import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  evaluateAccess,
  ROLE_PERMISSIONS,
  maskRecord,
  sanitizeRecordForUser,
} from '../packages/permissions/src/index.js';
import type { UserContext } from '../packages/types/src/index.js';

describe('RBAC & ABAC Security and Privacy Architecture', () => {
  const tenantAlpha = randomUUID();
  const tenantBeta = randomUUID();
  const siteDetroit = randomUUID();
  const siteMunich = randomUUID();

  it('guarantees tenant data isolation (blocks cross-tenant access)', () => {
    const userInAlpha: UserContext = {
      userId: 'user-alpha-1',
      tenantId: tenantAlpha,
      organizationId: randomUUID(),
      siteId: siteDetroit,
      role: 'SECURITY_MANAGER',
    };

    const resourceInBeta = {
      tenantId: tenantBeta, // Different tenant!
      siteId: siteMunich,
    };

    const decision = evaluateAccess(userInAlpha, 'VISITOR_READ', resourceInBeta);
    assert.equal(decision.allowed, false);
    assert.match(decision.reason || '', /Cross-tenant access prohibited/);
  });

  it('enforces privacy-by-design for ESG Manager (masks sensitive PII & biometrics)', () => {
    const esgUser: UserContext = {
      userId: 'esg-officer-1',
      tenantId: tenantAlpha,
      organizationId: randomUUID(),
      role: 'ESG_MANAGER',
    };

    const resourceInAlpha = {
      tenantId: tenantAlpha,
      siteId: siteDetroit,
    };

    // ESG Manager is allowed to read visitor operational data (to trace transport activity)
    const decision = evaluateAccess(esgUser, 'VISITOR_READ', resourceInAlpha);
    assert.equal(decision.allowed, true);

    // CRITICAL REQUIREMENT: Sensitive PII and biometrics MUST be masked!
    assert.ok(decision.maskedFields.includes('governmentIdNumber'));
    assert.ok(decision.maskedFields.includes('facialBiometricTemplate'));
    assert.ok(decision.maskedFields.includes('nationalIdNumber'));
    assert.ok(decision.maskedFields.includes('visitorPhone'));
    assert.ok(decision.maskedFields.includes('visitorEmail'));

    // Verify concrete record sanitization
    const rawVisitorRecord = {
      transactionId: 'VIS-2026-0001',
      visitorName: 'Alice Green',
      visitorEmail: 'alice@secret.com',
      visitorPhone: '+1-555-0199',
      governmentIdNumber: 'US-PASS-998811',
      governmentIdType: 'PASSPORT',
      facialBiometricTemplate: 'VEC-998822-XYZ-BIO',
      originLocation: 'Chicago',
      distanceKm: 450,
      mode: 'CAR',
    };

    const sanitized = sanitizeRecordForUser(
      rawVisitorRecord,
      esgUser,
      'VISITOR_READ',
      resourceInAlpha
    );

    // Operational and transport data must remain intact for Scope 3 emissions tracing
    assert.equal(sanitized.transactionId, 'VIS-2026-0001');
    assert.equal(sanitized.visitorName, 'Alice Green');
    assert.equal(sanitized.originLocation, 'Chicago');
    assert.equal(sanitized.distanceKm, 450);

    // Sensitive identity documents, PII, and biometric templates must be completely stripped!
    assert.equal(sanitized.governmentIdNumber, undefined);
    assert.equal(sanitized.facialBiometricTemplate, undefined);
    assert.equal(sanitized.visitorPhone, undefined);
    assert.equal(sanitized.visitorEmail, undefined);
    assert.equal(sanitized.governmentIdType, undefined);
  });

  it('restricts Security Guard gate actuation strictly to their assigned site', () => {
    const guardAtDetroit: UserContext = {
      userId: 'guard-detroit-1',
      tenantId: tenantAlpha,
      organizationId: randomUUID(),
      siteId: siteDetroit,
      role: 'SECURITY_GUARD',
    };

    // Allowed at Detroit site
    const allowedDecision = evaluateAccess(guardAtDetroit, 'GATE_ACTUATE', {
      tenantId: tenantAlpha,
      siteId: siteDetroit,
    });
    assert.equal(allowedDecision.allowed, true);

    // Denied at Munich site
    const deniedDecision = evaluateAccess(guardAtDetroit, 'GATE_ACTUATE', {
      tenantId: tenantAlpha,
      siteId: siteMunich,
    });
    assert.equal(deniedDecision.allowed, false);
    assert.match(deniedDecision.reason || '', /scoped strictly to home site/);
  });

  it('ensures EHS Manager can approve PTW but has no gate actuation or system admin rights', () => {
    const ehsPermissions = ROLE_PERMISSIONS['EHS_MANAGER'];
    assert.ok(ehsPermissions.includes('PTW_APPROVE'));
    assert.ok(!ehsPermissions.includes('GATE_ACTUATE'));
    assert.ok(!ehsPermissions.includes('SYSTEM_ADMIN_MANAGE'));
  });
});
