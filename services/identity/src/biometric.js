import { createHash, randomUUID } from 'node:crypto';
export class MockBiometricHardwareProvider {
    providerName = 'VMS_SECURE_EDGE_VISION_V2';
    async createReference(imageBuffer) {
        // Generate irreversible cryptographic reference token (never raw pixels!)
        const hash = createHash('sha256').update(imageBuffer).digest('hex');
        return {
            referenceToken: `bio-ref-${hash.substring(0, 32)}`,
            version: '2.4.0',
        };
    }
    async verifyFace(referenceToken, probeBuffer) {
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
    provider;
    references = new Map();
    auditEvents = [];
    constructor(provider = new MockBiometricHardwareProvider()) {
        this.provider = provider;
    }
    /**
     * Enrolls a person's biometric reference ONLY with documented statutory consent.
     * Strips raw image immediately and stores solely the protected reference ID.
     */
    async enroll(operator, personId, imageBuffer, consent) {
        if (!consent.accepted || consent.withdrawn || consent.consentType !== 'BIOMETRIC_PROCESSING') {
            throw new Error('Biometric processing prohibited: valid affirmative consent record is mandatory.');
        }
        if (operator.role !== 'SUPER_ADMIN' && operator.tenantId !== consent.tenantId) {
            throw new Error('Cross-tenant biometric enrollment prohibited.');
        }
        const { referenceToken, version } = await this.provider.createReference(imageBuffer);
        const biometricId = `bio-${randomUUID()}`;
        const now = new Date();
        // Default 1-year retention lifecycle
        const retentionExpiresAt = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
        const record = {
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
        this.references.set(personId, record);
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
    async verify(personId, probeBuffer, deviceInfo, transactionId) {
        const reference = this.references.get(personId);
        if (!reference || reference.status !== 'ACTIVE') {
            const deniedRecord = {
                verificationId: `bio-ver-${randomUUID()}`,
                tenantId: reference?.tenantId || 'UNKNOWN',
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
        const verificationRecord = {
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
        this.logAuditEvent(isSuccess ? 'FACE_VERIFICATION_SUCCESS' : 'FACE_VERIFICATION_FAILED', personId, {
            verificationId: verificationRecord.verificationId,
            device: deviceInfo,
            confidenceBand: result.confidenceBand,
        });
        return verificationRecord;
    }
    /**
     * Standalone liveness detection operation.
     */
    async liveness(probeBuffer) {
        // Hardware abstraction liveness verification
        if (probeBuffer.length < 8) {
            return { livenessPassed: false, confidenceBand: 'NOT_VERIFIED' };
        }
        return { livenessPassed: true, confidenceBand: 'VERIFIED' };
    }
    /**
     * Performs Right-to-be-Forgotten deletion of biometric reference.
     */
    async deleteReference(personId, reason = 'Consent withdrawn / Retention expiry') {
        const record = this.references.get(personId);
        if (!record)
            return false;
        record.status = 'REVOKED';
        record.deletedAt = new Date();
        this.references.delete(personId);
        this.logAuditEvent('BIOMETRIC_REFERENCE_DELETED', personId, { reason });
        return true;
    }
    /**
     * Alias for deleteReference per Section 19 specification.
     */
    async delete(personId, reason) {
        return this.deleteReference(personId, reason);
    }
    getReferenceStatus(personId) {
        const ref = this.references.get(personId);
        if (!ref)
            return 'NOT_ENROLLED';
        return ref.status;
    }
    /**
     * Alias for getReferenceStatus per Section 19 specification.
     */
    status(personId) {
        return this.getReferenceStatus(personId);
    }
    getAuditTrail() {
        return this.auditEvents;
    }
    logAuditEvent(action, personId, details) {
        this.auditEvents.push({
            action,
            personId,
            timestamp: new Date(),
            details,
        });
    }
}
