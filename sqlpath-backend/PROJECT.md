# SQLPath Backend

A NestJS + TypeORM + PostgreSQL (Supabase) API for **SQLPath** — a cohort-based platform that assigns students a curated sequence of SQL practice questions (LeetCode, HackerRank, StrataScratch, DataLemur, SQLZoo, GeeksforGeeks), verifies their solves with a tiered-trust model, and gives mentors a review queue plus a cohort risk dashboard.

## Tech stack

- **Framework:** NestJS 10 (Express platform)
- **ORM / DB:** TypeORM 0.3 + PostgreSQL (via Supabase), raw SQL for aggregate/reporting queries
- **Auth:** JWT (`@nestjs/jwt`, `passport-jwt`) + bcrypt password hashing
- **File storage:** Supabase Storage (solve screenshots)
- **Validation:** `class-validator` / `class-transformer` (global `ValidationPipe`)
- **Scheduling:** `@nestjs/schedule` (for engagement-status cron jobs)
- **Language:** TypeScript 5, `ts-node` for the seed script

## Project structure

```
src/
  main.ts                        Bootstrap: global prefix /api/v1, CORS, ValidationPipe, exception filter
  app.module.ts                  Root module — wires config, TypeORM, and all feature modules

  config/
    database.config.ts           TypeORM connection factory (reads DATABASE_URL, SSL in prod)
    supabase.config.ts           Singleton Supabase client factory (service-role key)

  common/
    enums/index.ts                All shared enums + scoring/trust constants (see below)
    decorators/roles.decorator.ts @Roles() metadata decorator
    filters/http-exception.filter.ts Global exception filter

  auth/                          Registration, login, JWT issuing, LeetCode username verification
    strategies/jwt.strategy.ts
    guards/jwt-auth.guard.ts
    guards/roles.guard.ts

  users/entities/user.entity.ts  Student/mentor/admin accounts, trust score, streaks, engagement status

  questions/                     Question bank (curated SQL problems by phase/difficulty/platform)
    entities/question.entity.ts

  solves/                        Solve submission pipeline: anti-gaming checks, scoring, streaks
    entities/solve.entity.ts

  verification/                  Evidence-tier verification: auto (LeetCode API) vs manual (screenshot)
    leetcode-checker.service.ts  Polls LeetCode's public GraphQL API for recent accepted submissions
    screenshot-store.service.ts  Validates + uploads screenshots to Supabase Storage
    verification.service.ts     Routes a solve to Tier 1–3 and decides queue placement

  leaderboard/                   All-time / weekly / cohort rankings (raw SQL window functions)

  engagement/                    Per-student activity heatmap, streaks, engagement status

  mentor/                        Verification queue, approve/reject/escalate, cohort risk dashboard

  seed/seed.ts                   Seeds a demo cohort, 1 mentor, 20 students, ~30 sample questions
```

## Domain model

### Evidence tiers (trust in a submitted solve)

| Tier | Meaning | Weight |
|---|---|---|
| 1 — `CODE_ONLY` | SQL pasted, no proof | 0.3 |
| 2 — `CODE_SCREENSHOT` | SQL + screenshot | 0.7 |
| 3 — `AUTO_VERIFIED` | Confirmed via LeetCode's accepted-submissions API | 0.95 |
| 4 — `MENTOR_VERIFIED` | A mentor manually approved it | 1.0 |

Score = `base_points × difficulty_weight × evidence_tier_weight × streak_bonus`.

### Trust score & anti-gaming

Every student has a `trust_score` (0–100, starts at 80). It moves via `trust_events` triggered by:

- **Impossible speed** — solved faster than `MIN_TIME_SECONDS[difficulty]`
- **Submission burst** — ≥5 submissions inside a 10-minute window (also hard-blocks the request)
- **Duplicate SQL** — identical `sql_code` to another student's solve on the same question
- **Mentor decisions** — approve (+2 trust) / reject (−10 trust)

Students below `LOW_TRUST_THRESHOLD` (40) are always routed to the mentor queue regardless of tier; others are spot-checked at tier-dependent sampling rates (`SAMPLING_RATES`: 100% / 30% / 10% for tiers 1/2/3).

### Engagement status

Derived from `last_active_date`: `active` (≤3d) → `slipping` (≤7d) → `at_risk` (≤14d) → `dormant` (>14d), or `never_started`.

## API surface (all routes under `/api/v1`)

| Module | Routes |
|---|---|
| `auth` | `POST /auth/register`, `POST /auth/login`, `PATCH /auth/leetcode-username` |
| `questions` | `GET /questions`, `GET /questions/next`, `GET /questions/:id`, `POST /questions/:id/open` |
| `solves` | `POST /solves` (multipart, optional screenshot), `GET /solves/my` |
| `leaderboard` | `GET /leaderboard/alltime`, `GET /leaderboard/weekly`, `GET /leaderboard/cohort` |
| `engagement` | `GET /engagement/me` |
| `mentor` | `GET /mentor/queue`, `PATCH /mentor/queue/:id`, `GET /mentor/cohort-risk`, `GET /mentor/student/:id` |

Auth: JWT bearer token (`JwtAuthGuard`); role-gated routes use `RolesGuard` + `@Roles(...)`.

## Database

TypeORM `synchronize` is **off** — schema is expected to be created via SQL migrations against Postgres/Supabase (entities describe the shape but don't auto-create tables). Tables referenced across services beyond the three TypeORM entities (`users`, `questions`, `solves`): `cohorts`, `score_ledger`, `daily_activity`, `trust_events`, `anti_gaming_flags`, `verification_queue`.

## Environment variables (`.env.example`)

```
PORT, NODE_ENV
DATABASE_URL                 Postgres/Supabase connection string
JWT_SECRET, JWT_EXPIRES_IN
SUPABASE_URL, SUPABASE_SERVICE_KEY
SCREENSHOT_BUCKET            Supabase Storage bucket for solve screenshots
MIN_TIME_EASY/MEDIUM/HARD    Anti-gaming minimum solve times (seconds)
BURST_WINDOW_MINUTES, BURST_MAX_SUBMISSIONS
LEETCODE_GRAPHQL_URL, LEETCODE_RECENT_LIMIT
FRONTEND_URL                 CORS origin
```

## Getting started

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
npm run seed               # seeds demo cohort/mentor/students/questions (requires schema already applied)
npm run start:dev
```

### Demo logins (after seeding)

| Role | Email | Password |
|---|---|---|
| Student (active, top of leaderboard) | `active_student@demo.com` | `Demo123!` |
| Student (at-risk, flagged) | `atrisk_student@demo.com` | `Demo123!` |
| Mentor | `faculty@demo.com` | `Demo123!` |

Cohort enroll code: `SQLPATH2025`

## Status / known gaps

- Only ~30 of the eventual ~350 questions are seeded (`seed/seed.ts` comment notes this is meant to be expanded).
- No SQL migration files are present yet — schema must exist in the target Postgres database before running the app or the seed script.
- No test suite yet.
