import { randomUUID } from 'node:crypto';
import { MasterRecordSchema } from '@vms/validation';
import { CANONICAL_MASTER_CATEGORIES } from './categories.js';
export class MasterDataService {
    masterRepo;
    auditRepo;
    tenantRepo;
    categoriesMap = new Map();
    constructor(masterRepo, auditRepo, tenantRepo) {
        this.masterRepo = masterRepo;
        this.auditRepo = auditRepo;
        this.tenantRepo = tenantRepo;
        for (const cat of CANONICAL_MASTER_CATEGORIES) {
            this.categoriesMap.set(cat.categoryCode.toUpperCase(), cat);
        }
    }
    getCategory(code) {
        return this.categoriesMap.get(code.toUpperCase()) || null;
    }
    listCategories() {
        return Array.from(this.categoriesMap.values());
    }
    registerCategory(cat) {
        this.categoriesMap.set(cat.categoryCode.toUpperCase(), cat);
    }
    /**
     * Creates a new master record with strict tenant isolation, validation, and audit logging.
     */
    async createRecord(input, user) {
        const categoryUpper = input.category.toUpperCase();
        const catDef = this.categoriesMap.get(categoryUpper);
        if (!catDef) {
            throw new Error(`Invalid master data category: '${input.category}' is not a recognized category.`);
        }
        // Site scope check
        if (input.siteId && user.siteId && user.siteId !== input.siteId && user.role !== 'SUPER_ADMIN' && user.role !== 'ORGANIZATION_ADMIN') {
            throw new Error(`Unauthorized: User cannot create master data for site '${input.siteId}' outside assigned site context.`);
        }
        // Duplicate check
        const existing = this.masterRepo.getRecordByCode(categoryUpper, input.code, user.tenantId);
        if (existing) {
            throw new Error(`Duplicate master record code '${input.code}' already exists in category '${categoryUpper}'.`);
        }
        // Sensitive category review requirement
        let targetStatus = input.status || 'ACTIVE';
        let pendingApproval = false;
        if (catDef.requiresApprovalForActivation && targetStatus === 'ACTIVE') {
            if (user.role !== 'SUPER_ADMIN') {
                targetStatus = 'DRAFT';
                pendingApproval = true;
            }
        }
        const recordId = randomUUID();
        const now = new Date();
        const recordData = {
            id: recordId,
            tenantId: user.tenantId,
            organizationId: input.organizationId || user.organizationId,
            siteId: input.siteId || user.siteId,
            category: categoryUpper,
            code: input.code.trim().toUpperCase(),
            name: input.name.trim(),
            description: input.description,
            parentRecordId: input.parentRecordId,
            status: targetStatus,
            sortOrder: input.sortOrder ?? 0,
            effectiveFrom: input.effectiveFrom || now,
            effectiveUntil: input.effectiveUntil,
            metadata: input.metadata || {},
            version: 1,
            createdBy: user.userId,
            createdAt: now,
            updatedBy: user.userId,
            updatedAt: now,
            isSensitive: catDef.isSensitive,
            pendingApproval,
        };
        // Validate using Zod schema
        const parseResult = MasterRecordSchema.safeParse(recordData);
        if (!parseResult.success) {
            throw new Error(`Validation failed: ${parseResult.error.issues.map(i => i.message).join(', ')}`);
        }
        const created = this.masterRepo.createRecord(recordData, user.tenantId);
        // Save initial version
        this.masterRepo.saveVersion({
            version_id: randomUUID(),
            record_id: recordId,
            version_number: 1,
            snapshot: created,
            changed_by: user.userId,
            changed_at: now,
            reason: 'Initial creation',
        });
        // Tamper-evident Audit log
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'MASTER_RECORD_CREATE',
            entity_type: 'MASTER_RECORD',
            entity_id: recordId,
            timestamp: now,
            request_id: randomUUID(),
            correlation_id: `master-${recordId}`,
            source: 'MasterDataService',
            after_snapshot: { category: categoryUpper, code: recordData.code, name: recordData.name, status: targetStatus },
        }, user.tenantId);
        return created;
    }
    /**
     * Updates an existing master record with version preservation and audit logging.
     */
    async updateRecord(recordId, updates, user) {
        const existing = this.masterRepo.getRecord(recordId, user.tenantId);
        if (!existing) {
            throw new Error(`Master record '${recordId}' not found in tenant '${user.tenantId}'.`);
        }
        // Site isolation check
        if (existing.siteId && user.siteId && user.siteId !== existing.siteId && user.role !== 'SUPER_ADMIN' && user.role !== 'ORGANIZATION_ADMIN') {
            throw new Error(`Access denied: User not permitted to modify master records for site '${existing.siteId}'.`);
        }
        if (existing.status === 'ARCHIVED') {
            throw new Error(`Cannot update archived master record '${recordId}'. Unarchive first.`);
        }
        const now = new Date();
        const newVersion = (existing.version || 1) + 1;
        const updatedData = {
            name: updates.name !== undefined ? updates.name.trim() : existing.name,
            description: updates.description !== undefined ? updates.description : existing.description,
            parentRecordId: updates.parentRecordId !== undefined ? updates.parentRecordId : existing.parentRecordId,
            sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : existing.sortOrder,
            effectiveFrom: updates.effectiveFrom || existing.effectiveFrom,
            effectiveUntil: updates.effectiveUntil !== undefined ? updates.effectiveUntil : existing.effectiveUntil,
            metadata: updates.metadata ? { ...existing.metadata, ...updates.metadata } : existing.metadata,
            version: newVersion,
            updatedBy: user.userId,
            updatedAt: now,
        };
        const updated = this.masterRepo.updateRecord(recordId, updatedData, user.tenantId);
        // Save version history
        this.masterRepo.saveVersion({
            version_id: randomUUID(),
            record_id: recordId,
            version_number: newVersion,
            snapshot: updated,
            changed_by: user.userId,
            changed_at: now,
            reason: updates.changeReason || 'Master record attributes updated',
        });
        // Audit log
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'MASTER_RECORD_UPDATE',
            entity_type: 'MASTER_RECORD',
            entity_id: recordId,
            timestamp: now,
            request_id: randomUUID(),
            correlation_id: `master-${recordId}-v${newVersion}`,
            source: 'MasterDataService',
            after_snapshot: { updates, previousVersion: existing.version, newVersion },
        }, user.tenantId);
        return updated;
    }
    /**
     * Activates a record, checking if approval is required.
     */
    async activateRecord(recordId, user) {
        const existing = this.masterRepo.getRecord(recordId, user.tenantId);
        if (!existing) {
            throw new Error(`Master record '${recordId}' not found.`);
        }
        const catDef = this.categoriesMap.get(existing.category.toUpperCase());
        if (catDef?.requiresApprovalForActivation && user.role !== 'SUPER_ADMIN') {
            throw new Error(`Activation denied: Category '${existing.category}' requires Super Admin approval.`);
        }
        const updated = this.masterRepo.updateRecord(recordId, {
            status: 'ACTIVE',
            pending_approval: false,
            updated_by: user.userId,
            updated_at: new Date(),
        }, user.tenantId);
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'MASTER_RECORD_ACTIVATE',
            entity_type: 'MASTER_RECORD',
            entity_id: recordId,
            timestamp: new Date(),
            request_id: randomUUID(),
            correlation_id: `master-act-${recordId}`,
            source: 'MasterDataService',
            after_snapshot: { previousStatus: existing.status, newStatus: 'ACTIVE' },
        }, user.tenantId);
        return updated;
    }
    /**
     * Deactivates a record without physically deleting it or corrupting historical transactions.
     */
    async deactivateRecord(recordId, reason, user) {
        const existing = this.masterRepo.getRecord(recordId, user.tenantId);
        if (!existing) {
            throw new Error(`Master record '${recordId}' not found.`);
        }
        const updated = this.masterRepo.updateRecord(recordId, {
            status: 'INACTIVE',
            updated_by: user.userId,
            updated_at: new Date(),
        }, user.tenantId);
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'MASTER_RECORD_DEACTIVATE',
            entity_type: 'MASTER_RECORD',
            entity_id: recordId,
            timestamp: new Date(),
            request_id: randomUUID(),
            correlation_id: `master-deact-${recordId}`,
            source: 'MasterDataService',
            reason,
            after_snapshot: { reason, previousStatus: existing.status },
        }, user.tenantId);
        return updated;
    }
    /**
     * Archives a record. Prevents physical deletion if referenced by historical transactions.
     */
    async archiveRecord(recordId, user) {
        const existing = this.masterRepo.getRecord(recordId, user.tenantId);
        if (!existing) {
            throw new Error(`Master record '${recordId}' not found.`);
        }
        const updated = this.masterRepo.updateRecord(recordId, {
            status: 'ARCHIVED',
            updated_by: user.userId,
            updated_at: new Date(),
        }, user.tenantId);
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'MASTER_RECORD_ARCHIVE',
            entity_type: 'MASTER_RECORD',
            entity_id: recordId,
            timestamp: new Date(),
            request_id: randomUUID(),
            correlation_id: `master-arch-${recordId}`,
            source: 'MasterDataService',
            after_snapshot: { code: existing.code, category: existing.category },
        }, user.tenantId);
        return updated;
    }
    getRecord(recordId, tenantId) {
        return this.masterRepo.getRecord(recordId, tenantId);
    }
    getRecordByCode(category, code, tenantId) {
        return this.masterRepo.getRecordByCode(category.toUpperCase(), code.toUpperCase(), tenantId);
    }
    /**
     * Lists records filtered by category, status, and effective date.
     * Ordinary operational forms should exclude INACTIVE and ARCHIVED records.
     */
    listRecords(params) {
        const filter = {};
        if (params.siteId)
            filter.site_id = params.siteId;
        const records = this.masterRepo.listRecords(params.category ? params.category.toUpperCase() : undefined, filter, params.tenantId);
        const now = params.asOfDate || new Date();
        return records.filter((r) => {
            // Status filtering
            if (params.status) {
                if (Array.isArray(params.status)) {
                    if (!params.status.includes(r.status))
                        return false;
                }
                else {
                    if (r.status !== params.status)
                        return false;
                }
            }
            else if (params.activeOnly) {
                if (r.status !== 'ACTIVE')
                    return false;
            }
            // Effective dates check for active forms
            if (params.activeOnly) {
                const from = new Date(r.effectiveFrom);
                if (from > now)
                    return false;
                if (r.effectiveUntil) {
                    const until = new Date(r.effectiveUntil);
                    if (until < now)
                        return false;
                }
            }
            return true;
        });
    }
    getRecordHistory(recordId) {
        return this.masterRepo.getVersionHistory(recordId);
    }
    // --------------------------------------------------------------------------
    // CSV Import Framework (Section 6)
    // --------------------------------------------------------------------------
    generateCsvTemplate(categoryCode) {
        const headers = ['Code', 'Name', 'Description', 'SortOrder', 'EffectiveFrom', 'EffectiveUntil', 'SiteCode', 'ParentCode'];
        const example = ['EX_001', 'Sample Master Record', 'Detailed description', '10', '2026-01-01', '', '', ''];
        return `${headers.join(',')}\n${example.join(',')}\n`;
    }
    splitCsvLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped double quote
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        fields.push(current.trim());
        return fields;
    }
    parseCsv(csvText) {
        const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
            throw new Error('CSV file is empty or missing data rows.');
        }
        const headers = this.splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
        const codeIdx = headers.indexOf('code');
        const nameIdx = headers.indexOf('name');
        const descIdx = headers.indexOf('description');
        const sortIdx = headers.indexOf('sortorder');
        const fromIdx = headers.indexOf('effectivefrom');
        const untilIdx = headers.indexOf('effectiveuntil');
        const siteIdx = headers.indexOf('sitecode');
        const parentIdx = headers.indexOf('parentcode');
        if (codeIdx === -1 || nameIdx === -1) {
            throw new Error("Invalid CSV format: Required header columns 'Code' and 'Name' were not found.");
        }
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const parts = this.splitCsvLine(lines[i]);
            if (parts.length < 2)
                continue;
            rows.push({
                code: parts[codeIdx] || '',
                name: parts[nameIdx] || '',
                description: descIdx !== -1 ? parts[descIdx] : undefined,
                category: '',
                sortOrder: sortIdx !== -1 && parts[sortIdx] ? parseInt(parts[sortIdx], 10) : 0,
                effectiveFrom: fromIdx !== -1 ? parts[fromIdx] : undefined,
                effectiveUntil: untilIdx !== -1 ? parts[untilIdx] : undefined,
                siteCode: siteIdx !== -1 ? parts[siteIdx] : undefined,
                parentCode: parentIdx !== -1 ? parts[parentIdx] : undefined,
            });
        }
        return rows;
    }
    /**
     * Previews CSV import, performing row-level validation, reference checks, and duplicate detection.
     */
    previewImport(categoryCode, rows, user) {
        const categoryUpper = categoryCode.toUpperCase();
        const catDef = this.categoriesMap.get(categoryUpper);
        if (!catDef) {
            throw new Error(`Invalid category '${categoryCode}' for import.`);
        }
        const errors = [];
        const codeCounts = new Map();
        rows.forEach((r) => {
            const c = (r.code || '').trim().toUpperCase();
            if (c) {
                codeCounts.set(c, (codeCounts.get(c) || 0) + 1);
            }
        });
        const seenCodesInFile = new Set();
        rows.forEach((row, idx) => {
            const rowNum = idx + 1;
            const cleanCode = (row.code || '').trim().toUpperCase();
            if (!cleanCode) {
                errors.push({ rowNumber: rowNum, field: 'Code', message: 'Record code is mandatory.' });
            }
            else if (!/^[A-Z0-9_\-\.]+$/.test(cleanCode)) {
                errors.push({ rowNumber: rowNum, code: cleanCode, field: 'Code', message: 'Code must only contain alphanumeric characters, underscores, dashes or dots.' });
            }
            else if (codeCounts.get(cleanCode) > 1) {
                errors.push({ rowNumber: rowNum, code: cleanCode, field: 'Code', message: `Duplicate code '${cleanCode}' found within the import file.` });
            }
            else {
                seenCodesInFile.add(cleanCode);
                // Check existing in DB
                const existing = this.masterRepo.getRecordByCode(categoryUpper, cleanCode, user.tenantId);
                if (existing) {
                    errors.push({ rowNumber: rowNum, code: cleanCode, field: 'Code', message: `Record with code '${cleanCode}' already exists in tenant database.` });
                }
            }
            if (!row.name || row.name.trim().length === 0) {
                errors.push({ rowNumber: rowNum, code: cleanCode, field: 'Name', message: 'Record name is mandatory.' });
            }
        });
        const rowsWithErrors = new Set(errors.map((e) => e.rowNumber));
        return {
            totalRows: rows.length,
            validRows: Math.max(0, rows.length - rowsWithErrors.size),
            errors,
        };
    }
    /**
     * Executes CSV import transactionally.
     * If there are errors and strict mode is on, rejects completely and rolls back any partial mutations.
     */
    async executeImport(categoryCode, rows, user) {
        const preview = this.previewImport(categoryCode, rows, user);
        if (preview.errors.length > 0) {
            throw new Error(`Import rejected: ${preview.errors.length} validation errors found. Resolve row-level errors before importing.`);
        }
        const importId = randomUUID();
        const importedRecords = [];
        const createdRecordIds = [];
        const categoryUpper = categoryCode.toUpperCase();
        try {
            for (const row of rows) {
                let parentRecordId = undefined;
                if (row.parentCode) {
                    const parent = this.masterRepo.getRecordByCode(categoryUpper, row.parentCode, user.tenantId);
                    parentRecordId = parent?.id;
                }
                const created = await this.createRecord({
                    category: categoryUpper,
                    code: row.code,
                    name: row.name,
                    description: row.description,
                    parentRecordId,
                    sortOrder: row.sortOrder,
                    effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom) : undefined,
                    effectiveUntil: row.effectiveUntil ? new Date(row.effectiveUntil) : undefined,
                }, user);
                createdRecordIds.push(created.id);
                importedRecords.push(created);
            }
        }
        catch (importErr) {
            // Rollback created records for all-or-nothing transactional atomicity
            for (const id of createdRecordIds) {
                try {
                    this.masterRepo.db.delete('master_data_records', id, user.tenantId);
                }
                catch {
                    // ignore cleanup errors during rollback
                }
            }
            throw importErr;
        }
        const auditId = randomUUID();
        this.auditRepo.logAudit({
            audit_id: auditId,
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'MASTER_DATA_IMPORT_CSV',
            entity_type: 'MASTER_CATEGORY',
            entity_id: categoryUpper,
            timestamp: new Date(),
            request_id: randomUUID(),
            correlation_id: `import-${importId}`,
            source: 'MasterDataService',
            after_snapshot: { importId, category: categoryUpper, count: importedRecords.length },
        }, user.tenantId);
        return {
            importId,
            tenantId: user.tenantId,
            category: categoryUpper,
            totalRows: rows.length,
            successfulRows: importedRecords.length,
            failedRows: 0,
            errors: [],
            importedRecords,
            auditLogId: auditId,
        };
    }
}
