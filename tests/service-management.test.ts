import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DomainRuleError,
  assessJourneyCompleteness,
  expandOccurrences,
  findOverlaps,
  journeyFingerprint,
  nextRequestStatus,
  nextWorkOrderStatus,
  outstandingDeliverables,
  providerEligibility,
  routePairKey,
  technicianEligibility,
  validateJourneyFacts,
  zonedTimeToUtc,
  UnavailableSafetyAdapter,
  UnavailableAccessAdapter,
  type JourneyFacts,
} from '@vms/service';
import { evaluateAccess, ROLE_PERMISSIONS } from '@vms/permissions';

const facts = (over: Partial<JourneyFacts> = {}): JourneyFacts => ({
  personId: 'person-1',
  activityDate: '2026-11-02',
  modeCode: 'CAR',
  ownershipCode: 'COMPANY',
  vehicleTypeCode: 'SEDAN',
  fuelCode: 'DIESEL',
  usageType: 'INDIVIDUAL',
  occupancy: 1,
  originName: 'Provider depot',
  originCity: 'Troy',
  destinationName: 'Detroit plant',
  destinationCity: 'Detroit',
  distanceKm: 32.5,
  journeyType: 'ONE_WAY',
  direction: 'INBOUND',
  measurementMethod: 'ODOMETER',
  ...over,
});

describe('Part 9: Service request lifecycle', () => {
  it('approves, orders work and fulfils in order', () => {
    assert.equal(nextRequestStatus('SUBMITTED', 'APPROVE'), 'APPROVED');
    assert.equal(nextRequestStatus('APPROVED', 'WORK_ORDER_CREATED'), 'WORK_ORDERED');
    assert.equal(nextRequestStatus('WORK_ORDERED', 'WORK_ORDER_CREATED'), 'WORK_ORDERED', 'several work orders per request');
    assert.equal(nextRequestStatus('WORK_ORDERED', 'FULFIL'), 'FULFILLED');
  });

  it('rejects invalid transitions', () => {
    assert.throws(() => nextRequestStatus('SUBMITTED', 'WORK_ORDER_CREATED'), DomainRuleError);
    assert.throws(() => nextRequestStatus('REJECTED', 'APPROVE'), /not allowed/);
    assert.throws(() => nextRequestStatus('FULFILLED', 'CANCEL'), /not allowed/);
  });
});

describe('Part 9: Work order lifecycle', () => {
  const ready = { hasActiveAssignment: true, prerequisitesRequired: false, prerequisitesSatisfied: false, outstandingDeliverables: [] };

  it('keeps arrival, start, completion and departure distinct', () => {
    assert.equal(nextWorkOrderStatus('SCHEDULED', 'ARRIVED'), 'SCHEDULED', 'arrival is not work start');
    assert.equal(nextWorkOrderStatus('SCHEDULED', 'WORK_STARTED', ready), 'IN_PROGRESS');
    assert.equal(nextWorkOrderStatus('IN_PROGRESS', 'WORK_PAUSED'), 'ON_HOLD');
    assert.equal(nextWorkOrderStatus('ON_HOLD', 'WORK_RESUMED'), 'IN_PROGRESS');
    assert.equal(nextWorkOrderStatus('IN_PROGRESS', 'COMPLETION_SUBMITTED', ready), 'COMPLETION_SUBMITTED');
    assert.equal(nextWorkOrderStatus('COMPLETION_SUBMITTED', 'DEPARTED'), 'COMPLETION_SUBMITTED', 'departure is not completion');
    assert.equal(nextWorkOrderStatus('COMPLETION_SUBMITTED', 'COMPLETION_RETURNED'), 'IN_PROGRESS');
    assert.equal(nextWorkOrderStatus('COMPLETION_SUBMITTED', 'COMPLETION_ACCEPTED'), 'COMPLETED');
    assert.equal(nextWorkOrderStatus('COMPLETED', 'CLOSED'), 'CLOSED');
  });

  it('requires a technician and verified prerequisites before work starts', () => {
    assert.throws(() => nextWorkOrderStatus('SCHEDULED', 'WORK_STARTED', { ...ready, hasActiveAssignment: false }), /Assign a technician/);
    assert.throws(
      () => nextWorkOrderStatus('SCHEDULED', 'WORK_STARTED', { ...ready, prerequisitesRequired: true, prerequisitesSatisfied: false }),
      (e: DomainRuleError) => e.code === 'PREREQUISITES_UNMET'
    );
    assert.equal(nextWorkOrderStatus('SCHEDULED', 'WORK_STARTED', { ...ready, prerequisitesRequired: true, prerequisitesSatisfied: true }), 'IN_PROGRESS');
  });

  it('blocks completion while mandatory deliverables lack evidence', () => {
    const outstanding = outstandingDeliverables([
      { description: 'Calibration certificate', isMandatory: true, evidenceRequired: true, satisfiedAt: new Date(), hasEvidence: false },
      { description: 'Photo of nameplate', isMandatory: true, evidenceRequired: true, satisfiedAt: new Date(), hasEvidence: true },
      { description: 'Optional note', isMandatory: false, evidenceRequired: false, satisfiedAt: null, hasEvidence: false },
    ]);
    assert.deepEqual(outstanding, ['Calibration certificate']);
    assert.throws(
      () => nextWorkOrderStatus('IN_PROGRESS', 'COMPLETION_SUBMITTED', { ...ready, outstandingDeliverables: outstanding }),
      /Calibration certificate/
    );
  });

  it('rejects illegal transitions', () => {
    assert.throws(() => nextWorkOrderStatus('PENDING_APPROVAL', 'WORK_STARTED', ready), /not allowed/);
    assert.throws(() => nextWorkOrderStatus('IN_PROGRESS', 'CANCELLED'), /not allowed/);
    assert.throws(() => nextWorkOrderStatus('CLOSED', 'COMPLETION_RETURNED'), /not allowed/);
  });
});

