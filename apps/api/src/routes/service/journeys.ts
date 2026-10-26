import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  assessJourneyCompleteness,
  journeyFingerprint,
  routePairKey,
  validateJourneyFacts,
  JOURNEY_DIRECTIONS,
  JOURNEY_TYPES,
  MEASUREMENT_METHODS,
  DATA_SOURCES,
  USAGE_TYPES,
  type JourneyFacts,
} from '@vms/service';
import type { RouteContext } from '../../app.js';
import { authorize, type AuthenticatedUser } from '../../context.js';
import { isUuid, type Tx } from '../../db.js';
import { HttpError, notFound } from '../../errors.js';
import { idempotent, sendResult } from '../../idempotency.js';
import { enqueueTransportCapture } from '../../jobs/esg-capture.js';
import { audit, can, DateOnly, lockWorkOrder, referenceNumber, siteScope, Uuid, type WorkOrderRow } from './common.js';

const FactsSchema = z.object({
  technicianId: Uuid.optional(),
  activityDate: DateOnly,
  modeCode: z.string().trim().max(32).nullable().default(null),
  ownershipCode: z.string().trim().max(32).nullable().default(null),
  vehicleTypeCode: z.string().trim().max(32).nullable().default(null),
  fuelCode: z.string().trim().max(32).nullable().default(null),
  usageType: z.enum(USAGE_TYPES).nullable().default(null),
  occupancy: z.number().int().nullable().default(null),
  originName: z.string().trim().max(255).nullable().default(null),
  originCity: z.string().trim().max(128).nullable().default(null),
  destinationName: z.string().trim().max(255).nullable().default(null),
  destinationCity: z.string().trim().max(128).nullable().default(null),
  distanceKm: z.number().nullable().default(null),
  journeyType: z.enum(JOURNEY_TYPES).default('UNKNOWN'),
  direction: z.enum(JOURNEY_DIRECTIONS).nullable().default(null),
  measurementMethod: z.enum(MEASUREMENT_METHODS).default('UNKNOWN'),
  dataSource: z.enum(DATA_SOURCES).default('SERVICE_FORM'),
  vehicleRegistration: z.string().trim().max(32).nullable().default(null),
});

const CaptureSchema = z.union([
  z.object({ linkTransportActivityId: Uuid, technicianId: Uuid.optional() }),
  FactsSchema,
]);

const CorrectionSchema = FactsSchema.extend({ reason: z.string().trim().min(3).max(1000) });

interface MasterIds {
  modeId: string | null;
  ownershipId: string | null;
  vehicleTypeId: string | null;
  fuelId: string | null;
}

async function resolveMaster(tx: Tx, facts: z.infer<typeof FactsSchema>): Promise<MasterIds> {
  const one = async (sql: string, code: string | null, label: string) => {
    if (!code) return null;
    const { rows } = await tx.query<{ id: string }>(sql, [code]);
    if (!rows[0]) throw new HttpError(400, 'VALIDATION_ERROR', `Unknown ${label} '${code}'.`);
    return rows[0].id;
  };
  return {
    modeId: await one('SELECT mode_id AS id FROM transport_modes WHERE code = $1 AND is_active', facts.modeCode, 'transport mode'),
    ownershipId: await one('SELECT ownership_type_id AS id FROM transport_ownership_types WHERE code = $1 AND is_active', facts.ownershipCode, 'ownership'),
    vehicleTypeId: await one('SELECT type_id AS id FROM vehicle_types WHERE code = $1 AND is_active', facts.vehicleTypeCode, 'vehicle type'),
    fuelId: await one('SELECT fuel_type_id AS id FROM vehicle_fuel_types WHERE code = $1 AND is_active', facts.fuelCode, 'fuel type'),
  };
}

async function technicianPerson(tx: Tx, wo: WorkOrderRow, technicianId: string | undefined): Promise<string | null> {
  if (!technicianId) return null;
  const { rows } = await tx.query<{ person_id: string }>(
    `SELECT t.person_id FROM service_assignments a JOIN service_technicians t ON t.technician_id = a.technician_id
      WHERE a.work_order_id = $1 AND a.technician_id = $2 AND a.status = 'ASSIGNED'`,
    [wo.work_order_id, technicianId]
  );
  if (!rows[0]) throw new HttpError(400, 'VALIDATION_ERROR', 'Technician is not assigned to this work order.');
  return rows[0].person_id;
}

