import { createHash, randomUUID } from 'node:crypto';
import type {
  AuditRecord,
  EventClassification,
  SecurityAlert,
} from '@vms/types';

export interface AuditLogInput {
  tenantId: string;
  actorUserId: string;
  actorRoleContext: AuditRecord['actorRoleContext'];
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  correlationId: string;
  source?: string;
  ipMetadata?: string;
  deviceMetadata?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  reason?: string;
  result?: 'SUCCESS' | 'DENIED' | 'FAILED';
  eventClassification?: EventClassification;
}

export class TamperEvidentAuditService {
  private static readonly SENSITIVE_KEYS_BLACKLIST = [
    'password',
    'passwordhash',
    'token',
    'jwt',
    'secret',
    'cookie',
    'privatekey',
    'private_key',
    'apikey',
    'api_key',
    'access_token',
    'refresh_token',
    'authorization',
    'facialbiometrictemplate',
    'biometrictemplate',
    'otp',
    'totp',
    'mfacode',
    'pin',
    'recoverycode',
    'governmentid',
    'nationalid',
    'passportnumber',
    'aadhaar',
  ];

  private records: AuditRecord[] = [];
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';
  private securityAlerts: SecurityAlert[] = [];

  /**
   * Deterministic canonical JSON serializer (sorts keys recursively)
   */
  public static canonicalJson(obj: unknown): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => TamperEvidentAuditService.canonicalJson(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(
      key => JSON.stringify(key) + ':' + TamperEvidentAuditService.canonicalJson((obj as Record<string, unknown>)[key])
    );
    return '{' + pairs.join(',') + '}';
  }

  /**
   * Records an audited action into a cryptographically chained, tamper-evident ledger.
   * Automatically scrubs passwords, credentials, tokens, and biometric vectors.
   */
  public logAudit(input: AuditLogInput): AuditRecord {
    const auditId = `aud-${randomUUID()}`;
    const timestamp = new Date();

    const sanitizedBefore = this.scrubSensitiveData(input.beforeSnapshot);
    const sanitizedAfter = this.scrubSensitiveData(input.afterSnapshot);

    const recordPayload = {
      auditId,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      actorRoleContext: input.actorRoleContext,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      timestamp: timestamp.toISOString(),
      requestId: input.requestId,
      correlationId: input.correlationId,
      source: input.source || 'APPLICATION',
      ipMetadata: input.ipMetadata,
      deviceMetadata: input.deviceMetadata,
      beforeSnapshot: sanitizedBefore,
      afterSnapshot: sanitizedAfter,
      reason: input.reason,
      result: input.result || 'SUCCESS',
      previousHash: this.lastHash,
    };

    // Compute cryptographic SHA-256 hash of canonical JSON string + previous hash
    const canonicalString = TamperEvidentAuditService.canonicalJson(recordPayload);
    const hash = createHash('sha256').update(canonicalString).digest('hex');

    const auditRecord: AuditRecord = {
      ...recordPayload,
      timestamp,
      hash,
    };

    this.records.push(auditRecord);
    this.lastHash = hash;

    // Check for high-risk security patterns and raise alerts
    this.evaluateSecurityAlerts(input);

    return auditRecord;
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain.
   * Detects any retroactively modified, reordered, or deleted records.
   */
  public verifyChainIntegrity(): { intact: boolean; totalChecked: number; corruptedRecordId?: string; reason?: string } {
    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < this.records.length; i++) {
      const record = this.records[i];

      // 1. Verify previous hash pointer
      if (record.previousHash !== previousHash) {
        return {
          intact: false,
          totalChecked: i,
          corruptedRecordId: record.auditId,
          reason: `Chain pointer broken: expected previousHash ${previousHash}, found ${record.previousHash}`,
        };
      }

      // 2. Recompute hash from canonical payload
      const payload = {
        auditId: record.auditId,
        tenantId: record.tenantId,
        actorUserId: record.actorUserId,
        actorRoleContext: record.actorRoleContext,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        timestamp: record.timestamp.toISOString(),
        requestId: record.requestId,
        correlationId: record.correlationId,
        source: record.source,
        ipMetadata: record.ipMetadata,
        deviceMetadata: record.deviceMetadata,
        beforeSnapshot: record.beforeSnapshot,
        afterSnapshot: record.afterSnapshot,
        reason: record.reason,
        result: record.result,
        previousHash: record.previousHash,
      };

      const computedHash = createHash('sha256').update(TamperEvidentAuditService.canonicalJson(payload)).digest('hex');
      if (computedHash !== record.hash) {
        return {
          intact: false,
          totalChecked: i,
          corruptedRecordId: record.auditId,
          reason: `Content hash mismatch: record payload was tampered with after logging.`,
        };
      }

      previousHash = record.hash;
    }

    return {
      intact: true,
      totalChecked: this.records.length,
    };
  }

  public getRecords(tenantId?: string): AuditRecord[] {
    if (!tenantId) return [...this.records];
    return this.records.filter(r => r.tenantId === tenantId);
  }

  public getSecurityAlerts(tenantId?: string): SecurityAlert[] {
    if (!tenantId) return [...this.securityAlerts];
    return this.securityAlerts.filter(a => a.tenantId === tenantId);
  }

