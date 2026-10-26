import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { nextRequestStatus, REQUEST_STAGE, SERVICE_PRIORITIES, SERVICE_TYPES, REQUEST_STATUSES, type RequestAction } from '@vms/service';
import type { RouteContext } from '../../app.js';
import { authorize, type AuthenticatedUser } from '../../context.js';
import { isUuid, type Tx } from '../../db.js';
import { HttpError, notFound } from '../../errors.js';
import { idempotent, sendResult } from '../../idempotency.js';
import { audit, can, CategoryCode, DateOnly, likePattern, Paging, recordStatus, referenceNumber, requireSite, siteScope, Uuid } from './common.js';

const RequestCreate = z
  .object({
    siteId: Uuid,
    departmentId: Uuid.optional(),
    serviceType: z.enum(SERVICE_TYPES),
    serviceCategory: CategoryCode,
    title: z.string().trim().min(3).max(255),
    description: z.string().trim().min(3).max(4000),
    priority: z.enum(SERVICE_PRIORITIES).default('STANDARD'),
    requestedDate: DateOnly.optional(),
    preferredStart: z.coerce.date().optional(),
    preferredEnd: z.coerce.date().optional(),
    workLocation: z.string().trim().max(255).optional(),
    zoneId: Uuid.optional(),
    equipmentTag: z.string().trim().max(64).optional(),
    suggestedProviderId: Uuid.optional(),
    deliverables: z.string().trim().max(4000).optional(),
    prerequisites: z.string().trim().max(4000).optional(),
    safetyPermitRequired: z.boolean().default(false),
  })
  .refine(v => !v.preferredStart || !v.preferredEnd || v.preferredEnd > v.preferredStart, {
    message: 'preferredEnd must be after preferredStart',
    path: ['preferredEnd'],
  });

const Decision = z.object({ remarks: z.string().trim().max(2000).optional() });

interface RequestRow {
  request_id: string;
  reference_number: string;
  site_id: string;
  status: string;
  requested_by_user_id: string | null;
}

/** Requests are visible to the requester, and to service staff assigned to the site. */
async function loadRequest(tx: Tx, user: AuthenticatedUser, id: string, lock = false): Promise<RequestRow> {
  if (!isUuid(id)) throw notFound('Service request');
  const { rows } = await tx.query<RequestRow>(
    `SELECT request_id, reference_number, site_id, status, requested_by_user_id FROM service_requests WHERE request_id = $1 ${lock ? 'FOR UPDATE' : ''}`,
    [id]
  );
  const r = rows[0];
  const scope = siteScope(user);
  const visible = r && (r.requested_by_user_id === user.userId || (can(user, 'SERVICE_READ') && (scope === null || scope.includes(r.site_id))));
  if (!visible) throw notFound('Service request');
  return r;
}

export async function transitionRequest(tx: Tx, user: AuthenticatedUser, r: RequestRow, action: RequestAction, reason?: string | null): Promise<string> {
  const to = nextRequestStatus(r.status, action);
  await tx.query(
    `UPDATE service_requests SET status = $2, stage = $3, version = version + 1, updated_by = $4, updated_at = now() WHERE request_id = $1`,
    [r.request_id, to, REQUEST_STAGE[to], user.userId]
  );
  await recordStatus(tx, user, 'SERVICE_REQUEST', r.request_id, r.status, to, reason);
  r.status = to;
  return to;
}

