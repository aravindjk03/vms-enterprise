import { SecretManager } from '@vms/config';

export interface ApiConfig {
  env: string;
  host: string;
  port: number;
  databaseUrl: string;
  databaseSsl: boolean;
  jwtSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  /**
   * Seconds after a refresh-token rotation during which the rotated-out token is answered with
   * "retry" instead of being treated as theft (parallel refreshes from several browser tabs).
   */
  refreshReuseGraceSeconds?: number;
  /** Mark the refresh cookie `Secure` (default: on in production). Turn off only for plain-HTTP test setups. */
  secureCookies?: boolean;
  maxFailedLogins: number;
  /** Sign-in attempts allowed per minute, per account. */
  loginRateLimitPerMinute: number;
  /** Sign-in attempts allowed per minute from one network address (an office NAT or proxy is one address). */
  loginRateLimitPerIpPerMinute?: number;
  lockoutMinutes: number;
  corsAllowedOrigins: string[];
  webDistDir?: string;
  trustProxy: boolean;
  /** Development escape hatch; production refuses DB roles that bypass row-level security. */
  allowPrivilegedDbRole: boolean;
  /**
   * Key material for encrypting two-step verification secrets at rest. Falls back to JWT_SECRET, in which
   * case rotating JWT_SECRET means users have to set up two-step verification again.
   */
  mfaEncryptionKey?: string;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function mfaKeyFromEnv(): string | undefined {
  const key = process.env['MFA_ENCRYPTION_KEY'];
  if (!key) return undefined;
  if (Buffer.byteLength(key) < 32) throw new Error('MFA_ENCRYPTION_KEY must be at least 32 bytes.');
  return key;
}

export function loadApiConfig(): ApiConfig {
  const env = process.env['NODE_ENV'] || 'production';
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required (connection for the RLS-restricted runtime role).');
  }

  const jwtSecret = SecretManager.getSecret('JWT_SECRET');
  if (Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes.');
  }
  // Fail at boot rather than on the first e-pass issued.
  SecretManager.getSecret('EPASS_SIGNING_SECRET');

  return {
    env,
    host: process.env['HOST'] || '0.0.0.0',
    port: int('PORT', int('APP_PORT', 8080)),
    databaseUrl,
    databaseSsl: process.env['DATABASE_SSL'] === 'true',
    jwtSecret,
    accessTokenTtlSeconds: int('JWT_EXPIRATION_SECONDS', 900),
    refreshTokenTtlSeconds: int('JWT_REFRESH_EXPIRATION_SECONDS', 12 * 3600),
    refreshReuseGraceSeconds: int('AUTH_REFRESH_GRACE_SECONDS', 10),
    secureCookies: process.env['COOKIE_SECURE'] ? process.env['COOKIE_SECURE'] === 'true' : env === 'production',
    maxFailedLogins: int('AUTH_MAX_FAILED_ATTEMPTS', 5),
    loginRateLimitPerMinute: int('RATE_LIMIT_LOGIN_MAX', 10),
    loginRateLimitPerIpPerMinute: int('RATE_LIMIT_LOGIN_IP_MAX', 100),
    lockoutMinutes: int('AUTH_LOCKOUT_DURATION_MINUTES', 15),
    corsAllowedOrigins: (process.env['CORS_ALLOWED_ORIGINS'] || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
    webDistDir: process.env['WEB_DIST_DIR'] || undefined,
    trustProxy: process.env['TRUST_PROXY'] === 'true',
    allowPrivilegedDbRole: env !== 'production' && process.env['ALLOW_PRIVILEGED_DB_ROLE'] === 'true',
    mfaEncryptionKey: mfaKeyFromEnv(),
  };
}
