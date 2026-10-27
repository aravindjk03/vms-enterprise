import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  DomainRuleError,
  findOverlaps,
  nextWorkOrderStatus,
  outstandingDeliverables,
  providerEligibility,
  technicianEligibility,
  validateWindow,
  SERVICE_PRIORITIES,
  SERVICE_TYPES,
  WORK_ORDER_STAGE,
  WORK_ORDER_STATUSES,
  OPEN_WORK_ORDER_STATUSES,
  UnavailableAccessAdapter,
  UnavailableSafetyAdapter,
  type OverlapPolicy,
  type WorkOrderEvent,
} from '@vms/service';
import type { RouteContext } from '../../app.js';
import { authorize, type AuthenticatedUser } from '../../context.js';
import { isUuid, type Tx } from '../../db.js';
import { HttpError, notFound } from '../../errors.js';
import { idempotent, sendResult } from '../../idempotency.js';
import { lockRequestForWork, transitionRequest } from './requests.js';
import {
  addProgressEvent,
  assertDocument,
  audit,
  can,
  CategoryCode,
  enqueueNotification,
  likePattern,
  lockWorkOrder,
  Paging,
  recordStatus,
  referenceNumber,
  requireSite,
  setWorkOrderStatus,
  siteScope,
  Uuid,
  type WorkOrderRow,
} from './common.js';

const safety = new UnavailableSafetyAdapter();
const access = new UnavailableAccessAdapter();
const OVERLAP_POLICY: OverlapPolicy = process.env['SERVICE_ASSIGNMENT_OVERLAP_POLICY'] === 'WARN' ? 'WARN' : 'BLOCK';
/** Reported times may lag reality (back-office entry) but not lie in the future. */
const MAX_BACKDATE_MS = 7 * 86_400_000;
const FUTURE_TOLERANCE_MS = 5 * 60_000;

const Deliverable = z.object({
  description: z.string().trim().min(2).max(255),
  evidenceRequired: z.boolean().default(true),
  isMandatory: z.boolean().default(true),
});

const WorkOrderCreate = z
  .object({
    requestId: Uuid.optional(),
    siteId: Uuid,
    providerId: Uuid,
    title: z.string().trim().min(3).max(255),
    scopeOfWork: z.string().trim().min(3).max(4000),
    serviceType: z.enum(SERVICE_TYPES),
    serviceCategory: CategoryCode,
    priority: z.enum(SERVICE_PRIORITIES).default('STANDARD'),
    workLocation: z.string().trim().max(255).optional(),
    zoneId: Uuid.optional(),
    equipmentTag: z.string().trim().max(64).optional(),
    scheduledStart: z.coerce.date(),
    scheduledEnd: z.coerce.date(),
    maintenanceLeadId: Uuid,
    safetyPermitRequired: z.boolean().default(false),
    prerequisites: z.string().trim().max(4000).optional(),
    completionCriteria: z.string().trim().max(4000).optional(),
    deliverables: z.array(Deliverable).max(30).default([]),
  })
  .refine(v => v.scheduledEnd > v.scheduledStart, { message: 'scheduledEnd must be after scheduledStart', path: ['scheduledEnd'] });

const Remarks = z.object({ remarks: z.string().trim().max(2000).optional() });
const RequiredReason = z.object({ reason: z.string().trim().min(3).max(2000) });

const AssignmentCreate = z.object({
  technicianId: Uuid,
  plannedStart: z.coerce.date().optional(),
  plannedEnd: z.coerce.date().optional(),
  role: z.enum(['LEAD', 'TECHNICIAN', 'HELPER']).default('TECHNICIAN'),
  acknowledgeConflicts: z.boolean().default(false),
});

const PROGRESS_TYPES = ['ARRIVED', 'PREREQUISITES_CHECKED', 'WORK_STARTED', 'WORK_PAUSED', 'WORK_RESUMED', 'DEPARTED'] as const;
const ProgressCreate = z.object({
  eventType: z.enum(PROGRESS_TYPES),
  technicianId: Uuid.optional(),
  occurredAt: z.coerce.date().optional(),
  outcome: z.enum(['VERIFIED', 'NOT_VERIFIED']).optional(),
  comment: z.string().trim().max(2000).optional(),
});

const Correction = z.object({ occurredAt: z.coerce.date(), reason: z.string().trim().min(3).max(1000) });
const Evidence = z.object({ evidenceNote: z.string().trim().min(3).max(2000), evidenceDocumentId: Uuid.optional() });
const Completion = z.object({ workSummary: z.string().trim().min(3).max(4000) });

