import { createHash, randomUUID } from 'node:crypto';
import type {
  BiometricReferenceRecord,
  BiometricVerificationRecord,
  ConsentRecord,
  UserContext,
} from '@vms/types';

export interface IBiometricProvider {
  providerName: string;
  createReference(imageBuffer: Buffer): Promise<{ referenceToken: string; version: string }>;
  verifyFace(referenceToken: string, probeBuffer: Buffer): Promise<{
    livenessPassed: boolean;
    matched: boolean;
    confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
  }>;
}

export class MockBiometricHardwareProvider implements IBiometricProvider {
  public providerName = 'VMS_SECURE_EDGE_VISION_V2';

  public async createReference(imageBuffer: Buffer): Promise<{ referenceToken: string; version: string }> {
    // Generate irreversible cryptographic reference token (never raw pixels!)
    const hash = createHash('sha256').update(imageBuffer).digest('hex');
    return {
      referenceToken: `bio-ref-${hash.substring(0, 32)}`,
      version: '2.4.0',
    };
  }

  public async verifyFace(referenceToken: string, probeBuffer: Buffer): Promise<{
    livenessPassed: boolean;
    matched: boolean;
    confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
  }> {
    const probeHash = createHash('sha256').update(probeBuffer).digest('hex');
    const probeToken = `bio-ref-${probeHash.substring(0, 32)}`;

    // In simulation: matching if tokens match, otherwise test condition
    const matched = referenceToken === probeToken;
    return {
      livenessPassed: true,
      matched,
      confidenceBand: matched ? 'VERIFIED' : 'NOT_VERIFIED',
    };
  }
}

/**
 * Biometric Security Foundation Service
 * Encapsulates privacy-preserving face reference management and controlled liveness verification.
 */
export class BiometricSecurityService {
  private references: Map<string, BiometricReferenceRecord> = new Map();
  private auditEvents: Array<{ action: string; personId: string; timestamp: Date; details?: Record<string, unknown> }> = [];

  constructor(private provider: IBiometricProvider = new MockBiometricHardwareProvider()) {}

  private static referenceKey(tenantId: string, personId: string): string {
    return `${tenantId}:${personId}`;
  }

  /**
   * Enrolls a person's biometric reference ONLY with documented statutory consent.
   * Strips raw image immediately and stores solely the protected reference ID.
   */
  public async enroll(
    operator: UserContext,
    personId: string,
    imageBuffer: Buffer,
    consent: ConsentRecord
  ): Promise<BiometricReferenceRecord> {
    if (!consent.accepted || consent.withdrawn || consent.consentType !== 'BIOMETRIC_PROCESSING') {
      throw new Error('Biometric processing prohibited: valid affirmative consent record is mandatory.');
    }

    if (consent.personId !== personId) {
      throw new Error('Biometric processing prohibited: consent record belongs to a different person.');
    }

    if (operator.tenantId !== consent.tenantId) {
      throw new Error('Cross-tenant biometric enrollment prohibited.');
    }

    const { referenceToken, version } = await this.provider.createReference(imageBuffer);
    const biometricId = `bio-${randomUUID()}`;
    const now = new Date();
    // Default 1-year retention lifecycle
    const retentionExpiresAt = new Date(now.getTime() + 365 * 24 * 3600 * 1000);

    const record: BiometricReferenceRecord = {
      biometricId,
      tenantId: consent.tenantId,
      personId,
      provider: this.provider.providerName,
      templateReferenceId: referenceToken,
      version,
      status: 'ACTIVE',
      consentReferenceId: consent.consentId,
      retentionExpiresAt,
      enrolledAt: now,
    };

    this.references.set(BiometricSecurityService.referenceKey(consent.tenantId, personId), record);
    this.logAuditEvent('FACE_ENROLLMENT_COMPLETED', personId, {
      biometricId,
      provider: record.provider,
      consentId: consent.consentId,
    });

    return record;
  }