describe('Part 9: Provider and technician eligibility', () => {
  const provider = { status: 'ACTIVE', categories: ['ROBOTIC_CALIBRATION'], siteIds: ['site-a'], effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' };
  const on = new Date('2026-11-02T10:00:00Z');

  it('accepts an active, in-date provider authorized for site and category', () => {
    assert.deepEqual(providerEligibility(provider, 'site-a', 'ROBOTIC_CALIBRATION', on), []);
  });

  it('reports every reason a provider is ineligible', () => {
    const reasons = providerEligibility({ ...provider, status: 'SUSPENDED' }, 'site-b', 'HVAC', new Date('2027-02-01'));
    assert.equal(reasons.length, 4);
  });

  it('only assigns technicians of the work order provider', () => {
    const tech = { status: 'ACTIVE', serviceProviderId: 'p1', effectiveFrom: null, effectiveTo: null };
    assert.deepEqual(technicianEligibility(tech, 'p1', on), []);
    assert.match(technicianEligibility(tech, 'p2', on)[0], /does not belong/);
  });
});

describe('Part 9: Scheduling', () => {
  const w = (s: string, e: string, id?: string) => ({ id, start: new Date(s), end: new Date(e) });

  it('detects overlaps but allows back-to-back windows', () => {
    const existing = [w('2026-11-02T08:00:00Z', '2026-11-02T10:00:00Z', 'a'), w('2026-11-02T12:00:00Z', '2026-11-02T13:00:00Z', 'b')];
    assert.equal(findOverlaps(w('2026-11-02T09:30:00Z', '2026-11-02T11:00:00Z'), existing).length, 1);
    assert.equal(findOverlaps(w('2026-11-02T10:00:00Z', '2026-11-02T12:00:00Z'), existing).length, 0);
  });

  it('converts site-local times across daylight-saving changes', () => {
    assert.equal(zonedTimeToUtc('2026-07-01', '09:00', 'America/Detroit').toISOString(), '2026-07-01T13:00:00.000Z');
    assert.equal(zonedTimeToUtc('2026-12-01', '09:00', 'America/Detroit').toISOString(), '2026-12-01T14:00:00.000Z');
    assert.equal(zonedTimeToUtc('2026-12-01', '09:00', 'Asia/Kolkata').toISOString(), '2026-12-01T03:30:00.000Z');
  });

  it('expands weekly, monthly and daily templates deterministically', () => {
    const weekly = { frequency: 'WEEKLY' as const, intervalCount: 1, byWeekdays: [1, 4], startDate: '2026-11-02', windowStartTime: '08:00', durationMinutes: 120, timezone: 'UTC' };
    const a = expandOccurrences(weekly, '2026-11-01', '2026-11-15');
    const b = expandOccurrences(weekly, '2026-11-01', '2026-11-15');
    assert.deepEqual(a.map(o => o.occurrenceDate), ['2026-11-02', '2026-11-05', '2026-11-09', '2026-11-12']);
    assert.deepEqual(a, b, 'same input, same occurrences');
    assert.equal(a[0].plannedEnd.getTime() - a[0].plannedStart.getTime(), 120 * 60_000);

    const monthly = { frequency: 'MONTHLY' as const, intervalCount: 2, dayOfMonth: 15, startDate: '2026-01-10', windowStartTime: '07:30', durationMinutes: 60, timezone: 'UTC' };
    assert.deepEqual(expandOccurrences(monthly, '2026-01-01', '2026-08-31').map(o => o.occurrenceDate), ['2026-01-15', '2026-03-15', '2026-05-15', '2026-07-15']);

    const daily = { frequency: 'DAILY' as const, intervalCount: 3, startDate: '2026-11-01', endDate: '2026-11-09', windowStartTime: '06:00', durationMinutes: 30, timezone: 'UTC' };
    assert.deepEqual(expandOccurrences(daily, '2026-10-01', '2026-12-31').map(o => o.occurrenceDate), ['2026-11-01', '2026-11-04', '2026-11-07']);
  });

  it('rejects invalid templates and oversized ranges', () => {
    const base = { frequency: 'DAILY' as const, intervalCount: 1, startDate: '2026-11-01', windowStartTime: '06:00', durationMinutes: 30, timezone: 'UTC' };
    assert.throws(() => expandOccurrences({ ...base, timezone: 'Mars/Olympus' }, '2026-11-01', '2026-11-02'), /time zone/);
    assert.throws(() => expandOccurrences({ ...base, endDate: '2026-10-01' }, '2026-11-01', '2026-11-02'), /End date/);
    assert.throws(() => expandOccurrences(base, '2026-01-01', '2027-06-01'), /at most one year/);
  });
});

describe('Part 9: Transport capture rules', () => {
  it('identifies the same physical journey regardless of the work order', () => {
    assert.equal(journeyFingerprint('t1', facts()), journeyFingerprint('t1', facts()));
    assert.notEqual(journeyFingerprint('t1', facts()), journeyFingerprint('t1', facts({ activityDate: '2026-11-03' })));
    assert.notEqual(journeyFingerprint('t1', facts()), journeyFingerprint('t2', facts()), 'tenant scoped');
    assert.equal(journeyFingerprint('t1', facts({ personId: null })), null, 'no de-duplication without a traveller');
  });

  it('pairs a one-way leg with a round trip on the same route', () => {
    const roundTrip = facts({ journeyType: 'ROUND_TRIP', direction: 'BOTH' });
    const returnLeg = facts({ originName: 'Detroit plant', destinationName: 'Provider depot', direction: 'OUTBOUND' });
    assert.equal(routePairKey(roundTrip), routePairKey(returnLeg));
  });

  it('records unknown facts as missing instead of inventing them', () => {
    assert.deepEqual(assessJourneyCompleteness(facts()), { completeness: 'COMPLETE', missing: [] });
    const sparse = assessJourneyCompleteness(facts({ distanceKm: null, measurementMethod: 'UNKNOWN', fuelCode: null }));
    assert.equal(sparse.completeness, 'INSUFFICIENT');
    assert.deepEqual(sparse.missing, ['distance', 'fuel type']);
    assert.equal(assessJourneyCompleteness(facts({ modeCode: 'TRAIN', fuelCode: null, vehicleTypeCode: null, ownershipCode: null })).completeness, 'COMPLETE');
  });

  it('rejects contradictory facts', () => {
    assert.match(validateJourneyFacts(facts({ modeCode: 'TRAIN' }))[0], /do not apply to train/);
    assert.match(validateJourneyFacts(facts({ distanceKm: -1 }))[0], /Distance/);
    assert.match(validateJourneyFacts(facts({ distanceKm: null }))[0], /without a distance/);
  });
});

describe('Part 9: Integration boundaries and roles', () => {
  it('reports Safety and Gate integrations as unavailable instead of faking results', async () => {
    const safety = await new UnavailableSafetyAdapter().getPrerequisiteStatus({ tenantId: 't', workOrderId: 'w', siteId: 's', permitRequired: true });
    assert.equal(safety.integration, 'UNAVAILABLE');
    assert.equal(safety.permitStatus, 'UNKNOWN');
    const access = await new UnavailableAccessAdapter().getTechnicianAccessStatus({ tenantId: 't', siteId: 's', personId: 'p' });
    assert.equal(access.lastObservedEvent, null);
  });

  it('grants service capabilities by role', () => {
    const user = (role: keyof typeof ROLE_PERMISSIONS) => ({ userId: 'u', tenantId: 't', organizationId: 'o', role });
    const can = (role: keyof typeof ROLE_PERMISSIONS, perm: string) => evaluateAccess(user(role), perm as never, { tenantId: 't' }).allowed;
    assert.equal(can('SERVICE_MANAGER', 'SERVICE_APPROVE'), true);
    assert.equal(can('SERVICE_MANAGER', 'SERVICE_ACCEPT'), true);
    assert.equal(can('HOST', 'SERVICE_REQUEST_CREATE'), true);
    assert.equal(can('HOST', 'SERVICE_MANAGE'), false);
    assert.equal(can('SECURITY_GUARD', 'SERVICE_ARRIVAL_RECORD'), true);
    assert.equal(can('SECURITY_GUARD', 'SERVICE_EXECUTE'), false);
    assert.equal(can('EHS_MANAGER', 'SERVICE_PREREQ_VERIFY'), true);
    assert.equal(can('EHS_MANAGER', 'SERVICE_ACCEPT'), false);
    assert.equal(can('AUDITOR', 'SERVICE_READ'), true);
    assert.equal(can('AUDITOR', 'SERVICE_MANAGE'), false);
  });
});
