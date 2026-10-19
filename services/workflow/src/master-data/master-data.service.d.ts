import type { MasterRecord, MasterRecordStatus, MasterDataCategoryDef, MasterDataImportRow, MasterDataImportResult, UserContext } from '@vms/types';
import { MasterDataRepository, AuditRepository, TenantRepository } from '@vms/database';
export interface CreateMasterRecordInput {
    organizationId?: string;
    siteId?: string;
    category: string;
    code: string;
    name: string;
    description?: string;
    parentRecordId?: string;
    status?: MasterRecordStatus;
    sortOrder?: number;
    effectiveFrom?: Date;
    effectiveUntil?: Date;
    metadata?: Record<string, unknown>;
}
export interface UpdateMasterRecordInput {
    name?: string;
    description?: string;
    parentRecordId?: string;
    sortOrder?: number;
    effectiveFrom?: Date;
    effectiveUntil?: Date;
    metadata?: Record<string, unknown>;
    changeReason?: string;
}
export declare class MasterDataService {
    private masterRepo;
    private auditRepo;
    private tenantRepo;
    private categoriesMap;
    constructor(masterRepo: MasterDataRepository, auditRepo: AuditRepository, tenantRepo: TenantRepository);
    getCategory(code: string): MasterDataCategoryDef | null;
    listCategories(): MasterDataCategoryDef[];
    registerCategory(cat: MasterDataCategoryDef): void;
    /**
     * Creates a new master record with strict tenant isolation, validation, and audit logging.
     */
    createRecord(input: CreateMasterRecordInput, user: UserContext): Promise<MasterRecord>;
    /**
     * Updates an existing master record with version preservation and audit logging.
     */
    updateRecord(recordId: string, updates: UpdateMasterRecordInput, user: UserContext): Promise<MasterRecord>;
    /**
     * Activates a record, checking if approval is required.
     */
    activateRecord(recordId: string, user: UserContext): Promise<MasterRecord>;
    /**
     * Deactivates a record without physically deleting it or corrupting historical transactions.
     */
    deactivateRecord(recordId: string, reason: string, user: UserContext): Promise<MasterRecord>;
    /**
     * Archives a record. Prevents physical deletion if referenced by historical transactions.
     */
    archiveRecord(recordId: string, user: UserContext): Promise<MasterRecord>;
    getRecord(recordId: string, tenantId: string): MasterRecord | null;
    getRecordByCode(category: string, code: string, tenantId: string): MasterRecord | null;
    /**
     * Lists records filtered by category, status, and effective date.
     * Ordinary operational forms should exclude INACTIVE and ARCHIVED records.
     */
    listRecords(params: {
        category?: string;
        siteId?: string;
        status?: MasterRecordStatus | MasterRecordStatus[];
        activeOnly?: boolean;
        asOfDate?: Date;
        tenantId: string;
    }): MasterRecord[];
    getRecordHistory(recordId: string): any[];
    generateCsvTemplate(categoryCode: string): string;
    private splitCsvLine;
    parseCsv(csvText: string): MasterDataImportRow[];
    /**
     * Previews CSV import, performing row-level validation, reference checks, and duplicate detection.
     */
    previewImport(categoryCode: string, rows: MasterDataImportRow[], user: UserContext): {
        totalRows: number;
        validRows: number;
        errors: Array<{
            rowNumber: number;
            code?: string;
            field?: string;
            message: string;
        }>;
    };
    /**
     * Executes CSV import transactionally.
     * If there are errors and strict mode is on, rejects completely and rolls back any partial mutations.
     */
    executeImport(categoryCode: string, rows: MasterDataImportRow[], user: UserContext): Promise<MasterDataImportResult>;
}
