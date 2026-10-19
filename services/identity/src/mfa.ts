import { createHmac, randomBytes } from 'node:crypto';
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
  private challenges: Map<string, MfaChallenge> = new Map();
  private userMfaSecrets: Map<string, string> = new Map();
  private userRecoveryCodes: Map<string, string[]> = new Map();

  constructor(
    private policy: MfaPolicyConfig = {
      mandatoryRoles: ['SUPER_ADMIN'],
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
  public generateTotpSecret(userId: string, email: string, issuer: string = 'VMS-Enterprise'): TotpSecret {
    const secretKey = randomBytes(20).toString('hex');
    this.userMfaSecrets.set(userId, secretKey);

    const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    return { secretKey, uri };
  }

  /**
   * Generates a set of single-use emergency recovery codes.
   */
  public generateRecoveryCodes(userId: string, count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = `${randomBytes(2).toString('hex')}-${randomBytes(2).toString('hex')}`.toUpperCase();
      codes.push(code);
    }
    this.userRecoveryCodes.set(userId, [...codes]);
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
    const trimmed = token.trim();
    if (trimmed.length !== 6) return false;

    const now = Date.now();
    for (const offset of [-1, 0, 1]) {
      const checkTime = new Date(now + offset * MfaService.TIME_STEP_SECONDS * 1000);
      if (this.computeTotp(secretKey, checkTime) === trimmed) {
        return true;
      }
    }
    return false;
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

    challenge.attempts++;
    if (challenge.attempts > this.policy.maxFailedAttempts) {
      this.challenges.delete(challengeId);
      return { success: false, error: 'Maximum MFA verification attempts exceeded.' };
    }

    // Check Recovery Codes
    const recoveryCodes = this.userRecoveryCodes.get(challenge.userId) || [];
    const recoveryIndex = recoveryCodes.indexOf(token.trim().toUpperCase());
    if (recoveryIndex !== -1) {
      // Consume single-use code
      recoveryCodes.splice(recoveryIndex, 1);
      this.userRecoveryCodes.set(challenge.userId, recoveryCodes);
      this.challenges.delete(challengeId);
      return { success: true, userId, tenantId };
    }

    // Check TOTP
    const secret = this.userMfaSecrets.get(challenge.userId);
    if (!secret) {
      return { success: false, error: 'No MFA enrollment registered for this user.' };
    }

    const isValid = this.verifyTotpCode(secret, token);
    if (isValid) {
      this.challenges.delete(challengeId);
      return { success: true, userId, tenantId };
    }

    return { success: false, error: 'Invalid MFA verification code.' };
  }
}
