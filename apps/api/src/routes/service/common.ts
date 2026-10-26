import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { evaluateAccess, type PermissionAction } from '@vms/permissions';
import type { Tx } from '../../db.js';
import { isUuid } from '../../db.js';
import { canAccessSite, type AuthenticatedUser } from '../../context.js';
import { HttpError, notFound } from '../../errors.js';
import { writeAudit } from '../../audit.js';

export const Uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'must be a UUID');
export const Paging = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});
export const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
export const CategoryCode = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .transform(v => v.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''));

export function referenceNumber(prefix: string): string {
  return `${prefix}-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/** Escapes LIKE wildcards in user search text. */
export function likePattern(search: string | undefined): string | null {
  return search ? search.replace(/[%_\\]/g, m => `\\${m}`) : null;
}

export function isTenantWideRole(user: AuthenticatedUser): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN';
}

/** null = every site in the tenant; otherwise the user's assigned sites. */
export function siteScope(user: AuthenticatedUser): string[] | null {
  return isTenantWideRole(user) ? null : user.assignedSiteIds || [];
}

export function requireSite(user: AuthenticatedUser, siteId: string): void {
  if (!canAccessSite(user, siteId)) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this site.');
  }
}

/** Role capability check (tenant-level, no site/resource context) through the shared policy engine. */
export function can(user: AuthenticatedUser, permission: PermissionAction): boolean {
  return evaluateAccess(user, permission, { tenantId: user.tenantId }).allowed;
}

export async function recordStatus(
  tx: Tx,
  user: AuthenticatedUser,
  entityType: 'SERVICE_REQUEST' | 'SERVICE_WORK_ORDER' | 'SERVICE_SCHEDULE' | 'SERVICE_OCCURRENCE',
  entityId: string,
  from: string | null,
  to: string,
  reason?: string | null
): Promise<void> {
  await tx.query(
    `INSERT INTO service_status_history (tenant_id, entity_type, entity_id, from_status, to_status, actor_user_id, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [user.tenantId, entityType, entityId, from, to, user.userId, reason ?? null]
  );
}

export async function audit(
  tx: Tx,
  user: AuthenticatedUser,
  requestId: string,
  action: string,
  entityType: string,
  entityId: string,
  extra: { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; reason?: string | null } = {}
): Promise<void> {
  await writeAudit(tx, {
    tenantId: user.tenantId,
    actorId: user.userId,
    actorRole: user.role,
    action,
    entityType,
    entityId,
    requestId,
    before: extra.before ?? null,
    after: extra.after ?? null,
    reason: extra.reason ?? undefined,
  });
}

export interface WorkOrderRow {
  work_order_id: string;
  reference_number: string;
  tenant_id: string;
  site_id: string;
  request_id: string | null;
  service_provider_id: string;
  occurrence_id: string | null;
  title: string | null;
  status: string;
  stage: string;
  scheduled_start: Date;
  scheduled_end: Date;
  safety_permit_required: boolean;
  prerequisites: string | null;
  created_by: string | null;
  maintenance_lead_id: string;
  service_category: string | null;
  version: number;
}

/** Loads a work order the user may act on; FOR UPDATE serializes concurrent transitions. */
export async function lockWorkOrder(tx: Tx, user: AuthenticatedUser, id: string): Promise<WorkOrderRow> {
  if (!isUuid(id)) throw notFound('Work order');
  const { rows } = await tx.query<WorkOrderRow>('SELECT * FROM service_work_orders WHERE work_order_id = $1 FOR UPDATE', [id]);
  const wo = rows[0];
  if (!wo || !canAccessSite(user, wo.site_id)) throw notFound('Work order');
  return wo;
}

export async function setWorkOrderStatus(tx: Tx, user: AuthenticatedUser, wo: WorkOrderRow, to: string, stage: string, reason?: string | null) {
  if (to === wo.status) return;
  await tx.query(
    `UPDATE service_work_orders
        SET status = $2, stage = $3, version = version + 1, updated_by = $4, updated_at = now(),
            closed_at = CASE WHEN $2::varchar IN ('CLOSED', 'CANCELLED', 'REJECTED') THEN now() ELSE closed_at END
      WHERE work_order_id = $1`,
    [wo.work_order_id, to, stage, user.userId]
  );
  await recordStatus(tx, user, 'SERVICE_WORK_ORDER', wo.work_order_id, wo.status, to, reason);
  wo.status = to;
  wo.stage = stage;
}

export async function addProgressEvent(
  tx: Tx,
  user: AuthenticatedUser,
  wo: { work_order_id: string },
  input: {
    eventType: string;
    occurredAt?: Date;
    technicianId?: string | null;
    statusBefore?: string | null;
    statusAfter?: string | null;
    outcome?: string | null;
    comment?: string | null;
    evidenceDocumentId?: string | null;
    correctsEventId?: string | null;
  }
): Promise<string> {
  const { rows } = await tx.query<{ event_id: string }>(
    `INSERT INTO service_progress_events
       (tenant_id, work_order_id, technician_id, event_type, occurred_at, actor_user_id, status_before, status_after,
        outcome, comment, evidence_document_id, corrects_event_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING event_id`,
    [
      user.tenantId,
      wo.work_order_id,
      input.technicianId ?? null,
      input.eventType,
      input.occurredAt ?? new Date(),
      user.userId,
      input.statusBefore ?? null,
      input.statusAfter ?? null,
      input.outcome ?? null,
      input.comment ?? null,
      input.evidenceDocumentId ?? null,
      input.correctsEventId ?? null,
    ]
  );
  return rows[0].event_id;
}

/** Queues a notification intent; delivery is performed by the notification integration (Part 18). */
export async function enqueueNotification(tx: Tx, tenantId: string, eventType: string, payload: Record<string, unknown>): Promise<void> {
  await tx.query('INSERT INTO workflow_outbox_events (tenant_id, event_type, payload) VALUES ($1, $2, $3)', [
    tenantId,
    eventType,
    JSON.stringify(payload),
  ]);
}

/** Validates an optional evidence document reference within the tenant (RLS hides other tenants). */
export async function assertDocument(tx: Tx, documentId: string | null | undefined): Promise<void> {
  if (!documentId) return;
  const { rowCount } = await tx.query('SELECT 1 FROM documents WHERE id = $1', [documentId]);
  if (!rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Evidence document not found.');
}
