import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RouteContext } from '../app.js';
import { writeAudit } from '../audit.js';
import { authorize, canAccessSite, permissionOnlyFrom, type AuthenticatedUser } from '../context.js';
import { isUuid, type Tx } from '../db.js';
import { HttpError, notFound } from '../errors.js';

const Uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'must be a UUID');
const Paging = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

const VISITOR_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ON_PREMISES', 'COMPLETED', 'CANCELLED'] as const;

const CreateVisitorSchema = z
  .object({
    siteId: Uuid,
    hostUserId: Uuid,
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    companyName: z.string().trim().max(255).optional(),
    visitorTypeId: Uuid.optional(),
    purposeId: Uuid.optional(),
    scheduledStart: z.coerce.date(),
    scheduledEnd: z.coerce.date(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(v => v.scheduledEnd > v.scheduledStart, { message: 'scheduledEnd must be after scheduledStart', path: ['scheduledEnd'] });

const DecisionSchema = z.object({ remarks: z.string().trim().max(1000).optional() });
const GateActionSchema = z.object({ gateId: Uuid });

function referenceNumber(prefix: string): string {
  return `${prefix}-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function requireSite(user: AuthenticatedUser, siteId: string): void {
  if (!canAccessSite(user, siteId)) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this site.');
  }
}

/** Site filter applied to list queries: admins see every site in the tenant, others their assigned sites. */
function siteScope(user: AuthenticatedUser): string[] | null {
  return user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN' ? null : user.assignedSiteIds || [];
}

interface VisitorRow {
  transaction_id: string;
  reference_number: string;
  site_id: string;
  host_user_id: string;
  status: string;
  stage: string;
  created_by: string;
}

async function lockVisitor(tx: Tx, user: AuthenticatedUser, id: string): Promise<VisitorRow> {
  if (!isUuid(id)) throw notFound('Visitor');
  const { rows } = await tx.query<VisitorRow>(
    'SELECT transaction_id, reference_number, site_id, host_user_id, status, stage, created_by FROM visitor_transactions WHERE transaction_id = $1 FOR UPDATE',
    [id]
  );
  const visit = rows[0];
  // Visible to staff assigned to the site, and to the employee hosting the visit.
  if (!visit || !(canAccessSite(user, visit.site_id) || visit.host_user_id === user.userId)) throw notFound('Visitor');
  return visit;
}

/**
 * Paged list response. The window count comes with the rows; a page past the end has no rows, so the
 * total is then counted separately (the client needs it to step back).
 */
async function withTotal(
  rows: Array<Record<string, unknown>>,
  q: { limit: number; offset: number },
  countAll: () => Promise<{ rows: Array<{ n: number }> }>
) {
  const total = rows.length ? Number(rows[0]['total']) : q.offset > 0 ? (await countAll()).rows[0].n : 0;
  return { items: rows.map(({ total: _t, ...r }) => r), total, limit: q.limit, offset: q.offset };
}

export async function registerDomainRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  // ---------------------------------------------------------------------------
  // Reference data
  // ---------------------------------------------------------------------------
  app.get('/api/v1/sites', async request =>
    ctx.asUser(request, async (tx, user) => {
      const scope = siteScope(user);
      const { rows } = await tx.query(
        `SELECT site_id AS "siteId", code, name, timezone, status FROM sites
          WHERE ($1::uuid[] IS NULL OR site_id = ANY($1)) ORDER BY name`,
        [scope]
      );
      return { items: rows };
    })
  );

  app.get('/api/v1/gates', async request =>
    ctx.asUser(request, async (tx, user) => {
      const { siteId } = z.object({ siteId: Uuid.optional() }).parse(request.query);
      if (siteId) requireSite(user, siteId);
      const { rows } = await tx.query(
        `SELECT gate_id AS "gateId", site_id AS "siteId", code, name, gate_type AS "gateType", is_active AS "isActive"
           FROM gates WHERE ($1::uuid IS NULL OR site_id = $1) AND ($2::uuid[] IS NULL OR site_id = ANY($2)) ORDER BY code`,
        [siteId ?? null, siteScope(user)]
      );
      return { items: rows };
    })
  );

  app.get('/api/v1/hosts', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'VISITOR_WRITE');
      const { rows } = await tx.query(
        `SELECT user_id AS "userId", full_name AS "fullName" FROM users WHERE is_active AND status = 'ACTIVE' ORDER BY full_name LIMIT 500`
      );
      return { items: rows };
    })
  );

  app.get('/api/v1/reference/visitor-types', async request =>
    ctx.asUser(request, async tx => {
      const types = await tx.query(`SELECT type_id AS "id", code, name FROM visitor_types WHERE is_active ORDER BY name`);
      const purposes = await tx.query(`SELECT purpose_id AS "id", code, name FROM visitor_purposes WHERE is_active ORDER BY name`);
      return { visitorTypes: types.rows, purposes: purposes.rows };
    })
  );

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------
  app.get('/api/v1/dashboard/summary', async request =>
    ctx.asUser(request, async (tx, user) => {
      const scope = siteScope(user);
      const { rows } = await tx.query(
        `SELECT
           (SELECT count(*) FROM visitor_transactions WHERE status = 'ON_PREMISES' AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "visitorsOnSite",
           (SELECT count(*) FROM visitor_transactions WHERE scheduled_start::date = current_date AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "visitorsToday",
           (SELECT count(*) FROM visitor_transactions WHERE status = 'PENDING' AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "visitorApprovalsPending",
           (SELECT count(*) FROM contractor_companies WHERE status = 'ACTIVE')::int AS "contractorCompanies",
           (SELECT count(*) FROM contractor_work_orders WHERE status NOT IN ('CLOSED','CANCELLED','COMPLETED') AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "openWorkOrders",
           (SELECT count(*) FROM customer_accounts WHERE status = 'ACTIVE')::int AS "customerAccounts",
           (SELECT count(*) FROM customer_visit_transactions WHERE scheduled_start >= now() AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "upcomingCustomerVisits",
           (SELECT count(*) FROM material_transactions WHERE created_at::date = current_date AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "materialMovementsToday",
           (SELECT count(*) FROM vehicles WHERE status = 'ACTIVE')::int AS "registeredVehicles",
           (SELECT count(*) FROM gate_events WHERE event_timestamp::date = current_date AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "gateEventsToday"`,
        [scope]
      );
      return rows[0];
    })
  );

  // ---------------------------------------------------------------------------
  // Visitor lifecycle: PENDING -> APPROVED -> ON_PREMISES -> COMPLETED (or REJECTED / CANCELLED)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/visitors', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'VISITOR_READ');
      const q = Paging.extend({
        status: z.enum(VISITOR_STATUSES).optional(),
        siteId: Uuid.optional(),
        search: z.string().trim().max(100).optional(),
      }).parse(request.query);
      if (q.siteId) requireSite(user, q.siteId);
      const { rows } = await tx.query(
        `SELECT v.transaction_id AS "id", v.reference_number AS "referenceNumber", v.status, v.stage,
                v.scheduled_start AS "scheduledStart", v.scheduled_end AS "scheduledEnd",
                v.actual_entry AS "actualEntry", v.actual_exit AS "actualExit",
                p.display_name AS "visitorName", v.metadata->>'companyName' AS "companyName",
                v.site_id AS "siteId", s.name AS "siteName", h.full_name AS "hostName", v.created_at AS "createdAt",
                count(*) OVER()::int AS "total"
           FROM visitor_transactions v
           JOIN persons p ON p.person_id = v.person_id
           JOIN sites s ON s.site_id = v.site_id
           LEFT JOIN users h ON h.user_id = v.host_user_id
          WHERE ($1::text IS NULL OR v.status = $1)
            AND ($2::uuid IS NULL OR v.site_id = $2)
            AND ($3::uuid[] IS NULL OR v.site_id = ANY($3) OR v.host_user_id = $7)
            AND ($4::text IS NULL OR p.display_name ILIKE '%' || $4 || '%' OR v.reference_number ILIKE '%' || $4 || '%')
          ORDER BY v.scheduled_start DESC
          LIMIT $5 OFFSET $6`,
        [q.status ?? null, q.siteId ?? null, siteScope(user), q.search?.replace(/[%_\\]/g, m => `\\${m}`) ?? null, q.limit, q.offset, user.userId]
      );
      const total = rows[0]?.total ?? 0;
      return { items: rows.map(({ total: _t, ...r }) => r), total, limit: q.limit, offset: q.offset };
    })
  );

  app.post('/api/v1/visitors', async (request, reply) =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'VISITOR_WRITE');
      const body = CreateVisitorSchema.parse(request.body);
      requireSite(user, body.siteId);

      const host = await tx.query('SELECT 1 FROM users WHERE user_id = $1 AND is_active', [body.hostUserId]);
      if (host.rowCount === 0) throw new HttpError(400, 'VALIDATION_ERROR', 'Host user not found.');
      const site = await tx.query('SELECT 1 FROM sites WHERE site_id = $1', [body.siteId]);
      if (site.rowCount === 0) throw new HttpError(400, 'VALIDATION_ERROR', 'Site not found.');

      const person = await tx.query<{ person_id: string }>(
        `INSERT INTO persons (tenant_id, first_name, last_name, display_name, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING person_id`,
        [user.tenantId, body.firstName, body.lastName, `${body.firstName} ${body.lastName}`, user.userId]
      );
      const ref = referenceNumber('VIS');
      const { rows } = await tx.query<{ transaction_id: string }>(
        `INSERT INTO visitor_transactions
           (reference_number, tenant_id, site_id, person_id, visitor_type_id, purpose_id, host_user_id, booking_mode,
            scheduled_start, scheduled_end, stage, status, metadata, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PRE_REGISTERED', $8, $9, 'APPROVAL', 'PENDING', $10, $11, $11)
         RETURNING transaction_id`,
        [
          ref,
          user.tenantId,
          body.siteId,
          person.rows[0].person_id,
          body.visitorTypeId ?? null,
          body.purposeId ?? null,
          body.hostUserId,
          body.scheduledStart,
          body.scheduledEnd,
          JSON.stringify({ companyName: body.companyName ?? null, notes: body.notes ?? null }),
          user.userId,
        ]
      );
      const id = rows[0].transaction_id;
      await writeAudit(tx, {
        tenantId: user.tenantId,
        actorId: user.userId,
        actorRole: user.role,
        action: 'VISITOR_REGISTERED',
        entityType: 'VISITOR_TRANSACTION',
        entityId: id,
        requestId: request.id,
        after: { referenceNumber: ref, siteId: body.siteId, status: 'PENDING' },
      });
      return reply.code(201).send({ id, referenceNumber: ref, status: 'PENDING' });
    })
  );

  async function transition(
    request: Parameters<RouteContext['asUser']>[0],
    id: string,
    opts: {
      permission: Parameters<typeof authorize>[1];
      from: string[];
      to: string;
      stage: string;
      action: string;
      verb: string;
      gate?: 'ENTRY' | 'EXIT';
      segregateFromCreator?: boolean;
    }
  ) {
    return ctx.asUser(request, async (tx, user) => {
      const visit = await lockVisitor(tx, user, id);
      authorize(user, opts.permission, {
        siteId: visit.site_id,
        ownerId: opts.segregateFromCreator ? visit.created_by : undefined,
        currentState: visit.status,
      });
      // A user whose decision right comes only from the HOST role may decide on visits they host,
      // nothing else, even when another role (e.g. receptionist) is their primary role.
      if (opts.segregateFromCreator && permissionOnlyFrom(user, opts.permission, 'HOST') && visit.host_user_id !== user.userId) {
        throw new HttpError(403, 'FORBIDDEN', 'Only the visit host or site management can decide on this visit.');
      }
      if (!opts.from.includes(visit.status)) {
        throw new HttpError(409, 'INVALID_STATE', `Visit is ${visit.status}; it cannot be ${opts.verb}.`);
      }

      let gateId: string | undefined;
      if (opts.gate) {
        gateId = GateActionSchema.parse(request.body).gateId;
        const gate = await tx.query('SELECT 1 FROM gates WHERE gate_id = $1 AND site_id = $2 AND is_active', [gateId, visit.site_id]);
        if (gate.rowCount === 0) throw new HttpError(400, 'VALIDATION_ERROR', 'Gate does not belong to the visit site.');
      }
      const remarks = opts.gate ? undefined : DecisionSchema.parse(request.body ?? {}).remarks;

      await tx.query(
        `UPDATE visitor_transactions
            SET status = $2, stage = $3, updated_by = $4, updated_at = now(), version = version + 1,
                actual_arrival = CASE WHEN $5 = 'ENTRY' THEN coalesce(actual_arrival, now()) ELSE actual_arrival END,
                actual_entry   = CASE WHEN $5 = 'ENTRY' THEN now() ELSE actual_entry END,
                actual_exit    = CASE WHEN $5 = 'EXIT'  THEN now() ELSE actual_exit END
          WHERE transaction_id = $1`,
        [id, opts.to, opts.stage, user.userId, opts.gate ?? null]
      );
      if (opts.gate && gateId) {
        await tx.query(
          `INSERT INTO gate_events (tenant_id, site_id, gate_id, source_domain, source_transaction_id, event_type, result, actor_id)
           VALUES ($1, $2, $3, 'VISITOR', $4, $5, 'GRANTED', $6)`,
          [user.tenantId, visit.site_id, gateId, id, opts.gate, user.userId]
        );
      }
      await writeAudit(tx, {
        tenantId: user.tenantId,
        actorId: user.userId,
        actorRole: user.role,
        action: opts.action,
        entityType: 'VISITOR_TRANSACTION',
        entityId: id,
        requestId: request.id,
        before: { status: visit.status },
        after: { status: opts.to, gateId: gateId ?? null },
        reason: remarks,
      });
      return { id, referenceNumber: visit.reference_number, status: opts.to };
    });
  }

  app.post('/api/v1/visitors/:id/approve', async request =>
    transition(request, (request.params as { id: string }).id, {
      permission: 'VISITOR_APPROVE',
      from: ['PENDING'],
      to: 'APPROVED',
      stage: 'SCHEDULED',
      action: 'VISITOR_APPROVED',
      verb: 'approved',
      segregateFromCreator: true,
    })
  );
  app.post('/api/v1/visitors/:id/reject', async request =>
    transition(request, (request.params as { id: string }).id, {
      permission: 'VISITOR_APPROVE',
      from: ['PENDING'],
      to: 'REJECTED',
      stage: 'CLOSED',
      action: 'VISITOR_REJECTED',
      verb: 'rejected',
      segregateFromCreator: true,
    })
  );
  app.post('/api/v1/visitors/:id/cancel', async request =>
    transition(request, (request.params as { id: string }).id, {
      permission: 'VISITOR_WRITE',
      from: ['PENDING', 'APPROVED'],
      to: 'CANCELLED',
      stage: 'CLOSED',
      action: 'VISITOR_CANCELLED',
      verb: 'cancelled',
    })
  );
  app.post('/api/v1/visitors/:id/check-in', async request =>
    transition(request, (request.params as { id: string }).id, {
      permission: 'GATE_ACTUATE',
      from: ['APPROVED'],
      to: 'ON_PREMISES',
      stage: 'ACTIVE',
      action: 'VISITOR_CHECKED_IN',
      verb: 'checked in',
      gate: 'ENTRY',
    })
  );
  app.post('/api/v1/visitors/:id/check-out', async request =>
    transition(request, (request.params as { id: string }).id, {
      permission: 'GATE_ACTUATE',
      from: ['ON_PREMISES'],
      to: 'COMPLETED',
      stage: 'CLOSED',
      action: 'VISITOR_CHECKED_OUT',
      verb: 'checked out',
      gate: 'EXIT',
    })
  );

  // ---------------------------------------------------------------------------
  // Contractors & customers (read models)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/contractors/companies', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'CONTRACTOR_READ');
      const q = Paging.parse(request.query);
      const { rows } = await tx.query(
        `SELECT c.company_id AS "id", c.vendor_code AS "vendorCode", coalesce(c.trade_name, o.trade_name, o.legal_name) AS "name",
                c.contractor_classification AS "classification", c.safety_rating AS "safetyRating", c.status,
                c.insurance_expiry_date AS "insuranceExpiry",
                (SELECT count(*) FROM contractor_work_orders w WHERE w.company_id = c.company_id)::int AS "workOrders",
                count(*) OVER()::int AS "total"
           FROM contractor_companies c JOIN external_organizations o ON o.org_id = c.external_org_id
          ORDER BY 3 LIMIT $1 OFFSET $2`,
        [q.limit, q.offset]
      );
      return withTotal(rows, q, () => tx.query('SELECT count(*)::int AS n FROM contractor_companies'));
    })
  );

  app.get('/api/v1/customers/accounts', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'CUSTOMER_READ');
      const q = Paging.parse(request.query);
      const { rows } = await tx.query(
        `SELECT customer_account_id AS "id", account_code AS "accountCode", account_name AS "name", tier,
                classification, status, default_nda_required AS "ndaRequired", count(*) OVER()::int AS "total"
           FROM customer_accounts ORDER BY account_name LIMIT $1 OFFSET $2`,
        [q.limit, q.offset]
      );
      return withTotal(rows, q, () => tx.query('SELECT count(*)::int AS n FROM customer_accounts'));
    })
  );

  // ---------------------------------------------------------------------------
  // Audit ledger
  // ---------------------------------------------------------------------------
  app.get('/api/v1/audit-logs', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'AUDIT_LOG_READ');
      const q = Paging.extend({ entityId: z.string().max(64).optional() }).parse(request.query);
      const { rows } = await tx.query(
        `SELECT audit_id AS "id", "timestamp", actor_id AS "actorId", actor_role AS "actorRole", action,
                entity_type AS "entityType", entity_id AS "entityId", request_id AS "requestId", reason,
                count(*) OVER()::int AS "total"
           FROM audit_logs WHERE ($1::text IS NULL OR entity_id = $1)
          ORDER BY "timestamp" DESC LIMIT $2 OFFSET $3`,
        [q.entityId ?? null, q.limit, q.offset]
      );
      return withTotal(rows, q, () => tx.query('SELECT count(*)::int AS n FROM audit_logs WHERE ($1::text IS NULL OR entity_id = $1)', [q.entityId ?? null]));
    })
  );
}
