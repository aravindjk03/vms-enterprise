import type { Tx } from './db.js';

export interface AuditEntry {
  tenantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
}

/** Appends to the immutable audit ledger inside the caller's transaction (commits or rolls back with it). */
export async function writeAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  await tx.query(
    `INSERT INTO audit_logs
       (tenant_id, actor_id, actor_role, action, entity_type, entity_id, request_id, correlation_id, source, before_snapshot, after_snapshot, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'API', $8, $9, $10)`,
    [
      entry.tenantId,
      entry.actorId,
      entry.actorRole,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.requestId,
      entry.before ? JSON.stringify(entry.before) : null,
      entry.after ? JSON.stringify(entry.after) : null,
      entry.reason ?? null,
    ]
  );
}
