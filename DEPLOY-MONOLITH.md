# Deploying SQLPath as one container

This is the single-container option described in `README.md` and originally
flagged as a follow-up in `sqlpath-backend/DEPLOY.md`. One Railway service,
one Dockerfile, one public URL — the frontend serves everything and proxies
`/api/v1/*` to the backend internally.

## 0. Prerequisites

- This repo (`sqlpath-backend/` + `sqlpath-frontend/` + root `Dockerfile`)
  pushed to a single GitHub repo. If you haven't put this under git yet:

  ```bash
  cd SQLPath
  git init
  git add .
  git commit -m "Monorepo: combine backend + frontend for single-container deploy"
  gh repo create sqlpath --private --source=. --push
  # or: create the repo on github.com, then
  # git remote add origin <url> && git push -u origin main
  ```

  Double check `git status` doesn't show `.env` or `.env.local` staged —
  both are gitignored, but worth a glance before the first push.

- Docker installed locally if you want to test the image before deploying
  (`docker build -t sqlpath .` from the repo root). Not required — Railway
  will build it for you — but catches problems earlier.

## 1. Create the Railway service

1. https://railway.app → New Project (or an existing one) → **Deploy from
   GitHub repo** → pick this repo.
2. Railway should detect the root `Dockerfile` and `railway.json`
   (`"builder": "DOCKERFILE"`) automatically. If it instead tries Nixpacks,
   set the builder to Dockerfile explicitly in Settings → Build.

## 2. Environment variables

Set these on the one service (Settings → Variables) — this combines what
used to be split across the backend and frontend services, since it's now
one process group:

```
NODE_ENV=production
DATABASE_URL=...            # Postgres/Supabase connection string
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SCREENSHOT_BUCKET=solve-screenshots
MIN_TIME_EASY=90
MIN_TIME_MEDIUM=300
MIN_TIME_HARD=720
BURST_WINDOW_MINUTES=10
BURST_MAX_SUBMISSIONS=5
LEETCODE_GRAPHQL_URL=https://leetcode.com/graphql
LEETCODE_RECENT_LIMIT=20
```

Don't set `NEXT_PUBLIC_API_URL` — leave it unset so the frontend uses its
relative default and goes through the rewrite. It's a build-time value for
Next, and this whole setup is designed around not needing it.

`PORT` is injected by Railway automatically; `BACKEND_INTERNAL_PORT`
defaults to `4000` in the Dockerfile and doesn't need to be set unless it
collides with something.

`FRONTEND_URL` (used for backend CORS) can stay unset or point at the
service's own domain — same-origin traffic through the rewrite doesn't hit
CORS at all, this only matters if something calls the backend directly.

## 3. Deploy and verify

1. Deploy. Once live, Settings → Networking → **Generate Domain**.
2. Open that domain, log in with a demo account (see
   `sqlpath-backend/PROJECT.md`), confirm the dashboard loads data through
   `/api/v1/...` — check the Network tab: requests should go to your own
   domain, not a separate backend host.
3. Check the service logs for both `[backend]` and `[frontend]` startup
   lines (from `docker-entrypoint.js`) — if you only see one, the other
   process crashed on boot and the container should have exited/restarted;
   look for a stack trace above the exit line.

## Troubleshooting: container restart loop on boot

The backend validates its required variables at startup (see
`sqlpath-backend/src/config/env.validation.ts`). If `DATABASE_URL` or
`JWT_SECRET` is missing, the very first log line after
`Starting Nest application...` names the missing variable and the process
exits — which, because `docker-entrypoint.js` shuts the container down when
either child dies, shows up as a restart loop with the frontend appearing
to start fine. Set the variable in Settings → Variables and redeploy.

`JWT_SECRET` must be at least 32 characters; generate one with:

```
openssl rand -base64 48
```

## Database note

Same caveat as the two-service setup: if your Supabase project's schema and
seed data haven't been applied to whatever `DATABASE_URL` points at in
production, the app will be up but empty/erroring on data-backed routes.
Run your SQL migrations (and optionally `npm run seed` from
`sqlpath-backend/`, pointed at the prod `DATABASE_URL`) before relying on
this deploy.

## Rolling back to two services

If this doesn't work out, the old per-service setup in
`sqlpath-backend/DEPLOY.md` still applies unchanged — deploy
`sqlpath-backend/` and `sqlpath-frontend/` as two separate Railway services
from the same repo (set each service's **root directory** to that subfolder
in Settings), each using its own `railway.json`. The `next.config.ts`
rewrite and the relative `NEXT_PUBLIC_API_URL` default are harmless in that
setup too — set `NEXT_PUBLIC_API_URL` to the backend's real domain like
before and the rewrite is simply unused.
