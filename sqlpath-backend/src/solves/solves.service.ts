import {
  Injectable, Logger, BadRequestException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Solve } from './entities/solve.entity';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import { VerificationService } from '../verification/verification.service';
import {
  EvidenceTier, SolveStatus, ScoreEventType, FlagType,
  DIFFICULTY_WEIGHTS, EVIDENCE_TIER_WEIGHTS,
  MIN_TIME_SECONDS, STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX,
  BURST_WINDOW_MINUTES, BURST_MAX_SUBMISSIONS, TRUST_DELTAS,
} from '../common/enums';

@Injectable()
export class SolvesService {
  private readonly logger = new Logger(SolvesService.name);

  constructor(
    @InjectRepository(Solve)
    private solveRepository: Repository<Solve>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private verificationService: VerificationService,
    private dataSource: DataSource,
  ) {}

  async recordOpen(
    studentId: string,
    questionId: string,
  ): Promise<{ firstOpenedAt: Date }> {
    const existing = await this.solveRepository.findOne({
      where: { studentId, questionId },
      order: { createdAt: 'ASC' },
    });
    if (existing) return { firstOpenedAt: existing.firstOpenedAt };

    const now = new Date();
    const placeholder = this.solveRepository.create({
      studentId,
      questionId,
      sqlCode: '',
      evidenceTier: EvidenceTier.CODE_ONLY,
      status: SolveStatus.PENDING,
      firstOpenedAt: now,
      submittedAt: now,
      timeOnTaskSec: 0,
    });

    try {
      await this.solveRepository.save(placeholder);
      return { firstOpenedAt: now };
    } catch (err: any) {
      // Concurrent open (e.g. two tabs, or a duplicate request) can race
      // past the check above; fall back to whichever row won the insert.
      if (err.code === '23505') {
        const race = await this.solveRepository.findOne({
          where: { studentId, questionId },
          order: { createdAt: 'ASC' },
        });
        if (race) return { firstOpenedAt: race.firstOpenedAt };
      }
      throw err;
    }
  }

