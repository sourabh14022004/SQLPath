# Deploying SQLPath (one Railway project, two services)

## Why not a true single-process monolith?

You asked about combining frontend + backend into one deployable unit instead of
hosting them as two separate things. Here's the honest trade-off:

- **True monolith** (one Docker container running both Nest and Next, one process
  reverse-proxying `/api/*` to the other) is possible, but your two projects live in
  two separate folders/repos right now. Doing this properly means merging them into
  one git repo (a monorepo with `backend/` and `frontend/` subfolders) so a single
  Dockerfile can `COPY` both — otherwise a deploy platform building from git can't see
  both codebases in one build. That's a real restructure, not just config.
- **One Railway project, two services** (recommended below) gets you *almost* all the
  same benefit — one dashboard, one bill, one place to manage env vars and logs,
  services can talk to each other over Railway's private network — without touching
  your existing repo layout or your Next.js dynamic routes (`/roadmap/[id]`,
  `/mentor/student/[id]`), which would be risky to convert to a static export.

If you later want the real single-container monolith, say so explicitly and I'll
merge the two repos into one and write the combined Dockerfile — it's a bigger,
slower change so it's worth doing deliberately rather than as a first deploy.

## What's been added

- `sqlpath-backend/railway.json` — tells Railway to run `npm run build` then
  `npm run start:prod`.
- `sqlpath-frontend/railway.json` — tells Railway to run `npm run build` then
  `npm run start -- -p $PORT`.

Both projects already read `process.env.PORT`, so no code changes were needed there.

## Steps

### 0. Push both repos to GitHub (skip if already done)

```bash
cd sqlpath-backend
git init && git add . && git commit -m "Initial commit"
gh repo create sqlpath-backend --private --source=. --push
# (or create the repo on github.com and `git remote add origin ...` + `git push -u origin main`)

cd ../sqlpath-frontend
git init && git add . && git commit -m "Initial commit"
gh repo create sqlpath-frontend --private --source=. --push
```

Make sure `.env` (backend) and `.env.local` (frontend) are in `.gitignore` — they
contain real secrets and should never be committed. Backend doesn't have a
`.gitignore` yet; add one with at least `node_modules/`, `dist/`, `.env`.

### 1. Create one Railway project, add the backend service first

1. https://railway.app → New Project → **Deploy from GitHub repo** → pick
   `sqlpath-backend`.
2. Railway auto-detects Node + the `railway.json`. Set these environment variables
   on the service (Settings → Variables), copied from your local `.env`:
   - `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SCREENSHOT_BUCKET`
   - `MIN_TIME_EASY`, `MIN_TIME_MEDIUM`, `MIN_TIME_HARD`
   - `BURST_WINDOW_MINUTES`, `BURST_MAX_SUBMISSIONS`
   - `LEETCODE_GRAPHQL_URL`, `LEETCODE_RECENT_LIMIT`
   - `NODE_ENV=production`
   - `FRONTEND_URL` — leave a placeholder for now (e.g. `http://localhost:3001`),
     you'll update it once the frontend has a URL.
3. Deploy. Once it's live, click the service → Settings → Networking → **Generate
   Domain**. Copy that URL — you'll need it as
   `https://<that-domain>/api/v1` for the frontend.

### 2. Add the frontend service to the same project

1. In the same Railway project: **New** → **GitHub Repo** → `sqlpath-frontend`.
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL=https://<backend-domain>/api/v1` (from step 1 — this is
     baked in at build time, so it must be set *before* the first build)
3. Deploy. Generate a domain for this service too (Settings → Networking →
   Generate Domain).

### 3. Close the loop — update backend CORS

Go back to the backend service → Variables → set `FRONTEND_URL` to the frontend's
real domain (`https://<frontend-domain>`), then redeploy the backend so CORS
allows requests from it.

### 4. Verify

- Open the frontend domain, log in with a demo account (see backend `PROJECT.md`),
  confirm the dashboard loads data.
- Check backend logs in Railway for the seed/schema state — if the production
  Supabase database doesn't have the schema applied yet, you'll need to run your
  SQL migrations (and optionally `npm run seed`) against it before the app is
  usable. This wasn't attempted from here since it touches production data
  directly — say the word and I'll walk through it (or run it) once you confirm
  which Supabase project is "prod."

## Database note

Your local `.env` already points at a live Supabase project. Reusing that same
project for production is the fastest path (nothing else to set up), but it means
your dev and prod data are the same database — fine for now, worth splitting later
once real users show up.
