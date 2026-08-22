import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TRUST_DELTAS } from '../common/enums';

@Injectable()
export class MentorService {
  constructor(private dataSource: DataSource) {}

  async getQueue(mentorId: string) {
    return this.dataSource.query(
      `SELECT
         vq.id AS queue_id, vq.priority, vq.created_at, vq.status,
         s.id AS solve_id, s.sql_code, s.screenshot_url, s.evidence_tier,
         s.time_on_task_sec, s.submitted_at, s.auto_check_result,
         u.id AS student_id, u.name AS student_name,
         u.trust_score, u.current_streak,
         q.title AS question_title, q.platform, q.difficulty, q.phase, q.url AS question_url,
         (SELECT COUNT(*) FROM verification_queue vq2
          JOIN solves s2 ON s2.id = vq2.solve_id
          WHERE s2.student_id = u.id AND vq2.status = 'rejected'
         ) AS prior_rejections
       FROM verification_queue vq
       JOIN solves s ON s.id = vq.solve_id
       JOIN users u ON u.id = vq.student_id
       JOIN questions q ON q.id = s.question_id
       WHERE vq.status = 'pending'
       ORDER BY vq.priority ASC, vq.created_at ASC
       LIMIT 50`,
    );
  }

  async decide(
    queueId: string,
    mentorId: string,
    decision: 'approved' | 'rejected' | 'escalated',
    note?: string,
  ) {
    const rows = await this.dataSource.query(
      `SELECT vq.*, s.student_id, s.evidence_tier, s.score_awarded
       FROM verification_queue vq
       JOIN solves s ON s.id = vq.solve_id
       WHERE vq.id = $1`,
      [queueId],
    );

    if (!rows.length) throw new NotFoundException('Queue item not found');
    const item = rows[0];

    if (!['pending', 'in_review'].includes(item.status)) {
      throw new ForbiddenException('This item has already been decided');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE verification_queue
         SET status=$1, decision_at=NOW(), assigned_to=$2, mentor_note=$3
         WHERE id=$4`,
        [decision, mentorId, note ?? null, queueId],
      );

      if (decision === 'approved') {
        await manager.query(
          `UPDATE solves SET evidence_tier=4, status='mentor_verified' WHERE id=$1`,
          [item.solve_id],
        );

        const tierWeights = { 1: 0.3, 2: 0.7, 3: 0.95, 4: 1.0 };
        const currentWeight = tierWeights[item.evidence_tier] ?? 0.7;
        const delta = item.score_awarded * (1.0 / currentWeight - 1);

        if (delta > 0) {
          await manager.query(
            `INSERT INTO score_ledger
               (student_id, solve_id, event_type, delta, evidence_tier, reason, actor_id)
             VALUES ($1,$2,'mentor_verified',$3,4,'Mentor approved — tier upgraded to 4',$4)`,
            [item.student_id, item.solve_id, Math.round(delta * 100) / 100, mentorId],
          );
        }

        await this.applyTrustDelta(
          manager, item.student_id, TRUST_DELTAS.MENTOR_APPROVED,
          'mentor_approved', 'Solve approved by mentor', mentorId,
        );
      }

      if (decision === 'rejected') {
        await manager.query(
          `UPDATE solves SET status='rejected' WHERE id=$1`,
          [item.solve_id],
        );

        await manager.query(
          `INSERT INTO score_ledger
             (student_id, solve_id, event_type, delta, reason, actor_id)
           VALUES ($1,$2,'solve_rejected',$3,$4,$5)`,
          [
            item.student_id, item.solve_id,
            -item.score_awarded,
            `Rejected: ${note ?? 'No reason given'}`,
            mentorId,
          ],
        );

        await this.applyTrustDelta(
          manager, item.student_id, TRUST_DELTAS.SOLVE_REJECTED,
          'solve_rejected', `Solve rejected: ${note ?? ''}`, mentorId,
        );
      }
    });

    return { message: `Solve ${decision} successfully`, queueId, decision };
  }

  async getCohortRisk(_adminId: string) {
    return this.dataSource.query(
      `SELECT
         u.id, u.name, u.email, u.trust_score, u.current_streak,
         u.longest_streak, u.last_active_date, u.engagement_status,
         COALESCE(SUM(sl.delta), 0) AS total_score,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status NOT IN ('rejected','pending')) AS verified_solves,
         COUNT(DISTINCT f.id) AS total_flags,
         CASE u.engagement_status
           WHEN 'never_started' THEN 0
           WHEN 'dormant'       THEN 1
           WHEN 'at_risk'       THEN 2
           WHEN 'slipping'      THEN 3
           WHEN 'active'        THEN 4
         END AS risk_level
       FROM users u
       LEFT JOIN score_ledger sl ON sl.student_id = u.id
       LEFT JOIN solves s ON s.student_id = u.id
       LEFT JOIN anti_gaming_flags f ON f.student_id = u.id AND f.resolved = false
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.email, u.trust_score, u.current_streak,
                u.longest_streak, u.last_active_date, u.engagement_status
       ORDER BY risk_level ASC, u.trust_score ASC, total_flags DESC`,
    );
  }

  async getStudentDetail(studentId: string) {
    const [profile, solves, flags, trustHistory] = await Promise.all([
      this.dataSource.query(
        `SELECT id, name, email, trust_score, current_streak,
                longest_streak, last_active_date, engagement_status, created_at
         FROM users WHERE id = $1`,
        [studentId],
      ),
      this.dataSource.query(
        `SELECT s.*, q.title, q.platform, q.difficulty, q.phase
         FROM solves s JOIN questions q ON q.id = s.question_id
         WHERE s.student_id = $1 ORDER BY s.submitted_at DESC LIMIT 20`,
        [studentId],
      ),
      this.dataSource.query(
        `SELECT * FROM anti_gaming_flags
         WHERE student_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [studentId],
      ),
      this.dataSource.query(
        `SELECT * FROM trust_events
         WHERE student_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [studentId],
      ),
    ]);

    return { profile: profile[0], recentSolves: solves, flags, trustHistory };
  }

  private async applyTrustDelta(
    manager: any, studentId: string, delta: number,
    eventType: string, reason: string, actorId: string,
  ) {
    await manager.query(
      `INSERT INTO trust_events (student_id, event_type, delta, reason, actor_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [studentId, eventType, delta, reason, actorId],
    );
    await manager.query(
      `UPDATE users SET trust_score = GREATEST(0, LEAST(100, trust_score + $1))
       WHERE id = $2`,
      [delta, studentId],
    );
  }
}
