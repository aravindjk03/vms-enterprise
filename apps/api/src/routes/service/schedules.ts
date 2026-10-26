import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { expandOccurrences, validateRule, SERVICE_TYPES, type RecurrenceRule } from '@vms/service';
import type { RouteContext } from '../../app.js';
import { authorize, type AuthenticatedUser } from '../../context.js';
import { isUuid, type Tx } from '../../db.js';
import { HttpError, notFound } from '../../errors.js';
import { idempotent, sendResult } from '../../idempotency.js';
import { audit, CategoryCode, DateOnly, Paging, recordStatus, referenceNumber, requireSite, siteScope, Uuid } from './common.js';
import { createWorkOrder, validateWorkOrderInput } from './work-orders.js';

const ScheduleCreate = z
  .object({
    siteId: Uuid,
    providerId: Uuid,
    requestId: Uuid.optional(),
    title: z.string().trim().min(3).max(255),
    scopeOfWork: z.string().trim().min(3).max(4000),
    serviceType: z.enum(SERVICE_TYPES).default('PREVENTIVE_MAINTENANCE'),
    serviceCategory: CategoryCode,
    workLocation: z.string().trim().max(255).optional(),
    maintenanceLeadId: Uuid,
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    intervalCount: z.number().int().min(1).max(52).default(1),
    byWeekdays: z.array(z.number().int().min(1).max(7)).max(7).optional(),
    dayOfMonth: z.number().int().min(1).max(28).optional(),
    startDate: DateOnly,
    endDate: DateOnly.optional(),
    windowStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    durationMinutes: z.number().int().min(15).max(1440),
    deliverables: z.array(z.string().trim().min(2).max(255)).max(30).default([]),
    safetyPermitRequired: z.boolean().default(false),
  })
  .refine(v => !v.endDate || v.endDate >= v.startDate, { message: 'endDate precedes startDate', path: ['endDate'] });

const Generate = z.object({ from: DateOnly, to: DateOnly });

interface ScheduleRow {
  schedule_id: string;
  reference_number: string;
  tenant_id: string;
  site_id: string;
  service_provider_id: string;
  request_id: string | null;
  title: string;
  scope_of_work: string;
  service_type: string;
  service_category: string;
  work_location: string | null;
  maintenance_lead_id: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval_count: number;
  by_weekdays: number[] | null;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  window_start_time: string;
  duration_minutes: number;
  timezone: string;
  deliverables: string[];
  safety_permit_required: boolean;
  status: string;
  created_by: string;
}

async function lockSchedule(tx: Tx, user: AuthenticatedUser, id: string): Promise<ScheduleRow> {
  if (!isUuid(id)) throw notFound('Schedule');
  const { rows } = await tx.query<ScheduleRow>(
    `SELECT *, start_date::text AS start_date, end_date::text AS end_date, window_start_time::text AS window_start_time
       FROM service_schedules WHERE schedule_id = $1 FOR UPDATE`,
    [id]
  );
  const s = rows[0];
  const scope = siteScope(user);
  if (!s || (scope !== null && !scope.includes(s.site_id))) throw notFound('Schedule');
  return s;
}

function ruleOf(s: Pick<ScheduleRow, 'frequency' | 'interval_count' | 'by_weekdays' | 'day_of_month' | 'start_date' | 'end_date' | 'window_start_time' | 'duration_minutes' | 'timezone'>): RecurrenceRule {
  return {
    frequency: s.frequency,
    intervalCount: s.interval_count,
    byWeekdays: s.by_weekdays,
    dayOfMonth: s.day_of_month,
    startDate: s.start_date,
    endDate: s.end_date,
    windowStartTime: s.window_start_time,
    durationMinutes: s.duration_minutes,
    timezone: s.timezone,
  };
}

const SCHEDULE_TRANSITIONS: Record<string, { from: string[]; to: string; permission: 'SERVICE_APPROVE' | 'SERVICE_MANAGE' }> = {
  approve: { from: ['DRAFT'], to: 'ACTIVE', permission: 'SERVICE_APPROVE' },
  pause: { from: ['ACTIVE'], to: 'PAUSED', permission: 'SERVICE_MANAGE' },
  resume: { from: ['PAUSED'], to: 'ACTIVE', permission: 'SERVICE_MANAGE' },
  end: { from: ['DRAFT', 'ACTIVE', 'PAUSED'], to: 'ENDED', permission: 'SERVICE_MANAGE' },
};

