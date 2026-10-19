import type { ConsentRecord, UserContext } from '@vms/types';
export interface RecordConsentInput {
    tenantId: string;
    personId: string;
    transactionId?: string;
    purpose: string;
    consentType: ConsentRecord['consentType'];
    versionPresented: string;
    accepted: boolean;
    channel: ConsentRecord['channel'];
    evidenceReference?: string;
}
export declare class PrivacyConsentService {
    private consents;
    private auditTrail;
    /**
     * Records a granular, purpose-specific consent or refusal.
     */
    recordConsent(input: RecordConsentInput): ConsentRecord;
    /**
     * Verifies if a person has valid, active (non-withdrawn) affirmative consent for a specific purpose.
     */
    hasValidConsent(personId: string, consentType: ConsentRecord['consentType'], purpose?: string): boolean;
    /**
     * Withdraws an existing consent record per GDPR / DPDP Right-to-Withdraw.
     */
    withdrawConsent(consentId: string, requestedByUserId?: string, reason?: string): boolean;
    /**
     * Withdraws all active consents for a person (e.g. right-to-be-forgotten / full withdrawal).
     */
    withdrawAllForPerson(personId: string, requestedByUserId?: string, reason?: string): number;
    /**
     * Returns all consent records for a person (with tenant isolation check).
     */
    getConsentsForPerson(user: UserContext, personId: string): ConsentRecord[];
    getAuditTrail(personId?: string): {
        action: string;
        consentId: string;
        personId: string;
        timestamp: Date;
        details?: Record<string, unknown>;
    }[];
    private logAuditEvent;
}
