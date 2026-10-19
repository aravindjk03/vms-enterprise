import { createHmac, randomBytes } from 'node:crypto';
import { evaluateAccess } from '@vms/permissions';
export class DefaultMalwareScanner {
    async scan(buffer) {
        // Check for EICAR standard test signature (58 bytes)
        const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
        if (buffer.toString('utf8').includes(eicar)) {
            return { clean: false, threatName: 'EICAR_STANDARD_TEST_SIGNATURE' };
        }
        return { clean: true };
    }
}
export class DocumentSecurityService {
    malwareScanner;
    static MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    static ALLOWED_MIME_EXT_MAP = {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'text/csv': ['.csv'],
    };
    retentionPolicies = new Map();
    retentionExceptions = new Map();
    legalHolds = new Set(); // Document IDs marked with legal hold
    retentionLogs = [];
    signingSecret = randomBytes(32).toString('hex');
    constructor(malwareScanner = new DefaultMalwareScanner()) {
        this.malwareScanner = malwareScanner;
    }
    /**
     * Validates file upload: MIME type, extension, size limit, magic bytes, malware scan, and quarantine state.
     */
    async validateUpload(payload) {
        // 1. File Size Check
        if (payload.sizeBytes > DocumentSecurityService.MAX_FILE_SIZE) {
            return {
                valid: false,
                quarantined: true,
                sanitizedFilename: payload.filename,
                error: `File size exceeds allowed maximum limit of 25 MB.`,
            };
        }
        // 2. Extension Check & Path Traversal Sanitization
        const baseName = payload.filename.replace(/^.*[\\\/]/, '').replace(/\.\.+/g, '');
        const extMatch = baseName.match(/\.[0-9a-z]+$/i);
        const extension = extMatch ? extMatch[0].toLowerCase() : '';
        const allowedExts = DocumentSecurityService.ALLOWED_MIME_EXT_MAP[payload.mimeType];
        if (!allowedExts || !allowedExts.includes(extension)) {
            return {
                valid: false,
                quarantined: true,
                sanitizedFilename: baseName,
                error: `File extension '${extension}' does not match permitted MIME type '${payload.mimeType}'.`,
            };
        }
        // 3. Magic Number Validation
        const magicValid = this.verifyMagicBytes(payload.buffer, payload.mimeType);
        if (!magicValid) {
            return {
                valid: false,
                quarantined: true,
                sanitizedFilename: baseName,
                error: 'Magic byte content verification failed: file content does not match declared MIME type.',
            };
        }
        // 4. Malware Scanning Verification
        const malwareResult = await this.malwareScanner.scan(payload.buffer);
        if (!malwareResult.clean) {
            return {
                valid: false,
                quarantined: true,
                sanitizedFilename: baseName,
                error: `Malware detected in payload: ${malwareResult.threatName || 'THREAT_DETECTED'}. Upload quarantined.`,
            };
        }
        // 5. Sanitize Filename (prevent path traversal / directory injection)
        const sanitizedFilename = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageKey = `vault/${payload.tenantId}/${payload.entityType}/${randomBytes(16).toString('hex')}-${sanitizedFilename}`;
        return {
            valid: true,
            quarantined: false,
            sanitizedFilename,
            storageKey,
        };
    }
    /**
     * Generates a short-lived cryptographically signed URL for document retrieval.
     * Enforces that raw object storage paths are never exposed publicly.
     */
    generateSignedAccessUrl(user, document, ttlSeconds = 900 // 15 minutes default
    ) {
        // 1. Tenant Isolation Check
        if (user.role !== 'SUPER_ADMIN' && user.tenantId !== document.tenantId) {
            throw new Error('Cross-tenant document access prohibited.');
        }
        // 2. Authorization Check based on sensitivity
        const requiredPermission = document.isSensitive
            ? 'DOCUMENT_READ_SENSITIVE'
            : 'DOCUMENT_READ_STANDARD';
        const decision = evaluateAccess(user, requiredPermission, {
            tenantId: document.tenantId,
            classification: document.isSensitive ? 'RESTRICTED' : 'INTERNAL',
        });
        if (!decision.allowed) {
            throw new Error(decision.reason || 'Unauthorized document download attempt.');
        }
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        const payload = `${document.documentId}:${document.storageKey}:${expiresAt.getTime()}:${user.userId}`;
        const signature = createHmac('sha256', this.signingSecret).update(payload).digest('hex');
        const signedUrl = `https://vault.vms.internal/api/v1/documents/download?docId=${document.documentId}&expires=${expiresAt.getTime()}&sig=${signature}`;
        return {
            signedUrl,
            expiresAt,
            documentId: document.documentId,
        };
    }
    /**
     * Validates signed URL signature and expiration before serving document content.
     */
    verifySignedUrl(documentId, storageKey, expiresTimestamp, userId, signature) {
        if (Date.now() > expiresTimestamp) {
            return false; // Expired
        }
        const expectedPayload = `${documentId}:${storageKey}:${expiresTimestamp}:${userId}`;
        const expectedSig = createHmac('sha256', this.signingSecret).update(expectedPayload).digest('hex');
        return signature === expectedSig;
    }
    /**
     * Register a configurable document retention policy.
     */
    registerRetentionPolicy(policy) {
        this.retentionPolicies.set(`${policy.tenantId}:${policy.documentType}`, policy);
    }
    /**
     * Register a retention exception (e.g. audit hold, legal preservation order).
     */
    registerRetentionException(exception) {
        this.retentionExceptions.set(exception.exceptionId, exception);
    }
    getRetentionException(exceptionId) {
        return this.retentionExceptions.get(exceptionId);
    }
    /**
     * Apply a legal hold exception to prevent document disposal.
     */
    applyLegalHold(documentId) {
        this.legalHolds.add(documentId);
    }
    releaseLegalHold(documentId) {
        this.legalHolds.delete(documentId);
    }
    /**
     * Evaluates document retention and protects against silent deletion of records subject to legal hold or retention exceptions.
     */
    evaluateRetentionDisposal(tenantId, documentId, documentType, createdAt) {
        const policy = this.retentionPolicies.get(`${tenantId}:${documentType}`);
        if (!policy) {
            return { canDispose: false, action: 'RETAIN', reason: 'No retention policy found; defaulting to retain.' };
        }
        // CRITICAL: Check legal hold exception
        if (policy.legalHold || this.legalHolds.has(documentId)) {
            this.logRetentionAction(policy.policyId, tenantId, documentId, 'DISPOSAL_PREVENTED', 'EXCEPTION_PREVENTED', 'Legal hold active.');
            return { canDispose: false, action: 'RETAIN', reason: 'Disposal prohibited: record is under legal hold exception.' };
        }
        // CRITICAL: Check registered retention exceptions (per Section 60)
        for (const ex of this.retentionExceptions.values()) {
            if (ex.isActive && ex.tenantId === tenantId) {
                const matchesDoc = ex.documentId === documentId;
                const matchesType = !ex.documentId && ex.documentType === documentType;
                if (matchesDoc || matchesType) {
                    const isExpired = ex.expiresAt && Date.now() > ex.expiresAt.getTime();
                    if (!isExpired) {
                        this.logRetentionAction(policy.policyId, tenantId, documentId, 'DISPOSAL_PREVENTED', 'EXCEPTION_PREVENTED', `Retention exception active: ${ex.reason}`);
                        return {
                            canDispose: false,
                            action: 'RETAIN',
                            reason: `Disposal prohibited: retention exception active (${ex.reason}).`,
                        };
                    }
                }
            }
        }
        const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 3600 * 24);
        if (ageInDays < policy.retentionDays) {
            return { canDispose: false, action: 'RETAIN', reason: `Document retention period (${policy.retentionDays} days) has not expired.` };
        }
        this.logRetentionAction(policy.policyId, tenantId, documentId, policy.actionOnExpiry, 'SUCCESS');
        return { canDispose: true, action: policy.actionOnExpiry };
    }
    getRetentionLogs() {
        return this.retentionLogs;
    }
    logRetentionAction(policyId, tenantId, documentId, actionTaken, status, details) {
        this.retentionLogs.push({
            logId: `ret-log-${randomBytes(8).toString('hex')}`,
            policyId,
            tenantId,
            documentId,
            actionTaken,
            executedAt: new Date(),
            status,
            details,
        });
    }
    verifyMagicBytes(buffer, mimeType) {
        if (buffer.length < 4)
            return false;
        // PDF: %PDF (0x25 0x50 0x44 0x46)
        if (mimeType === 'application/pdf') {
            return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
        }
        // JPEG: 0xFF 0xD8 0xFF
        if (mimeType === 'image/jpeg') {
            return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        }
        // PNG: 0x89 0x50 0x4E 0x47
        if (mimeType === 'image/png') {
            return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        }
        // Other supported formats (CSV/XLSX text/zip headers)
        return true;
    }
}