export async function registerScheduleRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  app.get('/api/v1/service/schedules', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = Paging.extend({ status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional() }).parse(request.query);
      const { rows } = await tx.query(
        `SELECT sc.schedule_id AS "id", sc.reference_number AS "referenceNumber", sc.title, sc.frequency, sc.interval_count AS "intervalCount",
                sc.by_weekdays AS "byWeekdays", sc.day_of_month AS "dayOfMonth", sc.start_date AS "startDate", sc.end_date AS "endDate",
                sc.window_start_time::text AS "windowStartTime", sc.duration_minutes AS "durationMinutes", sc.timezone, sc.status,
                s.name AS "siteName", coalesce(o.trade_name, o.legal_name) AS "providerName", sc.service_category AS "serviceCategory",
                (SELECT count(*) FROM service_occurrences x WHERE x.schedule_id = sc.schedule_id)::int AS "occurrences",
                (SELECT count(*) FROM service_occurrences x WHERE x.schedule_id = sc.schedule_id AND x.status = 'MISSED')::int AS "missed",
                count(*) OVER()::int AS "total"
           FROM service_schedules sc JOIN sites s ON s.site_id = sc.site_id
           JOIN service_providers sp ON sp.service_provider_id = sc.service_provider_id JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE ($1::text IS NULL OR sc.status = $1) AND ($2::uuid[] IS NULL OR sc.site_id = ANY($2))
          ORDER BY sc.created_at DESC LIMIT $3 OFFSET $4`,
        [q.status ?? null, siteScope(user), q.limit, q.offset]
      );
      return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0, limit: q.limit, offset: q.offset };
    })
  );

  app.get('/api/v1/service/schedules/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const s = await lockSchedule(tx, user, (request.params as { id: string }).id);
      const occurrences = await tx.query(
        `SELECT oc.occurrence_id AS "id", oc.occurrence_date AS "occurrenceDate", oc.planned_start AS "plannedStart", oc.planned_end AS "plannedEnd",
                oc.status, oc.missed_at AS "missedAt", w.work_order_id AS "workOrderId", w.reference_number AS "workOrderReference",
                w.status AS "workOrderStatus"
           FROM service_occurrences oc LEFT JOIN service_work_orders w ON w.work_order_id = oc.work_order_id
          WHERE oc.schedule_id = $1 ORDER BY oc.occurrence_date`,
        [s.schedule_id]
      );
      return {
        id: s.schedule_id,
        referenceNumber: s.reference_number,
        title: s.title,
        scopeOfWork: s.scope_of_work,
        status: s.status,
        frequency: s.frequency,
        intervalCount: s.interval_count,
        byWeekdays: s.by_weekdays,
        dayOfMonth: s.day_of_month,
        startDate: s.start_date,
        endDate: s.end_date,
        windowStartTime: s.window_start_time,
        durationMinutes: s.duration_minutes,
        timezone: s.timezone,
        deliverables: s.deliverables,
        occurrences: occurrences.rows,
      };
    })
  );

  app.post('/api/v1/service/schedules', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        authorize(user, 'SERVICE_MANAGE');
        const body = ScheduleCreate.parse(request.body);
        requireSite(user, body.siteId);
        const site = await tx.query<{ timezone: string | null }>('SELECT timezone FROM sites WHERE site_id = $1', [body.siteId]);
        if (!site.rows[0]) throw new HttpError(400, 'VALIDATION_ERROR', 'Site not found.');
        const timezone = site.rows[0].timezone || 'UTC';
        validateRule({ ...body, endDate: body.endDate ?? null, timezone });
        const lead = await tx.query('SELECT 1 FROM users WHERE user_id = $1 AND is_active', [body.maintenanceLeadId]);
        if (!lead.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Maintenance lead not found.');
        const provider = await tx.query('SELECT 1 FROM service_providers WHERE service_provider_id = $1', [body.providerId]);
        if (!provider.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Provider not found.');

        const ref = referenceNumber('SSC');
        const { rows } = await tx.query<{ schedule_id: string }>(
          `INSERT INTO service_schedules
             (reference_number, tenant_id, site_id, service_provider_id, request_id, title, scope_of_work, service_type, service_category,
              work_location, maintenance_lead_id, frequency, interval_count, by_weekdays, day_of_month, start_date, end_date,
              window_start_time, duration_minutes, timezone, deliverables, safety_permit_required, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
           RETURNING schedule_id`,
          [
            ref,
            user.tenantId,
            body.siteId,
            body.providerId,
            body.requestId ?? null,
            body.title,
            body.scopeOfWork,
            body.serviceType,
            body.serviceCategory,
            body.workLocation ?? null,
            body.maintenanceLeadId,
            body.frequency,
            body.intervalCount,
            body.byWeekdays ?? null,
            body.dayOfMonth ?? null,
            body.startDate,
            body.endDate ?? null,
            body.windowStartTime,
            body.durationMinutes,
            timezone,
            body.deliverables,
            body.safetyPermitRequired,
            user.userId,
          ]
        );
        await recordStatus(tx, user, 'SERVICE_SCHEDULE', rows[0].schedule_id, null, 'DRAFT');
        await audit(tx, user, request.id, 'SERVICE_SCHEDULE_CREATED', 'SERVICE_SCHEDULE', rows[0].schedule_id, {
          after: { referenceNumber: ref, frequency: body.frequency, startDate: body.startDate },
        });
        return { status: 201, body: { id: rows[0].schedule_id, referenceNumber: ref, status: 'DRAFT', timezone } };
      })
    );
    return sendResult(reply, result);
  });

  for (const [action, rule] of Object.entries(SCHEDULE_TRANSITIONS)) {
    app.post(`/api/v1/service/schedules/:id/${action}`, async request =>
      ctx.asUser(request, async (tx, user) => {
        const s = await lockSchedule(tx, user, (request.params as { id: string }).id);
        authorize(user, rule.permission, {
          siteId: s.site_id,
          ownerId: action === 'approve' ? s.created_by : undefined,
          currentState: s.status,
        });
        if (!rule.from.includes(s.status)) {
          throw new HttpError(409, 'INVALID_STATE', `Schedule is ${s.status}; cannot ${action}.`);
        }
        await tx.query(
          `UPDATE service_schedules SET status = $2, updated_at = now(),
              approved_by_user_id = CASE WHEN $3 THEN $4::uuid ELSE approved_by_user_id END,
              approved_at = CASE WHEN $3 THEN now() ELSE approved_at END
            WHERE schedule_id = $1`,
          [s.schedule_id, rule.to, action === 'approve', user.userId]
        );
        await recordStatus(tx, user, 'SERVICE_SCHEDULE', s.schedule_id, s.status, rule.to);
        await audit(tx, user, request.id, `SERVICE_SCHEDULE_${action.toUpperCase()}`, 'SERVICE_SCHEDULE', s.schedule_id, {
          before: { status: s.status },
          after: { status: rule.to },
        });
        return { id: s.schedule_id, status: rule.to };
      })
    );
  }

  // Generates one occurrence + one work order per date. Re-running the same range creates nothing new.
  app.post('/api/v1/service/schedules/:id/generate', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const s = await lockSchedule(tx, user, (request.params as { id: string }).id);
        authorize(user, 'SERVICE_MANAGE', { siteId: s.site_id });
        if (s.status !== 'ACTIVE') throw new HttpError(409, 'INVALID_STATE', `Only ACTIVE (approved) schedules generate work; this one is ${s.status}.`);
        const range = Generate.parse(request.body);
        const occurrences = expandOccurrences(ruleOf(s), range.from, range.to);

        let created = 0;
        let existing = 0;
        const generated: Array<{ occurrenceDate: string; workOrderId: string; referenceNumber: string }> = [];
        for (const occ of occurrences) {
          const ins = await tx.query<{ occurrence_id: string }>(
            `INSERT INTO service_occurrences (tenant_id, schedule_id, occurrence_date, planned_start, planned_end)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (schedule_id, occurrence_date) DO NOTHING RETURNING occurrence_id`,
            [user.tenantId, s.schedule_id, occ.occurrenceDate, occ.plannedStart, occ.plannedEnd]
          );
          if (!ins.rows[0]) {
            existing++;
            continue;
          }
          const input = {
            siteId: s.site_id,
            providerId: s.service_provider_id,
            requestId: s.request_id ?? undefined,
            title: `${s.title} — ${occ.occurrenceDate}`,
            scopeOfWork: s.scope_of_work,
            serviceType: s.service_type as never,
            serviceCategory: s.service_category,
            priority: 'STANDARD' as const,
            workLocation: s.work_location ?? undefined,
            scheduledStart: occ.plannedStart,
            scheduledEnd: occ.plannedEnd,
            maintenanceLeadId: s.maintenance_lead_id,
            safetyPermitRequired: s.safety_permit_required,
            deliverables: s.deliverables.map(description => ({ description, evidenceRequired: true, isMandatory: true })),
          };
          // Eligibility is re-checked per occurrence: a provider suspended later must not receive new work.
          await validateWorkOrderInput(tx, user, input);
          const wo = await createWorkOrder(tx, user, {
            ...input,
            occurrenceId: ins.rows[0].occurrence_id,
            initialStatus: 'APPROVED',
            approvedVia: `schedule ${s.reference_number}`,
          });
          await tx.query('UPDATE service_occurrences SET work_order_id = $2 WHERE occurrence_id = $1', [ins.rows[0].occurrence_id, wo.id]);
          generated.push({ occurrenceDate: occ.occurrenceDate, workOrderId: wo.id, referenceNumber: wo.referenceNumber });
          created++;
        }
        await audit(tx, user, request.id, 'SERVICE_OCCURRENCES_GENERATED', 'SERVICE_SCHEDULE', s.schedule_id, {
          after: { from: range.from, to: range.to, created, existing },
        });
        return { status: 200, body: { created, existing, generated } };
      })
    );
    return sendResult(reply, result);
  });

  // Marks past occurrences whose work never started as MISSED and raises an exception (never a fabricated completion).
  app.post('/api/v1/service/occurrences/sweep-missed', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_MANAGE');
      const graceMinutes = z.object({ graceMinutes: z.number().int().min(0).max(10_080).default(60) }).parse(request.body ?? {}).graceMinutes;
      const { rows } = await tx.query<{ occurrence_id: string; site_id: string; work_order_id: string | null; schedule_ref: string; occurrence_date: string }>(
        `SELECT oc.occurrence_id, sc.site_id, oc.work_order_id, sc.reference_number AS schedule_ref, oc.occurrence_date::text
           FROM service_occurrences oc
           JOIN service_schedules sc ON sc.schedule_id = oc.schedule_id
           LEFT JOIN service_work_orders w ON w.work_order_id = oc.work_order_id
          WHERE oc.status = 'GENERATED'
            AND oc.planned_end < now() - make_interval(mins => $1)
            AND (w.work_order_id IS NULL OR w.status IN ('PENDING_APPROVAL', 'APPROVED', 'SCHEDULED'))
            AND ($2::uuid[] IS NULL OR sc.site_id = ANY($2))
          FOR UPDATE OF oc`,
        [graceMinutes, siteScope(user)]
      );
      for (const r of rows) {
        await tx.query("UPDATE service_occurrences SET status = 'MISSED', missed_at = now() WHERE occurrence_id = $1", [r.occurrence_id]);
        await tx.query(
          `INSERT INTO service_exceptions (reference_number, tenant_id, site_id, work_order_id, occurrence_id, exception_type, severity, description, raised_by_user_id)
           VALUES ($1, $2, $3, $4, $5, 'MISSED_OCCURRENCE', 'HIGH', $6, $7)
           ON CONFLICT (occurrence_id) WHERE exception_type = 'MISSED_OCCURRENCE' DO NOTHING`,
          [referenceNumber('SEX'), user.tenantId, r.site_id, r.work_order_id, r.occurrence_id, `Scheduled service ${r.schedule_ref} on ${r.occurrence_date} was not started.`, user.userId]
        );
        await recordStatus(tx, user, 'SERVICE_OCCURRENCE', r.occurrence_id, 'GENERATED', 'MISSED', 'no work started by planned end');
      }
      await audit(tx, user, request.id, 'SERVICE_MISSED_SWEEP', 'SERVICE_SCHEDULE', 'ALL', { after: { missed: rows.length } });
      return { missed: rows.length };
    })
  );

  // -------------------------------------------------------------------------
  // Calendar & analytics
  // -------------------------------------------------------------------------
  app.get('/api/v1/service/calendar', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = z
        .object({
          from: z.coerce.date(),
          to: z.coerce.date(),
          siteId: Uuid.optional(),
          providerId: Uuid.optional(),
          technicianId: Uuid.optional(),
          category: CategoryCode.optional(),
          status: z.string().max(32).optional(),
        })
        .refine(v => v.to > v.from && v.to.getTime() - v.from.getTime() <= 62 * 86_400_000, { message: 'Range must be positive and at most 62 days', path: ['to'] })
        .parse(request.query);
      if (q.siteId) requireSite(user, q.siteId);
      const { rows } = await tx.query(
        `SELECT w.work_order_id AS "id", w.reference_number AS "referenceNumber", coalesce(w.title, w.equipment_tag) AS "title", w.status,
                w.priority, w.service_category AS "serviceCategory", w.scheduled_start AS "start", w.scheduled_end AS "end",
                s.name AS "siteName", coalesce(o.trade_name, o.legal_name) AS "providerName",
                coalesce((SELECT json_agg(json_build_object('technicianId', a.technician_id, 'name', p.display_name, 'start', a.planned_start, 'end', a.planned_end))
                            FROM service_assignments a JOIN service_technicians t ON t.technician_id = a.technician_id JOIN persons p ON p.person_id = t.person_id
                           WHERE a.work_order_id = w.work_order_id AND a.status = 'ASSIGNED'), '[]') AS "technicians"
           FROM service_work_orders w
           JOIN sites s ON s.site_id = w.site_id
           JOIN service_providers sp ON sp.service_provider_id = w.service_provider_id
           JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE w.scheduled_start < $2 AND w.scheduled_end > $1
            AND ($3::uuid IS NULL OR w.site_id = $3) AND ($4::uuid[] IS NULL OR w.site_id = ANY($4))
            AND ($5::uuid IS NULL OR w.service_provider_id = $5)
            AND ($6::uuid IS NULL OR EXISTS (SELECT 1 FROM service_assignments a WHERE a.work_order_id = w.work_order_id AND a.technician_id = $6 AND a.status = 'ASSIGNED'))
            AND ($7::text IS NULL OR w.service_category = $7)
            AND ($8::text IS NULL OR w.status = $8)
            AND w.status NOT IN ('REJECTED')
          ORDER BY w.scheduled_start LIMIT 1000`,
        [q.from, q.to, q.siteId ?? null, siteScope(user), q.providerId ?? null, q.technicianId ?? null, q.category ?? null, q.status ?? null]
      );
      return { items: rows, from: q.from, to: q.to };
    })
  );

  app.get('/api/v1/service/analytics/summary', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = z.object({ siteId: Uuid.optional() }).parse(request.query);
      if (q.siteId) requireSite(user, q.siteId);
      const scope = q.siteId ? [q.siteId] : siteScope(user);
      const counts = await tx.query(
        `SELECT
           (SELECT count(*) FROM service_requests WHERE status IN ('SUBMITTED','APPROVED','WORK_ORDERED') AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "openRequests",
           (SELECT count(*) FROM service_requests WHERE status = 'SUBMITTED' AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int
             + (SELECT count(*) FROM service_work_orders WHERE status = 'PENDING_APPROVAL' AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "pendingApprovals",
           (SELECT count(*) FROM service_work_orders WHERE status IN ('APPROVED','SCHEDULED') AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "scheduledWork",
           (SELECT count(DISTINCT a.technician_id) FROM service_assignments a JOIN service_work_orders w ON w.work_order_id = a.work_order_id
             WHERE a.status = 'ASSIGNED' AND a.planned_start::date = current_date AND ($1::uuid[] IS NULL OR w.site_id = ANY($1)))::int AS "techniciansExpectedToday",
           (SELECT count(*) FROM service_work_orders WHERE status IN ('IN_PROGRESS','ON_HOLD') AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "workInProgress",
           (SELECT count(*) FROM service_work_orders WHERE scheduled_end < now() AND status IN ('PENDING_APPROVAL','APPROVED','SCHEDULED','IN_PROGRESS','ON_HOLD')
             AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "overdueWork",
           (SELECT count(*) FROM service_work_orders WHERE status = 'COMPLETION_SUBMITTED' AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "pendingCompletion",
           (SELECT count(*) FROM service_exceptions WHERE status = 'OPEN' AND ($1::uuid[] IS NULL OR site_id = ANY($1)))::int AS "openExceptions",
           (SELECT round(avg(extract(epoch FROM (r.decided_at - r.created_at)) / 3600)::numeric, 1) FROM service_requests r
             WHERE r.decided_at IS NOT NULL AND ($1::uuid[] IS NULL OR r.site_id = ANY($1))) AS "avgRequestApprovalHours"`,
        [scope]
      );
      const byCategory = await tx.query(
        `SELECT coalesce(service_category, 'UNSPECIFIED') AS "key", count(*)::int AS "count" FROM service_work_orders
          WHERE status NOT IN ('CANCELLED','REJECTED') AND ($1::uuid[] IS NULL OR site_id = ANY($1)) GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
        [scope]
      );
      const byProvider = await tx.query(
        `SELECT coalesce(o.trade_name, o.legal_name) AS "key", count(*)::int AS "count"
           FROM service_work_orders w JOIN service_providers sp ON sp.service_provider_id = w.service_provider_id JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE w.status NOT IN ('CANCELLED','REJECTED') AND ($1::uuid[] IS NULL OR w.site_id = ANY($1)) GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
        [scope]
      );
      const bySite = await tx.query(
        `SELECT s.name AS "key", count(*)::int AS "count" FROM service_work_orders w JOIN sites s ON s.site_id = w.site_id
          WHERE w.status NOT IN ('CANCELLED','REJECTED') AND ($1::uuid[] IS NULL OR w.site_id = ANY($1)) GROUP BY 1 ORDER BY 2 DESC`,
        [scope]
      );
      // Activity capture completeness: of work orders that reached execution, how many have a journey,
      // and of current journeys how many are complete enough for calculation. No GHG totals are shown.
      const capture = await tx.query(
        `WITH executed AS (
           SELECT w.work_order_id FROM service_work_orders w
            WHERE w.status IN ('IN_PROGRESS','ON_HOLD','COMPLETION_SUBMITTED','COMPLETED','CLOSED') AND ($1::uuid[] IS NULL OR w.site_id = ANY($1))),
         journeys AS (
           SELECT DISTINCT ta.id, ta.data_completeness, g.id AS ghg_id
             FROM service_work_order_journeys j JOIN transport_activities ta ON ta.id = j.transport_activity_id
             LEFT JOIN ghg_activities g ON g.transport_activity_id = ta.id
            WHERE ta.superseded_by IS NULL AND ($1::uuid[] IS NULL OR ta.site_id = ANY($1)))
         SELECT (SELECT count(*) FROM executed)::int AS "executedWorkOrders",
                (SELECT count(*) FROM executed e WHERE EXISTS (SELECT 1 FROM service_work_order_journeys j WHERE j.work_order_id = e.work_order_id))::int AS "withJourney",
                (SELECT count(*) FROM journeys)::int AS "journeys",
                (SELECT count(*) FROM journeys WHERE data_completeness = 'COMPLETE')::int AS "completeJourneys",
                (SELECT count(*) FROM journeys WHERE ghg_id IS NOT NULL)::int AS "capturedInLedger"`,
        [scope]
      );
      return {
        ...counts.rows[0],
        avgRequestApprovalHours: counts.rows[0].avgRequestApprovalHours === null ? null : Number(counts.rows[0].avgRequestApprovalHours),
        byCategory: byCategory.rows,
        byProvider: byProvider.rows,
        bySite: bySite.rows,
        activityCapture: capture.rows[0],
        generatedAt: new Date().toISOString(),
      };
    })
  );
}
