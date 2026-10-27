import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  base32Decode,
  base32Encode,
  decryptSecret,
  deriveMfaKey,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  matchRecoveryCode,
  otpauthUrl,
  totpCode,
  totpStep,
  verifyTotp,
} from '../apps/api/src/security/totp.js';
import { issueAccessToken, issueMfaChallenge, verifyAccessToken, verifyMfaChallenge } from '../apps/api/src/security/tokens.js';

const RFC_SECRET = Buffer.from('12345678901234567890');

test('two-step verification primitives', async t => {
  await t.test('codes match the RFC 6238 SHA-1 reference values', () => {
    const vectors: Array<[number, string]> = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1111111111, '14050471'],
      [1234567890, '89005924'],
      [2000000000, '69279037'],
      [20000000000, '65353130'],
    ];
    for (const [seconds, expected] of vectors) {
      assert.equal(totpCode(RFC_SECRET, totpStep(seconds * 1000), 8), expected, `T=${seconds}`);
      assert.equal(totpCode(RFC_SECRET, totpStep(seconds * 1000)), expected.slice(2), `T=${seconds} (6 digits)`);
    }
  });

  await t.test('base32 round-trips and secrets carry 160 bits', () => {
    assert.equal(base32Encode(Buffer.from('foobar')), 'MZXW6YTBOI');
    assert.deepEqual(base32Decode('MZXW 6YTB-OI'), Buffer.from('foobar'));
    const secret = generateTotpSecret();
    assert.equal(base32Decode(secret).length, 20);
  });

  await t.test('a code is accepted within one step of drift, once, and never after its step was used', () => {
    const secret = base32Encode(RFC_SECRET);
    const at = 1_700_000_000_000;
    const step = totpStep(at);
    const code = totpCode(RFC_SECRET, step);
    assert.equal(verifyTotp(secret, code, 0, at), step);
    assert.equal(verifyTotp(secret, code, 0, at + 30_000), step, 'previous step still accepted');
    assert.equal(verifyTotp(secret, code, 0, at + 90_000), null, 'too old');
    assert.equal(verifyTotp(secret, code, step, at), null, 'replay refused');
    assert.equal(verifyTotp(secret, '12345', 0, at), null);
    assert.equal(verifyTotp(secret, 'abcdef', 0, at), null);
  });

  await t.test('recovery codes are random, hashed and matched case- and dash-insensitively', () => {
    const { codes, hashes } = generateRecoveryCodes();
    assert.equal(codes.length, 10);
    assert.equal(new Set(codes).size, 10);
    for (const c of codes) assert.match(c, /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
    assert.ok(hashes.every(h => !codes.some(c => h.includes(c.replace('-', '')))), 'hashes do not contain the codes');
    assert.equal(matchRecoveryCode(codes[3].toLowerCase().replace('-', ' '), hashes), 3);
    assert.equal(matchRecoveryCode('AAAAA-AAAAA', hashes), -1);
  });

  await t.test('secrets are encrypted with authentication and need the right key', () => {
    const key = deriveMfaKey('a'.repeat(40));
    const stored = encryptSecret('JBSWY3DPEHPK3PXP', key);
    assert.ok(stored.startsWith('v1.') && !stored.includes('JBSWY3DP'));
    assert.equal(decryptSecret(stored, key), 'JBSWY3DPEHPK3PXP');
    assert.throws(() => decryptSecret(stored, deriveMfaKey('b'.repeat(40))));
    assert.notEqual(encryptSecret('JBSWY3DPEHPK3PXP', key), stored, 'fresh IV every time');
  });

  await t.test('otpauth links carry the issuer and account for authenticator apps', () => {
    const url = otpauthUrl('VMS Enterprise', 'dana (Northwind)', 'JBSWY3DPEHPK3PXP');
    assert.ok(url.startsWith('otpauth://totp/VMS%20Enterprise:dana%20(Northwind)?'));
    assert.ok(url.includes('secret=JBSWY3DPEHPK3PXP') && url.includes('issuer=VMS+Enterprise') && url.includes('digits=6'));
  });

  await t.test('sign-in challenges and access tokens cannot stand in for each other', () => {
    const secret = 'x'.repeat(40);
    const challenge = issueMfaChallenge({ userId: 'u1', tenantId: 't1' }, secret).token;
    assert.equal(verifyMfaChallenge(challenge, secret)?.sub, 'u1');
    assert.equal(verifyAccessToken(challenge, secret), null);
    const access = issueAccessToken({ userId: 'u1', tenantId: 't1', sessionId: 's1' }, secret, 60).token;
    assert.equal(verifyMfaChallenge(access, secret), null);
    assert.equal(verifyMfaChallenge(challenge, 'y'.repeat(40)), null);
    const expired = issueMfaChallenge({ userId: 'u1', tenantId: 't1' }, secret, -1).token;
    assert.equal(verifyMfaChallenge(expired, secret), null);
  });
});
