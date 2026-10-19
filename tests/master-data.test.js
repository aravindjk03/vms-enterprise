import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RelationalDatabase } from '@vms/database';
import { MasterDataRepository, AuditRepository, TenantRepository } from '@vms/database';
import { MasterDataService } from '../services/workflow/src/master-data/master-data.service.js';
describe('Part 5: Master Data Management & Governance', () => {
    const db = new RelationalDatabase();
    const masterRepo = new MasterDataRepository(db);
    const auditRepo = new AuditRepository(db);
    const tenantRepo = new TenantRepository(db);
    // Setup sample tenant
    db.insert('tenants', {
        tenant_id: 'tenant-md-test',
        code: 'TENANT_MD',
        name: 'Master Data Test Tenant',
        status: 'ACTIVE',
    });
    db.insert('tenants', {
        tenant_id: 'tenant-other',
        code: 'TENANT_OTHER',
        name: 'Other Tenant',
        status: 'ACTIVE',
    });
    const superAdminUser = {
        userId: 'admin-01',
        tenantId: 'tenant-md-test',
        organizationId: 'org-01',
        role: 'SUPER_ADMIN',
    };
    const regularUser = {
        userId: 'user-01',
        tenantId: 'tenant-md-test',
        organizationId: 'org-01',
        role: 'SECURITY_MANAGER',
    };
    const service = new MasterDataService(masterRepo, auditRepo, tenantRepo);
    it('1. Canonical Categories Catalog spans all functional domains (4.1 to 4.10)', () => {
        const categories = service.listCategories();
        assert.ok(categories.length >= 50, `Expected at least 50 master categories, found ${categories.length}`);
        const domains = new Set(categories.map((c) => c.domain));
        assert.ok(domains.has('ORGANIZATION'), 'Missing ORGANIZATION domain');
        assert.ok(domains.has('VISITOR'), 'Missing VISITOR domain');
        assert.ok(domains.has('CUSTOMER'), 'Missing CUSTOMER domain');
        assert.ok(domains.has('CONTRACTOR'), 'Missing CONTRACTOR domain');
        assert.ok(domains.has('SERVICE'), 'Missing SERVICE domain');
        assert.ok(domains.has('MATERIAL'), 'Missing MATERIAL domain');
        assert.ok(domains.has('TRANSPORT'), 'Missing TRANSPORT domain');
        assert.ok(domains.has('DOCUMENT'), 'Missing DOCUMENT domain');
        assert.ok(domains.has('SAFETY'), 'Missing SAFETY domain');
        assert.ok(domains.has('ESG'), 'Missing ESG domain');
    });
    it('2. Successfully creates a master record with version 1 and audit logging', async () => {
        const record = await service.createRecord({
            category: 'VISITOR_TYPES',
            code: 'VIP_GUEST_TEST',
            name: 'VIP Executive Guest',
            description: 'Designated executive guest requiring white-glove escort',
            sortOrder: 1,
        }, superAdminUser);
        assert.strictEqual(record.code, 'VIP_GUEST_TEST');
        assert.strictEqual(record.status, 'ACTIVE');
        assert.strictEqual(record.version, 1);
        assert.strictEqual(record.tenantId, 'tenant-md-test');
        // Verify initial version saved
        const history = service.getRecordHistory(record.id);
        assert.strictEqual(history.length, 1);
        assert.strictEqual(history[0].version_number, 1);
        // Verify audit log
        const auditLogs = auditRepo.getAuditHistory('MASTER_RECORD', record.id, 'tenant-md-test');
        assert.strictEqual(auditLogs.length, 1);
        assert.strictEqual(auditLogs[0].action, 'MASTER_RECORD_CREATE');
    });
    it('3. Rejects duplicate code in same category and tenant', async () => {
        await assert.rejects(async () => {
            await service.createRecord({
                category: 'VISITOR_TYPES',
                code: 'VIP_GUEST_TEST',
                name: 'Duplicate VIP Guest',
            }, superAdminUser);
        }, /Duplicate master record code 'VIP_GUEST_TEST'/);
    });
    it('4. Sensitive category requires Super Admin approval for activation', async () => {
        // WORK_CATEGORIES is a sensitive category requiring approval
        const record = await service.createRecord({
            category: 'WORK_CATEGORIES',
            code: 'CONFINED_SPACE_TEST',
            name: 'Confined Space Entry Work',
            status: 'ACTIVE',
        }, regularUser);
        // Should be placed in DRAFT pending approval since non-Super-Admin created it
        assert.strictEqual(record.status, 'DRAFT');
        assert.strictEqual(record.pendingApproval, true);
        // Regular user cannot activate sensitive category
        await assert.rejects(async () => {
            await service.activateRecord(record.id, regularUser);
        }, /Activation denied: Category 'WORK_CATEGORIES' requires Super Admin approval/);
        // Super Admin activates successfully
        const activated = await service.activateRecord(record.id, superAdminUser);
        assert.strictEqual(activated.status, 'ACTIVE');
    });
    it('5. Updating a master record increments version and saves audit history', async () => {
        const record = await service.createRecord({
            category: 'TRANSPORT_MODES',
            code: 'EV_COMMUTE_TEST',
            name: 'Electric Car',
        }, superAdminUser);
        assert.strictEqual(record.version, 1);
        const updated = await service.updateRecord(record.id, {
            name: 'Battery Electric Vehicle (BEV)',
            description: 'Zero direct tailpipe emissions vehicle',
            changeReason: 'Updated to standardized ESG nomenclature',
        }, superAdminUser);
        assert.strictEqual(updated.name, 'Battery Electric Vehicle (BEV)');
        assert.strictEqual(updated.version, 2);
        const history = service.getRecordHistory(record.id);
        assert.strictEqual(history.length, 2);
        assert.strictEqual(history[1].version_number, 2);
        assert.strictEqual(history[1].reason, 'Updated to standardized ESG nomenclature');
    });
    it('6. Deactivation and Archive set statuses without physically deleting record', async () => {
        const record = await service.createRecord({
            category: 'MATERIAL_TRANSACTION_TYPES',
            code: 'SCRAP_OUTWARD_TEST',
            name: 'Scrap Outward Movement',
        }, superAdminUser);
        // Deactivate
        const deactivated = await service.deactivateRecord(record.id, 'Seasonal retirement', superAdminUser);
        assert.strictEqual(deactivated.status, 'INACTIVE');
        // Operational forms query activeOnly -> should exclude inactive
        const activeList = service.listRecords({
            category: 'MATERIAL_TRANSACTION_TYPES',
            activeOnly: true,
            tenantId: 'tenant-md-test',
        });
        assert.strictEqual(activeList.some((r) => r.id === record.id), false);
        // Archive
        const archived = await service.archiveRecord(record.id, superAdminUser);
        assert.strictEqual(archived.status, 'ARCHIVED');
        // Updating archived record is prohibited
        await assert.rejects(async () => {
            await service.updateRecord(record.id, { name: 'Attempted Change' }, superAdminUser);
        }, /Cannot update archived master record/);
        // Record remains accessible by ID for historical audit provenance!
        const fetched = service.getRecord(record.id, 'tenant-md-test');
        assert.ok(fetched !== null);
        assert.strictEqual(fetched.status, 'ARCHIVED');
    });
    it('7. Enforces strict Multi-Tenant Isolation', async () => {
        const tenantARecord = await service.createRecord({
            category: 'DOCUMENT_TYPES',
            code: 'PASSPORT_TENANT_A',
            name: 'Passport Doc',
        }, superAdminUser);
        // Tenant B cannot fetch Tenant A record
        const fetchCrossTenant = service.getRecord(tenantARecord.id, 'tenant-other');
        assert.strictEqual(fetchCrossTenant, null);
        // Tenant B cannot modify Tenant A record
        const tenantBUser = {
            userId: 'user-b',
            tenantId: 'tenant-other',
            organizationId: 'org-b',
            role: 'SUPER_ADMIN',
        };
        await assert.rejects(async () => {
            await service.updateRecord(tenantARecord.id, { name: 'Cross-Tenant Tamper' }, tenantBUser);
        }, /Master record '.*' not found in tenant 'tenant-other'/);
    });
    it('8. CSV Import: generates template and parses rows correctly', () => {
        const tpl = service.generateCsvTemplate('VISITOR_TYPES');
        assert.ok(tpl.includes('Code,Name,Description,SortOrder'));
        const sampleCsv = `Code,Name,Description,SortOrder,EffectiveFrom\nCSV_01,Contractor Lead,Lead Supervisor,10,2026-01-01\nCSV_02,Safety Inspector,Third-party safety check,20,2026-01-01\n`;
        const rows = service.parseCsv(sampleCsv);
        assert.strictEqual(rows.length, 2);
        assert.strictEqual(rows[0].code, 'CSV_01');
        assert.strictEqual(rows[1].name, 'Safety Inspector');
    });
    it('9. CSV Import: detects row-level errors in preview mode', () => {
        const invalidRows = [
            { code: '', name: 'Missing Code', category: 'VISITOR_TYPES' },
            { code: 'INVALID@CODE', name: 'Bad Code Format', category: 'VISITOR_TYPES' },
            { code: 'VALID_DUP', name: 'First Valid', category: 'VISITOR_TYPES' },
            { code: 'VALID_DUP', name: 'Duplicate Code In File', category: 'VISITOR_TYPES' },
            { code: 'NO_NAME_01', name: '', category: 'VISITOR_TYPES' },
        ];
        const preview = service.previewImport('VISITOR_TYPES', invalidRows, superAdminUser);
        assert.strictEqual(preview.totalRows, 5);
        assert.strictEqual(preview.validRows, 0);
        assert.ok(preview.errors.some((e) => e.message.includes('code is mandatory')));
        assert.ok(preview.errors.some((e) => e.message.includes('alphanumeric characters')));
        assert.ok(preview.errors.some((e) => e.message.includes('Duplicate code')));
        assert.ok(preview.errors.some((e) => e.message.includes('name is mandatory')));
    });
    it('10. CSV Import: executes transactionally when all rows valid', async () => {
        const validRows = [
            { code: 'CSV_BATCH_01', name: 'Batch Record 1', description: 'Desc 1', category: 'VISITOR_TYPES' },
            { code: 'CSV_BATCH_02', name: 'Batch Record 2', description: 'Desc 2', category: 'VISITOR_TYPES' },
        ];
        const result = await service.executeImport('VISITOR_TYPES', validRows, superAdminUser);
        assert.strictEqual(result.totalRows, 2);
        assert.strictEqual(result.successfulRows, 2);
        assert.strictEqual(result.failedRows, 0);
        assert.strictEqual(result.importedRecords.length, 2);
        const rec1 = service.getRecordByCode('VISITOR_TYPES', 'CSV_BATCH_01', 'tenant-md-test');
        assert.ok(rec1 !== null);
        assert.strictEqual(rec1.name, 'Batch Record 1');
    });
    it('11. CSV Import: parses RFC 4180 CSV with quotes containing commas and escaped quotes', () => {
        const rfcCsv = `Code,Name,Description,SortOrder,EffectiveFrom,EffectiveUntil,SiteCode,ParentCode
"CSV_RFC_01","Acme Corp, Inc.","Supplier with, comma in desc",10,2026-01-01,,,
"CSV_RFC_02","He said ""Hello, World""","Quoted value with escaped ""quotes""",20,2026-01-01,,,
`;
        const rows = service.parseCsv(rfcCsv);
        assert.strictEqual(rows.length, 2);
        assert.strictEqual(rows[0].code, 'CSV_RFC_01');
        assert.strictEqual(rows[0].name, 'Acme Corp, Inc.');
        assert.strictEqual(rows[0].description, 'Supplier with, comma in desc');
        assert.strictEqual(rows[1].code, 'CSV_RFC_02');
        assert.strictEqual(rows[1].name, 'He said "Hello, World"');
        assert.strictEqual(rows[1].description, 'Quoted value with escaped "quotes"');
    });
    it('12. CSV Import: resolves parentCode and guarantees atomic rollback on batch failure', async () => {
        // Create a parent record first
        const parentRec = await service.createRecord({
            category: 'VISITOR_TYPES',
            code: 'PARENT_VTYPE',
            name: 'General Visitor Group',
        }, superAdminUser);
        const rowsWithParent = [
            { code: 'CHILD_VTYPE_01', name: 'Child Type 1', parentCode: 'PARENT_VTYPE', category: 'VISITOR_TYPES' },
        ];
        const result = await service.executeImport('VISITOR_TYPES', rowsWithParent, superAdminUser);
        assert.strictEqual(result.successfulRows, 1);
        const child = service.getRecordByCode('VISITOR_TYPES', 'CHILD_VTYPE_01', 'tenant-md-test');
        assert.ok(child);
        assert.strictEqual(child.parentRecordId, parentRec.id, 'Parent record ID must be resolved from parentCode');
        // Test atomic rollback: create a batch where the second record fails
        const failingBatch = [
            { code: 'ATOMIC_ROW_01', name: 'Will Be Rolled Back', category: 'VISITOR_TYPES' },
            { code: 'CHILD_VTYPE_01', name: 'Duplicate Collision', category: 'VISITOR_TYPES' }, // Duplicate code, causes createRecord to throw
        ];
        // 1. Preview gate stops invalid batch before execution
        await assert.rejects(async () => {
            await service.executeImport('VISITOR_TYPES', failingBatch, superAdminUser);
        }, /Import rejected: 1 validation errors found/);
        assert.strictEqual(service.getRecordByCode('VISITOR_TYPES', 'ATOMIC_ROW_01', 'tenant-md-test'), null);
        // 2. Mid-execution rollback: if a failure occurs during batch insertion, prior created records roll back
        const origCreate = service.createRecord.bind(service);
        let callCount = 0;
        service.createRecord = async (...args) => {
            callCount++;
            if (callCount === 2) {
                throw new Error('Simulated repository crash during batch insertion');
            }
            return origCreate(args[0], args[1]);
        };
        const twoValidRows = [
            { code: 'ATOMIC_ROLLBACK_01', name: 'Row 1', category: 'VISITOR_TYPES' },
            { code: 'ATOMIC_ROLLBACK_02', name: 'Row 2', category: 'VISITOR_TYPES' },
        ];
        await assert.rejects(async () => {
            await service.executeImport('VISITOR_TYPES', twoValidRows, superAdminUser);
        }, /Simulated repository crash during batch insertion/);
        // Verify ATOMIC_ROLLBACK_01 was rolled back and is NOT in database
        assert.strictEqual(service.getRecordByCode('VISITOR_TYPES', 'ATOMIC_ROLLBACK_01', 'tenant-md-test'), null);
        service.createRecord = origCreate;
    });
});
