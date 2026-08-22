import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Difficulty, Platform, DIFFICULTY_WEIGHTS } from '../common/enums';

export interface CreateQuestionDto {
  title: string;
  platform: Platform;
  url: string;
  topic: string;
  difficulty: Difficulty;
  phase: number;
  estimatedMinutes: number;
  leetcodeSlug?: string;
}

export interface UpdateQuestionDto {
  title?: string;
  platform?: Platform;
  url?: string;
  topic?: string;
  difficulty?: Difficulty;
  phase?: number;
  estimatedMinutes?: number;
  leetcodeSlug?: string;
  isActive?: boolean;
}

const BASE_POINTS: Record<Difficulty, number> = {
  [Difficulty.EASY]: 10,
  [Difficulty.MEDIUM]: 25,
  [Difficulty.HARD]: 50,
};

@Injectable()
export class AdminService {
  constructor(private dataSource: DataSource) {}

  async getStats() {
    const [overview, difficulty, platform, solvesByDay] = await Promise.all([
      this.dataSource.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
          (SELECT COUNT(*) FROM questions WHERE is_active = true) AS total_questions,
          (SELECT COUNT(*) FROM solves WHERE status NOT IN ('pending', 'rejected') AND sql_code != '') AS total_solves,
          (SELECT COUNT(DISTINCT student_id) FROM daily_activity WHERE activity_date = CURRENT_DATE) AS active_today,
          (SELECT COALESCE(SUM(points_earned), 0) FROM daily_activity WHERE activity_date = CURRENT_DATE) AS points_today
      `),
      this.dataSource.query(`
        SELECT difficulty, COUNT(*) AS total,
          COUNT(CASE WHEN s.status NOT IN ('pending','rejected') AND s.sql_code != '' THEN 1 END) AS solves
        FROM questions q
        LEFT JOIN solves s ON s.question_id = q.id
        WHERE q.is_active = true
        GROUP BY difficulty
        ORDER BY difficulty
      `),
      this.dataSource.query(`
        SELECT platform, COUNT(*) AS total_questions
        FROM questions WHERE is_active = true
        GROUP BY platform ORDER BY total_questions DESC
      `),
      this.dataSource.query(`
        SELECT activity_date,
          SUM(solves_count) AS total_solves,
          COUNT(DISTINCT student_id) AS active_students
        FROM daily_activity
        WHERE activity_date >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY activity_date
        ORDER BY activity_date ASC
      `),
    ]);

    return {
      overview: overview[0],
      byDifficulty: difficulty,
      byPlatform: platform,
      last14Days: solvesByDay,
    };
  }

  async getQuestionHeatmap() {
    return this.dataSource.query(`
      SELECT
        q.id,
        q.number,
        q.title,
        q.platform,
        q.difficulty,
        q.phase,
        q.topic,
        q.base_points,
        q.is_active,
        COUNT(DISTINCT s.student_id) AS total_opens,
        COUNT(DISTINCT CASE WHEN s.sql_code != '' AND s.status NOT IN ('pending','rejected') THEN s.student_id END) AS solved_count,
        COUNT(DISTINCT CASE WHEN s.sql_code = '' OR s.status = 'pending' THEN s.student_id END) AS opened_not_solved,
        ROUND(
          100.0 * COUNT(DISTINCT CASE WHEN s.sql_code != '' AND s.status NOT IN ('pending','rejected') THEN s.student_id END)::numeric
          / NULLIF(COUNT(DISTINCT s.student_id), 0), 1
        ) AS solve_rate
      FROM questions q
      LEFT JOIN solves s ON s.question_id = q.id
      GROUP BY q.id, q.number, q.title, q.platform, q.difficulty, q.phase, q.topic, q.base_points, q.is_active
      ORDER BY q.number ASC
    `);
  }

  async getStudents() {
    return this.dataSource.query(`
      SELECT
        u.id, u.name, u.email, u.trust_score, u.current_streak,
        u.longest_streak, u.last_active_date, u.engagement_status, u.created_at,
        COUNT(DISTINCT s.id) FILTER (WHERE s.sql_code != '' AND s.status NOT IN ('pending','rejected')) AS total_solves,
        COALESCE(SUM(sl.delta) FILTER (WHERE sl.delta > 0), 0) AS total_score
      FROM users u
      LEFT JOIN solves s ON s.student_id = u.id
      LEFT JOIN score_ledger sl ON sl.student_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.email, u.trust_score, u.current_streak,
               u.longest_streak, u.last_active_date, u.engagement_status, u.created_at
      ORDER BY total_score DESC
    `);
  }

  async getStudentDetail(studentId: string) {
    const [profile] = await this.dataSource.query(
      `SELECT id, name, email, trust_score, current_streak, longest_streak,
              last_active_date, engagement_status, leetcode_username, leetcode_verified,
              codeforces_username, geeksforgeeks_username, hackerrank_username, created_at
       FROM users WHERE id = $1`,
      [studentId],
    );

    if (!profile) throw new NotFoundException('Student not found');

    const [recentSolves, activity, questionStats] = await Promise.all([
      this.dataSource.query(
        `SELECT s.id, s.sql_code, s.status, s.score_awarded, s.submitted_at,
                s.evidence_tier, s.time_on_task_sec,
                q.title, q.platform, q.difficulty, q.phase, q.number AS question_number
         FROM solves s JOIN questions q ON q.id = s.question_id
         WHERE s.student_id = $1 AND s.sql_code != ''
         ORDER BY s.submitted_at DESC LIMIT 30`,
        [studentId],
      ),
      this.dataSource.query(
        `SELECT activity_date, solves_count, points_earned
         FROM daily_activity
         WHERE student_id = $1
           AND activity_date >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY activity_date ASC`,
        [studentId],
      ),
      this.dataSource.query(
        `SELECT
           COUNT(*) FILTER (WHERE s.status NOT IN ('pending','rejected') AND s.sql_code != '') AS solved,
           COUNT(*) FILTER (WHERE q.difficulty = 'easy' AND s.status NOT IN ('pending','rejected') AND s.sql_code != '') AS easy_solved,
           COUNT(*) FILTER (WHERE q.difficulty = 'medium' AND s.status NOT IN ('pending','rejected') AND s.sql_code != '') AS medium_solved,
           COUNT(*) FILTER (WHERE q.difficulty = 'hard' AND s.status NOT IN ('pending','rejected') AND s.sql_code != '') AS hard_solved,
           COALESCE(SUM(s.score_awarded) FILTER (WHERE s.status NOT IN ('pending','rejected') AND s.sql_code != ''), 0) AS total_score
         FROM solves s
         JOIN questions q ON q.id = s.question_id
         WHERE s.student_id = $1`,
        [studentId],
      ),
    ]);

    return {
      profile,
      stats: questionStats[0],
      recentSolves,
      activityLast30Days: activity,
    };
  }

  async createQuestion(dto: CreateQuestionDto) {
    const [{ max }] = await this.dataSource.query(
      `SELECT COALESCE(MAX(number), 0) AS max FROM questions`,
    );
    const number = Number(max) + 1;
    const basePoints = BASE_POINTS[dto.difficulty];
    const difficultyWeight = DIFFICULTY_WEIGHTS[dto.difficulty];

    const [question] = await this.dataSource.query(
      `INSERT INTO questions
         (number, title, platform, url, leetcode_slug, topic, difficulty, phase,
          base_points, difficulty_weight, estimated_minutes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
       RETURNING *`,
      [
        number, dto.title, dto.platform, dto.url,
        dto.leetcodeSlug ?? null, dto.topic, dto.difficulty,
        dto.phase, basePoints, difficultyWeight, dto.estimatedMinutes,
      ],
    );
    return question;
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    const existing = await this.dataSource.query(
      `SELECT * FROM questions WHERE id = $1`,
      [id],
    );
    if (!existing.length) throw new NotFoundException('Question not found');

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      title: 'title', platform: 'platform', url: 'url',
      topic: 'topic', difficulty: 'difficulty', phase: 'phase',
      estimatedMinutes: 'estimated_minutes', leetcodeSlug: 'leetcode_slug',
      isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (dto[key as keyof UpdateQuestionDto] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        params.push(dto[key as keyof UpdateQuestionDto]);
      }
    }

    if (dto.difficulty) {
      updates.push(`base_points = $${idx++}`);
      params.push(BASE_POINTS[dto.difficulty]);
      updates.push(`difficulty_weight = $${idx++}`);
      params.push(DIFFICULTY_WEIGHTS[dto.difficulty]);
    }

    if (!updates.length) return existing[0];

    params.push(id);
    const [updated] = await this.dataSource.query(
      `UPDATE questions SET ${updates.join(', ')}
       WHERE id = $${idx} RETURNING *`,
      params,
    );
    return updated;
  }

  async deleteQuestion(id: string) {
    const existing = await this.dataSource.query(
      `SELECT id FROM questions WHERE id = $1`,
      [id],
    );
    if (!existing.length) throw new NotFoundException('Question not found');
    await this.dataSource.query(
      `UPDATE questions SET is_active = false WHERE id = $1`,
      [id],
    );
    return { message: 'Question deactivated' };
  }

  async hardDeleteQuestion(id: string) {
    const existing = await this.dataSource.query(
      `SELECT id FROM questions WHERE id = $1`,
      [id],
    );
    if (!existing.length) throw new NotFoundException('Question not found');
    await this.dataSource.query(`DELETE FROM questions WHERE id = $1`, [id]);
    return { message: 'Question permanently deleted' };
  }
}