  /**
   * Sanitizes objects by removing blacklisted secret keys.
   */
  private scrubSensitiveData(obj?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!obj) return undefined;
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (TamperEvidentAuditService.SENSITIVE_KEYS_BLACKLIST.some(k => lowerKey.includes(k))) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else {
        sanitized[key] = this.scrubValue(value);
      }
    }

    return sanitized;
  }

  private scrubValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.scrubValue(item));
    }
    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      return this.scrubSensitiveData(value as Record<string, unknown>);
    }
    return value;
  }

  /**
   * Rule-based real-time security alerting for all 8 enterprise alert types
   */
  private evaluateSecurityAlerts(input: AuditLogInput) {
    const now = Date.now();

    // 1. Multiple Failed Logins
    if (input.action === 'LOGIN_FAILURE') {
      const recentFailures = this.records.filter(
        r => r.action === 'LOGIN_FAILURE' &&
             r.actorUserId === input.actorUserId &&
             now - r.timestamp.getTime() < 5 * 60 * 1000
      );
      if (recentFailures.length >= 4) {
        this.securityAlerts.push({
          alertId: `alert-${randomUUID()}`,
          tenantId: input.tenantId,
          alertType: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          details: { actorUserId: input.actorUserId, failedCount: recentFailures.length },
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // 2. Impossible Login Pattern
    if (input.action === 'LOGIN' && input.ipMetadata) {
      const previousLogin = this.records.find(
        r => r.action === 'LOGIN' &&
             r.actorUserId === input.actorUserId &&
             r.ipMetadata &&
             r.ipMetadata !== input.ipMetadata &&
             now - r.timestamp.getTime() < 2 * 60 * 1000 // 2 minutes between different IPs
      );
      if (previousLogin) {
        this.securityAlerts.push({
          alertId: `alert-${randomUUID()}`,
          tenantId: input.tenantId,
          alertType: 'IMPOSSIBLE_LOGIN_PATTERN',
          severity: 'HIGH',
          details: { actorUserId: input.actorUserId, firstIp: previousLogin.ipMetadata, secondIp: input.ipMetadata },
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // 3. Mass Export Detected
    if (input.action.includes('EXPORT')) {
      this.securityAlerts.push({
        alertId: `alert-${randomUUID()}`,
        tenantId: input.tenantId,
        alertType: 'MASS_EXPORT_DETECTED',
        severity: 'MEDIUM',
        details: { actorUserId: input.actorUserId, action: input.action, entityType: input.entityType },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 4. Repeated Authorization Failure
    if (input.result === 'DENIED') {
      const recentDenials = this.records.filter(
        r => r.result === 'DENIED' &&
             r.actorUserId === input.actorUserId &&
             now - r.timestamp.getTime() < 5 * 60 * 1000
      );
      if (recentDenials.length >= 3) {
        this.securityAlerts.push({
          alertId: `alert-${randomUUID()}`,
          tenantId: input.tenantId,
          alertType: 'REPEATED_AUTHZ_FAILURE',
          severity: 'HIGH',
          details: { actorUserId: input.actorUserId, denialCount: recentDenials.length },
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // 5. Unauthorized Document Access
    if (input.action.includes('DOCUMENT') && input.result === 'DENIED') {
      this.securityAlerts.push({
        alertId: `alert-${randomUUID()}`,
        tenantId: input.tenantId,
        alertType: 'UNAUTHORIZED_DOCUMENT_ACCESS',
        severity: 'HIGH',
        details: { actorUserId: input.actorUserId, entityId: input.entityId, action: input.action },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 6. Privilege Escalation Attempt
    if (
      (input.action.includes('ROLE') || input.action.includes('PERMISSION') || input.action === 'SYSTEM_ADMIN_MANAGE') &&
      input.result === 'DENIED'
    ) {
      this.securityAlerts.push({
        alertId: `alert-${randomUUID()}`,
        tenantId: input.tenantId,
        alertType: 'PRIVILEGE_ESCALATION_ATTEMPT',
        severity: 'CRITICAL',
        details: { actorUserId: input.actorUserId, action: input.action, reason: input.reason },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 7. Suspicious Gate Override
    if (input.action.includes('OVERRIDE')) {
      this.securityAlerts.push({
        alertId: `alert-${randomUUID()}`,
        tenantId: input.tenantId,
        alertType: 'SUSPICIOUS_GATE_OVERRIDE',
        severity: 'MEDIUM',
        details: { actorUserId: input.actorUserId, entityId: input.entityId, reason: input.reason },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 8. Biometric Verification Failure Burst
    if (input.action === 'FACE_VERIFICATION_FAILED') {
      const recentBioFails = this.records.filter(
        r => r.action === 'FACE_VERIFICATION_FAILED' &&
             r.entityId === input.entityId &&
             now - r.timestamp.getTime() < 5 * 60 * 1000
      );
      if (recentBioFails.length >= 3) {
        this.securityAlerts.push({
          alertId: `alert-${randomUUID()}`,
          tenantId: input.tenantId,
          alertType: 'BIOMETRIC_VERIFICATION_FAILURE_BURST',
          severity: 'HIGH',
          details: { entityId: input.entityId, failureCount: recentBioFails.length },
          timestamp: new Date(),
          resolved: false,
        });
      }
    }
  }
}
