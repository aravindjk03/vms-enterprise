import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  RelationalDatabase,
  TenantRepository,
  PersonRepository,
  VisitorRepository,
  MaterialRepository,
  TransportRepository,
  GHGRepository,
} from '../packages/database/src/index.js';

describe('Multi-Tenant Data Isolation & RLS Security Architecture', () => {
  let db: RelationalDatabase;
  const tenantAId = '00000000-0000-0000-0000-000000000001'; // GLOBAL-MFG
  const tenantBId = '00000000-0000-0000-0000-000000000002'; // COMPETITOR-INC

  beforeEach(() => {
    db = new RelationalDatabase();

    // Seed Tenant A & Tenant B
    db.insert('tenants', { tenant_id: tenantAId, code: 'TENANT-A', name: 'Tenant A Corporation' });
    db.insert('tenants', { tenant_id: tenantBId, code: 'TENANT-B', name: 'Tenant B Corporation' });

    // Seed Organizations for Tenant A & Tenant B
    const orgAId = randomUUID();
    const orgBId = randomUUID();
    db.insert('organizations', { organization_id: orgAId, tenant_id: tenantAId, code: 'ORG-A', name: 'Org A' }, tenantAId);
    db.insert('organizations', { organization_id: orgBId, tenant_id: tenantBId, code: 'ORG-B', name: 'Org B' }, tenantBId);

    // Seed Sites for Tenant A and Tenant B
    db.insert('sites', {
      site_id: 'SITE-A-01',
      tenant_id: tenantAId,
      organization_id: orgAId,
      code: 'SITE-A',
      name: 'Site A Facility',
    });
    db.insert('sites', {
      site_id: 'SITE-B-01',
      tenant_id: tenantBId,
      organization_id: orgBId,
      code: 'SITE-B',
      name: 'Site B Facility',
    });
  });

  it('guarantees findById returns null when accessing records of another tenant', () => {
    // Insert person in Tenant B
    db.setTenantContext(tenantBId);
    const personB = db.insert('persons', {
      person_id: 'PERSON-B-100',
      tenant_id: tenantBId,
      first_name: 'Alice',
      last_name: 'B',
      display_name: 'Alice B',
    }, tenantBId);

    // Switch context to Tenant A
    db.setTenantContext(tenantAId);

    // Attempt to access Tenant B person
    const result = db.findById('persons', personB.person_id);
    assert.strictEqual(result, null, 'Tenant A must NOT be able to view Tenant B person via findById');
  });

  it('guarantees findMany excludes all records belonging to other tenants', () => {
    // Insert persons in both tenants
    db.insert('persons', { person_id: 'P-A1', tenant_id: tenantAId, first_name: 'John', last_name: 'A', display_name: 'John A' });
    db.insert('persons', { person_id: 'P-A2', tenant_id: tenantAId, first_name: 'Jane', last_name: 'A', display_name: 'Jane A' });
    db.insert('persons', { person_id: 'P-B1', tenant_id: tenantBId, first_name: 'Bob', last_name: 'B', display_name: 'Bob B' });

    // In Tenant A context
    db.setTenantContext(tenantAId);
    const tenantAPersons = db.findMany('persons');
    assert.strictEqual(tenantAPersons.length, 2);
    assert.ok(tenantAPersons.every((p: any) => p.tenant_id === tenantAId));

    // In Tenant B context
    db.setTenantContext(tenantBId);
    const tenantBPersons = db.findMany('persons');
    assert.strictEqual(tenantBPersons.length, 1);
    assert.strictEqual(tenantBPersons[0].person_id, 'P-B1');
  });

  it('prevents cross-tenant record modification and throws security violation', () => {
    db.insert('persons', {
      person_id: 'P-B-TARGET',
      tenant_id: tenantBId,
      first_name: 'Target',
      last_name: 'User',
      display_name: 'Target User',
    });

    db.setTenantContext(tenantAId);

    assert.throws(
      () => {
        db.update('persons', 'P-B-TARGET', { display_name: 'Compromised Name' });
      },
      /Cross-tenant modification prohibited/
    );
  });

  it('prevents cross-tenant record deletion and throws security violation', () => {
    db.insert('persons', {
      person_id: 'P-B-DELETE-TARGET',
      tenant_id: tenantBId,
      first_name: 'Target',
      last_name: 'User',
      display_name: 'Target User',
    });

    db.setTenantContext(tenantAId);

    assert.throws(
      () => {
        db.delete('persons', 'P-B-DELETE-TARGET');
      },
      /Cross-tenant deletion prohibited/
    );
  });

  it('prohibits inserting a record with another tenant ID in active tenant context', () => {
    db.setTenantContext(tenantAId);

    assert.throws(
      () => {
        db.insert('persons', {
          person_id: randomUUID(),
          tenant_id: tenantBId, // Intentionally malicious injection
          first_name: 'Injected',
          last_name: 'Worker',
          display_name: 'Injected Worker',
        });
      },
      /Cross-tenant insertion prohibited/
    );
  });

  it('enforces tenant scoping across all repository classes', () => {
    const tenantRepo = new TenantRepository(db);
    const personRepo = new PersonRepository(db);
    const visitorRepo = new VisitorRepository(db);
    const materialRepo = new MaterialRepository(db);
    const transportRepo = new TransportRepository(db);
    const ghgRepo = new GHGRepository(db);

    // Repository operations without context throw
    db.setTenantContext(null);
    assert.throws(() => personRepo.getPerson('SOME-ID'), /Tenant context required/);
    assert.throws(() => visitorRepo.getByReference('VIS-REF'), /Tenant context required/);
    assert.throws(() => transportRepo.getBySource('VISITOR', 'TX-1'), /Tenant context required/);

    // In Tenant A context
    db.setTenantContext(tenantAId);

    const personA = personRepo.createPerson({
      person_id: randomUUID(),
      tenant_id: tenantAId,
      first_name: 'Secure',
      last_name: 'Person',
      display_name: 'Secure Person',
      status: 'ACTIVE',
    });
    assert.strictEqual(personA.tenant_id, tenantAId);

    // Switch to Tenant B context
    db.setTenantContext(tenantBId);
    const shouldBeNull = personRepo.getPerson(personA.person_id);
    assert.strictEqual(shouldBeNull, null, 'Repository must enforce RLS and return null across tenant boundaries');

    // Transport Activity Isolation
    db.setTenantContext(tenantAId);
    const trnA = transportRepo.createActivity({
      id: randomUUID(),
      reference_number: 'TRN-SEC-01',
      tenant_id: tenantAId,
      site_id: 'SITE-A-01',
      source_domain: 'VISITOR',
      source_transaction_id: 'TX-SEC-01',
      origin_location_name: 'Origin A',
      destination_location_name: 'Destination A',
      distance: 50,
      distance_unit: 'km',
      journey_type: 'ONE_WAY',
      direction: 'INBOUND',
      usage_type: 'PERSONAL',
      occupancy: 1,
      measurement_method: 'ODOMETER_LOG',
      data_source: 'USER_INPUT',
      estimated_flag: false,
      activity_date: '2026-10-07',
    });

    db.setTenantContext(tenantBId);
    assert.strictEqual(transportRepo.getActivity(trnA.id), null);
    assert.strictEqual(transportRepo.getBySource('VISITOR', 'TX-SEC-01'), null);

    // GHG Activity Isolation
    db.setTenantContext(tenantAId);
    const ghgA = ghgRepo.createActivity({
      id: randomUUID(),
      reference_number: 'GHG-SEC-01',
      tenant_id: tenantAId,
      site_id: 'SITE-A-01',
      source_domain: 'VISITOR',
      source_transaction_id: 'TX-SEC-01',
      activity_type: 'PASSENGER_DISTANCE',
      activity_date: '2026-10-07',
      quantity: 50,
      quantity_unit: 'passenger-km',
      data_quality: 'MEASURED_PRIMARY',
      calculation_status: 'PENDING',
      verification_status: 'UNVERIFIED',
    });

    db.setTenantContext(tenantBId);
    assert.strictEqual(ghgRepo.getActivity(ghgA.id), null);
    assert.strictEqual(ghgRepo.getBySource('VISITOR', 'TX-SEC-01'), null);
  });
});
