import { randomBytes } from 'node:crypto';
import type { Tx } from '../db.js';
import type { OutboxEvent, OutboxHandler } from './outbox-worker.js';

export const TRANSPORT_CAPTURED_EVENT = 'vms.esg.transport_activity.captured.v1';

const DATA_QUALITY_BY_METHOD: Record<string, string | null> = {
  ODOMETER: 'MEASURED',
  GPS_TRACKED: 'MEASURED',
  ROUTE_ESTIMATE: 'SYSTEM_ESTIMATED',
  USER_REPORTED: 'USER_PROVIDED',
  UNKNOWN: null,
};

/** Queues source-linked GHG capture in the same transaction as the transport activity. */
export async function enqueueTransportCapture(
  tx: Tx,
  input: { tenantId: string; transportActivityId: string; sourceDomain: string; sourceEntityType: string; sourceEntityId: string }
): Promise<void> {
  await tx.query(
    `INSERT INTO workflow_outbox_events (tenant_id, event_type, payload, idempotency_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, event_type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`,
    [
      input.tenantId,
      TRANSPORT_CAPTURED_EVENT,
      JSON.stringify({
        transportActivityId: input.transportActivityId,
        sourceDomain: input.sourceDomain,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
      }),
      input.transportActivityId,
    ]
  );
}

/**
 * Creates the source-linked GHG activity for a captured transport activity.
 * Idempotent (unique per transport activity). Never assigns scope/category/factor/CO2e:
 * those belong to the central calculation engine (Part 16). Missing facts stay missing.
 */
export const captureTransportActivity: OutboxHandler = async (tx: Tx, event: OutboxEvent) => {
  const { transportActivityId, sourceEntityType } = event.payload as { transportActivityId: string; sourceEntityType: string };
  const { rows } = await tx.query<{
    id: string;
    tenant_id: string;
    site_id: string;
    source_domain: string;
    source_transaction_id: string;
    activity_date: Date;
    transport_mode_id: string | null;
    vehicle_type_id: string | null;
    fuel_type_id: string | null;
    occupancy: number | null;
    origin_location_name: string | null;
    origin_city: string | null;
    destination_location_name: string | null;
    destination_city: string | null;
    distance: string | null;
    distance_unit: string | null;
    measurement_method: string | null;
    missing_facts: string[] | null;
    superseded_by: string | null;
    supersedes: string | null;
  }>('SELECT * FROM transport_activities WHERE id = $1', [transportActivityId]);
  const activity = rows[0];
  if (!activity) {
    throw new Error(`Transport activity ${transportActivityId} not found for GHG capture`);
  }
  if (activity.superseded_by) {
    // Corrected before capture: the replacement activity carries its own capture event.
    return;
  }

  const missing = activity.missing_facts ?? [];
  const calculationStatus = missing.includes('distance') || missing.includes('transport mode') ? 'NEEDS_DATA' : 'PENDING_CALCULATION';
  const inserted = await tx.query<{ id: string }>(
    `INSERT INTO ghg_activities
       (reference_number, tenant_id, site_id, source_domain, source_transaction_id, source_activity_id, source_entity_type,
        transport_activity_id, activity_type, activity_date, quantity, quantity_unit, transport_mode_id, vehicle_type_id,
        fuel_type_id, occupancy, origin, destination, distance, distance_unit, data_quality, calculation_status,
        verification_status, missing_facts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $6, 'PERSON_TRAVEL', $8, $9, $10, $11, $12, $13, $14, $15, $16, $9, $10, $17, $18, 'UNVERIFIED', $19)
     ON CONFLICT (transport_activity_id) WHERE transport_activity_id IS NOT NULL DO NOTHING
     RETURNING id`,
    [
      `GHG-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`,
      activity.tenant_id,
      activity.site_id,
      activity.source_domain,
      activity.source_transaction_id,
      activity.id,
      sourceEntityType,
      activity.activity_date,
      activity.distance,
      activity.distance == null ? null : activity.distance_unit || 'km',
      activity.transport_mode_id,
      activity.vehicle_type_id,
      activity.fuel_type_id,
      activity.occupancy,
      activity.origin_location_name || activity.origin_city,
      activity.destination_location_name || activity.destination_city,
      DATA_QUALITY_BY_METHOD[activity.measurement_method ?? 'UNKNOWN'] ?? null,
      calculationStatus,
      missing,
    ]
  );

  // A correction replaces the earlier activity's GHG record rather than editing it.
  if (inserted.rows[0] && activity.supersedes) {
    await tx.query(
      `UPDATE ghg_activities SET calculation_status = 'SUPERSEDED', superseded_by = $1, updated_at = now()
        WHERE transport_activity_id = $2 AND superseded_by IS NULL`,
      [inserted.rows[0].id, activity.supersedes]
    );
  }
};
