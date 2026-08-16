import type { NextConfig } from "next";

// Where the NestJS backend actually lives, from this frontend process's
// point of view. Defaults to the backend's normal local dev address
// (`npm run start:dev` in sqlpath-backend, port 3000). In the combined
// Docker image, docker-entrypoint.js overrides this to the backend's
// internal-only port so the two processes talk over localhost inside
// the same container.
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_INTERNAL_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
