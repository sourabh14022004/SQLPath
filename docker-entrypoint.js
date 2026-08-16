// Starts the NestJS backend and the Next.js frontend as two child
// processes inside one container. The frontend is the only public
// process (it binds $PORT, whatever the host platform injects); the
// backend binds an internal-only port and is reached via Next's
// rewrites (see sqlpath-frontend/next.config.ts).
//
// If either child exits, this process exits too, so the container
// orchestrator (Docker/Railway restart policy) can restart the whole
// thing rather than leaving a half-alive container running.

const { spawn } = require('child_process');
const path = require('path');

const BACKEND_PORT = process.env.BACKEND_INTERNAL_PORT || '4000';
const FRONTEND_PORT = process.env.PORT || '3000';

let shuttingDown = false;

function run(name, cmd, args, cwd, env) {
  const child = spawn(cmd, args, {
    cwd: path.join(__dirname, cwd),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`[${name}] exited (code=${code}, signal=${signal}) — shutting down container`);
    process.exit(code ?? 1);
  });

  child.on('error', (err) => {
    console.error(`[${name}] failed to start:`, err);
    process.exit(1);
  });

  return child;
}

console.log(`Starting backend on internal port ${BACKEND_PORT}...`);
const backend = run('backend', 'node', ['dist/main.js'], 'backend', {
  PORT: BACKEND_PORT,
});

// Give the backend a couple seconds to bind before the frontend starts
// accepting public traffic that might immediately proxy to it.
setTimeout(() => {
  console.log(`Starting frontend on public port ${FRONTEND_PORT}...`);
  run('frontend', 'node_modules/.bin/next', ['start', '-p', FRONTEND_PORT], 'frontend', {
    PORT: FRONTEND_PORT,
    BACKEND_INTERNAL_URL: `http://localhost:${BACKEND_PORT}`,
  });
}, 2000);

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down...`);
  backend.kill(signal);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
