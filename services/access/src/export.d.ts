import type { UserContext } from '@vms/types';
export interface ExportRequest {
    datasetName: string;
    filters: Record<string, unknown>;
    purpose?: string;
    records: Array<Record<string, unknown>>;
}
export interface ExportResult {
    exportId: string;
    datasetName: string;
    recordCount: number;
    exportedAt: Date;
    data: Array<Record<string, unknown>>;
    auditEvent: {
        exportId: string;
        actorUserId: string;
        datasetName: string;
        recordCount: number;
        filters: Record<string, unknown>;
        timestamp: Date;
    };
}
export declare class ExportSecurityService {
    private auditLogger?;
    constructor(auditLogger?: ((event: {
        action: string;
        tenantId: string;
        actorUserId: string;
        datasetName: string;
        recordCount: number;
        filters: Record<string, unknown>;
    }) => void) | undefined);
    /**
     * Securely processes and sanitizes dataset exports with mandatory authorization,
     * tenant-scoping verification, data minimization, and audit trail generation.
     */
    executeExport(user: UserContext, request: ExportRequest): ExportResult;
}
