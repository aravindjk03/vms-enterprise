import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Minimal, dependency-free HS256 JWTs for short-lived access tokens.
 * Only HS256 is accepted (no `alg: none`, no algorithm confusion), and iss/aud/exp are mandatory.
 */
export interface AccessTokenClaims {
  sub: string; // user id
  tid: string; // tenant id
  sid: string; // session id (user_sessions.session_id)
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

const ISSUER = 'vms-enterprise';
const AUDIENCE = 'vms-api';
const HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

export function issueAccessToken(
  subject: { userId: string; tenantId: string; sessionId: string },
  secret: string,
  ttlSeconds: number
): { token: string; expiresAt: Date } {
  const now = Math.floor(Date.now() / 1000);
  const claims: AccessTokenClaims = {
    sub: subject.userId,
    tid: subject.tenantId,
    sid: subject.sessionId,
    iat: now,
    exp: now + ttlSeconds,
    iss: ISSUER,
    aud: AUDIENCE,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const body = `${HEADER}.${payload}`;
  return { token: `${body}.${sign(body, secret)}`, expiresAt: new Date(claims.exp * 1000) };
}

export function verifyAccessToken(token: string, secret: string): AccessTokenClaims | null {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== HEADER) return null;

  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, secret));
  const presented = Buffer.from(parts[2]);
  if (expected.length !== presented.length || !timingSafeEqual(expected, presented)) return null;

  let claims: AccessTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (
    claims.iss !== ISSUER ||
    claims.aud !== AUDIENCE ||
    typeof claims.exp !== 'number' ||
    claims.exp <= now ||
    typeof claims.sub !== 'string' ||
    typeof claims.tid !== 'string' ||
    typeof claims.sid !== 'string'
  ) {
    return null;
  }
  return claims;
}

/** Opaque refresh token; only its SHA-256 is stored server-side. */
export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Proof that the password step of a sign-in succeeded, exchanged for a session once the second factor
 * is verified. Its header differs from an access token's, so neither can be used as the other.
 */
export interface MfaChallengeClaims {
  sub: string; // user id
  tid: string; // tenant id
  exp: number;
  iss: string;
  aud: string;
}

const MFA_HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'MFA' })).toString('base64url');
const MFA_AUDIENCE = 'vms-mfa';

export function issueMfaChallenge(subject: { userId: string; tenantId: string }, secret: string, ttlSeconds = 300): { token: string; expiresAt: Date } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const claims: MfaChallengeClaims = { sub: subject.userId, tid: subject.tenantId, exp, iss: ISSUER, aud: MFA_AUDIENCE };
  const body = `${MFA_HEADER}.${Buffer.from(JSON.stringify({ ...claims, jti: randomBytes(9).toString('base64url') })).toString('base64url')}`;
  return { token: `${body}.${sign(body, secret)}`, expiresAt: new Date(exp * 1000) };
}

export function verifyMfaChallenge(token: string, secret: string): MfaChallengeClaims | null {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== MFA_HEADER) return null;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, secret));
  const presented = Buffer.from(parts[2]);
  if (expected.length !== presented.length || !timingSafeEqual(expected, presented)) return null;
  let claims: MfaChallengeClaims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (claims.iss !== ISSUER || claims.aud !== MFA_AUDIENCE || typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000)) return null;
  if (typeof claims.sub !== 'string' || typeof claims.tid !== 'string') return null;
  return claims;
}
