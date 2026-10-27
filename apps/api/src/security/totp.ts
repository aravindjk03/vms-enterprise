import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * Two-step verification with authenticator apps: TOTP (RFC 6238, HMAC-SHA1, 6 digits, 30-second steps,
 * the defaults every authenticator app supports), single-use recovery codes, and encryption of the
 * shared secret at rest. Dependency-free.
 */

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const RECOVERY_CODE_COUNT = 10;

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32 character.');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new 160-bit shared secret, base32-encoded for authenticator apps. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpStep(atMs: number = Date.now()): number {
  return Math.floor(atMs / 1000 / TOTP_STEP_SECONDS);
}

/** The code for one time step (RFC 4226 dynamic truncation). */
export function totpCode(secret: Buffer, step: number, digits = TOTP_DIGITS): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac('sha1', secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, '0');
}

/**
 * Checks a code against the current step and one step either side (clock drift). Returns the matching
 * step, or null. Steps at or before `lastUsedStep` are refused so a code works only once.
 */
export function verifyTotp(secretBase32: string, code: string, lastUsedStep: number, atMs: number = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = base32Decode(secretBase32);
  const now = totpStep(atMs);
  const presented = Buffer.from(code);
  let matched: number | null = null;
  for (const step of [now - 1, now, now + 1]) {
    // Compare every candidate (constant work) and keep the latest match.
    if (timingSafeEqual(Buffer.from(totpCode(secret, step)), presented) && step > lastUsedStep) matched = step;
  }
  return matched;
}

export function otpauthUrl(issuer: string, account: string, secretBase32: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({ secret: secretBase32, issuer, algorithm: 'SHA1', digits: String(TOTP_DIGITS), period: String(TOTP_STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Recovery codes: 10 characters from an alphabet without look-alikes, shown as XXXXX-XXXXX.
// ---------------------------------------------------------------------------

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(`vms-recovery:${normalizeRecoveryCode(code)}`).digest('hex');
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: count }, () => {
    const raw = Array.from({ length: 10 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)]).join('');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { codes, hashes: codes.map(hashRecoveryCode) };
}

/** Index of the stored hash that matches `code`, or -1. */
export function matchRecoveryCode(code: string, hashes: string[]): number {
  const normalized = normalizeRecoveryCode(code);
  if (normalized.length !== 10) return -1;
  const presented = Buffer.from(hashRecoveryCode(normalized));
  let found = -1;
  hashes.forEach((h, i) => {
    const stored = Buffer.from(h);
    if (stored.length === presented.length && timingSafeEqual(stored, presented)) found = i;
  });
  return found;
}

// ---------------------------------------------------------------------------
// Secret encryption at rest (AES-256-GCM). The key is derived from MFA_ENCRYPTION_KEY, or from
// JWT_SECRET when that is not set (rotating JWT_SECRET then requires users to set up again).
// ---------------------------------------------------------------------------

export function deriveMfaKey(material: string): Buffer {
  return Buffer.from(hkdfSync('sha256', Buffer.from(material), Buffer.from('vms-enterprise'), Buffer.from('mfa-secret-v1'), 32));
}

export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `v1.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url')}`;
}

export function decryptSecret(stored: string, key: Buffer): string {
  if (!stored.startsWith('v1.')) throw new Error('Unknown secret format.');
  const raw = Buffer.from(stored.slice(3), 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}