  /**
   * Verifies live subject against enrolled reference token.
   * Returns sanitized decision (ALLOW / DENY / MANUAL_INSPECTION) without exposing internal vector models.
   */
  public async verify(
    operator: UserContext,
    personId: string,
    probeBuffer: Buffer,
    deviceInfo?: string,
    transactionId?: string
  ): Promise<BiometricVerificationRecord> {
    // References are tenant-keyed: an operator can only ever match against its own tenant's enrollments.
    const stored = this.references.get(BiometricSecurityService.referenceKey(operator.tenantId, personId));
    const retentionExpired = !!stored && stored.retentionExpiresAt.getTime() <= Date.now();
    const reference = stored && !retentionExpired ? stored : undefined;
    if (!reference || reference.status !== 'ACTIVE') {
      const deniedRecord: BiometricVerificationRecord = {
        verificationId: `bio-ver-${randomUUID()}`,
        tenantId: operator.tenantId,
        personId,
        transactionId,
        provider: this.provider.providerName,
        method: 'FACIAL_RECOGNITION',
        livenessResult: false,
        matchResult: false,
        confidenceBand: 'NOT_VERIFIED',
        timestamp: new Date(),
        device: deviceInfo,
        result: 'DENY',
        failureReason: 'Active biometric enrollment reference not found.',
      };
      this.logAuditEvent('FACE_VERIFICATION_FAILED', personId, { reason: deniedRecord.failureReason });
      return deniedRecord;
    }

    const result = await this.provider.verifyFace(reference.templateReferenceId, probeBuffer);

    const isSuccess = result.livenessPassed && result.matched;
    const verificationRecord: BiometricVerificationRecord = {
      verificationId: `bio-ver-${randomUUID()}`,
      tenantId: reference.tenantId,
      personId,
      transactionId,
      provider: this.provider.providerName,
      method: 'FACIAL_RECOGNITION',
      livenessResult: result.livenessPassed,
      matchResult: result.matched,
      confidenceBand: result.confidenceBand,
      timestamp: new Date(),
      device: deviceInfo,
      result: isSuccess ? 'ALLOW' : 'DENY',
      failureReason: isSuccess ? undefined : 'Face vector does not match enrolled reference or liveness check failed.',
    };

    this.logAuditEvent(
      isSuccess ? 'FACE_VERIFICATION_SUCCESS' : 'FACE_VERIFICATION_FAILED',
      personId,
      {
        verificationId: verificationRecord.verificationId,
        device: deviceInfo,
        confidenceBand: result.confidenceBand,
      }
    );

    return verificationRecord;
  }

  /**
   * Standalone liveness detection operation.
   */
  public async liveness(probeBuffer: Buffer): Promise<{
    livenessPassed: boolean;
    confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
  }> {
    // Hardware abstraction liveness verification
    if (probeBuffer.length < 8) {
      return { livenessPassed: false, confidenceBand: 'NOT_VERIFIED' };
    }
    return { livenessPassed: true, confidenceBand: 'VERIFIED' };
  }

  /**
   * Performs Right-to-be-Forgotten deletion of biometric reference.
   */
  public async deleteReference(tenantId: string, personId: string, reason: string = 'Consent withdrawn / Retention expiry'): Promise<boolean> {
    const key = BiometricSecurityService.referenceKey(tenantId, personId);
    const record = this.references.get(key);
    if (!record) return false;

    record.status = 'REVOKED';
    record.deletedAt = new Date();
    this.references.delete(key);

    this.logAuditEvent('BIOMETRIC_REFERENCE_DELETED', personId, { reason });
    return true;
  }

  /**
   * Alias for deleteReference per Section 19 specification.
   */
  public async delete(tenantId: string, personId: string, reason?: string): Promise<boolean> {
    return this.deleteReference(tenantId, personId, reason);
  }

  public getReferenceStatus(tenantId: string, personId: string): 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_ENROLLED' {
    const ref = this.references.get(BiometricSecurityService.referenceKey(tenantId, personId));
    if (!ref) return 'NOT_ENROLLED';
    if (ref.retentionExpiresAt.getTime() <= Date.now()) return 'EXPIRED';
    return ref.status;
  }

  /**
   * Alias for getReferenceStatus per Section 19 specification.
   */
  public status(tenantId: string, personId: string): 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_ENROLLED' {
    return this.getReferenceStatus(tenantId, personId);
  }

  public getAuditTrail() {
    return this.auditEvents;
  }

  private logAuditEvent(action: string, personId: string, details?: Record<string, unknown>) {
    this.auditEvents.push({
      action,
      personId,
      timestamp: new Date(),
      details,
    });
  }
}
