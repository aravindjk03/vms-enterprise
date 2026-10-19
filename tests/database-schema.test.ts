import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  RelationalDatabase,
  SchemaValidator,
  MigrationRunner,
} from '../packages/database/src/index.js';

describe('Database Schema, DDL Migration & Relational Engine Verification', () => {
  let db: RelationalDatabase;
  let runner: MigrationRunner;

  beforeEach(() => {
    db = new RelationalDatabase();
    runner = new MigrationRunner(db);
  });

  it('parses canonical PostgreSQL DDL and verifies tables, constraints, and indexes', async () => {
    const { schema } = await runner.runMigrations();

    assert.ok(schema.tables.size >= 50, `Expected at least 50 tables, found ${schema.tables.size}`);

    // Core table presence
    const expectedTables = [
      'tenants',
      'organizations',
      'sites',
      'departments',
      'buildings',
      'gates',
      'zones',
      'users',
      'roles',
      'permissions',
      'persons',
      'person_contacts',
      'visitor_transactions',
      'customer_accounts',
      'customer_visit_transactions',
      'contractor_companies',
      'contractor_work_orders',
      'service_work_orders',
      'materials',
      'material_transactions',
      'material_transaction_lines',
      'vehicles',
      'transport_activities',
      'documents',
      'document_links',
      'gate_events',
      'emission_factors',
      'emission_factor_versions',
      'ghg_activities',
      'ghg_calculations',
      'audit_logs',
      'domain_events',
    ];

    for (const t of expectedTables) {
      assert.ok(schema.tables.has(t), `Table '${t}' must be present in parsed DDL schema`);
    }

    // Verify foreign keys on critical tables
    const visitorTxTable = schema.tables.get('visitor_transactions')!;
    assert.ok(visitorTxTable.foreignKeys.some(fk => fk.targetTable === 'tenants'), 'visitor_transactions must reference tenants');
    assert.ok(visitorTxTable.foreignKeys.some(fk => fk.targetTable === 'sites'), 'visitor_transactions must reference sites');
    assert.ok(visitorTxTable.foreignKeys.some(fk => fk.targetTable === 'persons'), 'visitor_transactions must reference persons');

    const materialLinesTable = schema.tables.get('material_transaction_lines')!;
    assert.ok(materialLinesTable.foreignKeys.some(fk => fk.targetTable === 'material_transactions'), 'material_transaction_lines must reference material_transactions');

    // Verify indexes and views
    assert.ok(schema.indexes.length > 0, 'Schema must define performance indexes');
    assert.ok(schema.views.length >= 4, `Schema must define compatibility views, found ${schema.views.length}`);
    assert.ok(schema.views.includes('esg_activity_records'), 'View esg_activity_records must be defined');
    assert.ok(schema.views.includes('ghg_calculation_results'), 'View ghg_calculation_results must be defined');
    assert.ok(schema.views.includes('scope_mapping_rules'), 'View scope_mapping_rules must be defined');
  });

  it('executes deterministic seed insertion and verifies entity population', async () => {
    const { seedCount } = await runner.runMigrations();
    assert.ok(seedCount > 50, `Expected >50 seeded rows, inserted ${seedCount}`);

    const status = runner.verifyMigrationStatus();
    assert.strictEqual(status.applied, true);
    assert.ok(status.seedRowCount > 50);

    // Verify global tenant and sites
    const tenant = db.findById('tenants', '00000000-0000-0000-0000-000000000001');
    assert.ok(tenant, 'Tenant GLOBAL-MFG must be seeded');
    assert.strictEqual(tenant.code, 'GLOBAL-MFG');

    const sites = db.findMany('sites', { tenant_id: '00000000-0000-0000-0000-000000000001' });
    assert.strictEqual(sites.length, 2);
    const siteCodes = sites.map((s: any) => s.code);
    assert.ok(siteCodes.includes('DETROIT-ASSEMBLY'));
    assert.ok(siteCodes.includes('CHENNAI-PLANT'));

    // Verify emission factors and versions across 2025/2026
    const factorVersions = db.findMany('emission_factor_versions');
    assert.ok(factorVersions.length >= 8, `Expected >=8 emission factor versions, found ${factorVersions.length}`);
    const petrolVersions = factorVersions.filter((v: any) => v.factor_id === 'EF-DEFRA-ROAD-PETROL-CAR');
    assert.strictEqual(petrolVersions.length, 2, 'Should have 2025 and 2026 versions for petrol car');
  });

  it('enforces primary key uniqueness across tables', () => {
    db.insert('tenants', {
      tenant_id: '11111111-1111-1111-1111-111111111111',
      code: 'TEST-TENANT-1',
      name: 'Test Tenant 1',
    });

    assert.throws(
      () => {
        db.insert('tenants', {
          tenant_id: '11111111-1111-1111-1111-111111111111',
          code: 'TEST-TENANT-2',
          name: 'Test Tenant 2 Duplicate PK',
        });
      },
      /Primary key violation/
    );
  });

  it('enforces composite unique constraints', () => {
    const tenantId = randomUUID();
    db.insert('tenants', { tenant_id: tenantId, code: 'UNIQUE-TEST', name: 'Unique Test' });

    db.insert('organizations', {
      organization_id: randomUUID(),
      tenant_id: tenantId,
      code: 'ORG-CODE-A',
      name: 'Org A',
    }, tenantId);

    assert.throws(
      () => {
        db.insert('organizations', {
          organization_id: randomUUID(),
          tenant_id: tenantId,
          code: 'ORG-CODE-A',
          name: 'Org A Duplicate',
        }, tenantId);
      },
      /Unique constraint violation/
    );
  });

  it('enforces foreign key existence checks', () => {
    assert.throws(
      () => {
        db.insert('sites', {
          site_id: randomUUID(),
          tenant_id: '00000000-0000-0000-0000-999999999999', // non-existent tenant
          organization_id: randomUUID(),
          code: 'INVALID-SITE',
          name: 'Invalid Site',
        });
      },
      /Foreign key violation/
    );
  });

  it('enforces foreign key restriction on parent deletion', () => {
    const tenantId = randomUUID();
    db.insert('tenants', { tenant_id: tenantId, code: 'T-FK-TEST', name: 'FK Test Tenant' });
    const orgId = randomUUID();
    db.insert('organizations', {
      organization_id: orgId,
      tenant_id: tenantId,
      code: 'ORG-FK-TEST',
      name: 'Org FK Test',
    }, tenantId);
    const siteId = randomUUID();
    db.insert('sites', {
      site_id: siteId,
      tenant_id: tenantId,
      organization_id: orgId,
      code: 'SITE-RESTRICT',
      name: 'Site Restrict',
    });
    const personId = randomUUID();
    db.insert('persons', {
      person_id: personId,
      tenant_id: tenantId,
      first_name: 'John',
      last_name: 'Doe',
      display_name: 'John Doe',
    }, tenantId);

    db.insert('visitor_transactions', {
      transaction_id: randomUUID(),
      reference_number: 'VIS-FK-01',
      tenant_id: tenantId,
      site_id: siteId,
      person_id: personId,
      host_user_id: randomUUID(),
      created_by: 'ADMIN',
      updated_by: 'ADMIN',
    }, tenantId);

    // Deleting person must be restricted because visitor_transaction references it with ON DELETE RESTRICT
    assert.throws(
      () => {
        db.delete('persons', personId, tenantId);
      },
      /Foreign key restriction: cannot delete from 'persons' while referenced by 'visitor_transactions'/
    );
  });

  it('strictly prohibits updates and deletions on immutable append-only ledgers', () => {
    const tenantId = randomUUID();
    db.setTenantContext(tenantId);

    // 1. Audit Log immutability
    const audit = db.insert('audit_logs', {
      audit_id: randomUUID(),
      tenant_id: tenantId,
      actor_id: 'USER-1',
      action: 'UPDATE',
      entity_type: 'VISITOR',
      entity_id: 'VIS-1',
      timestamp: new Date(),
      source: 'WEB',
    }, tenantId);

    assert.throws(
      () => {
        db.update('audit_logs', audit.audit_id, { action: 'HACKED' }, tenantId);
      },
      /Fatal Immutability Violation/
    );
    assert.throws(
      () => {
        db.delete('audit_logs', audit.audit_id, tenantId);
      },
      /Fatal Immutability Violation/
    );

    // 2. Gate Event immutability
    const gateEvent = db.insert('gate_events', {
      event_id: randomUUID(),
      tenant_id: tenantId,
      site_id: randomUUID(),
      gate_id: randomUUID(),
      source_domain: 'VISITOR',
      source_transaction_id: 'VIS-1',
      event_type: 'BADGE_SWIPE',
      result: 'GRANTED',
      event_timestamp: new Date(),
    }, tenantId);

    assert.throws(
      () => {
        db.update('gate_events', gateEvent.event_id, { result: 'DENIED' }, tenantId);
      },
      /Fatal Immutability Violation/
    );
    assert.throws(
      () => {
        db.delete('gate_events', gateEvent.event_id, tenantId);
      },
      /Fatal Immutability Violation/
    );

    // 3. GHG Calculation immutability
    const calc = db.insert('ghg_calculations', {
      id: randomUUID(),
      ghg_activity_id: randomUUID(),
      emission_factor_id: 'EF-TEST',
      emission_factor_version: '2026.1',
      methodology_id: 'GHG_PROTOCOL',
      input_snapshot: {},
      calculation_timestamp: new Date(),
      co2e: 45.2,
      calculation_status: 'SUCCESS',
      calculation_version: 1,
    });

    assert.throws(
      () => {
        db.update('ghg_calculations', calc.id, { co2e: 10.0 });
      },
      /Fatal Immutability Violation/
    );
    assert.throws(
      () => {
        db.delete('ghg_calculations', calc.id);
      },
      /Fatal Immutability Violation/
    );

    // 4. Emission Factor Version immutability
    const factorVer = db.insert('emission_factor_versions', {
      version_id: randomUUID(),
      factor_id: 'EF-TEST',
      version_tag: '2026.1',
      reporting_year: 2026,
      geography: 'GLOBAL',
      factor_value: 0.170,
      unit: 'kgCO2e/km',
      methodology: 'DEFRA',
      valid_from: new Date(),
      status: 'ACTIVE',
      created_at: new Date(),
    });

    assert.throws(
      () => {
        db.update('emission_factor_versions', factorVer.version_id, { factor_value: 0.0 });
      },
      /Fatal Immutability Violation/
    );
    assert.throws(
      () => {
        db.delete('emission_factor_versions', factorVer.version_id);
      },
      /Fatal Immutability Violation/
    );
  });

  it('guarantees ACID transaction rollback and commit semantics', () => {
    const tenantId = randomUUID();
    db.setTenantContext(tenantId);
    db.insert('tenants', { tenant_id: tenantId, code: 'ACID-TENANT', name: 'ACID Tenant' });

    // Begin transaction
    db.beginTransaction();
    db.insert('departments', {
      department_id: randomUUID(),
      tenant_id: tenantId,
      code: 'TX-DEP-1',
      name: 'Department 1 In TX',
    }, tenantId);

    assert.strictEqual(db.count('departments', { tenant_id: tenantId }), 1);

    // Rollback transaction
    db.rollback();
    assert.strictEqual(db.count('departments', { tenant_id: tenantId }), 0, 'Rolled back record must not persist');

    // Begin new transaction and commit
    db.beginTransaction();
    db.insert('departments', {
      department_id: randomUUID(),
      tenant_id: tenantId,
      code: 'TX-DEP-COMMITTED',
      name: 'Committed Dept',
    }, tenantId);
    db.commit();

    assert.strictEqual(db.count('departments', { tenant_id: tenantId }), 1, 'Committed record must persist');
  });
});