const ExceptionCreate = z.object({
  exceptionType: z.enum(['PROVIDER_NO_SHOW', 'SCOPE_CHANGE', 'SAFETY_CONCERN', 'QUALITY_ISSUE', 'ACCESS_ISSUE', 'OVERDUE', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().trim().min(3).max(4000),
});

function checkReportedTime(at: Date | undefined): Date {
  const when = at ?? new Date();
  if (Number.isNaN(when.getTime())) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid time.');
  if (when.getTime() > Date.now() + FUTURE_TOLERANCE_MS) throw new HttpError(400, 'VALIDATION_ERROR', 'Reported time cannot be in the future.');
  if (when.getTime() < Date.now() - MAX_BACKDATE_MS) throw new HttpError(400, 'VALIDATION_ERROR', 'Reported time is more than 7 days in the past.');
  return when;
}

async function loadProviderFacts(tx: Tx, providerId: string) {
  const { rows } = await tx.query<{ status: string; effective_from: string | null; effective_to: string | null }>(
    `SELECT status, effective_from::text, effective_to::text FROM service_providers WHERE service_provider_id = $1`,
    [providerId]
  );
  if (!rows[0]) return null;
  const cats = await tx.query<{ category_code: string }>('SELECT category_code FROM service_provider_categories WHERE service_provider_id = $1', [providerId]);
  const sites = await tx.query<{ site_id: string }>('SELECT site_id FROM service_provider_sites WHERE service_provider_id = $1', [providerId]);
  return {
    status: rows[0].status,
    effectiveFrom: rows[0].effective_from,
    effectiveTo: rows[0].effective_to,
    categories: cats.rows.map(r => r.category_code),
    siteIds: sites.rows.map(r => r.site_id),
  };
}

export async function guardContext(tx: Tx, wo: WorkOrderRow) {
  const assignments = await tx.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM service_assignments WHERE work_order_id = $1 AND status = 'ASSIGNED'",
    [wo.work_order_id]
  );
  // The latest prerequisite check decides (a later NOT_VERIFIED overrides an earlier VERIFIED).
  const prereq = await tx.query<{ outcome: string }>(
    `SELECT outcome FROM service_progress_events WHERE work_order_id = $1 AND event_type = 'PREREQUISITES_CHECKED'
      ORDER BY recorded_at DESC LIMIT 1`,
    [wo.work_order_id]
  );
  const deliverables = await tx.query<{ description: string; is_mandatory: boolean; evidence_required: boolean; satisfied_at: Date | null; has_evidence: boolean }>(
    `SELECT description, is_mandatory, evidence_required, satisfied_at,
            (evidence_note IS NOT NULL OR evidence_document_id IS NOT NULL) AS has_evidence
       FROM service_work_order_deliverables WHERE work_order_id = $1`,
    [wo.work_order_id]
  );
  return {
    hasActiveAssignment: assignments.rows[0].n > 0,
    prerequisitesRequired: wo.safety_permit_required || !!wo.prerequisites,
    prerequisitesSatisfied: prereq.rows[0]?.outcome === 'VERIFIED',
    outstandingDeliverables: outstandingDeliverables(
      deliverables.rows.map(d => ({
        description: d.description,
        isMandatory: d.is_mandatory,
        evidenceRequired: d.evidence_required,
        satisfiedAt: d.satisfied_at,
        hasEvidence: d.has_evidence,
      }))
    ),
  };
}

export async function applyEvent(tx: Tx, user: AuthenticatedUser, wo: WorkOrderRow, event: WorkOrderEvent, reason?: string | null) {
  const guard = await guardContext(tx, wo);
  const before = wo.status;
  const to = nextWorkOrderStatus(wo.status, event, guard);
  await setWorkOrderStatus(tx, user, wo, to, WORK_ORDER_STAGE[to], reason);
  return { before, to };
}

export async function createWorkOrder(
  tx: Tx,
  user: AuthenticatedUser,
  input: z.infer<typeof WorkOrderCreate> & { occurrenceId?: string; initialStatus?: 'PENDING_APPROVAL' | 'APPROVED'; approvedVia?: string }
): Promise<{ id: string; referenceNumber: string; status: string }> {
  const ref = referenceNumber('SWO');
  const status = input.initialStatus ?? 'PENDING_APPROVAL';
  const { rows } = await tx.query<{ work_order_id: string }>(
    `INSERT INTO service_work_orders
       (reference_number, tenant_id, site_id, request_id, service_provider_id, equipment_tag, maintenance_lead_id,
        scheduled_start, scheduled_end, stage, status, title, scope_of_work, service_type, service_category, priority,
        work_location, zone_id, completion_criteria, safety_permit_required, prerequisites, created_by, updated_by, occurrence_id,
        approved_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $22, $23,
             CASE WHEN $11::varchar = 'APPROVED' THEN now() END, $24)
     RETURNING work_order_id`,
    [
      ref,
      user.tenantId,
      input.siteId,
      input.requestId ?? null,
      input.providerId,
      input.equipmentTag ?? null,
      input.maintenanceLeadId,
      input.scheduledStart,
      input.scheduledEnd,
      WORK_ORDER_STAGE[status],
      status,
      input.title,
      input.scopeOfWork,
      input.serviceType,
      input.serviceCategory,
      input.priority,
      input.workLocation ?? null,
      input.zoneId ?? null,
      input.completionCriteria ?? null,
      input.safetyPermitRequired,
      input.prerequisites ?? null,
      user.userId,
      input.occurrenceId ?? null,
      JSON.stringify(input.approvedVia ? { approvedVia: input.approvedVia } : {}),
    ]
  );
  const id = rows[0].work_order_id;
  for (const d of input.deliverables) {
    await tx.query(
      `INSERT INTO service_work_order_deliverables (tenant_id, work_order_id, description, evidence_required, is_mandatory)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.tenantId, id, d.description, d.evidenceRequired, d.isMandatory]
    );
  }
  await recordStatus(tx, user, 'SERVICE_WORK_ORDER', id, null, status, input.approvedVia ?? null);
  return { id, referenceNumber: ref, status };
}

export async function validateWorkOrderInput(tx: Tx, user: AuthenticatedUser, body: z.infer<typeof WorkOrderCreate>) {
  requireSite(user, body.siteId);
  const site = await tx.query('SELECT 1 FROM sites WHERE site_id = $1', [body.siteId]);
  if (!site.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Site not found.');
  if (body.zoneId) {
    const zone = await tx.query('SELECT 1 FROM zones WHERE zone_id = $1 AND site_id = $2', [body.zoneId, body.siteId]);
    if (!zone.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Zone does not belong to the site.');
  }
  const lead = await tx.query('SELECT 1 FROM users WHERE user_id = $1 AND is_active', [body.maintenanceLeadId]);
  if (!lead.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Maintenance lead not found.');
  const provider = await loadProviderFacts(tx, body.providerId);
  if (!provider) throw new HttpError(400, 'VALIDATION_ERROR', 'Provider not found.');
  const reasons = providerEligibility(provider, body.siteId, body.serviceCategory, body.scheduledStart);
  if (reasons.length) {
    throw new HttpError(422, 'PROVIDER_NOT_ELIGIBLE', `Provider is not eligible for this work: ${reasons.join(' ')}`);
  }
}

export { WorkOrderCreate };

export async function registerWorkOrderRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------
  app.get('/api/v1/service/work-orders', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = Paging.extend({
        status: z.enum(WORK_ORDER_STATUSES).optional(),
        siteId: Uuid.optional(),
        providerId: Uuid.optional(),
        category: CategoryCode.optional(),
        overdue: z.enum(['true', 'false']).optional(),
        search: z.string().trim().max(100).optional(),
        sort: z.enum(['scheduledStart', 'createdAt', 'priority']).default('scheduledStart'),
        dir: z.enum(['asc', 'desc']).default('desc'),
      }).parse(request.query);
      if (q.siteId) requireSite(user, q.siteId);
      const order = { scheduledStart: 'w.scheduled_start', createdAt: 'w.created_at', priority: "array_position(ARRAY['CRITICAL','HIGH','STANDARD','LOW'], w.priority)" }[q.sort];
      const { rows } = await tx.query(
        `SELECT w.work_order_id AS "id", w.reference_number AS "referenceNumber", coalesce(w.title, w.equipment_tag) AS "title",
                w.status, w.stage, w.priority, w.service_type AS "serviceType", w.service_category AS "serviceCategory",
                w.scheduled_start AS "scheduledStart", w.scheduled_end AS "scheduledEnd", s.name AS "siteName", w.site_id AS "siteId",
                coalesce(o.trade_name, o.legal_name) AS "providerName",
                (w.scheduled_end < now() AND w.status IN ('PENDING_APPROVAL','APPROVED','SCHEDULED','IN_PROGRESS','ON_HOLD')) AS "overdue",
                (SELECT count(*) FROM service_assignments a WHERE a.work_order_id = w.work_order_id AND a.status = 'ASSIGNED')::int AS "technicians",
                count(*) OVER()::int AS "total"
           FROM service_work_orders w
           JOIN sites s ON s.site_id = w.site_id
           JOIN service_providers sp ON sp.service_provider_id = w.service_provider_id
           JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE ($1::text IS NULL OR w.status = $1)
            AND ($2::uuid IS NULL OR w.site_id = $2)
            AND ($3::uuid[] IS NULL OR w.site_id = ANY($3))
            AND ($4::uuid IS NULL OR w.service_provider_id = $4)
            AND ($5::text IS NULL OR w.service_category = $5)
            AND (NOT $6::boolean OR (w.scheduled_end < now() AND w.status IN ('PENDING_APPROVAL','APPROVED','SCHEDULED','IN_PROGRESS','ON_HOLD')))
            AND ($7::text IS NULL OR coalesce(w.title,'') ILIKE '%' || $7 || '%' OR w.reference_number ILIKE '%' || $7 || '%')
          ORDER BY ${order} ${q.dir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, w.reference_number
          LIMIT $8 OFFSET $9`,
        [q.status ?? null, q.siteId ?? null, siteScope(user), q.providerId ?? null, q.category ?? null, q.overdue === 'true', likePattern(q.search), q.limit, q.offset]
      );
      return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0, limit: q.limit, offset: q.offset };
    })
  );

  app.get('/api/v1/service/work-orders/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      const id = wo.work_order_id;
      const detail = await tx.query(
        `SELECT w.work_order_id AS "id", w.reference_number AS "referenceNumber", w.title, w.scope_of_work AS "scopeOfWork",
                w.status, w.stage, w.priority, w.service_type AS "serviceType", w.service_category AS "serviceCategory",
                w.work_location AS "workLocation", z.name AS "zoneName", w.equipment_tag AS "equipmentTag",
                w.scheduled_start AS "scheduledStart", w.scheduled_end AS "scheduledEnd", w.completion_criteria AS "completionCriteria",
                w.safety_permit_required AS "safetyPermitRequired", w.prerequisites, w.version, w.created_at AS "createdAt",
                w.approved_at AS "approvedAt", au.full_name AS "approvedBy", w.site_id AS "siteId", s.name AS "siteName",
                w.service_provider_id AS "providerId", coalesce(o.trade_name, o.legal_name) AS "providerName",
                w.maintenance_lead_id AS "maintenanceLeadId", lu.full_name AS "maintenanceLead", w.created_by AS "createdById",
                cu.full_name AS "createdBy", w.request_id AS "requestId", r.reference_number AS "requestReference",
                w.occurrence_id AS "occurrenceId", sch.reference_number AS "scheduleReference", sch.schedule_id AS "scheduleId"
           FROM service_work_orders w
           JOIN sites s ON s.site_id = w.site_id
           JOIN service_providers sp ON sp.service_provider_id = w.service_provider_id
           JOIN external_organizations o ON o.org_id = sp.external_org_id
           LEFT JOIN zones z ON z.zone_id = w.zone_id
           LEFT JOIN users au ON au.user_id = w.approved_by_user_id
           LEFT JOIN users lu ON lu.user_id = w.maintenance_lead_id
           LEFT JOIN users cu ON cu.user_id::text = w.created_by
           LEFT JOIN service_requests r ON r.request_id = w.request_id
           LEFT JOIN service_occurrences oc ON oc.occurrence_id = w.occurrence_id
           LEFT JOIN service_schedules sch ON sch.schedule_id = oc.schedule_id
          WHERE w.work_order_id = $1`,
        [id]
      );
      const deliverables = await tx.query(
        `SELECT d.deliverable_id AS "id", d.description, d.evidence_required AS "evidenceRequired", d.is_mandatory AS "isMandatory",
                d.satisfied_at AS "satisfiedAt", u.full_name AS "satisfiedBy", d.evidence_note AS "evidenceNote",
                d.evidence_document_id AS "evidenceDocumentId"
           FROM service_work_order_deliverables d LEFT JOIN users u ON u.user_id = d.satisfied_by_user_id
          WHERE d.work_order_id = $1 ORDER BY d.created_at`,
        [id]
      );
      const assignments = await tx.query(
        `SELECT a.assignment_id AS "id", a.technician_id AS "technicianId", p.display_name AS "technicianName", a.assignment_role AS "role",
                a.planned_start AS "plannedStart", a.planned_end AS "plannedEnd", a.status, a.conflict_acknowledged AS "conflictAcknowledged",
                t.person_id AS "personId"
           FROM service_assignments a JOIN service_technicians t ON t.technician_id = a.technician_id JOIN persons p ON p.person_id = t.person_id
          WHERE a.work_order_id = $1 ORDER BY a.created_at`,
        [id]
      );
      const events = await tx.query(
        `SELECT e.event_id AS "id", e.event_type AS "eventType", e.occurred_at AS "occurredAt", e.recorded_at AS "recordedAt",
                u.full_name AS "actor", e.status_before AS "statusBefore", e.status_after AS "statusAfter", e.outcome, e.comment,
                e.technician_id AS "technicianId", p.display_name AS "technicianName", e.corrects_event_id AS "correctsEventId", e.source,
                EXISTS (SELECT 1 FROM service_progress_events c WHERE c.corrects_event_id = e.event_id) AS "corrected"
           FROM service_progress_events e JOIN users u ON u.user_id = e.actor_user_id
           LEFT JOIN service_technicians t ON t.technician_id = e.technician_id LEFT JOIN persons p ON p.person_id = t.person_id
          WHERE e.work_order_id = $1 ORDER BY e.occurred_at, e.recorded_at`,
        [id]
      );
      const completions = await tx.query(
        `SELECT c.completion_id AS "id", c.work_summary AS "workSummary", c.submitted_at AS "submittedAt", su.full_name AS "submittedBy",
                c.submitted_by_user_id AS "submittedById", c.decision, c.decided_at AS "decidedAt", du.full_name AS "decidedBy",
                c.decision_remarks AS "decisionRemarks"
           FROM service_completion_records c JOIN users su ON su.user_id = c.submitted_by_user_id LEFT JOIN users du ON du.user_id = c.decided_by_user_id
          WHERE c.work_order_id = $1 ORDER BY c.submitted_at`,
        [id]
      );
      const exceptions = await tx.query(
        `SELECT exception_id AS "id", reference_number AS "referenceNumber", exception_type AS "exceptionType", severity, description,
                status, raised_at AS "raisedAt", resolution, resolved_at AS "resolvedAt"
           FROM service_exceptions WHERE work_order_id = $1 ORDER BY raised_at DESC`,
        [id]
      );
      const journeys = await tx.query(
        `SELECT ta.id, ta.reference_number AS "referenceNumber", j.association_role AS "associationRole", ta.activity_date AS "activityDate",
                tm.code AS "mode", ow.code AS "ownership", vt.code AS "vehicleType", ft.code AS "fuel", ta.usage_type AS "usageType",
                ta.occupancy, coalesce(ta.origin_location_name, ta.origin_city) AS "origin",
                coalesce(ta.destination_location_name, ta.destination_city) AS "destination", ta.distance, ta.distance_unit AS "distanceUnit",
                ta.journey_type AS "journeyType", ta.direction, ta.measurement_method AS "measurementMethod", ta.data_source AS "dataSource",
                ta.data_completeness AS "completeness", ta.missing_facts AS "missingFacts", ta.superseded_by AS "supersededBy",
                ta.correction_reason AS "correctionReason", p.display_name AS "travellerName",
                (SELECT count(*) FROM service_work_order_journeys x WHERE x.transport_activity_id = ta.id)::int AS "linkedWorkOrders",
                g.reference_number AS "ghgReference", g.calculation_status AS "ghgCalculationStatus",
                ob.status AS "captureQueueStatus", ob.retry_count AS "captureRetries"
           FROM service_work_order_journeys j
           JOIN transport_activities ta ON ta.id = j.transport_activity_id
           LEFT JOIN persons p ON p.person_id = ta.person_id
           LEFT JOIN transport_modes tm ON tm.mode_id = ta.transport_mode_id
           LEFT JOIN transport_ownership_types ow ON ow.ownership_type_id = ta.ownership_type_id
           LEFT JOIN vehicle_types vt ON vt.type_id = ta.vehicle_type_id
           LEFT JOIN vehicle_fuel_types ft ON ft.fuel_type_id = ta.fuel_type_id
           LEFT JOIN ghg_activities g ON g.transport_activity_id = ta.id
           LEFT JOIN workflow_outbox_events ob ON ob.event_type = 'vms.esg.transport_activity.captured.v1' AND ob.idempotency_key = ta.id::text
          WHERE j.work_order_id = $1 ORDER BY ta.activity_date, ta.created_at`,
        [id]
      );
      const history = await tx.query(
        `SELECT h.from_status AS "from", h.to_status AS "to", h.changed_at AS "at", u.full_name AS "actor", h.reason
           FROM service_status_history h LEFT JOIN users u ON u.user_id = h.actor_user_id
          WHERE h.entity_type = 'SERVICE_WORK_ORDER' AND h.entity_id = $1 ORDER BY h.changed_at`,
        [id]
      );
      const guard = await guardContext(tx, wo);
      const safetyStatus = await safety.getPrerequisiteStatus({ tenantId: user.tenantId, workOrderId: id, siteId: wo.site_id, permitRequired: wo.safety_permit_required });
      const accessStatus = await access.getTechnicianAccessStatus({ tenantId: user.tenantId, siteId: wo.site_id, personId: '' });

      return {
        ...detail.rows[0],
        deliverables: deliverables.rows,
        assignments: assignments.rows,
        progress: events.rows,
        completions: completions.rows,
        exceptions: exceptions.rows,
        journeys: journeys.rows.map(j => ({
          ...j,
          // Never report "captured" before the GHG activity row exists.
          activityCapture: j.supersededBy ? 'SUPERSEDED' : j.ghgReference ? 'CAPTURED' : j.captureQueueStatus === 'FAILED' ? 'FAILED' : 'QUEUED',
        })),
        history: history.rows,
        readiness: {
          prerequisitesRequired: guard.prerequisitesRequired,
          prerequisitesSatisfied: guard.prerequisitesSatisfied,
          hasActiveAssignment: guard.hasActiveAssignment,
          outstandingDeliverables: guard.outstandingDeliverables,
        },
        integrations: { safety: safetyStatus, access: accessStatus },
      };
    })
  );

  // -------------------------------------------------------------------------
  // Create / approve / reject / cancel
  // -------------------------------------------------------------------------
  app.post('/api/v1/service/work-orders', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        authorize(user, 'SERVICE_MANAGE');
        const body = WorkOrderCreate.parse(request.body);
        await validateWorkOrderInput(tx, user, body);

        const req = body.requestId ? await lockRequestForWork(tx, body.requestId, body.siteId) : undefined;

        const created = await createWorkOrder(tx, user, body);
        if (req) await transitionRequest(tx, user, req, 'WORK_ORDER_CREATED');
        await audit(tx, user, request.id, 'SERVICE_WORK_ORDER_CREATED', 'SERVICE_WORK_ORDER', created.id, {
          after: { referenceNumber: created.referenceNumber, providerId: body.providerId, requestId: body.requestId ?? null },
        });
        return { status: 201, body: created };
      })
    );
    return sendResult(reply, result);
  });

  const decide = (decision: 'APPROVE' | 'REJECT') => async (request: Parameters<RouteContext['asUser']>[0]) =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      authorize(user, 'SERVICE_APPROVE', { siteId: wo.site_id, ownerId: wo.created_by ?? undefined, currentState: wo.status });
      const { remarks } = Remarks.parse(request.body ?? {});
      if (decision === 'REJECT' && !remarks) throw new HttpError(400, 'VALIDATION_ERROR', 'A reason is required to reject a work order.');
      const { before, to } = await applyEvent(tx, user, wo, decision, remarks);
      let finalStatus = to;
      if (decision === 'APPROVE') {
        await tx.query('UPDATE service_work_orders SET approved_by_user_id = $2, approved_at = now() WHERE work_order_id = $1', [wo.work_order_id, user.userId]);
        // Technicians assigned during approval: the work is now scheduled.
        const guard = await guardContext(tx, wo);
        if (guard.hasActiveAssignment) {
          await setWorkOrderStatus(tx, user, wo, 'SCHEDULED', WORK_ORDER_STAGE.SCHEDULED, 'technicians already assigned');
          finalStatus = 'SCHEDULED';
        }
      }
      await audit(tx, user, request.id, decision === 'APPROVE' ? 'SERVICE_WORK_ORDER_APPROVED' : 'SERVICE_WORK_ORDER_REJECTED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
        before: { status: before },
        after: { status: finalStatus },
        reason: remarks,
      });
      return { id: wo.work_order_id, status: finalStatus };
    });

  app.post('/api/v1/service/work-orders/:id/approve', decide('APPROVE'));
  app.post('/api/v1/service/work-orders/:id/reject', decide('REJECT'));

  app.post('/api/v1/service/work-orders/:id/cancel', async request =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      authorize(user, 'SERVICE_MANAGE', { siteId: wo.site_id });
      const { reason } = RequiredReason.parse(request.body ?? {});
      const { before, to } = await applyEvent(tx, user, wo, 'CANCELLED', reason);
      await tx.query("UPDATE service_assignments SET status = 'CANCELLED', cancelled_at = now() WHERE work_order_id = $1 AND status = 'ASSIGNED'", [wo.work_order_id]);
      if (wo.occurrence_id) {
        await tx.query("UPDATE service_occurrences SET status = 'CANCELLED' WHERE occurrence_id = $1 AND status = 'GENERATED'", [wo.occurrence_id]);
      }
      await addProgressEvent(tx, user, wo, { eventType: 'CANCELLED', statusBefore: before, statusAfter: to, comment: reason });
      await audit(tx, user, request.id, 'SERVICE_WORK_ORDER_CANCELLED', 'SERVICE_WORK_ORDER', wo.work_order_id, { before: { status: before }, after: { status: to }, reason });
      return { id: wo.work_order_id, status: to };
    })
  );

  // -------------------------------------------------------------------------
  // Assignments
  // -------------------------------------------------------------------------
  app.post('/api/v1/service/work-orders/:id/assignments', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
        authorize(user, 'SERVICE_MANAGE', { siteId: wo.site_id });
        const body = AssignmentCreate.parse(request.body);
        nextWorkOrderStatus(wo.status, 'ASSIGN');

        const plannedStart = body.plannedStart ?? new Date(wo.scheduled_start);
        const plannedEnd = body.plannedEnd ?? new Date(wo.scheduled_end);
        validateWindow(plannedStart, plannedEnd);

        const tech = await tx.query<{ status: string; service_provider_id: string; effective_from: string | null; effective_to: string | null; person_id: string }>(
          'SELECT status, service_provider_id, effective_from::text, effective_to::text, person_id FROM service_technicians WHERE technician_id = $1 FOR UPDATE',
          [body.technicianId]
        );
        if (!tech.rows[0]) throw new HttpError(400, 'VALIDATION_ERROR', 'Technician not found.');
        const t = tech.rows[0];
        const reasons = technicianEligibility(
          { status: t.status, serviceProviderId: t.service_provider_id, effectiveFrom: t.effective_from, effectiveTo: t.effective_to },
          wo.service_provider_id,
          plannedStart
        );
        if (reasons.length) throw new HttpError(422, 'TECHNICIAN_NOT_ELIGIBLE', reasons.join(' '));

        // Overlap detection across all of the technician's active assignments in the tenant.
        const existing = await tx.query<{ assignment_id: string; planned_start: Date; planned_end: Date; reference_number: string }>(
          `SELECT a.assignment_id, a.planned_start, a.planned_end, w.reference_number
             FROM service_assignments a JOIN service_work_orders w ON w.work_order_id = a.work_order_id
            WHERE a.technician_id = $1 AND a.status = 'ASSIGNED' AND a.work_order_id <> $2
              AND w.status NOT IN ('CANCELLED', 'REJECTED', 'CLOSED')`,
          [body.technicianId, wo.work_order_id]
        );
        const conflicts = findOverlaps(
          { start: plannedStart, end: plannedEnd },
          existing.rows.map(e => ({ id: e.assignment_id, start: new Date(e.planned_start), end: new Date(e.planned_end), label: e.reference_number }))
        );
        if (conflicts.length && (OVERLAP_POLICY === 'BLOCK' || !body.acknowledgeConflicts)) {
          return {
            status: 409,
            body: {
              error: {
                code: 'SCHEDULE_CONFLICT',
                message: `Technician is already assigned during this window (${conflicts.map(c => c.label).join(', ')}).`,
                requestId: request.id,
                policy: OVERLAP_POLICY,
                conflicts: conflicts.map(c => ({ workOrderReference: c.label, start: c.start, end: c.end })),
              },
            },
          };
        }

        let assignmentId: string;
        try {
          const { rows } = await tx.query<{ assignment_id: string }>(
            `INSERT INTO service_assignments (tenant_id, work_order_id, technician_id, assignment_role, planned_start, planned_end, conflict_acknowledged, assigned_by_user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING assignment_id`,
            [user.tenantId, wo.work_order_id, body.technicianId, body.role, plannedStart, plannedEnd, conflicts.length > 0, user.userId]
          );
          assignmentId = rows[0].assignment_id;
        } catch (err) {
          if ((err as { code?: string }).code === '23505') throw new HttpError(409, 'ALREADY_ASSIGNED', 'Technician is already assigned to this work order.');
          throw err;
        }
        const before = wo.status;
        if (wo.status === 'APPROVED') await setWorkOrderStatus(tx, user, wo, 'SCHEDULED', WORK_ORDER_STAGE.SCHEDULED, 'technician assigned');
        await addProgressEvent(tx, user, wo, {
          eventType: 'TECHNICIAN_ASSIGNED',
          technicianId: body.technicianId,
          statusBefore: before,
          statusAfter: wo.status,
          comment: conflicts.length ? 'Assigned with acknowledged schedule overlap' : null,
        });
        await enqueueNotification(tx, user.tenantId, 'vms.service.technician_assigned.v1', {
          workOrderId: wo.work_order_id,
          technicianId: body.technicianId,
          plannedStart,
          plannedEnd,
        });
        await audit(tx, user, request.id, 'SERVICE_TECHNICIAN_ASSIGNED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
          after: { technicianId: body.technicianId, plannedStart, plannedEnd, conflictAcknowledged: conflicts.length > 0 },
        });
        return { status: 201, body: { id: assignmentId, workOrderStatus: wo.status, conflictsAcknowledged: conflicts.length } };
      })
    );
    return sendResult(reply, result);
  });

  app.post('/api/v1/service/work-orders/:id/assignments/:assignmentId/cancel', async request =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      authorize(user, 'SERVICE_MANAGE', { siteId: wo.site_id });
      const { reason } = RequiredReason.parse(request.body ?? {});
      const { assignmentId } = request.params as { assignmentId: string };
      const upd = await tx.query(
        "UPDATE service_assignments SET status = 'CANCELLED', cancelled_at = now() WHERE assignment_id = $1 AND work_order_id = $2 AND status = 'ASSIGNED' RETURNING technician_id",
        [assignmentId, wo.work_order_id]
      );
      if (!upd.rowCount) throw notFound('Assignment');
      const guard = await guardContext(tx, wo);
      if (!guard.hasActiveAssignment && wo.status === 'SCHEDULED') {
        await setWorkOrderStatus(tx, user, wo, 'APPROVED', WORK_ORDER_STAGE.APPROVED, 'last technician unassigned');
      }
      await audit(tx, user, request.id, 'SERVICE_ASSIGNMENT_CANCELLED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
        after: { assignmentId, technicianId: upd.rows[0].technician_id },
        reason,
      });
      return { id: assignmentId, workOrderStatus: wo.status };
    })
  );

  // -------------------------------------------------------------------------
  // Progress milestones
  // -------------------------------------------------------------------------
  app.post('/api/v1/service/work-orders/:id/progress', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
        const body = ProgressCreate.parse(request.body);

        // Reception/gate staff may only report arrival and departure.
        if (body.eventType === 'ARRIVED' || body.eventType === 'DEPARTED') {
          if (!can(user, 'SERVICE_ARRIVAL_RECORD')) authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
          else authorize(user, 'SERVICE_ARRIVAL_RECORD', { siteId: wo.site_id });
        } else if (body.eventType === 'PREREQUISITES_CHECKED') {
          // While Safety is not integrated, prerequisite verification is a manual, separately authorized act.
          authorize(user, 'SERVICE_PREREQ_VERIFY', { siteId: wo.site_id });
          if (!body.outcome) throw new HttpError(400, 'VALIDATION_ERROR', 'outcome (VERIFIED / NOT_VERIFIED) is required.');
          if (!body.comment) throw new HttpError(400, 'VALIDATION_ERROR', 'Record what was verified (e.g. permit reference) in the comment.');
        } else {
          authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
        }
        if (body.eventType === 'WORK_PAUSED' && !body.comment) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'A reason is required to pause work.');
        }
        if (body.technicianId) {
          const assigned = await tx.query("SELECT 1 FROM service_assignments WHERE work_order_id = $1 AND technician_id = $2 AND status = 'ASSIGNED'", [
            wo.work_order_id,
            body.technicianId,
          ]);
          if (!assigned.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Technician is not assigned to this work order.');
        }
        if (body.eventType === 'DEPARTED') {
          const arrived = await tx.query(
            "SELECT 1 FROM service_progress_events WHERE work_order_id = $1 AND event_type = 'ARRIVED' AND ($2::uuid IS NULL OR technician_id = $2)",
            [wo.work_order_id, body.technicianId ?? null]
          );
          if (!arrived.rowCount) throw new HttpError(409, 'INVALID_STATE', 'Departure requires a recorded arrival.');
        }
        const occurredAt = checkReportedTime(body.occurredAt);
        const { before, to } = await applyEvent(tx, user, wo, body.eventType as WorkOrderEvent, body.comment);
        const eventId = await addProgressEvent(tx, user, wo, {
          eventType: body.eventType,
          occurredAt,
          technicianId: body.technicianId,
          statusBefore: before,
          statusAfter: to,
          outcome: body.outcome ?? null,
          comment: body.comment ?? null,
        });
        await audit(tx, user, request.id, `SERVICE_${body.eventType}`, 'SERVICE_WORK_ORDER', wo.work_order_id, {
          before: { status: before },
          after: { status: to, eventId, outcome: body.outcome ?? null },
          reason: body.comment,
        });
        return { status: 201, body: { eventId, workOrderStatus: to } };
      })
    );
    return sendResult(reply, result);
  });

  app.post('/api/v1/service/work-orders/:id/progress/:eventId/corrections', async request =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
      const { eventId } = request.params as { eventId: string };
      const body = Correction.parse(request.body);
      const original = await tx.query<{ event_type: string; occurred_at: Date; technician_id: string | null }>(
        'SELECT event_type, occurred_at, technician_id FROM service_progress_events WHERE event_id = $1 AND work_order_id = $2',
        [eventId, wo.work_order_id]
      );
      const o = original.rows[0];
      if (!o) throw notFound('Progress event');
      if (!['ARRIVED', 'DEPARTED', 'WORK_STARTED', 'WORK_PAUSED', 'WORK_RESUMED'].includes(o.event_type)) {
        throw new HttpError(409, 'NOT_CORRECTABLE', `${o.event_type} events cannot be time-corrected.`);
      }
      const occurredAt = checkReportedTime(body.occurredAt);
      // Append-only: the original stays; the correction references it with the reason.
      const correctionId = await addProgressEvent(tx, user, wo, {
        eventType: 'CORRECTION',
        occurredAt,
        technicianId: o.technician_id,
        comment: `${o.event_type} time corrected from ${new Date(o.occurred_at).toISOString()}: ${body.reason}`,
        correctsEventId: eventId,
      });
      await audit(tx, user, request.id, 'SERVICE_PROGRESS_CORRECTED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
        before: { eventId, occurredAt: o.occurred_at },
        after: { correctionId, occurredAt },
        reason: body.reason,
      });
      return { id: correctionId };
    })
  );

  // -------------------------------------------------------------------------
  // Deliverables, completion and closure
  // -------------------------------------------------------------------------
  app.post('/api/v1/service/work-orders/:id/deliverables/:deliverableId/evidence', async request =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
      const { deliverableId } = request.params as { deliverableId: string };
      const body = Evidence.parse(request.body);
      nextWorkOrderStatus(wo.status, 'EVIDENCE_ATTACHED');
      await assertDocument(tx, body.evidenceDocumentId);
      if (!isUuid(deliverableId)) throw notFound('Deliverable');
      const current = await tx.query<{ description: string; evidence_note: string | null; evidence_document_id: string | null }>(
        'SELECT description, evidence_note, evidence_document_id FROM service_work_order_deliverables WHERE deliverable_id = $1 AND work_order_id = $2 FOR UPDATE',
        [deliverableId, wo.work_order_id]
      );
      const deliverable = current.rows[0];
      if (!deliverable) throw notFound('Deliverable');
      // Evidence can be replaced while work is open (e.g. after a completion was returned). The earlier
      // evidence stays in the append-only progress log and the audit trail; nothing is lost.
      const replaced = deliverable.evidence_note !== null || deliverable.evidence_document_id !== null;
      if (replaced && wo.status === 'COMPLETION_SUBMITTED') {
        throw new HttpError(409, 'UNDER_REVIEW', 'Completion is under review. The reviewer must return it before evidence can be replaced.');
      }
      await tx.query(
        `UPDATE service_work_order_deliverables
            SET satisfied_at = now(), satisfied_by_user_id = $3, evidence_note = $4, evidence_document_id = $5
          WHERE deliverable_id = $1 AND work_order_id = $2`,
        [deliverableId, wo.work_order_id, user.userId, body.evidenceNote, body.evidenceDocumentId ?? null]
      );
      await addProgressEvent(tx, user, wo, {
        eventType: 'EVIDENCE_ATTACHED',
        comment: replaced
          ? `${deliverable.description}: ${body.evidenceNote} (replaces: ${deliverable.evidence_note ?? 'document'})`
          : `${deliverable.description}: ${body.evidenceNote}`,
        evidenceDocumentId: body.evidenceDocumentId ?? null,
      });
      await audit(tx, user, request.id, replaced ? 'SERVICE_EVIDENCE_REPLACED' : 'SERVICE_EVIDENCE_ATTACHED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
        before: replaced ? { deliverableId, evidenceNote: deliverable.evidence_note, evidenceDocumentId: deliverable.evidence_document_id } : undefined,
        after: { deliverableId, evidenceNote: body.evidenceNote, evidenceDocumentId: body.evidenceDocumentId ?? null },
      });
      return { id: deliverableId };
    })
  );

  app.post('/api/v1/service/work-orders/:id/completion', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
        authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
        const body = Completion.parse(request.body);
        const { before, to } = await applyEvent(tx, user, wo, 'COMPLETION_SUBMITTED');
        const { rows } = await tx.query<{ completion_id: string }>(
          'INSERT INTO service_completion_records (tenant_id, work_order_id, submitted_by_user_id, work_summary) VALUES ($1, $2, $3, $4) RETURNING completion_id',
          [user.tenantId, wo.work_order_id, user.userId, body.workSummary]
        );
        await addProgressEvent(tx, user, wo, { eventType: 'COMPLETION_SUBMITTED', statusBefore: before, statusAfter: to, comment: body.workSummary });
        await audit(tx, user, request.id, 'SERVICE_COMPLETION_SUBMITTED', 'SERVICE_WORK_ORDER', wo.work_order_id, { before: { status: before }, after: { status: to } });
        return { status: 201, body: { id: rows[0].completion_id, workOrderStatus: to } };
      })
    );
    return sendResult(reply, result);
  });

  const decideCompletion = (decision: 'ACCEPTED' | 'RETURNED') => async (request: Parameters<RouteContext['asUser']>[0]) =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      const pending = await tx.query<{ completion_id: string; submitted_by_user_id: string }>(
        'SELECT completion_id, submitted_by_user_id FROM service_completion_records WHERE work_order_id = $1 AND decision IS NULL FOR UPDATE',
        [wo.work_order_id]
      );
      const record = pending.rows[0];
      if (!record) throw new HttpError(409, 'INVALID_STATE', 'There is no completion awaiting a decision.');
      // Segregation of duties: whoever submitted completion cannot accept or return it.
      authorize(user, 'SERVICE_ACCEPT', { siteId: wo.site_id });
      if (record.submitted_by_user_id === user.userId) {
        throw new HttpError(403, 'FORBIDDEN', 'Completion must be decided by someone other than the person who submitted it.');
      }
      const { remarks } = Remarks.parse(request.body ?? {});
      if (decision === 'RETURNED' && !remarks) throw new HttpError(400, 'VALIDATION_ERROR', 'Explain what must be fixed when returning completion.');
      const { before, to } = await applyEvent(tx, user, wo, decision === 'ACCEPTED' ? 'COMPLETION_ACCEPTED' : 'COMPLETION_RETURNED', remarks);
      await tx.query(
        'UPDATE service_completion_records SET decision = $2, decided_by_user_id = $3, decided_at = now(), decision_remarks = $4 WHERE completion_id = $1',
        [record.completion_id, decision, user.userId, remarks ?? null]
      );
      await addProgressEvent(tx, user, wo, {
        eventType: decision === 'ACCEPTED' ? 'COMPLETION_ACCEPTED' : 'COMPLETION_RETURNED',
        statusBefore: before,
        statusAfter: to,
        comment: remarks ?? null,
      });
      if (decision === 'ACCEPTED' && wo.occurrence_id) {
        await tx.query("UPDATE service_occurrences SET status = 'COMPLETED' WHERE occurrence_id = $1", [wo.occurrence_id]);
      }
      await audit(tx, user, request.id, `SERVICE_COMPLETION_${decision}`, 'SERVICE_WORK_ORDER', wo.work_order_id, {
        before: { status: before },
        after: { status: to },
        reason: remarks,
      });
      return { id: wo.work_order_id, status: to };
    });

  app.post('/api/v1/service/work-orders/:id/completion/accept', decideCompletion('ACCEPTED'));
  app.post('/api/v1/service/work-orders/:id/completion/return', decideCompletion('RETURNED'));

  app.post('/api/v1/service/work-orders/:id/close', async request =>
    ctx.asUser(request, async (tx, user) => {
      const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
      authorize(user, 'SERVICE_MANAGE', { siteId: wo.site_id });
      const { remarks } = Remarks.parse(request.body ?? {});
      const { before, to } = await applyEvent(tx, user, wo, 'CLOSED', remarks);
      await addProgressEvent(tx, user, wo, { eventType: 'CLOSED', statusBefore: before, statusAfter: to, comment: remarks ?? null });
      await audit(tx, user, request.id, 'SERVICE_WORK_ORDER_CLOSED', 'SERVICE_WORK_ORDER', wo.work_order_id, { before: { status: before }, after: { status: to } });
      return { id: wo.work_order_id, status: to };
    })
  );

  // -------------------------------------------------------------------------
  // Exceptions
  // -------------------------------------------------------------------------
  app.post('/api/v1/service/work-orders/:id/exceptions', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
        if (!can(user, 'SERVICE_EXECUTE')) authorize(user, 'SERVICE_MANAGE', { siteId: wo.site_id });
        else authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
        const body = ExceptionCreate.parse(request.body);
        const ref = referenceNumber('SEX');
        const { rows } = await tx.query<{ exception_id: string }>(
          `INSERT INTO service_exceptions (reference_number, tenant_id, site_id, work_order_id, request_id, occurrence_id, exception_type, severity, description, raised_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING exception_id`,
          [ref, user.tenantId, wo.site_id, wo.work_order_id, wo.request_id, wo.occurrence_id, body.exceptionType, body.severity, body.description, user.userId]
        );
        await audit(tx, user, request.id, 'SERVICE_EXCEPTION_RAISED', 'SERVICE_EXCEPTION', rows[0].exception_id, { after: { ...body, workOrderId: wo.work_order_id } });
        return { status: 201, body: { id: rows[0].exception_id, referenceNumber: ref } };
      })
    );
    return sendResult(reply, result);
  });

  app.get('/api/v1/service/exceptions', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = Paging.extend({ status: z.enum(['OPEN', 'RESOLVED']).optional(), siteId: Uuid.optional() }).parse(request.query);
      if (q.siteId) requireSite(user, q.siteId);
      const { rows } = await tx.query(
        `SELECT e.exception_id AS "id", e.reference_number AS "referenceNumber", e.exception_type AS "exceptionType", e.severity,
                e.description, e.status, e.raised_at AS "raisedAt", e.resolved_at AS "resolvedAt", e.resolution,
                s.name AS "siteName", w.work_order_id AS "workOrderId", w.reference_number AS "workOrderReference",
                ru.full_name AS "raisedBy", count(*) OVER()::int AS "total"
           FROM service_exceptions e JOIN sites s ON s.site_id = e.site_id
           LEFT JOIN service_work_orders w ON w.work_order_id = e.work_order_id
           LEFT JOIN users ru ON ru.user_id = e.raised_by_user_id
          WHERE ($1::text IS NULL OR e.status = $1) AND ($2::uuid IS NULL OR e.site_id = $2) AND ($3::uuid[] IS NULL OR e.site_id = ANY($3))
          ORDER BY e.status = 'OPEN' DESC, array_position(ARRAY['CRITICAL','HIGH','MEDIUM','LOW'], e.severity), e.raised_at DESC
          LIMIT $4 OFFSET $5`,
        [q.status ?? null, q.siteId ?? null, siteScope(user), q.limit, q.offset]
      );
      return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0, limit: q.limit, offset: q.offset };
    })
  );

  app.post('/api/v1/service/exceptions/:id/resolve', async request =>
    ctx.asUser(request, async (tx, user) => {
      const { id } = request.params as { id: string };
      const body = z.object({ resolution: z.string().trim().min(3).max(4000) }).parse(request.body);
      const ex = await tx.query<{ site_id: string; status: string }>('SELECT site_id, status FROM service_exceptions WHERE exception_id = $1 FOR UPDATE', [id]);
      if (!ex.rows[0] || !siteVisible(user, ex.rows[0].site_id)) throw notFound('Exception');
      authorize(user, 'SERVICE_MANAGE', { siteId: ex.rows[0].site_id });
      if (ex.rows[0].status !== 'OPEN') throw new HttpError(409, 'INVALID_STATE', 'Exception is already resolved.');
      await tx.query(
        "UPDATE service_exceptions SET status = 'RESOLVED', resolved_by_user_id = $2, resolved_at = now(), resolution = $3 WHERE exception_id = $1",
        [id, user.userId, body.resolution]
      );
      await audit(tx, user, request.id, 'SERVICE_EXCEPTION_RESOLVED', 'SERVICE_EXCEPTION', id, { reason: body.resolution });
      return { id, status: 'RESOLVED' };
    })
  );
}

function siteVisible(user: AuthenticatedUser, siteId: string): boolean {
  const scope = siteScope(user);
  return scope === null || scope.includes(siteId);
}

export { DomainRuleError, OPEN_WORK_ORDER_STATUSES };
