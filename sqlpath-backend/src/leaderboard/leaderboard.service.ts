import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class LeaderboardService {
  constructor(private dataSource: DataSource) {}

  async getAllTime(cohortId?: string) {
    return this.dataSource.query(
      `SELECT
         u.id, u.name, u.current_streak, u.trust_score, u.engagement_status,
         COALESCE(SUM(sl.delta), 0) AS total_score,
         COUNT(DISTINCT s.question_id)
           FILTER (WHERE s.status NOT IN ('rejected','pending')) AS verified_solves,
         AVG(s.evidence_tier)
           FILTER (WHERE s.status NOT IN ('rejected','pending')) AS avg_tier,
         RANK() OVER (
           ORDER BY COALESCE(SUM(sl.delta), 0) DESC,
             COUNT(DISTINCT s.question_id) FILTER (WHERE s.status NOT IN ('rejected','pending')) DESC,
             AVG(s.evidence_tier) FILTER (WHERE s.status NOT IN ('rejected','pending')) DESC,
             u.trust_score DESC,
             u.created_at ASC
         ) AS rank
       FROM users u
       LEFT JOIN score_ledger sl ON sl.student_id = u.id
       LEFT JOIN solves s ON s.student_id = u.id
       WHERE u.role = 'student'
         ${cohortId ? 'AND u.cohort_id = $1' : ''}
       GROUP BY u.id, u.name, u.current_streak, u.trust_score,
                u.engagement_status, u.created_at
       ORDER BY rank ASC
       LIMIT 100`,
      cohortId ? [cohortId] : [],
    );
  }

  async getWeekly(cohortId?: string) {
    return this.dataSource.query(
      `SELECT
         u.id, u.name, u.current_streak, u.trust_score,
         COALESCE(SUM(sl.delta), 0) AS weekly_score,
         COUNT(DISTINCT s.question_id)
           FILTER (WHERE s.status NOT IN ('rejected','pending')) AS weekly_solves,
         RANK() OVER (
           ORDER BY COALESCE(SUM(sl.delta), 0) DESC,
             COUNT(DISTINCT s.question_id) FILTER (WHERE s.status NOT IN ('rejected','pending')) DESC,
             u.trust_score DESC,
             u.created_at ASC
         ) AS rank
       FROM users u
       LEFT JOIN score_ledger sl
         ON sl.student_id = u.id
         AND sl.created_at >= date_trunc('week', NOW())
       LEFT JOIN solves s
         ON s.student_id = u.id
         AND s.submitted_at >= date_trunc('week', NOW())
       WHERE u.role = 'student'
         ${cohortId ? 'AND u.cohort_id = $1' : ''}
       GROUP BY u.id, u.name, u.current_streak, u.trust_score, u.created_at
       ORDER BY rank ASC
       LIMIT 100`,
      cohortId ? [cohortId] : [],
    );
  }

  async getCohort(cohortId: string) {
    return this.getAllTime(cohortId);
  }
}
