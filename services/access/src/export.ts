import { randomUUID } from 'node:crypto';
import type { UserContext } from '@vms/types';
import { evaluateAccess, maskRecord } from '@vms/permissions';
import { SecurityError } from './errors.js';

export interface ExportRequest {
  datasetName: string;
  filters: Record<string, unknown>;
  purpose?: string;
  records: Array<Record<string, unknown>>;
}

export interface ExportResult {
  exportId: string;
  datasetName: string;
  recordCount: number;
  exportedAt: Date;
  data: Array<Record<string, unknown>>;
  auditEvent: {
    exportId: string;
    actorUserId: string;
    datasetName: string;
    recordCount: number;
    filters: Record<string, unknown>;
    timestamp: Date;
  };
}

export class ExportSecurityService {
  constructor(
    private auditLogger?: (event: {
      action: string;
      tenantId: string;
      actorUserId: string;
      datasetName: string;
      recordCount: number;
      filters: Record<string, unknown>;
    }) => void
  ) {}

  /**
   * Securely processes and sanitizes dataset exports with mandatory authorization,
   * tenant-scoping verification, data minimization, and audit trail generation.
   */
  public executeExport(user: UserContext, request: ExportRequest): ExportResult {
    // 1. Authorization: check export capability
    const exportPermission = `${request.datasetName.toLowerCase()}.export`;
    const decision = evaluateAccess(user, exportPermission, { tenantId: user.tenantId });
    if (!decision.allowed) {
      throw new SecurityError(
        'AUTHORIZATION_DENIED',
        `User lacks export authorization for dataset '${request.datasetName}'.`
      );
    }

    // 2. Validate tenant scoping on every single exported record (supports both camelCase and snake_case)
    const sanitizedRecords: Array<Record<string, unknown>> = [];
    for (const record of request.records) {
      const recordTenant = (record['tenantId'] || record['tenant_id']) as string | undefined;
      if (recordTenant && recordTenant !== user.tenantId && user.role !== 'SUPER_ADMIN') {
        throw new SecurityError(
          'AUTHORIZATION_DENIED',
          'Cross-tenant data export prohibited: attempted to include records from an unauthorized tenant boundary.'
        );
      }

      // 3. Apply privacy-by-design field redaction
      const sanitized = maskRecord(record, decision);
      sanitizedRecords.push(sanitized);
    }

    if (this.auditLogger) {
      this.auditLogger({
        action: 'DATASET_EXPORTED',
        tenantId: user.tenantId,
        actorUserId: user.userId,
        datasetName: request.datasetName,
        recordCount: sanitizedRecords.length,
        filters: request.filters,
      });
    }

    const exportId = `exp-${randomUUID()}`;
    const exportedAt = new Date();

    return {
      exportId,
      datasetName: request.datasetName,
      recordCount: sanitizedRecords.length,
      exportedAt,
      data: sanitizedRecords,
      auditEvent: {
        exportId,
        actorUserId: user.userId,
        datasetName: request.datasetName,
        recordCount: sanitizedRecords.length,
        filters: request.filters,
        timestamp: exportedAt,
      },
    };
  }
}