export async function registerRequestRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  app.get('/api/v1/service/requests', async request =>
    ctx.asUser(request, async (tx, user) => {
      const canReadAll = can(user, 'SERVICE_READ');
      if (!canReadAll && !can(user, 'SERVICE_REQUEST_CREATE')) authorize(user, 'SERVICE_READ');
      const q = Paging.extend({
        status: z.enum(REQUEST_STATUSES).optional(),
        priority: z.enum(SERVICE_PRIORITIES).optional(),
        siteId: Uuid.optional(),
        search: z.string().trim().max(100).optional(),
        mine: z.enum(['true', 'false']).optional(),
      }).parse(request.query);
      if (q.siteId && canReadAll) requireSite(user, q.siteId);
      const onlyMine = !canReadAll || q.mine === 'true';
      const { rows } = await tx.query(
        `SELECT r.request_id AS "id", r.reference_number AS "referenceNumber", r.title, r.service_type AS "serviceType",
                r.service_category AS "serviceCategory", r.priority, r.status, r.stage, r.created_at AS "createdAt",
                r.preferred_start AS "preferredStart", s.name AS "siteName", r.site_id AS "siteId", u.full_name AS "requestedBy",
                (SELECT count(*) FROM service_work_orders w WHERE w.request_id = r.request_id)::int AS "workOrders",
                count(*) OVER()::int AS "total"
           FROM service_requests r JOIN sites s ON s.site_id = r.site_id LEFT JOIN users u ON u.user_id = r.requested_by_user_id
          WHERE ($1::text IS NULL OR r.status = $1)
            AND ($2::text IS NULL OR r.priority = $2)
            AND ($3::uuid IS NULL OR r.site_id = $3)
            AND (CASE WHEN $4::boolean THEN r.requested_by_user_id = $5 ELSE ($6::uuid[] IS NULL OR r.site_id = ANY($6)) END)
            AND ($7::text IS NULL OR r.title ILIKE '%' || $7 || '%' OR r.reference_number ILIKE '%' || $7 || '%')
          ORDER BY r.created_at DESC LIMIT $8 OFFSET $9`,
        [q.status ?? null, q.priority ?? null, q.siteId ?? null, onlyMine, user.userId, siteScope(user), likePattern(q.search), q.limit, q.offset]
      );
      return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0, limit: q.limit, offset: q.offset };
    })
  );

  app.get('/api/v1/service/requests/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      const r = await loadRequest(tx, user, (request.params as { id: string }).id);
      const { rows } = await tx.query(
        `SELECT r.request_id AS "id", r.reference_number AS "referenceNumber", r.title, r.description, r.service_type AS "serviceType",
                r.service_category AS "serviceCategory", r.priority, r.status, r.stage, r.requested_date AS "requestedDate",
                r.preferred_start AS "preferredStart", r.preferred_end AS "preferredEnd", r.work_location AS "workLocation",
                r.equipment_tag AS "equipmentTag", r.deliverables, r.prerequisites, r.safety_permit_required AS "safetyPermitRequired",
                r.site_id AS "siteId", s.name AS "siteName", d.name AS "departmentName", z.name AS "zoneName",
                r.requested_by_user_id AS "requestedById", u.full_name AS "requestedBy", r.created_at AS "createdAt",
                r.service_provider_id AS "suggestedProviderId", coalesce(o.trade_name, o.legal_name) AS "suggestedProviderName",
                r.decided_at AS "decidedAt", du.full_name AS "decidedBy", r.decision_remarks AS "decisionRemarks"
           FROM service_requests r JOIN sites s ON s.site_id = r.site_id
           LEFT JOIN departments d ON d.department_id = r.department_id
           LEFT JOIN zones z ON z.zone_id = r.zone_id
           LEFT JOIN users u ON u.user_id = r.requested_by_user_id
           LEFT JOIN users du ON du.user_id = r.decided_by_user_id
           LEFT JOIN service_providers sp ON sp.service_provider_id = r.service_provider_id
           LEFT JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE r.request_id = $1`,
        [r.request_id]
      );
      const workOrders = can(user, 'SERVICE_READ')
        ? (
            await tx.query(
              `SELECT work_order_id AS "id", reference_number AS "referenceNumber", coalesce(title, equipment_tag) AS "title",
                      status, scheduled_start AS "scheduledStart" FROM service_work_orders WHERE request_id = $1 ORDER BY scheduled_start`,
              [r.request_id]
            )
          ).rows
        : [];
      const history = await tx.query(
        `SELECT h.from_status AS "from", h.to_status AS "to", h.changed_at AS "at", u.full_name AS "actor", h.reason
           FROM service_status_history h LEFT JOIN users u ON u.user_id = h.actor_user_id
          WHERE h.entity_type = 'SERVICE_REQUEST' AND h.entity_id = $1 ORDER BY h.changed_at`,
        [r.request_id]
      );
      return { ...rows[0], workOrders, history: history.rows };
    })
  );

  app.post('/api/v1/service/requests', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        authorize(user, 'SERVICE_REQUEST_CREATE');
        const body = RequestCreate.parse(request.body);
        // Requesters raise work for sites they belong to (tenant-wide roles excepted).
        requireSite(user, body.siteId);
        const site = await tx.query('SELECT 1 FROM sites WHERE site_id = $1', [body.siteId]);
        if (!site.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Site not found.');
        if (body.zoneId) {
          const zone = await tx.query('SELECT 1 FROM zones WHERE zone_id = $1 AND site_id = $2', [body.zoneId, body.siteId]);
          if (!zone.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Zone does not belong to the site.');
        }
        if (body.departmentId) {
          const dept = await tx.query('SELECT 1 FROM departments WHERE department_id = $1', [body.departmentId]);
          if (!dept.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Department not found.');
        }
        if (body.suggestedProviderId) {
          const p = await tx.query('SELECT 1 FROM service_providers WHERE service_provider_id = $1', [body.suggestedProviderId]);
          if (!p.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Suggested provider not found.');
        }
        const ref = referenceNumber('SRQ');
        const { rows } = await tx.query<{ request_id: string }>(
          `INSERT INTO service_requests
             (reference_number, tenant_id, site_id, service_provider_id, title, description, equipment_tag, priority, status, stage,
              requested_by_user_id, department_id, service_type, service_category, requested_date, preferred_start, preferred_end,
              work_location, zone_id, deliverables, prerequisites, safety_permit_required, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED', 'APPROVAL', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21)
           RETURNING request_id`,
          [
            ref,
            user.tenantId,
            body.siteId,
            body.suggestedProviderId ?? null,
            body.title,
            body.description,
            body.equipmentTag ?? null,
            body.priority,
            user.userId,
            body.departmentId ?? null,
            body.serviceType,
            body.serviceCategory,
            body.requestedDate ?? null,
            body.preferredStart ?? null,
            body.preferredEnd ?? null,
            body.workLocation ?? null,
            body.zoneId ?? null,
            body.deliverables ?? null,
            body.prerequisites ?? null,
            body.safetyPermitRequired,
            user.userId,
          ]
        );
        const id = rows[0].request_id;
        await recordStatus(tx, user, 'SERVICE_REQUEST', id, null, 'SUBMITTED');
        await audit(tx, user, request.id, 'SERVICE_REQUEST_SUBMITTED', 'SERVICE_REQUEST', id, {
          after: { referenceNumber: ref, siteId: body.siteId, serviceType: body.serviceType, priority: body.priority },
        });
        return { status: 201, body: { id, referenceNumber: ref, status: 'SUBMITTED' } };
      })
    );
    return sendResult(reply, result);
  });

  const decide = (action: 'APPROVE' | 'REJECT') => async (request: Parameters<RouteContext['asUser']>[0]) =>
    ctx.asUser(request, async (tx, user) => {
      const r = await loadRequest(tx, user, (request.params as { id: string }).id, true);
      // Segregation of duties: the requester cannot decide on their own request.
      authorize(user, 'SERVICE_APPROVE', { siteId: r.site_id, ownerId: r.requested_by_user_id ?? undefined, currentState: r.status });
      const { remarks } = Decision.parse(request.body ?? {});
      if (action === 'REJECT' && !remarks) throw new HttpError(400, 'VALIDATION_ERROR', 'A reason is required to reject a request.');
      const before = r.status;
      const to = await transitionRequest(tx, user, r, action, remarks);
      await tx.query('UPDATE service_requests SET decided_by_user_id = $2, decided_at = now(), decision_remarks = $3 WHERE request_id = $1', [
        r.request_id,
        user.userId,
        remarks ?? null,
      ]);
      await audit(tx, user, request.id, action === 'APPROVE' ? 'SERVICE_REQUEST_APPROVED' : 'SERVICE_REQUEST_REJECTED', 'SERVICE_REQUEST', r.request_id, {
        before: { status: before },
        after: { status: to },
        reason: remarks,
      });
      return { id: r.request_id, status: to };
    });

  app.post('/api/v1/service/requests/:id/approve', decide('APPROVE'));
  app.post('/api/v1/service/requests/:id/reject', decide('REJECT'));

  app.post('/api/v1/service/requests/:id/cancel', async request =>
    ctx.asUser(request, async (tx, user) => {
      const r = await loadRequest(tx, user, (request.params as { id: string }).id, true);
      if (r.requested_by_user_id !== user.userId) authorize(user, 'SERVICE_MANAGE', { siteId: r.site_id });
      const { remarks } = Decision.parse(request.body ?? {});
      if (!remarks) throw new HttpError(400, 'VALIDATION_ERROR', 'A reason is required to cancel a request.');
      const before = r.status;
      const to = await transitionRequest(tx, user, r, 'CANCEL', remarks);
      await audit(tx, user, request.id, 'SERVICE_REQUEST_CANCELLED', 'SERVICE_REQUEST', r.request_id, { before: { status: before }, after: { status: to }, reason: remarks });
      return { id: r.request_id, status: to };
    })
  );

  app.post('/api/v1/service/requests/:id/fulfil', async request =>
    ctx.asUser(request, async (tx, user) => {
      const r = await loadRequest(tx, user, (request.params as { id: string }).id, true);
      authorize(user, 'SERVICE_MANAGE', { siteId: r.site_id });
      const open = await tx.query(
        `SELECT count(*)::int AS n FROM service_work_orders WHERE request_id = $1 AND status NOT IN ('CLOSED', 'CANCELLED', 'REJECTED')`,
        [r.request_id]
      );
      if (open.rows[0].n > 0) throw new HttpError(409, 'WORK_ORDERS_OPEN', 'All work orders must be closed or cancelled before the request is fulfilled.');
      const before = r.status;
      const to = await transitionRequest(tx, user, r, 'FULFIL');
      await audit(tx, user, request.id, 'SERVICE_REQUEST_FULFILLED', 'SERVICE_REQUEST', r.request_id, { before: { status: before }, after: { status: to } });
      return { id: r.request_id, status: to };
    })
  );
}
