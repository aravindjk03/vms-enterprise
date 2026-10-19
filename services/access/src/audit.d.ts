import type { AuditRecord, EventClassification, SecurityAlert } from '@vms/types';
export interface AuditLogInput {
    tenantId: string;
    actorUserId: string;
    actorRoleContext: AuditRecord['actorRoleContext'];
    action: string;
    entityType: string;
    entityId: string;
    requestId: string;
    correlationId: string;
    source?: string;
    ipMetadata?: string;
    deviceMetadata?: string;
    beforeSnapshot?: Record<string, unknown>;
    afterSnapshot?: Record<string, unknown>;
    reason?: string;
    result?: 'SUCCESS' | 'DENIED' | 'FAILED';
    eventClassification?: EventClassification;
}
export declare class TamperEvidentAuditService {
    private static readonly SENSITIVE_KEYS_BLACKLIST;
    private records;
    private lastHash;
    private securityAlerts;
    /**
     * Deterministic canonical JSON serializer (sorts keys recursively)
     */
    static canonicalJson(obj: unknown): string;
    /**
     * Records an audited action into a cryptographically chained, tamper-evident ledger.
     * Automatically scrubs passwords, credentials, tokens, and biometric vectors.
     */
    logAudit(input: AuditLogInput): AuditRecord;
    /**
     * Verifies the cryptographic integrity of the entire audit chain.
     * Detects any retroactively modified, reordered, or deleted records.
     */
    verifyChainIntegrity(): {
        intact: boolean;
        totalChecked: number;
        corruptedRecordId?: string;
        reason?: string;
    };
    getRecords(tenantId?: string): AuditRecord[];
    getSecurityAlerts(tenantId?: string): SecurityAlert[];
    /**
     * Sanitizes objects by removing blacklisted secret keys.
     */
    private scrubSensitiveData;
    /**
     * Rule-based real-time security alerting for all 8 enterprise alert types
     */
    private evaluateSecurityAlerts;
}