function toFacts(personId: string | null, f: z.infer<typeof FactsSchema>): JourneyFacts {
  return {
    personId,
    activityDate: f.activityDate,
    modeCode: f.modeCode,
    ownershipCode: f.ownershipCode,
    vehicleTypeCode: f.vehicleTypeCode,
    fuelCode: f.fuelCode,
    usageType: f.usageType,
    occupancy: f.occupancy,
    originName: f.originName,
    originCity: f.originCity,
    destinationName: f.destinationName,
    destinationCity: f.destinationCity,
    distanceKm: f.distanceKm,
    journeyType: f.journeyType,
    direction: f.direction,
    measurementMethod: f.measurementMethod,
    vehicleRegistration: f.vehicleRegistration,
  };
}

async function insertTransportActivity(
  tx: Tx,
  user: AuthenticatedUser,
  wo: WorkOrderRow,
  facts: JourneyFacts,
  raw: z.infer<typeof FactsSchema>,
  extra: { supersedes?: string; correctionReason?: string }
): Promise<string> {
  const ids = await resolveMaster(tx, raw);
  const completeness = assessJourneyCompleteness(facts);
  const { rows } = await tx.query<{ id: string }>(
    `INSERT INTO transport_activities
       (reference_number, tenant_id, site_id, source_domain, source_transaction_id, person_id, transport_mode_id, ownership_type_id,
        vehicle_type_id, fuel_type_id, usage_type, occupancy, origin_location_name, origin_city, destination_location_name,
        destination_city, distance, distance_unit, journey_type, direction, measurement_method, data_source,
        estimated_flag, activity_date, journey_fingerprint, data_completeness, missing_facts, supersedes, correction_reason, created_by)
     VALUES ($1, $2, $3, 'SERVICE', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CASE WHEN $16::numeric IS NULL THEN NULL ELSE 'km' END,
             $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
     RETURNING id`,
    [
      referenceNumber('TRA'),
      user.tenantId,
      wo.site_id,
      wo.work_order_id,
      facts.personId,
      ids.modeId,
      ids.ownershipId,
      ids.vehicleTypeId,
      ids.fuelId,
      facts.usageType,
      facts.occupancy,
      facts.originName,
      facts.originCity,
      facts.destinationName,
      facts.destinationCity,
      facts.distanceKm,
      facts.journeyType,
      facts.direction,
      facts.measurementMethod,
      raw.dataSource,
      facts.measurementMethod === 'ROUTE_ESTIMATE',
      facts.activityDate,
      journeyFingerprint(user.tenantId, facts),
      completeness.completeness,
      completeness.missing,
      extra.supersedes ?? null,
      extra.correctionReason ?? null,
      user.userId,
    ]
  );
  return rows[0].id;
}

/** Another current journey for the same traveller/day/route whose round-trip status would double count. */
async function findRouteConflict(tx: Tx, facts: JourneyFacts, excludeId?: string): Promise<{ id: string; reference_number: string } | null> {
  const key = routePairKey(facts);
  if (!key) return null;
  const { rows } = await tx.query<{
    id: string;
    reference_number: string;
    journey_type: string;
    origin_location_name: string | null;
    origin_city: string | null;
    destination_location_name: string | null;
    destination_city: string | null;
  }>(
    `SELECT id, reference_number, journey_type, origin_location_name, origin_city, destination_location_name, destination_city
       FROM transport_activities WHERE person_id = $1 AND activity_date = $2 AND superseded_by IS NULL AND ($3::uuid IS NULL OR id <> $3)`,
    [facts.personId, facts.activityDate, excludeId ?? null]
  );
  for (const r of rows) {
    const other: JourneyFacts = {
      ...facts,
      originName: r.origin_location_name,
      originCity: r.origin_city,
      destinationName: r.destination_location_name,
      destinationCity: r.destination_city,
    };
    if (routePairKey(other) === key && (r.journey_type === 'ROUND_TRIP' || facts.journeyType === 'ROUND_TRIP')) return r;
  }
  return null;
}

