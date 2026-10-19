import type { BiometricReferenceRecord, BiometricVerificationRecord, ConsentRecord, UserContext } from '@vms/types';
export interface IBiometricProvider {
    providerName: string;
    createReference(imageBuffer: Buffer): Promise<{
        referenceToken: string;
        version: string;
    }>;
    verifyFace(referenceToken: string, probeBuffer: Buffer): Promise<{
        livenessPassed: boolean;
        matched: boolean;
        confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
    }>;
}
export declare class MockBiometricHardwareProvider implements IBiometricProvider {
    providerName: string;
    createReference(imageBuffer: Buffer): Promise<{
        referenceToken: string;
        version: string;
    }>;
    verifyFace(referenceToken: string, probeBuffer: Buffer): Promise<{
        livenessPassed: boolean;
        matched: boolean;
        confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
    }>;
}
/**
 * Biometric Security Foundation Service
 * Encapsulates privacy-preserving face reference management and controlled liveness verification.
 */
export declare class BiometricSecurityService {
    private provider;
    private references;
    private auditEvents;
    constructor(provider?: IBiometricProvider);
    /**
     * Enrolls a person's biometric reference ONLY with documented statutory consent.
     * Strips raw image immediately and stores solely the protected reference ID.
     */
    enroll(operator: UserContext, personId: string, imageBuffer: Buffer, consent: ConsentRecord): Promise<BiometricReferenceRecord>;
    /**
     * Verifies live subject against enrolled reference token.
     * Returns sanitized decision (ALLOW / DENY / MANUAL_INSPECTION) without exposing internal vector models.
     */
    verify(personId: string, probeBuffer: Buffer, deviceInfo?: string, transactionId?: string): Promise<BiometricVerificationRecord>;
    /**
     * Standalone liveness detection operation.
     */
    liveness(probeBuffer: Buffer): Promise<{
        livenessPassed: boolean;
        confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
    }>;
    /**
     * Performs Right-to-be-Forgotten deletion of biometric reference.
     */
    deleteReference(personId: string, reason?: string): Promise<boolean>;
    /**
     * Alias for deleteReference per Section 19 specification.
     */
    delete(personId: string, reason?: string): Promise<boolean>;
    getReferenceStatus(personId: string): 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_ENROLLED';
    /**
     * Alias for getReferenceStatus per Section 19 specification.
     */
    status(personId: string): 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_ENROLLED';
    getAuditTrail(): {
        action: string;
        personId: string;
        timestamp: Date;
        details?: Record<string, unknown>;
    }[];
    private logAuditEvent;
}
