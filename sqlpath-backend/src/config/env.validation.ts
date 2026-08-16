// Boot-time check for the environment variables the app cannot start
// without. Without this, a missing JWT_SECRET surfaces as a cryptic
// "JwtStrategy requires a secret or key" from deep inside passport-jwt
// after TypeORM has already connected — which in a container reads as a
// generic restart loop rather than "you forgot to set a variable".

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

const MIN_JWT_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}.\n` +
        `Set them on the host platform (Railway → Settings → Variables) or in ` +
        `sqlpath-backend/.env for local runs — see sqlpath-backend/.env.example.\n` +
        `Generate a JWT_SECRET with: openssl rand -base64 48`,
    );
  }

  const secret = String(config.JWT_SECRET);
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters ` +
        `(got ${secret.length}). Generate one with: openssl rand -base64 48`,
    );
  }

  return config;
}