export async function registerJourneyRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  app.get('/api/v1/service/transport-reference', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = (sql: string) => tx.query(sql).then(r => r.rows);
      return {
        modes: await q('SELECT code, name FROM transport_modes WHERE is_active ORDER BY name'),
        ownership: await q('SELECT code, name FROM transport_ownership_types WHERE is_active ORDER BY name'),
        vehicleTypes: await q('SELECT code, name FROM vehicle_types WHERE is_active ORDER BY name'),
        fuels: await q('SELECT code, name FROM vehicle_fuel_types WHERE is_active ORDER BY name'),
        journeyTypes: JOURNEY_TYPES,
        directions: JOURNEY_DIRECTIONS,
        usageTypes: USAGE_TYPES,
        measurementMethods: MEASUREMENT_METHODS,
      };
    })
  );

  app.post('/api/v1/service/work-orders/:id/journeys', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const wo = await lockWorkOrder(tx, user, (request.params as { id: string }).id);
        if (!can(user, 'SERVICE_EXECUTE')) authorize(user, 'SERVICE_MANAGE', { siteId: wo.site_id });
        else authorize(user, 'SERVICE_EXECUTE', { siteId: wo.site_id });
        if (['CANCELLED', 'REJECTED'].includes(wo.status)) {
          throw new HttpError(409, 'INVALID_STATE', `Work order is ${wo.status}; journeys cannot be recorded.`);
        }
        const body = CaptureSchema.parse(request.body);

        // Link an existing physical journey (e.g. one trip serving two work orders): no new journey, no new GHG activity.
        if ('linkTransportActivityId' in body) {
          const existing = await tx.query<{ id: string; superseded_by: string | null }>(
            'SELECT id, superseded_by FROM transport_activities WHERE id = $1',
            [body.linkTransportActivityId]
          );
          if (!existing.rows[0]) throw new HttpError(400, 'VALIDATION_ERROR', 'Journey not found.');
          if (existing.rows[0].superseded_by) throw new HttpError(409, 'SUPERSEDED', 'That journey was corrected; link the current version.');
          const linked = await tx.query(
            `INSERT INTO service_work_order_journeys (tenant_id, work_order_id, transport_activity_id, technician_id, association_role, linked_by_user_id)
             VALUES ($1, $2, $3, $4, 'SHARED', $5) ON CONFLICT (work_order_id, transport_activity_id) DO NOTHING RETURNING id`,
            [user.tenantId, wo.work_order_id, body.linkTransportActivityId, body.technicianId ?? null, user.userId]
          );
          await audit(tx, user, request.id, 'SERVICE_JOURNEY_LINKED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
            after: { transportActivityId: body.linkTransportActivityId },
          });
          return { status: 201, body: { transportActivityId: body.linkTransportActivityId, linked: true, alreadyLinked: linked.rowCount === 0 } };
        }

        const personId = await technicianPerson(tx, wo, body.technicianId);
        const facts = toFacts(personId, body);
        const errors = validateJourneyFacts(facts);
        if (errors.length) throw new HttpError(400, 'VALIDATION_ERROR', errors.join(' '));

        // Same physical trip already recorded (from any work order): link it instead of duplicating it.
        const fingerprint = journeyFingerprint(user.tenantId, facts);
        if (fingerprint) {
          const dup = await tx.query<{ id: string; reference_number: string }>(
            'SELECT id, reference_number FROM transport_activities WHERE journey_fingerprint = $1 AND superseded_by IS NULL',
            [fingerprint]
          );
          if (dup.rows[0]) {
            await tx.query(
              `INSERT INTO service_work_order_journeys (tenant_id, work_order_id, transport_activity_id, technician_id, association_role, linked_by_user_id)
               VALUES ($1, $2, $3, $4, 'SHARED', $5) ON CONFLICT (work_order_id, transport_activity_id) DO NOTHING`,
              [user.tenantId, wo.work_order_id, dup.rows[0].id, body.technicianId ?? null, user.userId]
            );
            await audit(tx, user, request.id, 'SERVICE_JOURNEY_DEDUPLICATED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
              after: { transportActivityId: dup.rows[0].id },
            });
            return { status: 200, body: { transportActivityId: dup.rows[0].id, referenceNumber: dup.rows[0].reference_number, deduplicated: true } };
          }
        }
        const routeConflict = await findRouteConflict(tx, facts);
        if (routeConflict) {
          throw new HttpError(
            409,
            'POSSIBLE_DUPLICATE_JOURNEY',
            `A round trip on this route is already recorded for this traveller on ${facts.activityDate} (${routeConflict.reference_number}). Link it or correct it instead of adding another leg.`
          );
        }

        const transportActivityId = await insertTransportActivity(tx, user, wo, facts, body, {});
        await tx.query(
          `INSERT INTO service_work_order_journeys (tenant_id, work_order_id, transport_activity_id, technician_id, association_role, linked_by_user_id)
           VALUES ($1, $2, $3, $4, 'PRIMARY', $5)`,
          [user.tenantId, wo.work_order_id, transportActivityId, body.technicianId ?? null, user.userId]
        );
        await enqueueTransportCapture(tx, {
          tenantId: user.tenantId,
          transportActivityId,
          sourceDomain: 'SERVICE',
          sourceEntityType: 'SERVICE_WORK_ORDER',
          sourceEntityId: wo.work_order_id,
        });
        const completeness = assessJourneyCompleteness(facts);
        await audit(tx, user, request.id, 'SERVICE_JOURNEY_CAPTURED', 'SERVICE_WORK_ORDER', wo.work_order_id, {
          after: { transportActivityId, completeness: completeness.completeness, missing: completeness.missing },
        });
        return {
          status: 201,
          body: { transportActivityId, deduplicated: false, completeness: completeness.completeness, missingFacts: completeness.missing, activityCapture: 'QUEUED' },
        };
      })
    );
    return sendResult(reply, result);
  });

  // Correction = new version; the original activity (and its GHG activity) is superseded, never edited.
  app.post('/api/v1/service/journeys/:id/corrections', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        const { id } = request.params as { id: string };
        if (!isUuid(id)) throw notFound('Journey');
        const body = CorrectionSchema.parse(request.body);
        const original = await tx.query<{ id: string; superseded_by: string | null; source_transaction_id: string; person_id: string | null }>(
          `SELECT id, superseded_by, source_transaction_id, person_id FROM transport_activities WHERE id = $1 AND source_domain = 'SERVICE' FOR UPDATE`,
          [id]
        );
        const o = original.rows[0];
        if (!o) throw notFound('Journey');
        if (o.superseded_by) throw new HttpError(409, 'SUPERSEDED', 'This journey has already been corrected; correct the latest version.');
        const wo = await lockWorkOrder(tx, user, o.source_transaction_id);
        authorize(user, can(user, 'SERVICE_EXECUTE') ? 'SERVICE_EXECUTE' : 'SERVICE_MANAGE', { siteId: wo.site_id });

        const personId = body.technicianId ? await technicianPerson(tx, wo, body.technicianId) : o.person_id;
        const facts = toFacts(personId, body);
        const errors = validateJourneyFacts(facts);
        if (errors.length) throw new HttpError(400, 'VALIDATION_ERROR', errors.join(' '));

        // Retire the old version first so the corrected trip can take its place in the uniqueness index.
        await tx.query("UPDATE transport_activities SET superseded_by = id, updated_at = now() WHERE id = $1", [o.id]);
        const routeConflict = await findRouteConflict(tx, facts, o.id);
        if (routeConflict) {
          throw new HttpError(409, 'POSSIBLE_DUPLICATE_JOURNEY', `Correction would overlap journey ${routeConflict.reference_number} on the same route.`);
        }
        const newId = await insertTransportActivity(tx, user, wo, facts, body, { supersedes: o.id, correctionReason: body.reason });
        await tx.query('UPDATE transport_activities SET superseded_by = $2 WHERE id = $1', [o.id, newId]);
        // Every work order linked to the old trip now links the corrected one (old links stay as history).
        await tx.query(
          `INSERT INTO service_work_order_journeys (tenant_id, work_order_id, transport_activity_id, technician_id, association_role, linked_by_user_id)
           SELECT tenant_id, work_order_id, $2, technician_id, association_role, $3 FROM service_work_order_journeys WHERE transport_activity_id = $1
           ON CONFLICT (work_order_id, transport_activity_id) DO NOTHING`,
          [o.id, newId, user.userId]
        );
        await enqueueTransportCapture(tx, {
          tenantId: user.tenantId,
          transportActivityId: newId,
          sourceDomain: 'SERVICE',
          sourceEntityType: 'SERVICE_WORK_ORDER',
          sourceEntityId: wo.work_order_id,
        });
        await audit(tx, user, request.id, 'SERVICE_JOURNEY_CORRECTED', 'TRANSPORT_ACTIVITY', newId, {
          before: { transportActivityId: o.id },
          after: { transportActivityId: newId },
          reason: body.reason,
        });
        return { status: 201, body: { transportActivityId: newId, supersedes: o.id, activityCapture: 'QUEUED' } };
      })
    );
    return sendResult(reply, result);
  });

  // Provenance: transport activity -> work orders (sources) -> GHG activity -> capture queue, plus version chain.
  app.get('/api/v1/service/journeys/:id/trace', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const { id } = request.params as { id: string };
      if (!isUuid(id)) throw notFound('Journey');
      const ta = await tx.query(
        `SELECT ta.id, ta.reference_number AS "referenceNumber", ta.source_domain AS "sourceDomain", ta.source_transaction_id AS "sourceTransactionId",
                ta.activity_date AS "activityDate", ta.distance, ta.distance_unit AS "distanceUnit", ta.measurement_method AS "measurementMethod",
                ta.data_source AS "dataSource", ta.data_completeness AS "completeness", ta.missing_facts AS "missingFacts",
                ta.supersedes, ta.superseded_by AS "supersededBy", ta.correction_reason AS "correctionReason", ta.created_at AS "capturedAt",
                ta.site_id AS "siteId"
           FROM transport_activities ta WHERE ta.id = $1`,
        [id]
      );
      const row = ta.rows[0];
      const scope = siteScope(user);
      if (!row || (scope !== null && !scope.includes(row.siteId))) throw notFound('Journey');
      const sources = await tx.query(
        `SELECT j.work_order_id AS "workOrderId", w.reference_number AS "workOrderReference", j.association_role AS "associationRole",
                w.request_id AS "requestId", r.reference_number AS "requestReference", j.linked_at AS "linkedAt"
           FROM service_work_order_journeys j JOIN service_work_orders w ON w.work_order_id = j.work_order_id
           LEFT JOIN service_requests r ON r.request_id = w.request_id
          WHERE j.transport_activity_id = $1 ORDER BY j.linked_at`,
        [id]
      );
      const ghg = await tx.query(
        `SELECT id, reference_number AS "referenceNumber", activity_type AS "activityType", source_domain AS "sourceDomain",
                source_transaction_id AS "sourceTransactionId", source_entity_type AS "sourceEntityType", quantity, quantity_unit AS "quantityUnit",
                data_quality AS "dataQuality", calculation_status AS "calculationStatus", verification_status AS "verificationStatus",
                scope, category, co2e, superseded_by AS "supersededBy", created_at AS "createdAt"
           FROM ghg_activities WHERE transport_activity_id = $1`,
        [id]
      );
      const queue = await tx.query(
        `SELECT status, retry_count AS "retryCount", error_details AS "lastError", created_at AS "queuedAt", dispatched_at AS "processedAt"
           FROM workflow_outbox_events WHERE event_type = 'vms.esg.transport_activity.captured.v1' AND idempotency_key = $1`,
        [id]
      );
      return {
        transportActivity: row,
        sources: sources.rows,
        ghgActivity: ghg.rows[0] ?? null,
        captureQueue: queue.rows[0] ?? null,
        note: 'Scope, category, emission factor and CO2e are assigned by the central GHG engine (Part 16); none are entered or calculated here.',
      };
    })
  );
}
