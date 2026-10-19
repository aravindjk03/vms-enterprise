import { randomUUID } from 'node:crypto';
export class PrivacyConsentService {
    consents = new Map();
    auditTrail = [];
    /**
     * Records a granular, purpose-specific consent or refusal.
     */
    recordConsent(input) {
        const consentId = `csnt-${randomUUID()}`;
        const timestamp = new Date();
        const record = {
            consentId,
            tenantId: input.tenantId,
            personId: input.personId,
            transactionId: input.transactionId,
            purpose: input.purpose,
            consentType: input.consentType,
            versionPresented: input.versionPresented,
            accepted: input.accepted,
            timestamp,
            channel: input.channel,
            evidenceReference: input.evidenceReference,
            withdrawn: false,
        };
        this.consents.set(consentId, record);
        this.logAuditEvent(input.accepted ? 'CONSENT_GRANTED' : 'CONSENT_REFUSED', consentId, input.personId, {
            purpose: input.purpose,
            consentType: input.consentType,
            channel: input.channel,
        });
        return record;
    }
    /**
     * Verifies if a person has valid, active (non-withdrawn) affirmative consent for a specific purpose.
     */
    hasValidConsent(personId, consentType, purpose) {
        const personConsents = Array.from(this.consents.values()).filter(c => c.personId === personId && c.consentType === consentType && !c.withdrawn);
        if (personConsents.length === 0)
            return false;
        // If specific purpose provided, check matching purpose
        if (purpose) {
            return personConsents.some(c => c.accepted && c.purpose.toLowerCase() === purpose.toLowerCase());
        }
        // Latest consent for this type must be accepted
        personConsents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return personConsents[0].accepted;
    }
    /**
     * Withdraws an existing consent record per GDPR / DPDP Right-to-Withdraw.
     */
    withdrawConsent(consentId, requestedByUserId, reason) {
        const record = this.consents.get(consentId);
        if (!record)
            return false;
        record.withdrawn = true;
        record.withdrawnAt = new Date();
        this.logAuditEvent('CONSENT_WITHDRAWN', consentId, record.personId, {
            requestedByUserId,
            reason: reason || 'Individual invoked right to withdraw consent.',
        });
        return true;
    }
    /**
     * Withdraws all active consents for a person (e.g. right-to-be-forgotten / full withdrawal).
     */
    withdrawAllForPerson(personId, requestedByUserId, reason) {
        let count = 0;
        for (const record of this.consents.values()) {
            if (record.personId === personId && !record.withdrawn) {
                record.withdrawn = true;
                record.withdrawnAt = new Date();
                count++;
                this.logAuditEvent('CONSENT_WITHDRAWN', record.consentId, personId, {
                    requestedByUserId,
                    reason: reason || 'Comprehensive consent withdrawal.',
                });
            }
        }
        return count;
    }
    /**
     * Returns all consent records for a person (with tenant isolation check).
     */
    getConsentsForPerson(user, personId) {
        return Array.from(this.consents.values()).filter(c => {
            if (c.personId !== personId)
                return false;
            if (user.role !== 'SUPER_ADMIN' && user.tenantId !== c.tenantId)
                return false;
            return true;
        });
    }
    getAuditTrail(personId) {
        if (personId) {
            return this.auditTrail.filter(a => a.personId === personId);
        }
        return this.auditTrail;
    }
    logAuditEvent(action, consentId, personId, details) {
        this.auditTrail.push({
            action,
            consentId,
            personId,
            timestamp: new Date(),
            details,
        });
    }
}
