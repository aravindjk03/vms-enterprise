import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RelationalDatabase } from '@vms/database';
import type { UserContext } from '@vms/types';
import {
  evaluateAccess,
  ROLE_PERMISSIONS,
  sanitizeRecordForUser,
} from '@vms/permissions';
import {
  AuthenticationService,
  PasswordSecurityService,
  MfaService,
  SessionSecurityService,
  BreakGlassService,
  BiometricSecurityService,
  PrivacyConsentService,
  UserSecurityProfileService,
} from '@vms/identity';
import {
  SecurityGateway,
  RateLimiter,
  SecurityHeadersService,
  SafeErrorHandler,
  SecurityError,
  ExportSecurityService,
  BulkOperationSecurityValidator,
  TamperEvidentAuditService,
  ServiceAuthService,
  DeviceSecurityService,
  type RequestEnvelope,
} from '@vms/access';
import { DocumentSecurityService } from '@vms/document';
import { SecretManager } from '@vms/config';

describe('Part 4: Enterprise Security and Identity Foundation Verification', () => {
  // Test Tenants & Sites per Section 62 specification
  const TENANT_A = '00000000-0000-0000-0000-000000000001';
  const TENANT_B = '00000000-0000-0000-0000-000000000002';
  const SITE_A1 = 'SITE-ALPHA-01';
  const SITE_A2 = 'SITE-ALPHA-02';
  const SITE_B1 = 'SITE-BETA-01';

  let db: RelationalDatabase;
  let authService: AuthenticationService;
  let passwordService: PasswordSecurityService;
  let mfaService: MfaService;
  let sessionService: SessionSecurityService;
  let documentService: DocumentSecurityService;
  let auditService: TamperEvidentAuditService;
  let gateway: SecurityGateway;

  beforeEach(() => {
    db = new RelationalDatabase();
    passwordService = new PasswordSecurityService();
    mfaService = new MfaService();
    sessionService = new SessionSecurityService();
    documentService = new DocumentSecurityService();
    auditService = new TamperEvidentAuditService();
    authService = new AuthenticationService(passwordService, mfaService, sessionService);

    gateway = new SecurityGateway(sessionService, new RateLimiter(), record => auditService.logAudit({
      tenantId: record.tenantId,
      actorUserId: record.actorUserId,
      actorRoleContext: record.actorRoleContext,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      requestId: record.requestId,
      correlationId: record.correlationId,
      result: record.result,
    }));

    // Seed tenants
    db.insert('tenants', { tenant_id: TENANT_A, code: 'TENANT-A', name: 'Tenant A Industrial Corp' });
    db.insert('tenants', { tenant_id: TENANT_B, code: 'TENANT-B', name: 'Tenant B Logistics Corp' });
  });

  // ==========================================================================
  // MANDATORY TEST 1: Cross-tenant data access must fail
  // ==========================================================================
  it('1. Cross-tenant data access must fail', () => {
    const userA: UserContext = {
      userId: 'usr-a-001',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SECURITY_MANAGER',
    };

    const targetBetaResource = {
      tenantId: TENANT_B, // Belongs to different tenant!
      siteId: SITE_B1,
    };

    const decision = evaluateAccess(userA, 'visitor.read', targetBetaResource);
    assert.equal(decision.allowed, false);
    assert.match(decision.reason || '', /Cross-tenant access prohibited/);
  });

  // ==========================================================================
  // MANDATORY TEST 2: User without permission cannot call restricted API
  // ==========================================================================
  it('2. User without permission cannot call restricted API', () => {
    const receptionist: UserContext = {
      userId: 'usr-rec-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'RECEPTIONIST',
    };

    // Receptionist trying to actuate security gate
    const decision = evaluateAccess(receptionist, 'gate.actuate', {
      tenantId: TENANT_A,
      siteId: SITE_A1,
    });

    assert.equal(decision.allowed, false);
    assert.match(decision.reason || '', /lacks capability/);
  });

  // ==========================================================================
  // MANDATORY TEST 3: User with visitor.read cannot access contractor administration
  // ==========================================================================
  it('3. User with visitor.read cannot access contractor administration', () => {
    const hostUser: UserContext = {
      userId: 'usr-host-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'HOST',
    };

    // Host has visitor.read and visitor.create, but no contractor permissions
    const visitorReadDecision = evaluateAccess(hostUser, 'visitor.read', { tenantId: TENANT_A });
    assert.equal(visitorReadDecision.allowed, true);

    const contractorAdminDecision = evaluateAccess(hostUser, 'contractor.manage_compliance', { tenantId: TENANT_A });
    assert.equal(contractorAdminDecision.allowed, false);
    assert.match(contractorAdminDecision.reason || '', /lacks capability/);
  });

  // ==========================================================================
  // MANDATORY TEST 4: Site A user cannot access Site B resources
  // ==========================================================================
  it('4. Site A user cannot access Site B resources', () => {
    const guardAtSiteA1: UserContext = {
      userId: 'guard-a1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      siteId: SITE_A1,
      role: 'SECURITY_GUARD',
    };

    // Allowed at Site A1
    const siteA1Decision = evaluateAccess(guardAtSiteA1, 'gate.actuate', {
      tenantId: TENANT_A,
      siteId: SITE_A1,
    });
    assert.equal(siteA1Decision.allowed, true);

    // DENIED at Site A2 (different site within same tenant)
    const siteA2Decision = evaluateAccess(guardAtSiteA1, 'gate.actuate', {
      tenantId: TENANT_A,
      siteId: SITE_A2,
    });
    assert.equal(siteA2Decision.allowed, false);
    assert.match(siteA2Decision.reason || '', /scoped strictly to home site/);

    // GATE_OPERATOR is also strictly scoped to assigned site
    const opAtSiteA1: UserContext = {
      userId: 'gate-op-1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      siteId: SITE_A1,
      role: 'GATE_OPERATOR',
    };
    const opSiteA2Decision = evaluateAccess(opAtSiteA1, 'gate.actuate', {
      tenantId: TENANT_A,
      siteId: SITE_A2,
    });
    assert.equal(opSiteA2Decision.allowed, false);
    assert.match(opSiteA2Decision.reason || '', /scoped strictly to home site/);
  });

  // ==========================================================================
  // MANDATORY TEST 5: Gate operator cannot modify roles
  // ==========================================================================
  it('5. Gate operator cannot modify roles', () => {
    const gateOperator: UserContext = {
      userId: 'gate-op-1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      siteId: SITE_A1,
      role: 'GATE_OPERATOR',
    };

    const roleModifyDecision = evaluateAccess(gateOperator, 'admin.roles', { tenantId: TENANT_A });
    assert.equal(roleModifyDecision.allowed, false);
    assert.match(roleModifyDecision.reason || '', /lacks capability/);
  });

  // ==========================================================================
  // MANDATORY TEST 6: ESG user cannot access restricted identity documents unless explicitly permitted
  // ==========================================================================
  it('6. ESG user cannot access restricted identity documents unless explicitly permitted', () => {
    const esgUser: UserContext = {
      userId: 'esg-user-1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'ESG_MANAGER',
    };

    // Attempting to access sensitive KYC document
    const sensitiveDocDecision = evaluateAccess(esgUser, 'DOCUMENT_READ_SENSITIVE', {
      tenantId: TENANT_A,
      classification: 'RESTRICTED',
    });
    assert.equal(sensitiveDocDecision.allowed, false);

    // ESG Manager cannot manage GHG emission factors / methodology admin (Section 46)
    const factorDecision = evaluateAccess(esgUser, 'GHG_FACTOR_MANAGE', {
      tenantId: TENANT_A,
    });
    assert.equal(factorDecision.allowed, false);
    assert.match(factorDecision.reason || '', /lacks capability/);

    // Operational record querying must redact PII
    const rawRecord = {
      visitorName: 'Alice Green',
      originLocation: 'Detroit',
      distanceKm: 25,
      governmentIdNumber: 'SECRET-ID-999',
      facialBiometricTemplate: 'VEC-BIOMETRIC-XYZ',
      visitorPhone: '+1-555-1234',
    };

    const sanitized = sanitizeRecordForUser(rawRecord, esgUser, 'visitor.read', { tenantId: TENANT_A });
    assert.equal(sanitized.visitorName, 'Alice Green');
    assert.equal(sanitized.distanceKm, 25);
    assert.equal(sanitized.governmentIdNumber, undefined);
    assert.equal(sanitized.facialBiometricTemplate, undefined);
    assert.equal(sanitized.visitorPhone, undefined);
  });

  // ==========================================================================
  // MANDATORY TEST 7: Unauthorized document download fails
  // ==========================================================================
  it('7. Unauthorized document download fails', () => {
    const guardUser: UserContext = {
      userId: 'guard-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SECURITY_GUARD',
    };

    const sensitiveDocument = {
      documentId: 'doc-confidential-01',
      tenantId: TENANT_A,
      isSensitive: true, // Requires DOCUMENT_READ_SENSITIVE
      storageKey: 'vault/tenant_a/sensitive/contract.pdf',
    };

    // Guard lacks sensitive document clearance
    assert.throws(
      () => documentService.generateSignedAccessUrl(guardUser, sensitiveDocument),
      /lacks capability DOCUMENT_READ_SENSITIVE/
    );
  });

  // ==========================================================================
  // MANDATORY TEST 8: Unauthorized export fails
  // ==========================================================================
  it('8. Unauthorized export fails', () => {
    const exportService = new ExportSecurityService();

    const receptionist: UserContext = {
      userId: 'rec-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'RECEPTIONIST',
    };

    // Receptionist does NOT have visitor.export
    assert.throws(
      () => {
        exportService.executeExport(receptionist, {
          datasetName: 'VISITOR',
          filters: {},
          records: [{ visitorName: 'Bob' }],
        });
      },
      /User lacks export authorization/
    );

    // Auditor DOES have export capability
    const auditor: UserContext = {
      userId: 'auditor-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'AUDITOR',
    };

    const auditExportResult = exportService.executeExport(auditor, {
      datasetName: 'AUDIT',
      filters: {},
      records: [{ auditId: '1', action: 'LOGIN', tenant_id: TENANT_A }],
    });
    assert.equal(auditExportResult.recordCount, 1);

    // Auditor attempting to export cross-tenant rows (with snake_case tenant_id) is strictly blocked!
    assert.throws(
      () => {
        exportService.executeExport(auditor, {
          datasetName: 'AUDIT',
          filters: {},
          records: [
            { auditId: '1', action: 'LOGIN', tenant_id: TENANT_A },
            { auditId: '2', action: 'LOGIN', tenant_id: TENANT_B }, // Cross-tenant row!
          ],
        });
      },
      /Cross-tenant data export prohibited/
    );
  });

  // ==========================================================================
  // MANDATORY TEST 9: Expired session fails
  // ==========================================================================
  it('9. Expired session fails', () => {
    const session = sessionService.createSession('user-01', TENANT_A);
    // Artificially age session beyond lifetime
    session.expiresAt = new Date(Date.now() - 1000);

    const validation = sessionService.validateSession(session.sessionId);
    assert.equal(validation.valid, false);
    assert.match(validation.reason || '', /Session expired/);
  });

  // ==========================================================================
  // MANDATORY TEST 10: Revoked session fails
  // ==========================================================================
  it('10. Revoked session fails', () => {
    const session = sessionService.createSession('user-02', TENANT_A);
    sessionService.revokeSession(session.sessionId, 'Suspicious activity detected');

    const validation = sessionService.validateSession(session.sessionId);
    assert.equal(validation.valid, false);
    assert.match(validation.reason || '', /revoked/);
  });

  // ==========================================================================
  // MANDATORY TEST 11: MFA-required user cannot bypass MFA
  // ==========================================================================
  it('11. MFA-required user cannot bypass MFA', async () => {
    const adminPasswordHash = passwordService.hashPassword('SuperAdminSecret#2026!');
    authService.registerUser({
      userId: 'admin-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      username: 'superadmin',
      email: 'admin@corp.internal',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN', // Mandatory MFA required!
      isActive: true,
      failedLoginAttempts: 0,
    });

    const loginStep1 = await authService.login('superadmin', 'SuperAdminSecret#2026!');
    // Must NOT return session immediately; MUST branch to MFA challenge!
    assert.equal(loginStep1.success, false);
    assert.equal(loginStep1.mfaRequired, true);
    assert.ok(loginStep1.mfaChallengeId);
    assert.equal(loginStep1.session, undefined);

    // Invalid MFA token fails
    const invalidStep2 = authService.completeMfaLogin('admin-01', loginStep1.mfaChallengeId!, '000000');
    assert.equal(invalidStep2.success, false);
    assert.match(invalidStep2.error || '', /MFA/);

    // Valid MFA token succeeds and issues session & userContext with mfaVerified: true
    const totpSecret = mfaService.generateTotpSecret('admin-01', 'admin@corp.internal');
    const validTotp = mfaService.computeTotp(totpSecret.secretKey);
    const validStep2 = authService.completeMfaLogin('admin-01', loginStep1.mfaChallengeId!, validTotp);
    assert.equal(validStep2.success, true);
    assert.ok(validStep2.session);
    assert.ok(validStep2.userContext);
    assert.equal(validStep2.userContext?.mfaVerified, true);
    assert.equal(validStep2.userContext?.tenantId, TENANT_A);
  });

  // ==========================================================================
  // MANDATORY TEST 12: Direct API manipulation of tenant_id fails
  // ==========================================================================
  it('12. Direct API manipulation of tenant_id fails', async () => {
    const session = sessionService.createSession('user-tamper-01', TENANT_A);

    const req: RequestEnvelope = {
      path: '/api/v1/visitors',
      method: 'POST',
      headers: {},
      sessionId: session.sessionId,
      body: {
        visitorName: 'Injected Target',
        tenantId: TENANT_B, // Malicious injection of a different tenant_id!
      },
    };

    const response = await gateway.handleRequest(
      req,
      { requiredPermission: 'visitor.create' },
      async () => ({
        userId: 'user-tamper-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        role: 'HOST',
      }),
      async () => ({ success: true })
    );

    assert.equal(response.statusCode, 403);
    assert.equal(response.error?.code, 'AUTHORIZATION_DENIED');
    assert.match(response.error?.message || '', /Direct manipulation of tenant_id prohibited/);

    // Also verify snake_case tenant_id injection is rejected
    const reqSnake: RequestEnvelope = {
      path: '/api/v1/visitors',
      method: 'POST',
      headers: {},
      sessionId: session.sessionId,
      body: {
        visitorName: 'Injected Target Snake',
        tenant_id: TENANT_B, // Snake case malicious injection!
      },
    };

    const responseSnake = await gateway.handleRequest(
      reqSnake,
      { requiredPermission: 'visitor.create' },
      async () => ({
        userId: 'user-tamper-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        role: 'HOST',
      }),
      async () => ({ success: true })
    );

    assert.equal(responseSnake.statusCode, 403);
    assert.match(responseSnake.error?.message || '', /Direct manipulation of tenant_id prohibited/);
  });

  // ==========================================================================
  // MANDATORY TEST 13: Direct API manipulation of site_id fails
  // ==========================================================================
  it('13. Direct API manipulation of site_id fails', async () => {
    const session = sessionService.createSession('guard-site-01', TENANT_A);

    const req: RequestEnvelope = {
      path: '/api/v1/gates/actuate',
      method: 'POST',
      headers: {},
      sessionId: session.sessionId,
      body: {
        gateId: 'GATE-01',
        siteId: SITE_A2, // Guard belongs to SITE_A1, attempts manipulation to SITE_A2!
      },
    };

    const response = await gateway.handleRequest(
      req,
      { requiredPermission: 'gate.actuate', targetSiteId: SITE_A2 },
      async () => ({
        userId: 'guard-site-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        siteId: SITE_A1, // Guard is strictly assigned to SITE_A1
        role: 'SECURITY_GUARD',
      }),
      async () => ({ actuated: true })
    );

    assert.equal(response.statusCode, 403);
    assert.equal(response.error?.code, 'AUTHORIZATION_DENIED');

    // Also verify snake_case site_id injection without targetSiteId specified
    const reqSnake: RequestEnvelope = {
      path: '/api/v1/gates/actuate',
      method: 'POST',
      headers: {},
      sessionId: session.sessionId,
      body: {
        gateId: 'GATE-01',
        site_id: SITE_A2,
      },
    };

    const responseSnake = await gateway.handleRequest(
      reqSnake,
      { requiredPermission: 'gate.actuate' },
      async () => ({
        userId: 'guard-site-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        siteId: SITE_A1,
        role: 'SECURITY_GUARD',
      }),
      async () => ({ actuated: true })
    );

    assert.equal(responseSnake.statusCode, 403);
    assert.equal(responseSnake.error?.code, 'AUTHORIZATION_DENIED');
  });

  // ==========================================================================
  // MANDATORY TEST 14: IDOR attempts fail
  // ==========================================================================
  it('14. IDOR attempts fail', async () => {
    // User in Tenant A attempts to fetch a resource by ID that belongs to Tenant B
    const session = sessionService.createSession('user-idor-01', TENANT_A);

    const req: RequestEnvelope = {
      path: '/api/v1/visitors/tx-beta-999',
      method: 'GET',
      headers: {},
      sessionId: session.sessionId,
    };

    const response = await gateway.handleRequest(
      req,
      {
        requiredPermission: 'visitor.read',
        targetResourceId: 'tx-beta-999',
        targetTenantId: TENANT_B, // Target entity is owned by Tenant B!
      },
      async () => ({
        userId: 'user-idor-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        role: 'RECEPTIONIST',
      }),
      async () => ({ recordFound: true })
    );

    assert.equal(response.statusCode, 403);
    assert.equal(response.error?.code, 'AUTHORIZATION_DENIED');
  });

  // ==========================================================================
  // MANDATORY TEST 15: Privilege escalation attempts fail
  // ==========================================================================
  it('15. Privilege escalation attempts fail', () => {
    const receptionist: UserContext = {
      userId: 'rec-02',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'RECEPTIONIST',
    };

    // Receptionist attempts to self-grant SYSTEM_ADMIN_MANAGE
    const decision = evaluateAccess(receptionist, 'SYSTEM_ADMIN_MANAGE', { tenantId: TENANT_A });
    assert.equal(decision.allowed, false);

    // Segregation of duties: Creator cannot approve own work order / factor
    const dutyViolatingDecision = evaluateAccess(
      {
        userId: 'approver-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        role: 'SITE_ADMIN',
      },
      'visitor.approve',
      {
        tenantId: TENANT_A,
        ownerId: 'approver-01', // Created by same user!
        requiresSegregationOfDuties: true,
      }
    );
    assert.equal(dutyViolatingDecision.allowed, false);
    assert.match(dutyViolatingDecision.reason || '', /Segregation of duties/);

    // Segregation of duties: Creator cannot approve even without explicit requiresSegregationOfDuties flag
    const dutyViolatingDefault = evaluateAccess(
      {
        userId: 'approver-01',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        role: 'SITE_ADMIN',
      },
      'visitor.approve',
      {
        tenantId: TENANT_A,
        ownerId: 'approver-01',
      }
    );
    assert.equal(dutyViolatingDefault.allowed, false);
    assert.match(dutyViolatingDefault.reason || '', /Segregation of duties/);

    // Approval state security: cannot approve a transaction that is CANCELLED or EXPIRED
    const cancelledApproval = evaluateAccess(
      {
        userId: 'approver-02',
        tenantId: TENANT_A,
        organizationId: 'org-a',
        role: 'SITE_ADMIN',
      },
      'visitor.approve',
      {
        tenantId: TENANT_A,
        ownerId: 'creator-01',
        state: 'CANCELLED',
      }
    );
    assert.equal(cancelledApproval.allowed, false);
    assert.match(cancelledApproval.reason || '', /Cannot approve transaction in CANCELLED state/);
  });

  // ==========================================================================
  // MANDATORY TEST 16: Audit records cannot be modified through ordinary application APIs
  // ==========================================================================
  it('16. Audit records cannot be modified through ordinary application APIs', () => {
    // 1. Relational Database engine immutability invariant
    db.setTenantContext(TENANT_A);
    const auditRow = db.insert('audit_logs', {
      audit_id: 'AUD-001',
      tenant_id: TENANT_A,
      action: 'LOGIN',
      timestamp: new Date(),
    });

    // Prohibit update on audit table
    assert.throws(
      () => db.update('audit_logs', auditRow.audit_id, { action: 'MODIFIED_LOGIN' }),
      /Fatal Immutability Violation/
    );

    // Prohibit delete on audit table
    assert.throws(
      () => db.delete('audit_logs', auditRow.audit_id),
      /Fatal Immutability Violation/
    );

    // 2. Cryptographic Tamper-Evident Hash Chain Verification
    auditService.logAudit({
      tenantId: TENANT_A,
      actorUserId: 'u1',
      actorRoleContext: 'SECURITY_MANAGER',
      action: 'LOGIN',
      entityType: 'SESSION',
      entityId: 's1',
      requestId: 'REQ-1',
      correlationId: 'REQ-1',
    });

    const secondRecord = auditService.logAudit({
      tenantId: TENANT_A,
      actorUserId: 'u1',
      actorRoleContext: 'SECURITY_MANAGER',
      action: 'VISITOR_VIEWED',
      entityType: 'VISITOR',
      entityId: 'v100',
      requestId: 'REQ-2',
      correlationId: 'REQ-2',
    });

    // Chain is intact
    assert.equal(auditService.verifyChainIntegrity().intact, true);

    // Tamper with record content in memory
    (secondRecord as any).action = 'UNAUDITED_ALTERATION';
    const tamperedCheck = auditService.verifyChainIntegrity();
    assert.equal(tamperedCheck.intact, false);
    assert.match(tamperedCheck.reason || '', /tampered/);
  });

  // ==========================================================================
  // MANDATORY TEST 17: Sensitive data is not exposed in error responses
  // ==========================================================================
  it('17. Sensitive data is not exposed in error responses', () => {
    const rawError = new Error('SELECT * FROM users WHERE password_hash = "secret123" failed at /internal/srv/db.ts:40');
    const safeResponse = SafeErrorHandler.toSafeResponse(rawError, 'REQ-TEST-001');

    assert.equal(safeResponse.statusCode, 500);
    assert.equal(safeResponse.body.code, 'INTERNAL_ERROR');
    // Ensure zero leakage of SQL query, file paths, or password values!
    assert.ok(!safeResponse.body.message.includes('password'));
    assert.ok(!safeResponse.body.message.includes('SELECT'));
    assert.ok(!safeResponse.body.message.includes('/internal/'));
  });

  // ==========================================================================
  // MANDATORY TEST 18: Secrets are not present in source code
  // ==========================================================================
  it('18. Secrets are not present in source code', () => {
    // Verify that SecretManager throws in production if secrets are missing rather than using hardcoded fallbacks
    process.env['NODE_ENV'] = 'production';
    delete process.env['CRITICAL_PRODUCTION_KEY'];

    assert.throws(
      () => SecretManager.getSecret('CRITICAL_PRODUCTION_KEY'),
      /CRITICAL SECURITY FAILURE/
    );

    // Reset environment
    process.env['NODE_ENV'] = 'test';

    // Verify .example.env has only placeholders and no real passwords
    const envExample = readFileSync(join(process.cwd(), '.example.env'), 'utf-8');
    assert.ok(envExample.includes('PLACEHOLDER_'));
    assert.ok(envExample.includes('CHANGE_ME_'));
    assert.ok(!envExample.includes('sk_live_'));
    assert.ok(!envExample.includes('ghp_'));
  });

  // ==========================================================================
  // MANDATORY TEST 19: Rate limiting activates correctly
  // ==========================================================================
  it('19. Rate limiting activates correctly', () => {
    const rateLimiter = new RateLimiter({
      LOGIN: { limit: 3, windowMs: 60 * 1000 },
    });

    const ip = '192.168.1.100';

    assert.equal(rateLimiter.checkRateLimit(ip, 'LOGIN').allowed, true);
    assert.equal(rateLimiter.checkRateLimit(ip, 'LOGIN').allowed, true);
    assert.equal(rateLimiter.checkRateLimit(ip, 'LOGIN').allowed, true);

    // 4th request must be rejected
    const blocked = rateLimiter.checkRateLimit(ip, 'LOGIN');
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.resetSeconds > 0);
  });

  // ==========================================================================
  // MANDATORY TEST 20: Bulk operations enforce permissions
  // ==========================================================================
  it('20. Bulk operations enforce permissions', async () => {
    const securityGuard: UserContext = {
      userId: 'guard-bulk-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      siteId: SITE_A1,
      role: 'SECURITY_GUARD',
    };

    const bulkItems = [
      // Item 1: Valid site A1 pass
      { id: 'item-1', tenantId: TENANT_A, siteId: SITE_A1, payload: { passId: 'P1' } },
      // Item 2: Malicious cross-tenant injection into Tenant B!
      { id: 'item-2', tenantId: TENANT_B, siteId: SITE_B1, payload: { passId: 'P2' } },
      // Item 3: Cross-site injection into Site A2!
      { id: 'item-3', tenantId: TENANT_A, siteId: SITE_A2, payload: { passId: 'P3' } },
    ];

    const bulkResult = await BulkOperationSecurityValidator.executeBulk(
      securityGuard,
      'gate.actuate',
      bulkItems,
      item => `Processed ${item.id}`
    );

    assert.equal(bulkResult.processedCount, 3);
    assert.equal(bulkResult.results[0].success, true);
    assert.equal(bulkResult.results[1].success, false); // Cross-tenant rejected
    assert.match(bulkResult.results[1].error || '', /Cross-tenant/);
    assert.equal(bulkResult.results[2].success, false); // Site A2 rejected
    assert.match(bulkResult.results[2].error || '', /home site/);
  });

  // ==========================================================================
  // MANDATORY TEST 21: Multi-role RBAC evaluates union of roles
  // ==========================================================================
  it('21. Multi-role RBAC evaluates union of roles', () => {
    const dualRoleUser: UserContext = {
      userId: 'usr-dual-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'RECEPTIONIST',
      roles: ['RECEPTIONIST', 'SECURITY_GUARD'],
    };

    // Receptionist has visitor.read and visitor.checkin
    const checkinDecision = evaluateAccess(dualRoleUser, 'visitor.checkin', { tenantId: TENANT_A });
    assert.equal(checkinDecision.allowed, true);

    // Security guard has gate.actuate
    const gateDecision = evaluateAccess(dualRoleUser, 'gate.actuate', {
      tenantId: TENANT_A,
      siteId: SITE_A1,
    });
    assert.equal(gateDecision.allowed, true);

    // But neither role has admin.roles
    const adminDecision = evaluateAccess(dualRoleUser, 'admin.roles', { tenantId: TENANT_A });
    assert.equal(adminDecision.allowed, false);
  });

  // ==========================================================================
  // MANDATORY TEST 22: Zone and time-window ABAC access enforcement
  // ==========================================================================
  it('22. Zone and time-window ABAC access enforcement', () => {
    const zonedUser: UserContext = {
      userId: 'usr-zone-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SECURITY_GUARD',
      assignedZoneIds: ['ZONE-ALPHA-SECURE'],
    };

    // Allowed in assigned zone
    const validZone = evaluateAccess(zonedUser, 'gate.actuate', {
      tenantId: TENANT_A,
      zoneId: 'ZONE-ALPHA-SECURE',
    });
    assert.equal(validZone.allowed, true);

    // Denied in unassigned zone
    const invalidZone = evaluateAccess(zonedUser, 'gate.actuate', {
      tenantId: TENANT_A,
      zoneId: 'ZONE-BETA-RESTRICTED',
    });
    assert.equal(invalidZone.allowed, false);
    assert.match(invalidZone.reason || '', /assigned zones/);

    // Operational time window enforcement
    const timedUser: UserContext = {
      userId: 'usr-timed-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SECURITY_GUARD',
    };

    const outOfWindowDecision = evaluateAccess(timedUser, 'gate.actuate', {
      tenantId: TENANT_A,
      allowedTimeWindow: {
        startTime: '01:00',
        endTime: '01:05',
      },
      evaluationTime: new Date('2026-01-01T15:00:00Z'),
    });
    assert.equal(outOfWindowDecision.allowed, false);
    assert.match(outOfWindowDecision.reason || '', /outside permitted operational hours/);
  });

  // ==========================================================================
  // MANDATORY TEST 23: Privacy consent lifecycle and statutory withdrawal
  // ==========================================================================
  it('23. Privacy consent lifecycle and statutory withdrawal', () => {
    const consentService = new PrivacyConsentService();

    // 1. Record consent
    const consent = consentService.recordConsent({
      tenantId: TENANT_A,
      personId: 'visitor-alice',
      purpose: 'VISITOR_REGISTRATION',
      consentType: 'TERMS_OF_ACCESS',
      versionPresented: 'v2.1',
      accepted: true,
      channel: 'KIOSK',
    });

    assert.equal(consentService.hasValidConsent('visitor-alice', 'TERMS_OF_ACCESS', 'VISITOR_REGISTRATION'), true);

    // 2. Withdraw consent
    const withdrew = consentService.withdrawConsent(consent.consentId, 'admin-01', 'Visitor requested erasure');
    assert.equal(withdrew, true);

    // 3. Now consent is invalid
    assert.equal(consentService.hasValidConsent('visitor-alice', 'TERMS_OF_ACCESS', 'VISITOR_REGISTRATION'), false);

    // 4. Audit trail records withdrawal
    const auditEvents = consentService.getAuditTrail('visitor-alice');
    assert.ok(auditEvents.length >= 2);
    assert.equal(auditEvents[auditEvents.length - 1].action, 'CONSENT_WITHDRAWN');
  });

  // ==========================================================================
  // MANDATORY TEST 24: Device security and offline gate pass cache validation
  // ==========================================================================
  it('24. Device security and offline gate pass cache validation', () => {
    const deviceService = new DeviceSecurityService();

    // 1. Register device
    deviceService.registerDevice({
      deviceId: 'GATE-TERM-01',
      deviceType: 'GATE_TERMINAL',
      siteId: SITE_A1,
      gateId: 'GATE-MAIN',
      isTrusted: true,
    });

    // 2. Verify site mismatch fails
    const badSiteAuth = deviceService.authenticateDevice('GATE-TERM-01', SITE_A2);
    assert.equal(badSiteAuth.authorized, false);

    // 3. Cache valid offline pass
    const rawQrToken = 'SECURE-QR-PASS-ALPHA-999';
    const qrHash = createHash('sha256').update(rawQrToken).digest('hex');

    deviceService.cacheOfflinePass({
      passId: 'PASS-OFFLINE-01',
      tenantId: TENANT_A,
      siteId: SITE_A1,
      gateId: 'GATE-MAIN',
      subjectIdentifier: 'worker-101',
      qrHash,
      validFrom: new Date(Date.now() - 60000),
      validTo: new Date(Date.now() + 3600000),
      cachedAt: new Date(),
      isBlacklisted: false,
    });

    // 4. Verify valid offline pass
    const validOffline = deviceService.verifyOfflinePass(
      TENANT_A,
      'PASS-OFFLINE-01',
      SITE_A1,
      'GATE-MAIN',
      rawQrToken
    );
    assert.equal(validOffline.allowed, true);

    // 5. Anti-passback / duplicate rejection during sync
    const syncResults = deviceService.reconcileOfflineBatch('GATE-TERM-01', [
      {
        syncRecordId: 'SYNC-1',
        deviceId: 'GATE-TERM-01',
        siteId: SITE_A1,
        gateId: 'GATE-MAIN',
        action: 'OFFLINE_PASS_ENTRY',
        subjectIdentifier: 'worker-101',
        passId: 'PASS-OFFLINE-01',
        recordedAt: new Date(),
        signature: 'sig-1',
      },
      {
        syncRecordId: 'SYNC-2',
        deviceId: 'GATE-TERM-01',
        siteId: SITE_A1,
        gateId: 'GATE-MAIN',
        action: 'OFFLINE_PASS_ENTRY',
        subjectIdentifier: 'worker-101',
        passId: 'PASS-OFFLINE-01',
        recordedAt: new Date(),
        signature: 'sig-2',
      },
    ]);

    assert.equal(syncResults[0].status, 'RECONCILED');
    assert.equal(syncResults[1].status, 'DUPLICATE_REJECTED');
  });

  // ==========================================================================
  // MANDATORY TEST 25: Service-to-service HMAC authentication
  // ==========================================================================
  it('25. Service-to-service HMAC authentication', () => {
    const s2sService = new ServiceAuthService();
    s2sService.registerService({
      serviceId: 'srv-visitor',
      serviceName: 'Visitor Management Core',
      publicKeyOrSecret: 'super-secret-s2s-key-12345',
      allowedAudiences: ['srv-ghg', 'srv-notifications'],
      isActive: true,
      createdAt: new Date(),
    });

    // 1. Issue token for allowed audience
    const token = s2sService.generateServiceToken('srv-visitor', 'srv-ghg', 300);
    assert.ok(token.startsWith('s2s.'));

    // 2. Verify token
    const verifyValid = s2sService.verifyServiceToken(token, 'srv-ghg');
    assert.equal(verifyValid.valid, true);
    assert.equal(verifyValid.payload?.serviceId, 'srv-visitor');

    // 3. Unauthorized audience fails
    const verifyWrongAud = s2sService.verifyServiceToken(token, 'srv-billing');
    assert.equal(verifyWrongAud.valid, false);

    // 4. Tampered token fails
    const tamperedToken = token.slice(0, -4) + 'abcd';
    const verifyTampered = s2sService.verifyServiceToken(tamperedToken, 'srv-ghg');
    assert.equal(verifyTampered.valid, false);
    assert.match(verifyTampered.error || '', /signature/i);
  });

  // ==========================================================================
  // MANDATORY TEST 26: User Security Profile authorization & tenant boundary
  // ==========================================================================
  it('26. User Security Profile authorization & tenant boundary', () => {
    const profileService = new UserSecurityProfileService(
      sessionService,
      (userId: string) => {
        if (userId === 'usr-target') {
          return {
            userId: 'usr-target',
            tenantId: TENANT_A,
            organizationId: 'org-a',
            username: 'alice.target',
            email: 'alice@corp.internal',
            passwordHash: 'dummy-hash',
            role: 'ESG_MANAGER',
            isActive: true,
            failedLoginAttempts: 0,
          };
        }
        return undefined;
      }
    );

    const adminUser: UserContext = {
      userId: 'usr-admin-01',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'IT_ADMIN',
    };

    const targetUserContext: UserContext = {
      userId: 'usr-target',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'ESG_MANAGER',
    };

    const unauthorizedViewer: UserContext = {
      userId: 'usr-other',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'RECEPTIONIST',
    };

    // 1. Self can access profile
    const selfProfile = profileService.getProfile(targetUserContext, 'usr-target');
    assert.equal(selfProfile.userId, 'usr-target');
    assert.equal(selfProfile.roles[0], 'ESG_MANAGER');

    // 2. Admin can access profile
    const adminProfile = profileService.getProfile(adminUser, 'usr-target');
    assert.equal(adminProfile.userId, 'usr-target');

    // 3. Unauthorized viewer fails
    assert.throws(
      () => profileService.getProfile(unauthorizedViewer, 'usr-target'),
      /insufficient authorization/
    );

    // 4. Cross-tenant admin access fails
    const tenantBAdmin: UserContext = {
      userId: 'usr-admin-b',
      tenantId: TENANT_B,
      organizationId: 'org-b',
      role: 'IT_ADMIN',
    };
    assert.throws(
      () => profileService.getProfile(tenantBAdmin, 'usr-target'),
      /Cross-tenant/
    );
  });

  // ==========================================================================
  // MANDATORY TEST 27: Password history and reset token lifecycle
  // ==========================================================================
  it('27. Password history and reset token lifecycle', () => {
    const pw = 'SecretPass#2026!';
    const hash1 = passwordService.hashPassword(pw);
    const hash2 = passwordService.hashPassword('AnotherPass#2026!');

    // Password history detection
    assert.equal(passwordService.isPasswordInHistory(pw, [hash1, hash2]), true);
    assert.equal(passwordService.isPasswordInHistory('BrandNewPassword#2026!', [hash1, hash2]), false);

    // Reset token generation and validation
    const reset = passwordService.generatePasswordResetToken('user-101', 30);
    assert.ok(reset.resetToken);
    const validVerify = passwordService.verifyPasswordResetToken(reset.resetToken);
    assert.equal(validVerify.valid, true);
    assert.equal(validVerify.userId, 'user-101');

    const invalidVerify = passwordService.verifyPasswordResetToken('bad-token');
    assert.equal(invalidVerify.valid, false);
  });

  // ==========================================================================
  // MANDATORY TEST 28: Malware upload quarantine & filename sanitization
  // ==========================================================================
  it('28. Malware upload quarantine & filename sanitization', async () => {
    // 1. Valid PDF upload succeeds and sanitizes traversal attempt
    const validPdfBuffer = Buffer.from('%PDF-1.5 test document content');
    const uploadResult = await documentService.validateUpload({
      filename: '../../path/traversal/test-file.pdf',
      mimeType: 'application/pdf',
      sizeBytes: validPdfBuffer.length,
      buffer: validPdfBuffer,
      tenantId: TENANT_A,
      entityType: 'contracts',
      entityId: 'c1',
    });

    assert.equal(uploadResult.valid, true);
    assert.equal(uploadResult.quarantined, false);
    assert.ok(!uploadResult.sanitizedFilename.includes('..'));
    assert.ok(!uploadResult.sanitizedFilename.includes('/'));

    // 2. Malware payload (EICAR standard test signature) is quarantined!
    const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const infectedBuffer = Buffer.concat([Buffer.from('%PDF-1.4 '), Buffer.from(eicar)]);

    const malwareResult = await documentService.validateUpload({
      filename: 'invoice-virus.pdf',
      mimeType: 'application/pdf',
      sizeBytes: infectedBuffer.length,
      buffer: infectedBuffer,
      tenantId: TENANT_A,
      entityType: 'invoices',
      entityId: 'inv-1',
    });

    assert.equal(malwareResult.valid, false);
    assert.equal(malwareResult.quarantined, true);
    assert.match(malwareResult.error || '', /Malware detected/);
  });

  // ==========================================================================
  // MANDATORY TEST 29: Retention policy exception preserves documents from disposal
  // ==========================================================================
  it('29. Retention policy exception preserves documents from disposal', () => {
    documentService.registerRetentionPolicy({
      policyId: 'pol-contracts',
      tenantId: TENANT_A,
      documentType: 'CONTRACT',
      retentionDays: 30,
      legalHold: false,
      actionOnExpiry: 'DELETE',
    });

    // 60-day old document (expired by retentionDays)
    const oldDate = new Date(Date.now() - 60 * 24 * 3600 * 1000);

    // 1. Without exception, disposal is allowed
    const disposalResult = documentService.evaluateRetentionDisposal(
      TENANT_A,
      'doc-old-01',
      'CONTRACT',
      oldDate
    );
    assert.equal(disposalResult.canDispose, true);
    assert.equal(disposalResult.action, 'DELETE');

    // 2. Register retention exception
    documentService.registerRetentionException({
      exceptionId: 'ex-audit-hold',
      tenantId: TENANT_A,
      documentId: 'doc-old-02',
      reason: 'Under external statutory audit',
      grantedBy: 'auditor-01',
      grantedAt: new Date(),
      isActive: true,
    });

    // 3. Disposal is blocked by retention exception
    const preservedResult = documentService.evaluateRetentionDisposal(
      TENANT_A,
      'doc-old-02',
      'CONTRACT',
      oldDate
    );
    assert.equal(preservedResult.canDispose, false);
    assert.equal(preservedResult.action, 'RETAIN');
    assert.match(preservedResult.reason || '', /retention exception active/);
  });

  // ==========================================================================
  // MANDATORY TEST 30: Session refresh & tenant-isolated admin revocation
  // ==========================================================================
  it('30. Session refresh & tenant-isolated admin revocation', () => {
    const session = sessionService.createSession('user-sess-01', TENANT_A);
    const initialExpires = session.expiresAt.getTime();

    // 1. Refresh session
    const refreshed = sessionService.refreshSession(session.sessionId);
    assert.ok(refreshed);
    assert.ok(refreshed.expiresAt.getTime() >= initialExpires);

    // 2. Cross-tenant admin revocation prohibited
    const tenantBAdmin = {
      userId: 'admin-b-01',
      tenantId: TENANT_B,
      role: 'IT_ADMIN',
    };
    assert.throws(
      () => sessionService.revokeSessionByAdmin(tenantBAdmin, session.sessionId, 'Cross-tenant attempt'),
      /Cross-tenant session revocation prohibited/
    );

    // 3. Same-tenant admin revocation succeeds
    const tenantAAdmin = {
      userId: 'admin-a-01',
      tenantId: TENANT_A,
      role: 'IT_ADMIN',
    };
    const revoked = sessionService.revokeSessionByAdmin(tenantAAdmin, session.sessionId, 'Security reset');
    assert.equal(revoked, true);
    assert.equal(sessionService.validateSession(session.sessionId).valid, false);
  });
});
