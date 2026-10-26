import { pbkdf2, timingSafeEqual } from 'node:crypto';
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
