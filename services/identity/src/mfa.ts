import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { EnterpriseRole, MfaChannel, MfaPolicyConfig } from '@vms/types';

export interface TotpSecret {
  secretKey: string;
  uri: string;
}

export interface MfaChallenge {
  challengeId: string;
  userId: string;
  tenantId: string;
  requiredChannel: MfaChannel;
  expiresAt: Date;
  attempts: number;
}

export class MfaService {
  private static readonly TIME_STEP_SECONDS = 30;
  /** Failures across all of a user's challenges before MFA is locked for the user. */
  private static readonly USER_FAILURE_LIMIT = 10;
  private static readonly USER_LOCKOUT_MS = 15 * 60 * 1000;
  private challenges: Map<string, MfaChallenge> = new Map();
  private userMfaSecrets: Map<string, string> = new Map();
  /** SHA-256 hashes of unused recovery codes (codes themselves are shown once, never stored). */
  private userRecoveryCodeHashes: Map<string, Buffer[]> = new Map();
  /** Last accepted TOTP time step per user, to reject replay of a code within its window. */
  private lastAcceptedStep: Map<string, number> = new Map();
  private userFailures: Map<string, { count: number; lockedUntil?: number }> = new Map();

  constructor(
    private policy: MfaPolicyConfig = {
      mandatoryRoles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'IT_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER'],
      tenantEnforced: false,
      allowedChannels: ['TOTP', 'RECOVERY_CODE', 'OTP_EMAIL'],
      maxFailedAttempts: 3,
    }
  ) {}

  /**
   * Evaluates whether MFA is mandatory for a user based on role, user opt-in, and tenant policy.
   */
  public isMfaRequired(role: EnterpriseRole, userEnforced: boolean = false, tenantPolicyEnforced: boolean = false): boolean {
    if (this.policy.mandatoryRoles.includes(role)) {
      return true;
    }
    return userEnforced || tenantPolicyEnforced || this.policy.tenantEnforced;
  }

  /**
   * Generates a new TOTP secret for user enrollment.
   */
  public isEnrolled(userId: string): boolean {
    return this.userMfaSecrets.has(userId);
  }

  /**
   * Generates a new TOTP secret for user enrollment.
   * Replacing an existing enrollment requires a valid code from the current factor, so a
   * hijacked session cannot silently swap the user's authenticator.
   */
  public generateTotpSecret(userId: string, email: string, issuer: string = 'VMS-Enterprise', currentCode?: string): TotpSecret {
    const existing = this.userMfaSecrets.get(userId);
    if (existing && (!currentCode || this.matchTotpStep(existing, currentCode) === null)) {
      throw new Error('Re-enrolling MFA requires a valid code from the currently enrolled authenticator.');
    }
    const secretKey = randomBytes(20).toString('hex');
    this.userMfaSecrets.set(userId, secretKey);
    this.lastAcceptedStep.delete(userId);

    const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    return { secretKey, uri };
  }

  /**
   * Generates a set of single-use emergency recovery codes.
   */
  public generateRecoveryCodes(userId: string, count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 64 bits of entropy per code
      const raw = randomBytes(8).toString('hex').toUpperCase();
      codes.push(raw.match(/.{4}/g)!.join('-'));
    }
    this.userRecoveryCodeHashes.set(userId, codes.map(c => MfaService.hashRecoveryCode(c)));
    return codes;
  }

  /**
   * Computes current RFC 6238 TOTP code for a secret and time.
   */
  public computeTotp(secretKey: string, time: Date = new Date()): string {
    const counter = Math.floor(time.getTime() / 1000 / MfaService.TIME_STEP_SECONDS);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', Buffer.from(secretKey, 'hex'));
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = binary % 1_000_000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Verifies TOTP code allowing ±1 step clock drift (60 second window).
   */
  public verifyTotpCode(secretKey: string, token: string): boolean {
    return this.matchTotpStep(secretKey, token) !== null;
  }

  /** Returns the matching time step (±1 step drift) or null, comparing in constant time. */
  private matchTotpStep(secretKey: string, token: string): number | null {
    const trimmed = token.trim();
    if (!/^\d{6}$/.test(trimmed)) return null;

    const now = Date.now();
    const currentStep = Math.floor(now / 1000 / MfaService.TIME_STEP_SECONDS);
    let matched: number | null = null;
    for (const offset of [-1, 0, 1]) {
      const checkTime = new Date(now + offset * MfaService.TIME_STEP_SECONDS * 1000);
      if (timingSafeEqual(Buffer.from(this.computeTotp(secretKey, checkTime)), Buffer.from(trimmed))) {
        matched = currentStep + offset;
      }
    }
    return matched;
  }

  private static hashRecoveryCode(code: string): Buffer {
    return createHash('sha256').update(code.trim().toUpperCase().replace(/[^0-9A-F]/g, '')).digest();
  }

  /** Whether the user is currently locked out of MFA verification. */
  public isUserLocked(userId: string): boolean {
    const state = this.userFailures.get(userId);
    return !!state?.lockedUntil && Date.now() < state.lockedUntil;
  }

  private recordFailure(userId: string): void {
    const state = this.userFailures.get(userId) || { count: 0 };
    state.count++;
    if (state.count >= MfaService.USER_FAILURE_LIMIT) {
      state.lockedUntil = Date.now() + MfaService.USER_LOCKOUT_MS;
      state.count = 0;
    }
    this.userFailures.set(userId, state);
  }

  /**
   * Creates an MFA challenge when user credentials pass step 1.
   */
  public createChallenge(userId: string, tenantId: string, channel: MfaChannel = 'TOTP'): MfaChallenge {
    const challengeId = `mfa-ch-${randomBytes(16).toString('hex')}`;
    const challenge: MfaChallenge = {
      challengeId,
      userId,
      tenantId,
      requiredChannel: channel,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min TTL
      attempts: 0,
    };
    this.challenges.set(challengeId, challenge);
    return challenge;
  }

  /**
   * Verifies an active MFA challenge using TOTP or single-use recovery code.
   */
  public verifyChallenge(challengeId: string, token: string): { success: boolean; userId?: string; tenantId?: string; error?: string } {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return { success: false, error: 'MFA challenge expired or invalid.' };
    }

    if (Date.now() > challenge.expiresAt.getTime()) {
      this.challenges.delete(challengeId);
      return { success: false, error: 'MFA challenge has expired.' };
    }

    const { userId, tenantId } = challenge;

    // Per-user limit across challenges: a fresh password login must not reset MFA guessing.
    if (this.isUserLocked(userId)) {
      this.challenges.delete(challengeId);
      return { success: false, error: 'MFA is temporarily locked for this account.' };
    }

    challenge.attempts++;
    if (challenge.attempts > this.policy.maxFailedAttempts) {
      this.challenges.delete(challengeId);
      return { success: false, error: 'Maximum MFA verification attempts exceeded.' };
    }

    // Check Recovery Codes (hashed, constant-time comparison, single use)
    const recoveryHashes = this.userRecoveryCodeHashes.get(userId) || [];
    const candidate = MfaService.hashRecoveryCode(token);
    const recoveryIndex = recoveryHashes.findIndex(h => timingSafeEqual(h, candidate));
    if (recoveryIndex !== -1) {
      recoveryHashes.splice(recoveryIndex, 1);
      this.challenges.delete(challengeId);
      this.userFailures.delete(userId);
      return { success: true, userId, tenantId };
    }

    // Check TOTP
    const secret = this.userMfaSecrets.get(userId);
    if (!secret) {
      this.recordFailure(userId);
      return { success: false, error: 'No MFA enrollment registered for this user.' };
    }

    const step = this.matchTotpStep(secret, token);
    const lastStep = this.lastAcceptedStep.get(userId);
    if (step !== null && (lastStep === undefined || step > lastStep)) {
      this.lastAcceptedStep.set(userId, step);
      this.challenges.delete(challengeId);
      this.userFailures.delete(userId);
      return { success: true, userId, tenantId };
    }

    this.recordFailure(userId);
    return { success: false, error: 'Invalid MFA verification code.' };
  }
}
