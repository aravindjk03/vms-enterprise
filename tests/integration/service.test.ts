/**
 * Part 9 — Service / Work Management, end to end on PostgreSQL through the HTTP API.
 * Requires INTEGRATION_DATABASE_URL (see api.test.ts). Skipped when unset.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { OutboxWorker } from '../../apps/api/src/jobs/outbox-worker.js';
import { captureTransportActivity, TRANSPORT_CAPTURED_EVENT } from '../../apps/api/src/jobs/esg-capture.js';
import { ADMIN_URL, addUser, createTestEnv, type Session, type TestEnv } from './helpers.js';

const T = '00000000-0000-0000-0000-000000000001';
const ORG = '00000000-0000-0000-0000-000000000010';
const DETROIT = '00000000-0000-0000-0000-000000000101';
const CHENNAI = '00000000-0000-0000-0000-000000000102';
const KUKA = '00000000-0000-0000-0000-000000000871';
const KUKA_TECH = '00000000-0000-0000-0000-000000000881';
const HOST_MARY = '00000000-0000-0000-0000-000000000604';
const PW = 'Service#Test2026!';

const iso = (offsetHours: number, base = Date.now()) => new Date(base + offsetHours * 3_600_000).toISOString();
const dateOnly = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

describe('Part 9: Service / Work Management (API + PostgreSQL)', { skip: !ADMIN_URL && 'INTEGRATION_DATABASE_URL not set' }, () => {
  let env: TestEnv;
  let alpha: Session; // service manager (creator)
  let beta: Session; // service manager (approver)
  let ehs: Session;
  let guard: Session;
  let host: Session;
  let rival: Session;
  let secondTechId: string;
  let otherProviderTechId: string;
  let requestId: string;
  let woA: string; // main lifecycle work order
  let woB: string; // shares a journey with woA
  let leadId: string;

  before(async () => {
    env = await createTestEnv();
    const { owner } = env;
    leadId = await addUser(owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'sm.alpha', role: 'SERVICE_MANAGER', siteIds: [DETROIT], password: PW });
    await addUser(owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'sm.beta', role: 'SERVICE_MANAGER', siteIds: [DETROIT], password: PW });
    await addUser(owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'ehs.lead', role: 'EHS_MANAGER', siteIds: [DETROIT], password: PW });
    await addUser(owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'gate.det', role: 'SECURITY_GUARD', siteIds: [DETROIT], password: PW });
    // host.mary exists in the seed without a role (HOST baseline) and without site access
    await owner.query('INSERT INTO user_site_access (user_id, site_id, tenant_id, is_default) VALUES ($1, $2, $3, true)', [HOST_MARY, DETROIT, T]);
    const { setUserPassword } = await import('../../packages/database/scripts/bootstrap-user.js');
    await setUserPassword(owner, 'GLOBAL-MFG', 'host.mary', PW);

    // Second tenant with its own service manager
    await owner.query(`
      INSERT INTO tenants (tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000b2', 'RIVAL-CO', 'Rival Co');
      INSERT INTO organizations (organization_id, tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000b2', 'RIVAL', 'Rival');
      INSERT INTO roles (tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000b2', 'SERVICE_MANAGER', 'Service Manager');`);
    await addUser(owner, {
      tenantId: '00000000-0000-0000-0000-0000000000b2',
      orgId: '00000000-0000-0000-0000-0000000000b3',
      tenantCode: 'RIVAL-CO',
      username: 'rival.sm',
      role: 'SERVICE_MANAGER',
      password: PW,
    });

    [alpha, beta, ehs, guard, host, rival] = await Promise.all([
      env.login('GLOBAL-MFG', 'sm.alpha', PW),
      env.login('GLOBAL-MFG', 'sm.beta', PW),
      env.login('GLOBAL-MFG', 'ehs.lead', PW),
      env.login('GLOBAL-MFG', 'gate.det', PW),
      env.login('GLOBAL-MFG', 'host.mary', PW),
      env.login('RIVAL-CO', 'rival.sm', PW),
    ]);
    assert.equal(alpha.user.role, 'SERVICE_MANAGER');
    assert.equal(host.user.role, 'HOST');
  });

  after(async () => {
    await env?.close();
  });

  it('manages providers on the canonical organization model without duplicates', async () => {
    // Authorize the seeded provider for Detroit; registration alone grants no site.
    const upd = await alpha.patch(`/api/v1/service/providers/${KUKA}`, { siteIds: [DETROIT], categories: ['ROBOTIC_CALIBRATION', 'INSPECTION'], reason: 'annual onboarding' });
    assert.equal(upd.statusCode, 200);

    const dupOrg = await alpha.post('/api/v1/service/providers', {
      newOrganization: { code: 'KUKA-SERVICE', legalName: 'Kuka again' },
      providerCode: 'SP-X',
      categories: ['HVAC'],
    });
    assert.equal(dupOrg.statusCode, 409, 'existing organization code must be selected, not duplicated');
    const again = await alpha.post('/api/v1/service/providers', { externalOrgId: '00000000-0000-0000-0000-000000000805', providerCode: 'SP-Y', categories: ['HVAC'] });
    assert.equal(again.statusCode, 409, 'an organization has one provider relationship');

    // A contractor company can also be a service provider (same org identity).
    const apex = await alpha.post('/api/v1/service/providers', {
      externalOrgId: '00000000-0000-0000-0000-000000000802',
      providerCode: 'SP-APEX',
      categories: ['WELDING'],
      siteIds: [DETROIT],
    });
    assert.equal(apex.statusCode, 201);
    const profile = (await alpha.get(`/api/v1/service/providers/${apex.json().id}`)).json();
    assert.equal(profile.isContractor, true);

    const t2 = await alpha.post('/api/v1/service/technicians', { providerId: KUKA, newPerson: { firstName: 'Lena', lastName: 'Ortiz' }, certificationLevel: 'Field Engineer' });
    assert.equal(t2.statusCode, 201);
    secondTechId = t2.json().id;
    const t3 = await alpha.post('/api/v1/service/technicians', { providerId: apex.json().id, newPerson: { firstName: 'Omar', lastName: 'Haddad' } });
    otherProviderTechId = t3.json().id;
    const dupTech = await alpha.post('/api/v1/service/technicians', { providerId: KUKA, personId: t2.json().personId });
    assert.equal(dupTech.statusCode, 409);

    assert.equal((await host.post('/api/v1/service/technicians', { providerId: KUKA, newPerson: { firstName: 'X', lastName: 'Y' } })).statusCode, 403);
  });

  it('runs the request lifecycle with requester visibility and segregation of duties', async () => {
    const payload = {
      siteId: DETROIT,
      serviceType: 'CALIBRATION',
      serviceCategory: 'Robotic calibration',
      title: 'Recalibrate welding robot R-12',
      description: 'Drift detected on axis 4',
      priority: 'HIGH',
      equipmentTag: 'R-12',
      safetyPermitRequired: true,
      deliverables: 'Calibration certificate',
    };
    const created = await host.post('/api/v1/service/requests', payload, { 'idempotency-key': 'req-key-0001' });
    assert.equal(created.statusCode, 201);
    requestId = created.json().id;

    // Idempotent retry returns the same request; a different body under the same key is refused.
    const replay = await host.post('/api/v1/service/requests', payload, { 'idempotency-key': 'req-key-0001' });
    assert.equal(replay.json().id, requestId);
    assert.equal(replay.headers['idempotent-replay'], 'true');
    const reuse = await host.post('/api/v1/service/requests', { ...payload, title: 'Different' }, { 'idempotency-key': 'req-key-0001' });
    assert.equal(reuse.statusCode, 422);
    const count = await env.owner.query("SELECT count(*)::int AS n FROM service_requests WHERE title = 'Recalibrate welding robot R-12'");
    assert.equal(count.rows[0].n, 1);

    assert.equal((await guard.post('/api/v1/service/requests', payload)).statusCode, 403, 'guards cannot raise requests');
    const mine = (await host.get('/api/v1/service/requests')).json();
    assert.ok(mine.items.every((r: { id: string }) => r.id === requestId), 'requesters only see their own requests');

    const early = await alpha.post('/api/v1/service/work-orders', {
      requestId,
      siteId: DETROIT,
      providerId: KUKA,
      title: 'Too early',
      scopeOfWork: 'n/a',
      serviceType: 'CALIBRATION',
      serviceCategory: 'ROBOTIC_CALIBRATION',
      scheduledStart: iso(24),
      scheduledEnd: iso(26),
      maintenanceLeadId: leadId,
    });
    assert.equal(early.statusCode, 409, 'work orders need an approved request');

    assert.equal((await alpha.post(`/api/v1/service/requests/${requestId}/reject`, {})).statusCode, 400, 'rejection needs a reason');
    const approved = await alpha.post(`/api/v1/service/requests/${requestId}/approve`, { remarks: 'Budget OK' });
    assert.equal(approved.json().status, 'APPROVED');
    assert.equal((await alpha.post(`/api/v1/service/requests/${requestId}/approve`, {})).statusCode, 409);
  });

  it('creates work orders only for eligible providers and enforces approval separation', async () => {
    const base = {
      requestId,
      siteId: DETROIT,
      providerId: KUKA,
      title: 'Recalibrate R-12',
      scopeOfWork: 'Axis 4 recalibration and test run',
      serviceType: 'CALIBRATION',
      serviceCategory: 'ROBOTIC_CALIBRATION',
      scheduledStart: iso(48),
      scheduledEnd: iso(51),
      maintenanceLeadId: leadId,
      safetyPermitRequired: true,
      deliverables: [{ description: 'Calibration certificate' }, { description: 'Supervisor note', evidenceRequired: false, isMandatory: false }],
    };
    const wrongCategory = await alpha.post('/api/v1/service/work-orders', { ...base, serviceCategory: 'HVAC' });
    assert.equal(wrongCategory.statusCode, 422);
    const wrongSite = await alpha.post('/api/v1/service/work-orders', { ...base, requestId: undefined, siteId: CHENNAI });
    assert.equal(wrongSite.statusCode, 403, 'manager is not assigned to Chennai');

    const a = await alpha.post('/api/v1/service/work-orders', base);
    assert.equal(a.statusCode, 201);
    woA = a.json().id;
    const b = await alpha.post('/api/v1/service/work-orders', { ...base, title: 'Inspect R-13 (same visit)', serviceCategory: 'INSPECTION', deliverables: [], safetyPermitRequired: false, scheduledStart: iso(51), scheduledEnd: iso(52) });
    woB = b.json().id;

    const req = (await alpha.get(`/api/v1/service/requests/${requestId}`)).json();
    assert.equal(req.status, 'WORK_ORDERED');
    assert.equal(req.workOrders.length, 2, 'one request, several work orders');

    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/approve`, {})).statusCode, 403, 'creator cannot approve');
    assert.equal((await beta.post(`/api/v1/service/work-orders/${woA}/approve`, {})).json().status, 'APPROVED');
    assert.equal((await beta.post(`/api/v1/service/work-orders/${woB}/approve`, {})).json().status, 'APPROVED');
  });

  it('validates assignments and detects schedule conflicts', async () => {
    const other = await alpha.post(`/api/v1/service/work-orders/${woA}/assignments`, { technicianId: otherProviderTechId });
    assert.equal(other.statusCode, 422, 'technician must belong to the provider');

    const first = await alpha.post(`/api/v1/service/work-orders/${woA}/assignments`, { technicianId: KUKA_TECH });
    assert.equal(first.statusCode, 201);
    assert.equal(first.json().workOrderStatus, 'SCHEDULED');

    // Same technician, overlapping window on another work order -> conflict (policy BLOCK)
    const overlap = await alpha.post(`/api/v1/service/work-orders/${woB}/assignments`, {
      technicianId: KUKA_TECH,
      plannedStart: iso(50),
      plannedEnd: iso(52),
    });
    assert.equal(overlap.statusCode, 409);
    assert.equal(overlap.json().error.code, 'SCHEDULE_CONFLICT');
    // Back-to-back is not an overlap
    const adjacent = await alpha.post(`/api/v1/service/work-orders/${woB}/assignments`, { technicianId: KUKA_TECH, plannedStart: iso(51), plannedEnd: iso(52) });
    assert.equal(adjacent.statusCode, 201);
    await alpha.post(`/api/v1/service/work-orders/${woA}/assignments`, { technicianId: secondTechId });

    const calendar = (await alpha.get(`/api/v1/service/calendar?from=${iso(0)}&to=${iso(24 * 7)}`)).json();
    assert.ok(calendar.items.some((i: { id: string; technicians: unknown[] }) => i.id === woA && i.technicians.length === 2));
    assert.equal((await alpha.get(`/api/v1/service/calendar?from=${iso(0)}&to=${iso(24 * 90)}`)).statusCode, 400);
  });

  it('keeps arrival, prerequisites, start, completion and departure distinct and authorized', async () => {
    const started = await alpha.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'WORK_STARTED' });
    assert.equal(started.statusCode, 409);
    assert.equal(started.json().error.code, 'PREREQUISITES_UNMET');

    const arrived = await guard.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'ARRIVED', technicianId: KUKA_TECH });
    assert.equal(arrived.statusCode, 201);
    assert.equal(arrived.json().workOrderStatus, 'SCHEDULED', 'arrival is not work start');
    assert.equal((await guard.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'WORK_STARTED' })).statusCode, 403);
    assert.equal(
      (await guard.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'DEPARTED', technicianId: secondTechId })).statusCode,
      409,
      'departure needs an arrival'
    );

    assert.equal(
      (await alpha.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'PREREQUISITES_CHECKED', outcome: 'VERIFIED', comment: 'PTW 123' })).statusCode,
      403,
      'only authorized EHS/site roles verify prerequisites'
    );
    const verified = await ehs.post(`/api/v1/service/work-orders/${woA}/progress`, {
      eventType: 'PREREQUISITES_CHECKED',
      outcome: 'VERIFIED',
      comment: 'Hot-work permit PTW-2026-0042 checked on paper',
    });
    assert.equal(verified.statusCode, 201);

    const detail = (await alpha.get(`/api/v1/service/work-orders/${woA}`)).json();
    assert.equal(detail.integrations.safety.integration, 'UNAVAILABLE', 'no fake permit integration');
    assert.equal(detail.integrations.access.integration, 'UNAVAILABLE');

    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'WORK_STARTED' })).json().workOrderStatus, 'IN_PROGRESS');
    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'WORK_PAUSED' })).statusCode, 400, 'pause needs a reason');
    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'WORK_PAUSED', comment: 'Waiting for spare' })).json().workOrderStatus, 'ON_HOLD');
    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/cancel`, { reason: 'x' })).statusCode, 400);
    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'WORK_RESUMED' })).json().workOrderStatus, 'IN_PROGRESS');
    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/cancel`, { reason: 'changed mind' })).statusCode, 409, 'cannot cancel work in progress');

    // Corrections append; the original event is immutable even for the schema owner.
    const arrivedEvent = detail.progress.find((e: { eventType: string }) => e.eventType === 'ARRIVED');
    const corr = await alpha.post(`/api/v1/service/work-orders/${woA}/progress/${arrivedEvent.id}/corrections`, {
      occurredAt: iso(-1),
      reason: 'Guard entered arrival late',
    });
    assert.equal(corr.statusCode, 200);
    await assert.rejects(env.owner.query('UPDATE service_progress_events SET comment = $1 WHERE event_id = $2', ['tamper', arrivedEvent.id]), /append-only/);
  });

  it('requires deliverable evidence and independent acceptance before closure', async () => {
    const blocked = await alpha.post(`/api/v1/service/work-orders/${woA}/completion`, { workSummary: 'Done' });
    assert.equal(blocked.statusCode, 409);
    assert.equal(blocked.json().error.code, 'DELIVERABLES_OUTSTANDING');

    const detail = (await alpha.get(`/api/v1/service/work-orders/${woA}`)).json();
    const cert = detail.deliverables.find((d: { description: string }) => d.description === 'Calibration certificate');
    assert.equal(
      (await alpha.post(`/api/v1/service/work-orders/${woA}/deliverables/${cert.id}/evidence`, { evidenceNote: 'Certificate CAL-7781 issued by provider' })).statusCode,
      200
    );
    const submitted = await alpha.post(`/api/v1/service/work-orders/${woA}/completion`, { workSummary: 'Axis 4 recalibrated, test run passed' });
    assert.equal(submitted.json().workOrderStatus, 'COMPLETION_SUBMITTED');

    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/completion/accept`, {})).statusCode, 403, 'submitter cannot accept');
    assert.equal((await beta.post(`/api/v1/service/work-orders/${woA}/completion/return`, {})).statusCode, 400);
    assert.equal((await beta.post(`/api/v1/service/work-orders/${woA}/completion/return`, { remarks: 'Attach torque log' })).json().status, 'IN_PROGRESS');
    await alpha.post(`/api/v1/service/work-orders/${woA}/completion`, { workSummary: 'Torque log attached' });
    assert.equal((await beta.post(`/api/v1/service/work-orders/${woA}/completion/accept`, { remarks: 'Verified' })).json().status, 'COMPLETED');

    const departed = await guard.post(`/api/v1/service/work-orders/${woA}/progress`, { eventType: 'DEPARTED', technicianId: KUKA_TECH });
    assert.equal(departed.json().workOrderStatus, 'COMPLETED', 'departure does not change completion');
    assert.equal((await alpha.post(`/api/v1/service/work-orders/${woA}/close`, {})).json().status, 'CLOSED');

    const fulfilEarly = await alpha.post(`/api/v1/service/requests/${requestId}/fulfil`, {});
    assert.equal(fulfilEarly.statusCode, 409, 'other work order still open');
  });

  it('captures transport facts once per physical journey and queues GHG capture durably', async () => {
    const facts = {
      technicianId: KUKA_TECH,
      activityDate: dateOnly(2),
      modeCode: 'CAR',
      ownershipCode: 'COMPANY',
      vehicleTypeCode: 'SEDAN',
      fuelCode: 'DIESEL',
      occupancy: 1,
      originName: 'Kuka depot',
      originCity: 'Sterling Heights',
      destinationName: 'Detroit Assembly',
      destinationCity: 'Detroit',
      distanceKm: 38.4,
      journeyType: 'ROUND_TRIP',
      direction: 'BOTH',
      measurementMethod: 'ODOMETER',
    };
    const first = await alpha.post(`/api/v1/service/work-orders/${woA}/journeys`, facts, { 'idempotency-key': 'journey-key-01' });
    assert.equal(first.statusCode, 201);
    assert.equal(first.json().activityCapture, 'QUEUED', 'not "captured" before the ledger record exists');
    const journeyId = first.json().transportActivityId;

    // Same physical trip recorded from the second work order: linked, not duplicated.
    const shared = await alpha.post(`/api/v1/service/work-orders/${woB}/journeys`, facts);
    assert.equal(shared.statusCode, 200);
    assert.equal(shared.json().deduplicated, true);
    assert.equal(shared.json().transportActivityId, journeyId);

    // A one-way leg on top of the recorded round trip would double count distance.
    const leg = await alpha.post(`/api/v1/service/work-orders/${woB}/journeys`, { ...facts, journeyType: 'ONE_WAY', direction: 'OUTBOUND', originName: 'Detroit Assembly', destinationName: 'Kuka depot' });
    assert.equal(leg.statusCode, 409);
    assert.equal(leg.json().error.code, 'POSSIBLE_DUPLICATE_JOURNEY');

    // GHG processing outage: the event is retried later; service records are untouched.
    const failing = new OutboxWorker(env.appDb, { [TRANSPORT_CAPTURED_EVENT]: async () => { throw new Error('GHG ledger unavailable'); } });
    const r1 = await failing.runOnce();
    assert.ok(r1.failed >= 1);
    const queued = (await alpha.get(`/api/v1/service/journeys/${journeyId}/trace`)).json();
    assert.equal(queued.ghgActivity, null);
    assert.equal(queued.captureQueue.status, 'PENDING');
    assert.equal(queued.captureQueue.retryCount, 1);
    assert.equal((await alpha.get(`/api/v1/service/work-orders/${woA}`)).json().status, 'CLOSED');

    await env.owner.query("UPDATE workflow_outbox_events SET next_attempt_at = now() WHERE status = 'PENDING'");
    const worker = new OutboxWorker(env.appDb, { [TRANSPORT_CAPTURED_EVENT]: captureTransportActivity });
    await worker.runOnce();
    await worker.runOnce();
    const traced = (await alpha.get(`/api/v1/service/journeys/${journeyId}/trace`)).json();
    assert.equal(traced.captureQueue.status, 'DISPATCHED');
    assert.equal(traced.ghgActivity.sourceDomain, 'SERVICE');
    assert.equal(traced.ghgActivity.sourceTransactionId, woA);
    assert.equal(traced.ghgActivity.calculationStatus, 'PENDING_CALCULATION');
    assert.equal(traced.ghgActivity.co2e, null, 'no CO2e computed in the source workflow');
    assert.equal(traced.ghgActivity.scope, null);
    assert.deepEqual(traced.sources.map((s: { workOrderId: string }) => s.workOrderId).sort(), [woA, woB].sort());
    const ghgCount = await env.owner.query('SELECT count(*)::int AS n FROM ghg_activities WHERE transport_activity_id = $1', [journeyId]);
    assert.equal(ghgCount.rows[0].n, 1, 'one GHG activity for one physical journey, even with two work orders');

    // Unknown distance is stored as unknown and flagged, never estimated.
    const sparse = await alpha.post(`/api/v1/service/work-orders/${woA}/journeys`, {
      technicianId: secondTechId,
      activityDate: dateOnly(2),
      modeCode: 'TRAIN',
      originCity: 'Ann Arbor',
      destinationCity: 'Detroit',
      journeyType: 'ONE_WAY',
      direction: 'INBOUND',
    });
    assert.equal(sparse.json().completeness, 'INSUFFICIENT');
    assert.deepEqual(sparse.json().missingFacts, ['distance']);
    const sparseRun = await worker.runOnce();
    const outboxErr = await env.owner.query("SELECT status, error_details FROM workflow_outbox_events WHERE idempotency_key = $1", [sparse.json().transportActivityId]);
    assert.equal(sparseRun.failed, 0, JSON.stringify(outboxErr.rows));
    const sparseTrace = (await alpha.get(`/api/v1/service/journeys/${sparse.json().transportActivityId}/trace`)).json();
    assert.equal(sparseTrace.ghgActivity.calculationStatus, 'NEEDS_DATA');
    assert.equal(sparseTrace.ghgActivity.quantity, null);

    // Correction creates a new version; old journey and its GHG activity are superseded, not edited.
    const corrected = await alpha.post(`/api/v1/service/journeys/${journeyId}/corrections`, { ...facts, distanceKm: 41.2, reason: 'Odometer photo re-read' });
    assert.equal(corrected.statusCode, 201);
    await worker.runOnce();
    const oldTrace = (await alpha.get(`/api/v1/service/journeys/${journeyId}/trace`)).json();
    const newTrace = (await alpha.get(`/api/v1/service/journeys/${corrected.json().transportActivityId}/trace`)).json();
    assert.equal(oldTrace.transportActivity.supersededBy, corrected.json().transportActivityId);
    assert.equal(oldTrace.ghgActivity.calculationStatus, 'SUPERSEDED');
    assert.equal(Number(newTrace.ghgActivity.quantity), 41.2);
    assert.equal(newTrace.sources.length, 2, 'both work orders follow the corrected journey');

    const wo = (await alpha.get(`/api/v1/service/work-orders/${woA}`)).json();
    assert.ok(wo.journeys.some((j: { activityCapture: string }) => j.activityCapture === 'SUPERSEDED'));
    assert.ok(wo.journeys.some((j: { activityCapture: string }) => j.activityCapture === 'CAPTURED'));
  });

  it('generates recurring occurrences idempotently and flags missed ones', async () => {
    const schedule = await alpha.post('/api/v1/service/schedules', {
      siteId: DETROIT,
      providerId: KUKA,
      title: 'Weekly robot inspection',
      scopeOfWork: 'Visual inspection of welding cell',
      serviceCategory: 'INSPECTION',
      maintenanceLeadId: leadId,
      frequency: 'WEEKLY',
      byWeekdays: [1, 3],
      startDate: dateOnly(-21),
      windowStartTime: '07:00',
      durationMinutes: 60,
      deliverables: ['Inspection checklist'],
    });
    assert.equal(schedule.statusCode, 201);
    assert.equal(schedule.json().timezone, 'America/Detroit', 'site time zone applied');
    const sid = schedule.json().id;

    assert.equal((await alpha.post(`/api/v1/service/schedules/${sid}/generate`, { from: dateOnly(-21), to: dateOnly(14) })).statusCode, 409, 'draft schedules do not generate work');
    assert.equal((await alpha.post(`/api/v1/service/schedules/${sid}/approve`, {})).statusCode, 403, 'creator cannot approve');
    assert.equal((await beta.post(`/api/v1/service/schedules/${sid}/approve`, {})).json().status, 'ACTIVE');

    const gen1 = (await alpha.post(`/api/v1/service/schedules/${sid}/generate`, { from: dateOnly(-21), to: dateOnly(14) })).json();
    assert.ok(gen1.created >= 9 && gen1.created <= 11, `twice weekly over 5 weeks, got ${gen1.created}`);
    const gen2 = (await alpha.post(`/api/v1/service/schedules/${sid}/generate`, { from: dateOnly(-21), to: dateOnly(14) })).json();
    assert.equal(gen2.created, 0);
    assert.equal(gen2.existing, gen1.created);
    const workOrders = await env.owner.query(
      'SELECT count(DISTINCT w.work_order_id)::int AS n FROM service_occurrences o JOIN service_work_orders w ON w.occurrence_id = o.occurrence_id WHERE o.schedule_id = $1',
      [sid]
    );
    assert.equal(workOrders.rows[0].n, gen1.created, 'each occurrence has its own work order');

    const sweep = (await alpha.post('/api/v1/service/occurrences/sweep-missed', { graceMinutes: 0 })).json();
    assert.ok(sweep.missed >= 5, 'past occurrences with no work are missed');
    const sweepAgain = (await alpha.post('/api/v1/service/occurrences/sweep-missed', { graceMinutes: 0 })).json();
    assert.equal(sweepAgain.missed, 0);
    const completedFake = await env.owner.query("SELECT count(*)::int AS n FROM service_occurrences WHERE schedule_id = $1 AND status = 'COMPLETED'", [sid]);
    assert.equal(completedFake.rows[0].n, 0, 'missed work is never marked complete');
    const exceptions = (await alpha.get('/api/v1/service/exceptions?status=OPEN')).json();
    assert.equal(exceptions.items.filter((e: { exceptionType: string }) => e.exceptionType === 'MISSED_OCCURRENCE').length, sweep.missed);
  });

  it('reports analytics from persisted data only', async () => {
    const s = (await alpha.get('/api/v1/service/analytics/summary')).json();
    assert.equal(typeof s.openRequests, 'number');
    assert.ok(s.openExceptions >= 5);
    assert.ok(s.activityCapture.journeys >= 2);
    assert.ok(s.activityCapture.capturedInLedger >= 2);
    assert.equal('co2e' in s, false, 'no GHG totals in service analytics');
  });

  it('isolates tenants and enforces row-level security on service tables', async () => {
    assert.equal((await rival.get('/api/v1/service/work-orders')).json().total, 0);
    assert.equal((await rival.get(`/api/v1/service/work-orders/${woA}`)).statusCode, 404);
    assert.equal((await rival.get(`/api/v1/service/providers/${KUKA}`)).statusCode, 404);
    assert.equal((await rival.post(`/api/v1/service/work-orders/${woB}/assignments`, { technicianId: secondTechId })).statusCode, 404);
    const journeys = await env.owner.query('SELECT id FROM transport_activities LIMIT 1');
    assert.equal((await rival.get(`/api/v1/service/journeys/${journeys.rows[0].id}/trace`)).statusCode, 404);

    const noContext = await env.appDb.query('SELECT count(*)::int AS n FROM service_work_orders');
    assert.equal(noContext.rows[0].n, 0);
    await assert.rejects(env.appDb.query('DELETE FROM service_status_history'), /permission denied/);
    assert.equal((await alpha.get(`/api/v1/service/work-orders/${randomUUID()}`)).statusCode, 404);
  });
});
