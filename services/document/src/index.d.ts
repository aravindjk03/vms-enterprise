import type { UserContext, DocumentRetentionPolicy, RetentionExecutionLog, RetentionException } from '@vms/types';
export interface IMalwareScanner {
    scan(buffer: Buffer): Promise<{
        clean: boolean;
        threatName?: string;
    }>;
}
export declare class DefaultMalwareScanner implements IMalwareScanner {
    scan(buffer: Buffer): Promise<{
        clean: boolean;
        threatName?: string;
    }>;
}
export interface FileUploadPayload {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    buffer: Buffer;
    tenantId: string;
    entityType: string;
    entityId: string;
    isSensitive?: boolean;
}
export interface FileValidationResult {
    valid: boolean;
    quarantined: boolean;
    error?: string;
    sanitizedFilename: string;
    storageKey?: string;
}
export interface SignedDocumentUrlResult {
    signedUrl: string;
    expiresAt: Date;
    documentId: string;
}
export declare class DocumentSecurityService {
    private malwareScanner;
    private static readonly MAX_FILE_SIZE;
    private static readonly ALLOWED_MIME_EXT_MAP;
    private retentionPolicies;
    private retentionExceptions;
    private legalHolds;
    private retentionLogs;
    private signingSecret;
    constructor(malwareScanner?: IMalwareScanner);
    /**
     * Validates file upload: MIME type, extension, size limit, magic bytes, malware scan, and quarantine state.
     */
    validateUpload(payload: FileUploadPayload): Promise<FileValidationResult>;
    /**
     * Generates a short-lived cryptographically signed URL for document retrieval.
     * Enforces that raw object storage paths are never exposed publicly.
     */
    generateSignedAccessUrl(user: UserContext, document: {
        documentId: string;
        tenantId: string;
        isSensitive?: boolean;
        storageKey: string;
    }, ttlSeconds?: number): SignedDocumentUrlResult;
    /**
     * Validates signed URL signature and expiration before serving document content.
     */
    verifySignedUrl(documentId: string, storageKey: string, expiresTimestamp: number, userId: string, signature: string): boolean;
    /**
     * Register a configurable document retention policy.
     */
    registerRetentionPolicy(policy: DocumentRetentionPolicy): void;
    /**
     * Register a retention exception (e.g. audit hold, legal preservation order).
     */
    registerRetentionException(exception: RetentionException): void;
    getRetentionException(exceptionId: string): RetentionException | undefined;
    /**
     * Apply a legal hold exception to prevent document disposal.
     */
    applyLegalHold(documentId: string): void;
    releaseLegalHold(documentId: string): void;
    /**
     * Evaluates document retention and protects against silent deletion of records subject to legal hold or retention exceptions.
     */
    evaluateRetentionDisposal(tenantId: string, documentId: string, documentType: string, createdAt: Date): {
        canDispose: boolean;
        action: 'DELETE' | 'ARCHIVE' | 'ANONYMIZE' | 'RETAIN';
        reason?: string;
    };
    getRetentionLogs(): RetentionExecutionLog[];
    private logRetentionAction;
    private verifyMagicBytes;
}
