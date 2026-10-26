import { createHash } from 'node:crypto';

/**
 * Transport facts captured inside the Service workflow. Users record operational facts only;
 * scope, category, emission factors and CO2e are assigned later by the central GHG engine.
 */
export const JOURNEY_TYPES = ['ONE_WAY', 'ROUND_TRIP', 'MULTI_STOP', 'UNKNOWN'] as const;
export const JOURNEY_DIRECTIONS = ['INBOUND', 'OUTBOUND', 'BOTH'] as const;
export const USAGE_TYPES = ['INDIVIDUAL', 'SHARED', 'CARPOOL', 'COMPANY_POOL', 'PUBLIC_TRANSPORT', 'OTHER'] as const;
export const MEASUREMENT_METHODS = ['ODOMETER', 'GPS_TRACKED', 'ROUTE_ESTIMATE', 'USER_REPORTED', 'UNKNOWN'] as const;
export const DATA_SOURCES = ['SERVICE_FORM', 'PROVIDER_REPORT', 'IMPORTED'] as const;

/** Modes for which a road-vehicle type / fuel is meaningful. */
const ROAD_VEHICLE_MODES = new Set(['CAR', 'TWO_WHEELER', 'TAXI_CAB', 'TRUCK', 'BUS']);

export interface JourneyFacts {
  personId: string | null;
  activityDate: string; // YYYY-MM-DD
  modeCode: string | null; // null = unknown
  ownershipCode: string | null;
  vehicleTypeCode: string | null;
  fuelCode: string | null;
  usageType: string | null;
  occupancy: number | null;
  originName: string | null;
  originCity: string | null;
  destinationName: string | null;
  destinationCity: string | null;
  distanceKm: number | null;
  journeyType: (typeof JOURNEY_TYPES)[number];
  direction: (typeof JOURNEY_DIRECTIONS)[number] | null;
  measurementMethod: (typeof MEASUREMENT_METHODS)[number];
  vehicleRegistration?: string | null;
}

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Identity of one physical journey: the same traveller on the same day over the same route,
 * mode and direction is the same trip, whichever work order it is captured from. Used to link a
 * shared trip to several work orders instead of recording it twice.
 * Returns null when the facts are too sparse to identify a trip safely (no de-duplication).
 */
export function journeyFingerprint(tenantId: string, facts: JourneyFacts): string | null {
  const route = norm(facts.originName) || norm(facts.originCity);
  const dest = norm(facts.destinationName) || norm(facts.destinationCity);
  if (!facts.personId || !route || !dest) return null;
  const key = [
    tenantId,
    facts.personId,
    facts.activityDate,
    route,
    dest,
    facts.modeCode ?? 'unknown',
    facts.journeyType,
    facts.direction ?? '',
    norm(facts.vehicleRegistration),
  ].join('|');
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Unordered route identity (traveller, day, endpoints in either direction). Used to stop a
 * one-way leg being recorded on top of a round trip that already covers it (or vice versa).
 */
export function routePairKey(facts: JourneyFacts): string | null {
  const a = norm(facts.originName) || norm(facts.originCity);
  const b = norm(facts.destinationName) || norm(facts.destinationCity);
  if (!facts.personId || !a || !b) return null;
  return [facts.personId, facts.activityDate, ...[a, b].sort()].join('|');
}

export interface CompletenessAssessment {
  completeness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  missing: string[];
}

/** Lists facts the GHG engine will need but that were not provided (never filled with guesses). */
export function assessJourneyCompleteness(facts: JourneyFacts): CompletenessAssessment {
  const missing: string[] = [];
  if (!facts.modeCode) missing.push('transport mode');
  if (facts.distanceKm == null) missing.push('distance');
  if (!facts.originName && !facts.originCity) missing.push('origin');
  if (!facts.destinationName && !facts.destinationCity) missing.push('destination');
  if (facts.modeCode && ROAD_VEHICLE_MODES.has(facts.modeCode)) {
    if (!facts.fuelCode) missing.push('fuel type');
    if (!facts.ownershipCode) missing.push('vehicle ownership');
  }
  if (facts.journeyType === 'UNKNOWN') missing.push('journey type');
  const critical = missing.includes('transport mode') || missing.includes('distance');
  return { completeness: missing.length === 0 ? 'COMPLETE' : critical ? 'INSUFFICIENT' : 'PARTIAL', missing };
}

/** Rejects contradictory fact combinations instead of silently storing them. */
export function validateJourneyFacts(facts: JourneyFacts): string[] {
  const errors: string[] = [];
  if (facts.distanceKm != null && (!(facts.distanceKm >= 0) || facts.distanceKm > 20_000)) errors.push('Distance must be between 0 and 20,000 km.');
  if (facts.occupancy != null && (!Number.isInteger(facts.occupancy) || facts.occupancy < 1 || facts.occupancy > 120)) {
    errors.push('Occupancy must be a whole number of people (1–120).');
  }
  if (facts.modeCode && !ROAD_VEHICLE_MODES.has(facts.modeCode) && (facts.fuelCode || facts.vehicleTypeCode)) {
    errors.push(`Vehicle type and fuel do not apply to ${facts.modeCode.toLowerCase().replace(/_/g, ' ')} journeys.`);
  }
  if (facts.measurementMethod !== 'UNKNOWN' && facts.distanceKm == null) {
    errors.push('A measurement method was given without a distance.');
  }
  return errors;
}
