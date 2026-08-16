# SQLPath — Frontend

SQLPath is a gamified SQL learning platform. Students work through a phased roadmap of SQL questions, submit solves for verification, and track their progress on leaderboards. Mentors/faculty review submissions and monitor cohort engagement to catch students who are falling behind or showing signs of academic dishonesty.

This repo is the frontend only — a Next.js App Router client that talks to a separate backend API.

## Tech stack

- **Next.js 16** (App Router, Turbopack, client components)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- No server-side data fetching — every page is `'use client'` and fetches from the API in `useEffect`

## Roles

The app branches on `user.role` from the authenticated user object:

- **student** — roadmap, solving questions, leaderboard, personal dashboard
- **mentor** / **admin** — review queue, cohort risk dashboard, per-student detail

`src/app/page.tsx` is the root redirect: students go to `/dashboard`, mentors/admins go to `/mentor`.

## Routes

| Route | Audience | Purpose |
|---|---|---|
| `/login`, `/register` | all | Auth forms; register requires a cohort code. Login page has quick demo-account buttons. |
| `/dashboard` | student | Home base — current engagement status and the next recommended question. |
| `/roadmap` | student | Full question list grouped into 8 phases (Basics → Interview Case Studies), with solve status per question. |
| `/roadmap/[id]` | student | Solve a single question — submit SQL code (+ optional screenshot) for verification. |
| `/leaderboard` | student | All-time / weekly / cohort rankings. |
| `/mentor` | mentor/admin | Review queue for pending solve submissions (approve / reject / escalate). |
| `/mentor/risk` | mentor/admin | Cohort risk dashboard — students sorted riskiest first, flags integrity/engagement issues. |
| `/mentor/student/[id]` | mentor/admin | Full history and detail for one student. |

## Architecture

```
src/
  app/                  route segments (App Router), all client components
  components/
    Navbar.tsx          student-facing top nav
    MentorLayout.tsx     mentor-facing shell/sidebar
    Icon.tsx             icon wrapper
  contexts/
    AuthContext.tsx      React context: user, token, login/register/logout, loading
  lib/
    api.ts               typed fetch wrapper + all backend endpoints
    auth.ts               localStorage-backed token/user persistence
    utils.ts              formatting + status/badge color helpers
```

### Auth flow

- JWT (`access_token`) and user object are persisted to `localStorage` (`sqlpath_token`, `sqlpath_user`) via `src/lib/auth.ts`.
- `AuthContext` hydrates from localStorage on mount, exposes `login`, `register`, `logout`, `user`, `token`, `loading`.
- Every protected page follows the same guard pattern in `useEffect`: wait for `authLoading`, redirect to `/login` if no token, redirect away if the role doesn't match the page.
- The token is attached as `Authorization: Bearer <token>` on API calls that need it.

### API layer (`src/lib/api.ts`)

Thin wrapper around `fetch` targeting `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/api/v1`). Throws on non-OK responses using the backend's `message` field. Endpoints cover: auth (login/register/leetcode username), questions (list/next/open), solves (submit with optional screenshot via `FormData`, list mine), engagement, leaderboard, and mentor operations (queue, decision, cohort risk, student detail).

### Verification model

`utils.ts` encodes a 4-tier verification model for solves (`tierLabel`): code-only → code + screenshot → auto-verified → mentor-verified. Solve status (`statusColor`) tracks `pending`, `pending_review`, `auto_verified`, `mentor_verified`, `rejected`. Engagement status (`engagementBadge`) tracks `active`, `slipping`, `at_risk`, `dormant`, `never_started` — this drives the cohort risk dashboard's sort and flagging.

## Running locally

```bash
npm run dev     # starts on port 3001 (see package.json)
```

Requires `NEXT_PUBLIC_API_URL` in `.env.local` pointing at a running backend.

## Notes for future work

- This project pins **Next.js 16**, which has breaking changes from the version most training data reflects (see `AGENTS.md` — `legacyBehavior` on `Link` is gone, for example). Check `node_modules/next/dist/docs/` before assuming an API still works as expected.
- API response types are largely `any` — there's no shared type contract with the backend yet.
