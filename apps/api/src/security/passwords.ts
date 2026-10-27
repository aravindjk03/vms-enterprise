import { pbkdf2, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { PasswordSecurityService } from '@vms/identity';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);

/** Hash used when the account does not exist, so response timing does not reveal valid usernames. */
const DUMMY_HASH = `pbkdf2:100000:${'0'.repeat(32)}:${'0'.repeat(128)}`;

/**
 * Async verification of the `pbkdf2:iterations:salt:hash` format produced by
 * PasswordSecurityService (services/identity), so login does not block the event loop.
 */
export async function verifyPasswordAsync(plaintext: string, storedHash: string | null | undefined): Promise<boolean> {
  const parts = (storedHash || DUMMY_HASH).split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 100_000 || iterations > 2_000_000) return false;

  const expected = Buffer.from(parts[3], 'hex');
  const computed = await pbkdf2Async(plaintext, parts[2], iterations, 64, 'sha512');
  const match = expected.length === computed.length && timingSafeEqual(expected, computed);
  return match && !!storedHash;
}

const ITERATIONS = 100_000;
const policy = new PasswordSecurityService();

/** Async PBKDF2 hash in the same `pbkdf2:iterations:salt:hash` format, so requests do not block the event loop. */
export async function hashPasswordAsync(plaintext: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await pbkdf2Async(plaintext, salt, ITERATIONS, 64, 'sha512');
  return `pbkdf2:${ITERATIONS}:${salt}:${hash.toString('hex')}`;
}

/** Enterprise password policy (length and character classes); returns the reasons a password is rejected. */
export function passwordPolicyErrors(password: string): string[] {
  return policy.validatePolicy(password).errors;
}

/** Number of previous passwords that may not be reused. */
export const PASSWORD_HISTORY_LIMIT = 5;

const ALPHABETS = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!#%+=?@'];

/**
 * A one-time password for a new or reset account (16 characters, every class the policy requires,
 * look-alike characters left out). It is shown once to the administrator and must be changed at first sign-in.
 */
export function generateTemporaryPassword(length = 16): string {
  const all = ALPHABETS.join('');
  const chars = ALPHABETS.map(a => a[randomInt(a.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
