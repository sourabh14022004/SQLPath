import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getMyEngagement(studentId: string) {
    const user = await this.userRepository.findOne({ where: { id: studentId } });

    const [heatmap, totalScore, recentSolves, totalSolved, phaseProgress] = await Promise.all([
      this.getHeatmap(studentId),
      this.getTotalScore(studentId),
      this.getRecentSolves(studentId),
      this.getTotalSolved(studentId),
      this.getPhaseProgress(studentId),
    ]);

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      engagementStatus: user.engagementStatus,
      trustScore: user.trustScore,
      totalScore,
      totalSolved,
      phaseProgress,
      heatmap,
      recentSolves,
    };
  }

  private async getHeatmap(studentId: string) {
    const rows = await this.dataSource.query(
      `SELECT activity_date::text AS date, solves_count, points_earned
       FROM daily_activity
       WHERE student_id = $1
         AND activity_date >= CURRENT_DATE - INTERVAL '83 days'
       ORDER BY activity_date ASC`,
      [studentId],
    );

    const map = new Map(rows.map((r) => [r.date, r]));
    const result = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        solvesCount: (map.get(dateStr) as any)?.solves_count ?? 0,
        pointsEarned: (map.get(dateStr) as any)?.points_earned ?? 0,
      });
    }
    return result;
  }

  private async getTotalSolved(studentId: string): Promise<number> {
    const r = await this.dataSource.query(
      `SELECT COUNT(DISTINCT question_id) AS total FROM solves
       WHERE student_id = $1 AND status IN ('auto_verified', 'mentor_verified')`,
      [studentId],
    );
    return Number(r[0]?.total ?? 0);
  }

  private async getPhaseProgress(studentId: string) {
    const rows = await this.dataSource.query(
      `SELECT
         q.phase,
         COUNT(q.id) AS total,
         COUNT(s.id) FILTER (WHERE s.status IN ('auto_verified','mentor_verified')) AS solved
       FROM questions q
       LEFT JOIN solves s ON s.question_id = q.id AND s.student_id = $1
       GROUP BY q.phase
       ORDER BY q.phase ASC`,
      [studentId],
    );
    return rows.map((r: any) => ({
      phase: Number(r.phase),
      total: Number(r.total),
      solved: Number(r.solved),
    }));
  }

  private async getTotalScore(studentId: string) {
    const r = await this.dataSource.query(
      `SELECT COALESCE(SUM(delta), 0) AS total FROM score_ledger WHERE student_id = $1`,
      [studentId],
    );
    return Number(r[0]?.total ?? 0);
  }

  private async getRecentSolves(studentId: string) {
    return this.dataSource.query(
      `SELECT s.id, q.title, q.platform, q.difficulty, q.phase,
              s.evidence_tier, s.status, s.score_awarded, s.submitted_at
       FROM solves s
       JOIN questions q ON q.id = s.question_id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC LIMIT 10`,
      [studentId],
    );
  }

  async updateAllEngagementStatuses() {
    await this.dataSource.query(`
      UPDATE users SET engagement_status = CASE
        WHEN last_active_date IS NULL                                  THEN 'never_started'
        WHEN last_active_date >= CURRENT_DATE - INTERVAL '3 days'     THEN 'active'
        WHEN last_active_date >= CURRENT_DATE - INTERVAL '7 days'     THEN 'slipping'
        WHEN last_active_date >= CURRENT_DATE - INTERVAL '14 days'    THEN 'at_risk'
        ELSE 'dormant'
      END
      WHERE role = 'student'
    `);
  }
}