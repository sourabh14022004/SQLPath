# SQLPath (monorepo)

One repo, two apps, one deployable container:

```
SQLPath/
  sqlpath-backend/    NestJS API (see sqlpath-backend/PROJECT.md)
  sqlpath-frontend/   Next.js app (see sqlpath-frontend/PROJECT.md)
  Dockerfile           builds + runs both in one image
  docker-entrypoint.js  starts both processes inside that image
  railway.json          root-level: deploy the Dockerfile as one Railway service
  package.json           convenience scripts for running both locally
```

Nothing moved — `sqlpath-backend/` and `sqlpath-frontend/` are still exactly
where they were, they're just now two folders in one repo instead of two
separate repos. Each keeps its own `package.json`, `node_modules`, and build
output; nothing is merged at the code level.

## How the "monolith" part works

The frontend is the only public entry point. `sqlpath-frontend/next.config.ts`
rewrites any request to `/api/v1/*` to the backend over `localhost`
(`BACKEND_INTERNAL_URL`, an internal-only address) instead of the browser
calling the backend directly. Two consequences:

- The browser only ever talks to one origin, so CORS is no longer in the
  request path (the backend still sets `enableCors` for cases where you
  point `NEXT_PUBLIC_API_URL` at it directly — see below — but the default
  proxied path doesn't need it).
- `sqlpath-frontend/src/lib/api.ts` now defaults `NEXT_PUBLIC_API_URL` to the
  relative path `/api/v1` rather than an absolute backend URL. Set
  `NEXT_PUBLIC_API_URL` explicitly (e.g. in `.env.local`) if you ever want
  the frontend to call a backend directly instead of through the rewrite —
  that's still fully supported, it's just no longer the default.

In the Docker image (`docker-entrypoint.js`), the backend binds an
internal-only port (`BACKEND_INTERNAL_PORT`, default `4000`) and the
frontend binds the platform's public `$PORT`. If either process dies, the
entrypoint exits so the whole container restarts — there's no scenario
where the container looks "up" with only half of it actually running.

## Running locally

Two options, both still work:

**Two terminals (closest to before):**
```bash
cd sqlpath-backend && npm run start:dev     # http://localhost:3000
cd sqlpath-frontend && npm run dev          # http://localhost:3001
```

**One terminal, via the root scripts** (needs `npm install` at the root once
to pull in `concurrently`):
```bash
npm install
npm run dev
```

Either way, leave `NEXT_PUBLIC_API_URL` unset in
`sqlpath-frontend/.env.local` to exercise the same rewrite path the Docker
image uses (see the comment in that file) — that's the setup worth testing
before deploying.

## Building the single container

```bash
npm run docker:build      # docker build -t sqlpath .
npm run docker:run        # runs it locally on :3000, using sqlpath-backend/.env
```

Or plain `docker build -t sqlpath .` / `docker run -p 3000:3000 --env-file sqlpath-backend/.env sqlpath`.

The build needs `sqlpath-backend/.env` filled in with real values
(`DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, etc. —
see `sqlpath-backend/.env.example`) at **run** time, not build time; nothing
backend-specific is baked into the image at build time.

## Deploying

`DEPLOY-MONOLITH.md` walks through deploying this as a single Railway
service from the root `Dockerfile`/`railway.json`.

`sqlpath-backend/DEPLOY.md` still documents the original two-service
approach (one Railway project, backend + frontend as separate Nixpacks
services) — that's still valid if you'd rather keep them independently
scalable/deployable. Don't use both `railway.json`s in the same Railway
service: the root one builds the combined Docker image; the ones inside
`sqlpath-backend/` and `sqlpath-frontend/` are for the old per-service setup.

## What didn't change

- Each app's own source, dependencies, scripts, and `.env`/`.env.example`
  files are untouched, aside from the two edits above
  (`next.config.ts`, `src/lib/api.ts`).
- The backend's routes, auth, and CORS setup are unchanged.
- You can still deploy them as two separate services if you want to — the
  monolith is an additional option, not a replacement that locks you in.