  async submitSolve(
    studentId: string,
    questionId: string,
    sqlCode: string,
    file?: Express.Multer.File,
  ) {
    const submittedAt = new Date();

    const [student, question] = await Promise.all([
      this.userRepository.findOne({ where: { id: studentId } }),
      this.questionRepository.findOne({ where: { id: questionId } }),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    if (!question) throw new NotFoundException('Question not found');

    const openRecord = await this.solveRepository.findOne({
      where: { studentId, questionId },
      order: { createdAt: 'ASC' },
    });

    const firstOpenedAt = openRecord?.firstOpenedAt ?? submittedAt;
    const timeOnTaskSec = Math.floor(
      (submittedAt.getTime() - firstOpenedAt.getTime()) / 1000,
    );

    await this.runAntiGamingChecks(
      student, question, sqlCode, timeOnTaskSec, submittedAt,
    );

    const previousAttempts = await this.solveRepository.count({
      where: { studentId, questionId },
    });
    const attemptNumber = previousAttempts + 1;

    const verification = await this.verificationService.verify(
      student, question, file, firstOpenedAt,
    );

    const score = this.calculateScore(
      question, verification.evidenceTier, student.currentStreak,
    );

    await this.dataSource.transaction(async (manager) => {
      if (openRecord) {
        await manager.delete(Solve, { id: openRecord.id });
      }

      const solve = manager.create(Solve, {
        studentId, questionId, sqlCode,
        screenshotUrl: verification.screenshotUrl,
        evidenceTier: verification.evidenceTier,
        status: verification.status,
        scoreAwarded: score,
        firstOpenedAt, submittedAt, timeOnTaskSec,
        autoCheckResult: verification.autoCheckResult,
        attemptNumber,
      });
      const savedSolve = await manager.save(Solve, solve);

      await manager.query(
        `INSERT INTO score_ledger
           (student_id, question_id, solve_id, event_type, delta, evidence_tier, reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [studentId, questionId, savedSolve.id,
         ScoreEventType.SOLVE_SUBMITTED, score,
         verification.evidenceTier, `Tier ${verification.evidenceTier} solve`],
      );

      await manager.query(
        `INSERT INTO daily_activity (student_id, activity_date, solves_count, points_earned)
         VALUES ($1, CURRENT_DATE, 1, $2)
         ON CONFLICT (student_id, activity_date)
         DO UPDATE SET
           solves_count = daily_activity.solves_count + 1,
           points_earned = daily_activity.points_earned + $2`,
        [studentId, score],
      );

      if (verification.routeToQueue) {
        await manager.query(
          `INSERT INTO verification_queue (solve_id, student_id, priority)
           VALUES ($1,$2,$3)`,
          [savedSolve.id, studentId, verification.queuePriority],
        );
      }

      await this.updateStreakAndEngagement(manager, student);
    });

    return {
      message: this.buildResponseMessage(
        verification.evidenceTier, verification.status,
      ),
      evidenceTier: verification.evidenceTier,
      status: verification.status,
      scoreAwarded: score,
      inReviewQueue: verification.routeToQueue,
    };
  }

  private async runAntiGamingChecks(
    student: User, question: Question,
    sqlCode: string, timeOnTaskSec: number, submittedAt: Date,
  ) {
    const minTime = MIN_TIME_SECONDS[question.difficulty];
    if (timeOnTaskSec < minTime) {
      // No solve row exists yet at this point in the flow, so there is
      // nothing valid to reference for solve_id (it has a FK to solves.id).
      await this.flagAndPenalize(student.id, FlagType.IMPOSSIBLE_SPEED, null, {
        questionId: question.id, timeOnTaskSec, minRequired: minTime, difficulty: question.difficulty,
      });
    }

    const burstWindowStart = new Date(
      submittedAt.getTime() - BURST_WINDOW_MINUTES * 60 * 1000,
    );
    const recentCount = await this.solveRepository
      .createQueryBuilder('s')
      .where('s.student_id = :id', { id: student.id })
      .andWhere('s.submitted_at > :start', { start: burstWindowStart })
      .andWhere("s.status != 'pending'")
      .getCount();

    if (recentCount >= BURST_MAX_SUBMISSIONS) {
      await this.flagAndPenalize(student.id, FlagType.SUBMISSION_BURST, null, {
        count: recentCount, windowMinutes: BURST_WINDOW_MINUTES,
      });
      throw new ForbiddenException(
        `Too many submissions in ${BURST_WINDOW_MINUTES} minutes. Please wait.`,
      );
    }

    if (sqlCode?.trim().length > 0) {
      const duplicate = await this.solveRepository
        .createQueryBuilder('s')
        .where('s.question_id = :qid', { qid: question.id })
        .andWhere('s.student_id != :sid', { sid: student.id })
        .andWhere('s.sql_code = :code', { code: sqlCode.trim() })
        .andWhere("s.status NOT IN ('rejected')")
        .getOne();

      if (duplicate) {
        await this.flagAndPenalize(student.id, FlagType.DUPLICATE_SQL, null, {
          questionId: question.id, matchedSolveId: duplicate.id,
        });
      }
    }
  }

  private async flagAndPenalize(
    studentId: string, flagType: FlagType,
    solveId: string | null, detail: object,
  ) {
    await this.dataSource.query(
      `INSERT INTO anti_gaming_flags (student_id, flag_type, solve_id, detail)
       VALUES ($1,$2,$3,$4)`,
      [studentId, flagType, solveId, JSON.stringify(detail)],
    );

    const delta = flagType === FlagType.DUPLICATE_SQL
      ? TRUST_DELTAS.DUPLICATE_SQL
      : flagType === FlagType.SUBMISSION_BURST
        ? TRUST_DELTAS.BURST_DETECTED
        : TRUST_DELTAS.SPEED_VIOLATION;

    await this.dataSource.query(
      `INSERT INTO trust_events (student_id, event_type, delta, reason)
       VALUES ($1,$2,$3,$4)`,
      [studentId, flagType, delta, `Auto-flagged: ${flagType}`],
    );

    await this.userRepository.query(
      `UPDATE users SET trust_score = GREATEST(0, LEAST(100, trust_score + $1))
       WHERE id = $2`,
      [delta, studentId],
    );
  }

  private calculateScore(
    question: Question, evidenceTier: EvidenceTier, currentStreak: number,
  ): number {
    const base = question.basePoints;
    const diffWeight = DIFFICULTY_WEIGHTS[question.difficulty];
    const tierWeight = EVIDENCE_TIER_WEIGHTS[evidenceTier];
    const streakBonus = Math.min(
      1 + STREAK_BONUS_PER_DAY * currentStreak,
      1 + STREAK_BONUS_MAX,
    );
    return Math.round(base * diffWeight * tierWeight * streakBonus * 100) / 100;
  }

  private async updateStreakAndEngagement(manager: any, student: User) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = student.currentStreak;
    if (student.lastActiveDate === yesterday) {
      newStreak = student.currentStreak + 1;
    } else if (student.lastActiveDate !== today) {
      newStreak = 1;
    }

    const longest = Math.max(newStreak, student.longestStreak);
    await manager.query(
      `UPDATE users SET
         current_streak = $1, longest_streak = $2,
         last_active_date = $3, engagement_status = 'active', updated_at = NOW()
       WHERE id = $4`,
      [newStreak, longest, today, student.id],
    );
  }

  async getMySolves(studentId: string) {
    return this.solveRepository.find({
      where: { studentId },
      relations: ['question'],
      order: { submittedAt: 'DESC' },
    });
  }

  private buildResponseMessage(tier: EvidenceTier, status: SolveStatus): string {
    if (tier === EvidenceTier.AUTO_VERIFIED && status === SolveStatus.AUTO_VERIFIED)
      return '✅ Auto-verified via LeetCode. Full points applied.';
    if (tier === EvidenceTier.AUTO_VERIFIED && status === SolveStatus.PENDING_REVIEW)
      return '✅ Auto-verified. Selected for mentor spot-check.';
    if (tier === EvidenceTier.CODE_SCREENSHOT)
      return '📸 Screenshot recorded. Points at 0.7 weight pending review.';
    if (status === SolveStatus.PENDING)
      return "⏳ LeetCode solve not found yet. We'll re-check in 2 minutes.";
    return '📝 Solve recorded. Mentor review required for full points.';
  }
}