/**
 * SQLPath Seed Script
 * Run: npx ts-node src/seed/seed.ts
 *
 * Seeds: 1 cohort, 1 mentor, 20 students, 30 sample questions (expand to 350 manually)
 * Demo logins:
 *   active_student@demo.com  / Demo123!
 *   atrisk_student@demo.com  / Demo123!
 *   faculty@demo.com         / Demo123!
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
});

// ─── Sample questions (first 30 — add remaining 320 following same pattern) ──

const SAMPLE_QUESTIONS = [
  // Phase 1 — Basics & Filtering (Easy)
  { number: 1,  title: 'Revising the Select Query I',         platform: 'hackerrank',    url: 'https://www.hackerrank.com/challenges/revising-the-select-query/problem',                               topic: 'SELECT basics',      difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 5,  leetcode_slug: null },
  { number: 2,  title: 'Revising the Select Query II',        platform: 'hackerrank',    url: 'https://www.hackerrank.com/challenges/revising-the-select-query-2/problem',                              topic: 'SELECT basics',      difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 5,  leetcode_slug: null },
  { number: 3,  title: 'Select All',                          platform: 'hackerrank',    url: 'https://www.hackerrank.com/challenges/select-all-sql/problem',                                           topic: 'SELECT basics',      difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 3,  leetcode_slug: null },
  { number: 4,  title: 'Select By ID',                        platform: 'hackerrank',    url: 'https://www.hackerrank.com/challenges/select-by-id/problem',                                             topic: 'WHERE clause',       difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 3,  leetcode_slug: null },
  { number: 5,  title: 'Japanese Cities Attributes',          platform: 'hackerrank',    url: 'https://www.hackerrank.com/challenges/japanese-cities-attributes/problem',                                topic: 'WHERE clause',       difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 5,  leetcode_slug: null },
  { number: 6,  title: 'Recyclable and Low Fat Products',     platform: 'leetcode',      url: 'https://leetcode.com/problems/recyclable-and-low-fat-products/',                                         topic: 'WHERE + AND',        difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 5,  leetcode_slug: 'recyclable-and-low-fat-products' },
  { number: 7,  title: 'Find Customer Referee',               platform: 'leetcode',      url: 'https://leetcode.com/problems/find-customer-referee/',                                                   topic: 'NULL handling',      difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 8,  leetcode_slug: 'find-customer-referee' },
  { number: 8,  title: 'Big Countries',                       platform: 'leetcode',      url: 'https://leetcode.com/problems/big-countries/',                                                           topic: 'WHERE + OR',         difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 5,  leetcode_slug: 'big-countries' },
  { number: 9,  title: 'Article Views I',                     platform: 'leetcode',      url: 'https://leetcode.com/problems/article-views-i/',                                                         topic: 'Self-comparison',    difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 8,  leetcode_slug: 'article-views-i' },
  { number: 10, title: 'SELECT Basics (SQLZoo)',               platform: 'sqlzoo',        url: 'https://sqlzoo.net/wiki/SELECT_basics',                                                                  topic: 'SELECT basics',      difficulty: 'easy',   phase: 1, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 10, leetcode_slug: null },

  // Phase 2 — String, Date & CASE (Easy–Medium)
  { number: 41, title: 'Fix Names in a Table',                platform: 'leetcode',      url: 'https://leetcode.com/problems/fix-names-in-a-table/',                                                   topic: 'String functions',   difficulty: 'easy',   phase: 2, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 8,  leetcode_slug: 'fix-names-in-a-table' },
  { number: 42, title: 'Patients With a Condition',           platform: 'leetcode',      url: 'https://leetcode.com/problems/patients-with-a-condition/',                                               topic: 'LIKE operator',      difficulty: 'easy',   phase: 2, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 8,  leetcode_slug: 'patients-with-a-condition' },
  { number: 43, title: 'Delete Duplicate Emails',             platform: 'leetcode',      url: 'https://leetcode.com/problems/delete-duplicate-emails/',                                                 topic: 'DELETE + subquery',  difficulty: 'easy',   phase: 2, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 12, leetcode_slug: 'delete-duplicate-emails' },
  { number: 44, title: 'CASE expression (SQLZoo)',             platform: 'sqlzoo',        url: 'https://sqlzoo.net/wiki/CASE',                                                                           topic: 'CASE WHEN',          difficulty: 'medium', phase: 2, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 15, leetcode_slug: null },
  { number: 45, title: 'Rearrange Products Table',            platform: 'leetcode',      url: 'https://leetcode.com/problems/rearrange-products-table/',                                               topic: 'CASE / pivot',       difficulty: 'medium', phase: 2, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 20, leetcode_slug: 'rearrange-products-table' },

  // Phase 3 — Aggregation & Grouping (Medium)
  { number: 86, title: 'Not Boring Movies',                   platform: 'leetcode',      url: 'https://leetcode.com/problems/not-boring-movies/',                                                      topic: 'WHERE + ORDER BY',   difficulty: 'easy',   phase: 3, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 8,  leetcode_slug: 'not-boring-movies' },
  { number: 87, title: 'Average Selling Price',               platform: 'leetcode',      url: 'https://leetcode.com/problems/average-selling-price/',                                                  topic: 'Weighted AVG',       difficulty: 'easy',   phase: 3, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 15, leetcode_slug: 'average-selling-price' },
  { number: 88, title: 'Count Employees',                     platform: 'hackerrank',    url: 'https://www.hackerrank.com/challenges/salary-of-employees/problem',                                     topic: 'COUNT + WHERE',      difficulty: 'easy',   phase: 3, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 8,  leetcode_slug: null },
  { number: 89, title: 'Classes More Than 5 Students',        platform: 'leetcode',      url: 'https://leetcode.com/problems/classes-more-than-5-students/',                                           topic: 'GROUP BY + HAVING',  difficulty: 'easy',   phase: 3, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 10, leetcode_slug: 'classes-more-than-5-students' },
  { number: 90, title: 'Biggest Single Number',               platform: 'leetcode',      url: 'https://leetcode.com/problems/biggest-single-number/',                                                  topic: 'GROUP BY + HAVING',  difficulty: 'medium', phase: 3, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 15, leetcode_slug: 'biggest-single-number' },

  // Phase 4 — Joins (Medium)
  { number: 131, title: 'Combine Two Tables',                 platform: 'leetcode',      url: 'https://leetcode.com/problems/combine-two-tables/',                                                     topic: 'LEFT JOIN',          difficulty: 'easy',   phase: 4, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 10, leetcode_slug: 'combine-two-tables' },
  { number: 132, title: 'Employees Earning More Than Managers', platform: 'leetcode',    url: 'https://leetcode.com/problems/employees-earning-more-than-their-managers/',                             topic: 'Self JOIN',          difficulty: 'easy',   phase: 4, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 12, leetcode_slug: 'employees-earning-more-than-their-managers' },
  { number: 133, title: 'Duplicate Emails',                   platform: 'leetcode',      url: 'https://leetcode.com/problems/duplicate-emails/',                                                       topic: 'GROUP BY',           difficulty: 'easy',   phase: 4, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 10, leetcode_slug: 'duplicate-emails' },
  { number: 134, title: 'Rising Temperature',                 platform: 'leetcode',      url: 'https://leetcode.com/problems/rising-temperature/',                                                     topic: 'Self JOIN + date',   difficulty: 'easy',   phase: 4, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 15, leetcode_slug: 'rising-temperature' },
  { number: 135, title: 'The Join (SQLZoo)',                   platform: 'sqlzoo',        url: 'https://sqlzoo.net/wiki/The_JOIN_operation',                                                            topic: 'INNER JOIN',         difficulty: 'medium', phase: 4, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 20, leetcode_slug: null },

  // Phase 5 — Subqueries & Set Operations (Medium–Hard)
  { number: 176, title: 'Second Highest Salary',              platform: 'leetcode',      url: 'https://leetcode.com/problems/second-highest-salary/',                                                  topic: 'Subquery + LIMIT',   difficulty: 'medium', phase: 5, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 20, leetcode_slug: 'second-highest-salary' },
  { number: 177, title: 'Nth Highest Salary',                 platform: 'leetcode',      url: 'https://leetcode.com/problems/nth-highest-salary/',                                                     topic: 'Dynamic subquery',   difficulty: 'medium', phase: 5, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 25, leetcode_slug: 'nth-highest-salary' },
  { number: 178, title: 'Page 1 (StrataScratch subquery)',    platform: 'stratascratch',  url: 'https://platform.stratascratch.com/coding?code_type=1',                                                topic: 'Correlated subquery', difficulty: 'hard',  phase: 5, base_points: 50, difficulty_weight: 2.0, estimated_minutes: 30, leetcode_slug: null },

  // Phase 6 — Window Functions (Hard)
  { number: 221, title: 'Rank Scores',                        platform: 'leetcode',      url: 'https://leetcode.com/problems/rank-scores/',                                                            topic: 'RANK()',             difficulty: 'medium', phase: 6, base_points: 25, difficulty_weight: 1.5, estimated_minutes: 20, leetcode_slug: 'rank-scores' },
  { number: 222, title: 'Department Top Three Salaries',      platform: 'leetcode',      url: 'https://leetcode.com/problems/department-top-three-salaries/',                                          topic: 'DENSE_RANK()',       difficulty: 'hard',  phase: 6, base_points: 50, difficulty_weight: 2.0, estimated_minutes: 35, leetcode_slug: 'department-top-three-salaries' },
  { number: 223, title: 'Histogram of Tweets',                platform: 'datalemur',     url: 'https://datalemur.com/questions/sql-histogram-tweets',                                                  topic: 'Window + GROUP BY',  difficulty: 'easy',  phase: 6, base_points: 10, difficulty_weight: 1.0, estimated_minutes: 20, leetcode_slug: null },
];

const DEMO_STUDENTS = [
  { name: 'Arjun Sharma',      email: 'active_student@demo.com',  password: 'Demo123!', engagement: 'active',        trust: 92, streak: 14 },
  { name: 'Priya Nair',        email: 'atrisk_student@demo.com',  password: 'Demo123!', engagement: 'at_risk',       trust: 38, streak: 0  },
  { name: 'Rohan Mehta',       email: 'rohan@demo.com',           password: 'Demo123!', engagement: 'active',        trust: 85, streak: 7  },
  { name: 'Sneha Patel',       email: 'sneha@demo.com',           password: 'Demo123!', engagement: 'slipping',      trust: 70, streak: 2  },
  { name: 'Vikram Singh',      email: 'vikram@demo.com',          password: 'Demo123!', engagement: 'active',        trust: 78, streak: 5  },
  { name: 'Anita Krishnan',    email: 'anita@demo.com',           password: 'Demo123!', engagement: 'dormant',       trust: 60, streak: 0  },
  { name: 'Dev Oberoi',        email: 'dev@demo.com',             password: 'Demo123!', engagement: 'active',        trust: 88, streak: 10 },
  { name: 'Meera Iyer',        email: 'meera@demo.com',           password: 'Demo123!', engagement: 'active',        trust: 95, streak: 21 },
  { name: 'Karan Chopra',      email: 'karan@demo.com',           password: 'Demo123!', engagement: 'at_risk',       trust: 45, streak: 0  },
  { name: 'Pooja Gupta',       email: 'pooja@demo.com',           password: 'Demo123!', engagement: 'slipping',      trust: 72, streak: 1  },
  { name: 'Rahul Verma',       email: 'rahul@demo.com',           password: 'Demo123!', engagement: 'active',        trust: 80, streak: 4  },
  { name: 'Divya Reddy',       email: 'divya@demo.com',           password: 'Demo123!', engagement: 'never_started', trust: 80, streak: 0  },
  { name: 'Suresh Pillai',     email: 'suresh@demo.com',          password: 'Demo123!', engagement: 'active',        trust: 83, streak: 6  },
  { name: 'Neha Joshi',        email: 'neha@demo.com',            password: 'Demo123!', engagement: 'dormant',       trust: 55, streak: 0  },
  { name: 'Amit Bose',         email: 'amit@demo.com',            password: 'Demo123!', engagement: 'active',        trust: 76, streak: 3  },
  { name: 'Kavya Menon',       email: 'kavya@demo.com',           password: 'Demo123!', engagement: 'active',        trust: 91, streak: 12 },
  { name: 'Rajesh Kumar',      email: 'rajesh@demo.com',          password: 'Demo123!', engagement: 'at_risk',       trust: 42, streak: 0  },
  { name: 'Shruti Agarwal',    email: 'shruti@demo.com',          password: 'Demo123!', engagement: 'slipping',      trust: 68, streak: 1  },
  { name: 'Nikhil Tiwari',     email: 'nikhil@demo.com',          password: 'Demo123!', engagement: 'active',        trust: 87, streak: 9  },
  { name: 'Ishaan Malhotra',   email: 'ishaan@demo.com',          password: 'Demo123!', engagement: 'never_started', trust: 80, streak: 0  },
];

async function seed() {
  console.log('🌱 Connecting to database...');
  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();

  try {
    console.log('🧹 Clearing existing seed data...');
    await runner.query(`
      TRUNCATE anti_gaming_flags, verification_queue, score_ledger,
               trust_events, daily_activity, solves,
               questions, users, cohorts
      CASCADE
    `);

    // ── Cohort ──────────────────────────────────────────────────────────────
    console.log('📚 Creating cohort...');
    const cohortResult = await runner.query(`
      INSERT INTO cohorts (name, enroll_code, start_date)
      VALUES ('Batch 2025-A', 'SQLPATH2025', '2025-01-01')
      RETURNING id
    `);
    const cohortId = cohortResult[0].id;

    // ── Mentor ──────────────────────────────────────────────────────────────
    console.log('👨‍🏫 Creating mentor...');
    const mentorHash = await bcrypt.hash('Demo123!', 12);
    const mentorResult = await runner.query(`
      INSERT INTO users (name, email, password_hash, role, cohort_id, trust_score)
      VALUES ('Prof. Sharma', 'faculty@demo.com', $1, 'mentor', $2, 100)
      RETURNING id
    `, [mentorHash, cohortId]);
    const mentorId = mentorResult[0].id;

    // Update cohort with mentor
    await runner.query(`UPDATE cohorts SET mentor_id = $1 WHERE id = $2`, [mentorId, cohortId]);

    // ── Students ─────────────────────────────────────────────────────────────
    console.log('👩‍🎓 Creating 20 demo students...');
    const studentIds: string[] = [];
    for (const s of DEMO_STUDENTS) {
      const hash = await bcrypt.hash(s.password, 12);
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
      const lastActive = s.engagement === 'active' ? yesterday
        : s.engagement === 'slipping' ? new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
        : s.engagement === 'at_risk' ? tenDaysAgo
        : s.engagement === 'dormant' ? new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0]
        : null;

      const result = await runner.query(`
        INSERT INTO users
          (name, email, password_hash, role, cohort_id, trust_score,
           current_streak, longest_streak, last_active_date, engagement_status)
        VALUES ($1,$2,$3,'student',$4,$5,$6,$7,$8,$9)
        RETURNING id
      `, [s.name, s.email, hash, cohortId, s.trust, s.streak,
          Math.max(s.streak, 3), lastActive, s.engagement]);
      studentIds.push(result[0].id);
    }

    // ── Questions ─────────────────────────────────────────────────────────────
    console.log('❓ Seeding questions...');
    const questionIds: Record<number, string> = {};
    for (const q of SAMPLE_QUESTIONS) {
      const result = await runner.query(`
        INSERT INTO questions
          (number, title, platform, url, leetcode_slug, topic,
           difficulty, phase, base_points, difficulty_weight, estimated_minutes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING id
      `, [q.number, q.title, q.platform, q.url, q.leetcode_slug,
          q.topic, q.difficulty, q.phase, q.base_points,
          q.difficulty_weight, q.estimated_minutes]);
      questionIds[q.number] = result[0].id;
    }

    // ── Sample solves for active student ─────────────────────────────────────
    console.log('✅ Creating sample solves...');
    const activeStudentId = studentIds[0]; // active_student@demo.com
    const solveQuestions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 41, 42, 43];

    for (const qNum of solveQuestions) {
      const qId = questionIds[qNum];
      if (!qId) continue;
      const q = SAMPLE_QUESTIONS.find(x => x.number === qNum);
      const firstOpened = new Date(Date.now() - 2 * 86400000);
      const submitted = new Date(firstOpened.getTime() + (q.estimated_minutes * 2 * 60 * 1000));
      const timeOnTask = Math.floor((submitted.getTime() - firstOpened.getTime()) / 1000);
      const score = q.base_points * q.difficulty_weight * 0.7; // Tier 2

      const solveResult = await runner.query(`
        INSERT INTO solves
          (student_id, question_id, sql_code, evidence_tier, status,
           score_awarded, first_opened_at, submitted_at, time_on_task_sec)
        VALUES ($1,$2,$3,2,'mentor_verified',$4,$5,$6,$7)
        RETURNING id
      `, [activeStudentId, qId, `SELECT * FROM table_name WHERE condition = true; -- Q${qNum}`,
          score, firstOpened, submitted, timeOnTask]);

      await runner.query(`
        INSERT INTO score_ledger
          (student_id, question_id, solve_id, event_type, delta, evidence_tier, reason)
        VALUES ($1,$2,$3,'solve_submitted',$4,2,'Seeded solve')
      `, [activeStudentId, qId, solveResult[0].id, score]);

      await runner.query(`
        INSERT INTO daily_activity (student_id, activity_date, solves_count, points_earned)
        VALUES ($1, CURRENT_DATE - INTERVAL '1 day', 1, $2)
        ON CONFLICT (student_id, activity_date)
        DO UPDATE SET solves_count = daily_activity.solves_count + 1,
                      points_earned = daily_activity.points_earned + $2
      `, [activeStudentId, score]);
    }

    // ── Sample verification queue items ──────────────────────────────────────
    console.log('📋 Creating verification queue items...');
    const atRiskStudentId = studentIds[1]; // atrisk_student@demo.com
    const qId = questionIds[86];
    if (qId) {
      const solveResult = await runner.query(`
        INSERT INTO solves
          (student_id, question_id, sql_code, evidence_tier, status,
           score_awarded, first_opened_at, submitted_at, time_on_task_sec)
        VALUES ($1,$2,$3,1,'pending_review',3,$4,$5,45)
        RETURNING id
      `, [atRiskStudentId, qId, 'SELECT * FROM cinema WHERE id%2=1 AND description!="boring" ORDER BY rating DESC',
          new Date(Date.now() - 3600000), new Date()]);

      await runner.query(`
        INSERT INTO anti_gaming_flags (student_id, flag_type, solve_id, detail)
        VALUES ($1,'impossible_speed',$2,$3)
      `, [atRiskStudentId, solveResult[0].id, JSON.stringify({ timeOnTaskSec: 45, minRequired: 90 })]);

      await runner.query(`
        INSERT INTO verification_queue (solve_id, student_id, priority)
        VALUES ($1,$2,1)
      `, [solveResult[0].id, atRiskStudentId]);
    }

    console.log('\n✅ Seed complete!\n');
    console.log('Demo logins:');
    console.log('  👩‍🎓 active_student@demo.com  / Demo123!  (Active, rank ~1)');
    console.log('  ⚠️  atrisk_student@demo.com  / Demo123!  (At-risk, flagged)');
    console.log('  👨‍🏫 faculty@demo.com          / Demo123!  (Mentor)');
    console.log(`\n  Cohort enroll code: SQLPATH2025\n`);

  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    await runner.release();
    await dataSource.destroy();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });