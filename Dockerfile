# syntax=docker/dockerfile:1
#
# Single-container build for SQLPath: builds the NestJS backend and the
# Next.js frontend separately, then runs both in one image via
# docker-entrypoint.js. Only the frontend's port is exposed publicly —
# it proxies /api/v1/* to the backend over localhost (see
# sqlpath-frontend/next.config.ts `rewrites()`), so the browser only ever
# talks to one origin.
#
# bcrypt (backend dep) ships native bindings, so the build stages need a
# C toolchain. Debian slim images have it (and better prebuilt-binary
# compatibility than Alpine/musl), which is why we use `bookworm-slim`
# instead of `alpine` here.

# ---------- Backend build ----------
FROM node:20-bookworm-slim AS backend-build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY sqlpath-backend/package*.json ./
RUN npm install
COPY sqlpath-backend/ ./
RUN npm run build

# ---------- Frontend build ----------
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY sqlpath-frontend/package*.json ./
RUN npm install
COPY sqlpath-frontend/ ./
# No NEXT_PUBLIC_API_URL is set here on purpose: src/lib/api.ts defaults to
# the relative path '/api/v1', which the rewrite below forwards to the
# backend. That keeps the browser same-origin against the frontend only.
RUN npm run build

# ---------- Runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Backend runtime deps + compiled output
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY --from=backend-build /app/backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY --from=backend-build /app/backend/dist ./backend/dist

# Frontend runtime deps + build output
COPY --from=frontend-build /app/frontend/package*.json ./frontend/
RUN cd frontend && npm install --omit=dev
COPY --from=frontend-build /app/frontend/.next ./frontend/.next
COPY --from=frontend-build /app/frontend/public ./frontend/public
COPY --from=frontend-build /app/frontend/next.config.ts ./frontend/

COPY docker-entrypoint.js ./

# The platform (Railway, etc.) injects PORT for the single public port,
# which the frontend binds to. The backend listens internally on
# BACKEND_INTERNAL_PORT and is never exposed directly.
ENV BACKEND_INTERNAL_PORT=4000
EXPOSE 3000

CMD ["node", "docker-entrypoint.js"]
