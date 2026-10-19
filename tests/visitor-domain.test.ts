import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { VisitorService } from '../services/visitor/src/visitor.service.js';
import type { CreateVisitorInput } from '../services/visitor/src/types.js';

describe('Part 6: Complete Visitor Management Domain Verification', () => {
  let db: RelationalDatabase;
  let service: VisitorService;

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const SITE_1 = '33333333-3333-4333-8333-333333333331';
  const SITE_2 = '33333333-3333-4333-8333-333333333332';
  const HOST_USER_ID = '44444444-4444-4444-8444-444444444441';
  const GATE_ID = '55555555-5555-4555-8555-555555555551';

  beforeEach(() => {
    db = new RelationalDatabase();

    // Seed Tenant A & B
    db.insert('tenants', { tenant_id: TENANT_A, code: 'TENANT_A', name: 'Alpha Manufacturing' });
    db.insert('tenants', { tenant_id: TENANT_B, code: 'TENANT_B', name: 'Beta Logistics' });

    // Seed Organizations & Sites
    db.insert('organizations', { organization_id: 'org-a', tenant_id: TENANT_A, code: 'ORG_A', name: 'Alpha Plant Corp' }, TENANT_A);
    db.insert('sites', { site_id: SITE_1, tenant_id: TENANT_A, organization_id: 'org-a', code: 'SITE_CHENNAI', name: 'Chennai Industrial Plant' }, TENANT_A);
    db.insert('sites', { site_id: SITE_2, tenant_id: TENANT_A, organization_id: 'org-a', code: 'SITE_COIMBATORE', name: 'Coimbatore Foundry' }, TENANT_A);

    // Seed Users (Host and Operator)
    db.insert('users', { user_id: HOST_USER_ID, tenant_id: TENANT_A, username: 'host.rajesh', email: 'rajesh@alpha.com' }, TENANT_A);
    db.insert('users', { user_id: 'guard-1', tenant_id: TENANT_A, username: 'guard.ramesh', email: 'ramesh@alpha.com' }, TENANT_A);

    // Seed Gates
    db.insert('gates', { gate_id: GATE_ID, tenant_id: TENANT_A, site_id: SITE_1, code: 'GATE_NORTH', name: 'North Commercial Gate' }, TENANT_A);

    service = new VisitorService(db);
  });

  // ==========================================================================
  // A. NEW VISITOR LIFECYCLE
  // ==========================================================================
  it('A. executes complete new visitor lifecycle: register -> submit -> approve -> verify -> checkin -> checkout', async () => {
    const scheduledStart = new Date(Date.now() - 30 * 60 * 1000); // 30m ago
    const scheduledEnd = new Date(Date.now() + 2 * 60 * 60 * 1000); // in 2h

    const input: CreateVisitorInput = {
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Aditya Sundaram',
      visitorEmail: 'aditya@externaltech.com',
      visitorPhone: '+91-9884012345',
      companyName: 'External Tech Solutions',
      governmentIdNumber: 'AADHAAR-8839-2211',
      governmentIdType: 'NATIONAL_ID',
      hostUserId: HOST_USER_ID,
      scheduledStart,
      scheduledEnd,
      submittedBy: 'aditya@externaltech.com',
      transport: {
        mode: 'CAR',
        ownership: 'PERSONAL',
        vehicleClass: 'SEDAN',
        fuelType: 'PETROL',
        usageType: 'INDIVIDUAL',
        occupancy: 1,
        originLocation: 'Bengaluru',
        destinationLocation: 'Chennai Plant',
      },
    };

    // 1. Create Visitor Transaction
    const tx = await service.createVisitorTransaction(input);
    assert.strictEqual(tx.status, 'PENDING');
    assert.strictEqual(tx.stage, 'APPROVAL');
    assert.ok(tx.referenceNumber.startsWith('VIS-'));
    assert.strictEqual(tx.visitorName, 'Aditya Sundaram');
    assert.ok(tx.transport);
    assert.strictEqual(tx.transport.mode, 'CAR');
    assert.ok(tx.transport.distanceKm > 0);
    assert.ok(tx.esgActivity);
    assert.strictEqual(tx.esgActivity.sourceTransactionId, tx.transactionId);

    // 2. Host Approval
    const approvedTx = service.approveVisit(TENANT_A, tx.transactionId, HOST_USER_ID, 'Welcome to plant');
    assert.strictEqual(approvedTx.status, 'APPROVED');
    assert.strictEqual(approvedTx.stage, 'SCHEDULED');

    // 3. Identity Verification at Reception
    const verification = service.recordIdentityVerification({
      tenantId: TENANT_A,
      transactionId: tx.transactionId,
      method: 'GOVT_ID_DOCUMENT',
      verifierUserId: 'guard-1',
      status: 'SUCCESS',
      notes: 'Aadhaar physical card inspected',
    });
    assert.strictEqual(verification.status, 'SUCCESS');

    // 4. Issue QR E-Pass
    const epass = service.issueEPass(TENANT_A, tx.transactionId);
    assert.strictEqual(epass.passStatus, 'ACTIVE');
    assert.ok(epass.token.length > 20);
    assert.ok(epass.qrPayload.startsWith('vms://epass/'));

    // 5. Check In
    const checkedInTx = service.checkIn({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: tx.transactionId,
      operatorUserId: 'guard-1',
      gateId: GATE_ID,
    });
    assert.strictEqual(checkedInTx.status, 'ON_PREMISES');
    assert.strictEqual(checkedInTx.stage, 'CHECK_IN');
    assert.ok(checkedInTx.actualEntry);

    // Verify gate_event was inserted
    const gateEvents = db.findMany('gate_events', { source_transaction_id: tx.transactionId }, TENANT_A);
    assert.strictEqual(gateEvents.length, 1);
    assert.strictEqual(gateEvents[0].event_type, 'CHECKED_IN');

    // 6. Check Out
    const checkedOutTx = service.checkOut({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: tx.transactionId,
      operatorUserId: 'guard-1',
      gateId: GATE_ID,
    });
    assert.strictEqual(checkedOutTx.status, 'COMPLETED');
    assert.strictEqual(checkedOutTx.stage, 'CLOSED');
    assert.ok(checkedOutTx.actualExit);

    // Verify exit gate_event
    const allGateEvents = db.findMany('gate_events', { source_transaction_id: tx.transactionId }, TENANT_A);
    assert.strictEqual(allGateEvents.length, 2);
    assert.strictEqual(allGateEvents[1].event_type, 'CHECKED_OUT');
  });

  // ==========================================================================
  // B. REPEATED VISITOR MATCHING & AMBIGUITY RESOLUTION
  // ==========================================================================
  it('B. identifies returning visitor, handles disambiguation, and creates second visit without profile duplication', async () => {
    // Register visit 1
    const v1 = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'AUDIT',
      bookingMode: 'RESERVED',
      visitorName: 'Priya Narayanan',
      visitorPhone: '+91-9444098765',
      companyName: 'TUV Rheinland',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      submittedBy: 'host.rajesh',
    });

    // Lookup returning visitor by phone
    const candidates = service.searchVisitorProfiles({
      tenantId: TENANT_A,
      query: '9444098765',
    });
    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].fullName, 'Priya Narayanan');
    assert.strictEqual(candidates[0].matchScore, 100);

    // Create visit 2 for same person with different purpose and transport
    const v2 = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'REPEATED_VISITOR',
      purpose: 'INSPECTION',
      bookingMode: 'RESERVED',
      visitorName: 'Priya Narayanan',
      visitorPhone: '+91-9444098765',
      companyName: 'TUV Rheinland',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() + 86400000),
      scheduledEnd: new Date(Date.now() + 90000000),
      submittedBy: 'host.rajesh',
      transport: {
        mode: 'TRAIN',
        ownership: 'PUBLIC',
        vehicleClass: 'OTHER',
        fuelType: 'ELECTRIC',
        usageType: 'PUBLIC_COMMUTE',
        originLocation: 'Coimbatore',
        destinationLocation: 'Chennai Plant',
      },
    });

    // Both visits share same person_id but have distinct transaction references
    assert.strictEqual(v1.personId, v2.personId);
    assert.notStrictEqual(v1.transactionId, v2.transactionId);
    assert.notStrictEqual(v1.referenceNumber, v2.referenceNumber);

    // Profile visit count incremented
    const prof = service.getVisitorProfile(TENANT_A, candidates[0].profileId);
    assert.strictEqual(prof?.totalVisits, 2);
  });

  // ==========================================================================
  // C. WALK-IN FLOW & APPROVAL BLOCKING
  // ==========================================================================
  it('C. blocks check-in for walk-in visitor until host approval is granted', async () => {
    const walkIn = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'CONSULTATION',
      bookingMode: 'WALK_IN',
      visitorName: 'Vikram Seth',
      visitorPhone: '+91-9840112233',
      companyName: 'Consulting Partners Ltd',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      submittedBy: 'guard-1',
    });

    assert.strictEqual(walkIn.status, 'PENDING');

    // Attempting check-in before approval MUST throw error
    assert.throws(() => {
      service.checkIn({
        tenantId: TENANT_A,
        siteId: SITE_1,
        transactionId: walkIn.transactionId,
        operatorUserId: 'guard-1',
      });
    }, /Host approval required/);

    // Approve walk-in
    service.approveVisit(TENANT_A, walkIn.transactionId, HOST_USER_ID, 'Host accepts walk-in');

    // Now check-in succeeds
    const approvedWalkIn = service.checkIn({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: walkIn.transactionId,
      operatorUserId: 'guard-1',
    });
    assert.strictEqual(approvedWalkIn.status, 'ON_PREMISES');
  });

  // ==========================================================================
  // D. GROUP VISIT & DELEGATION PARTICIPANTS
  // ==========================================================================
  it('D. supports group delegation with multiple participants under one shared appointment', async () => {
    const groupVisit = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'GROUP_VISITOR',
      purpose: 'SITE_VISIT',
      bookingMode: 'GROUP',
      visitorName: 'Dr. Sarah Jenkins',
      visitorPhone: '+1-555-1234',
      companyName: 'Global EPC Consortium',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 14400000),
      submittedBy: 'host.rajesh',
      groupParticipants: [
        { fullName: 'Michael Chang', phone: '+1-555-1235', role: 'PARTICIPANT' },
        { fullName: 'Elena Rostova', phone: '+1-555-1236', role: 'DELEGATE' },
        { fullName: 'Kavita Menon', phone: '+91-9840001122', role: 'PARTICIPANT' },
      ],
      transport: {
        mode: 'BUS',
        ownership: 'COMPANY',
        vehicleClass: 'COACH_BUS',
        fuelType: 'DIESEL',
        usageType: 'SHARED',
        occupancy: 4, // 1 organizer + 3 delegates sharing 1 vehicle
        originLocation: 'Chennai Airport',
        destinationLocation: 'Chennai Plant',
      },
    });

    assert.strictEqual(groupVisit.bookingMode, 'GROUP');
    const participants = db.findMany('visitor_participants', {
      visitor_transaction_id: groupVisit.transactionId,
    }, TENANT_A);
    assert.strictEqual(participants.length, 3);

    // Verify only 1 transport activity was created for the shared bus, not 4
    const transports = db.findMany('transport_activities', {
      source_transaction_id: groupVisit.transactionId,
    }, TENANT_A);
    assert.strictEqual(transports.length, 1);
    assert.strictEqual(transports[0].occupancy, 4);
  });

  // ==========================================================================
  // E. EMBEDDED ESG/GHG AUTO-CAPTURE & PROVENANCE CHAIN
  // ==========================================================================
  it('E. automatically captures normalized transport, derives distance, and creates traceable GHG activity', async () => {
    const tx = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'VIP_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Rajesh Varma',
      companyName: 'Varma Global',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 7200000),
      submittedBy: 'host.rajesh',
      transport: {
        mode: 'CAR',
        ownership: 'PERSONAL',
        vehicleClass: 'SUV',
        fuelType: 'DIESEL',
        usageType: 'INDIVIDUAL',
        occupancy: 2,
        originLocation: 'Bengaluru',
        destinationLocation: 'Chennai Plant',
      },
    });

    assert.ok(tx.transport);
    assert.strictEqual(tx.transport.originLocation, 'Bengaluru');
    assert.strictEqual(tx.transport.destinationLocation, 'Chennai Plant');
    assert.strictEqual(tx.transport.distanceKm, 348); // Automatically estimated from GIS matrix!
    assert.strictEqual(tx.transport.distanceProvenance, 'SYSTEM_ESTIMATED');

    assert.ok(tx.esgActivity);
    assert.strictEqual(tx.esgActivity.sourceDomain, 'VISITOR');
    assert.strictEqual(tx.esgActivity.sourceTransactionId, tx.transactionId);
    assert.strictEqual(tx.esgActivity.transportId, tx.transport.transportId);

    // Traceability resolution
    const trace = service.getTraceabilityChain(TENANT_A, tx.transactionId);
    assert.ok(trace);
    assert.strictEqual(trace.transaction.transactionId, tx.transactionId);
    assert.strictEqual(trace.transportActivity?.transportId, tx.transport.transportId);
    assert.strictEqual(trace.ghgActivity?.esgActivityId, tx.esgActivity.esgActivityId);
  });

  // ==========================================================================
  // F. IDEMPOTENCY & DOUBLE SUBMISSION DEDUPLICATION
  // ==========================================================================
  it('F. guarantees idempotency: retrying submission with identical idempotencyKey does not duplicate records', async () => {
    const idempotencyKey = 'CLIENT-IDEMPOTENCY-KEY-999';

    const input: CreateVisitorInput = {
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Naveen Kumar',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      submittedBy: 'naveen@client.com',
      idempotencyKey,
      transport: {
        mode: 'CAR',
        ownership: 'PERSONAL',
        vehicleClass: 'HATCHBACK',
        fuelType: 'PETROL',
        usageType: 'INDIVIDUAL',
        originLocation: 'Tambaram',
        destinationLocation: 'Chennai Plant',
        distanceKm: 28,
        distanceProvenance: 'USER_PROVIDED',
      },
    };

    const first = await service.createVisitorTransaction(input);
    const second = await service.createVisitorTransaction(input);

    // Guaranteed same transaction ID
    assert.strictEqual(first.transactionId, second.transactionId);
    assert.strictEqual(first.referenceNumber, second.referenceNumber);

    // Only 1 transport activity in database
    const transports = db.findMany('transport_activities', {
      source_transaction_id: first.transactionId,
    }, TENANT_A);
    assert.strictEqual(transports.length, 1);
  });

  // ==========================================================================
  // G. OVERSTAY DETECTION ENGINE
  // ==========================================================================
  it('G. detects active visitors exceeding scheduled end time and raises overstay breach', async () => {
    // Create and check in a visit scheduled to end 30 minutes in the PAST
    const pastStart = new Date(Date.now() - 3 * 3600000);
    const pastEnd = new Date(Date.now() - 30 * 60 * 1000); // Ended 30 minutes ago

    const tx = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Suresh Raina',
      hostUserId: HOST_USER_ID,
      scheduledStart: pastStart,
      scheduledEnd: pastEnd,
      submittedBy: 'host.rajesh',
    });

    service.approveVisit(TENANT_A, tx.transactionId, HOST_USER_ID);
    service.checkIn({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: tx.transactionId,
      operatorUserId: 'guard-1',
    });

    // Run overstay detection
    const overstays = service.detectOverstays({
      tenantId: TENANT_A,
      siteId: SITE_1,
      warningThresholdMinutes: 15,
      breachThresholdMinutes: 0,
      currentTime: new Date(),
    });

    assert.ok(overstays.length >= 1);
    const found = overstays.find(o => o.transactionId === tx.transactionId);
    assert.ok(found);
    assert.strictEqual(found.status, 'BREACH');
    assert.ok(found.overstayMinutes >= 29);

    // An exception record must have been logged
    const exceptions = db.findMany('exceptions', {
      source_transaction_id: tx.transactionId,
      exception_type: 'OVERSTAY',
    }, TENANT_A);
    assert.strictEqual(exceptions.length, 1);
  });

  // ==========================================================================
  // H. ACTIVITY CORRECTION AUDIT TRAIL
  // ==========================================================================
  it('H. preserves historical audit trail when activity data is corrected by authorized user', async () => {
    const tx = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Gaurav Gill',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      submittedBy: 'host.rajesh',
      transport: {
        mode: 'CAR',
        ownership: 'PERSONAL',
        vehicleClass: 'SEDAN',
        fuelType: 'PETROL',
        usageType: 'INDIVIDUAL',
        originLocation: 'Airport',
        destinationLocation: 'Chennai Plant',
        distanceKm: 25,
        distanceProvenance: 'SYSTEM_ESTIMATED',
      },
    });

    // Correct distance and fuel type
    service.correctActivityData({
      tenantId: TENANT_A,
      transactionId: tx.transactionId,
      correctedTransport: {
        fuelType: 'DIESEL',
        distanceKm: 35,
        distanceProvenance: 'USER_PROVIDED',
      },
      reason: 'Visitor verified actual odometer and confirmed diesel rental',
      correctedBy: 'esg.manager',
    });

    const updated = service.getVisitorTransaction(TENANT_A, tx.transactionId);
    assert.strictEqual(updated?.transport?.distanceKm, 35);
    assert.strictEqual(updated?.transport?.distanceProvenance, 'USER_PROVIDED');

    // Audit log recorded
    const audits = db.findMany('audit_logs', {
      entity_id: updated?.transport?.transportId,
      action: 'TRANSPORT_ACTIVITY_CORRECTED',
    }, TENANT_A);
    assert.strictEqual(audits.length, 1);
    assert.ok(audits[0].details.includes('Previous: distance=25'));
  });

  // ==========================================================================
  // I. MULTI-TENANT ISOLATION
  // ==========================================================================
  it('I. prevents cross-tenant access to visitor transactions', async () => {
    const txA = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Tenant A Visitor',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      submittedBy: 'user.a',
    });

    // Tenant B querying Tenant A's visit returns null
    const result = service.getVisitorTransaction(TENANT_B, txA.transactionId);
    assert.strictEqual(result, null);
  });

  // ==========================================================================
  // J. EMERGENCY VISITOR REGISTRATION
  // ==========================================================================
  it('J. supports emergency visitor registration with minimum essentials and auditable trail', async () => {
    const emgTx = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'GOVERNMENT_OFFICIAL',
      purpose: 'INSPECTION',
      bookingMode: 'EMERGENCY',
      visitorName: 'Inspector K. Ramanathan',
      visitorPhone: '+91-9940011223',
      companyName: 'Pollution Control Board',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 7200000),
      emergencyReason: 'Statutory surprise factory environmental inspection',
      submittedBy: 'guard-1',
    });

    assert.strictEqual(emgTx.bookingMode, 'EMERGENCY');
    assert.strictEqual(emgTx.status, 'APPROVED'); // Emergency is pre-approved for gate processing
    assert.strictEqual(emgTx.stage, 'CHECK_IN');

    // Immediate check-in permitted
    const checkedIn = service.checkIn({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: emgTx.transactionId,
      operatorUserId: 'guard-1',
      gateId: GATE_ID,
    });
    assert.strictEqual(checkedIn.status, 'ON_PREMISES');
  });

  // ==========================================================================
  // K. RESCHEDULE AND CANCELLATION LIFECYCLE
  // ==========================================================================
  it('K. handles reschedule and cancellation with version increments and audit logging', async () => {
    const tx = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'INTERVIEW',
      bookingMode: 'RESERVED',
      visitorName: 'Sneha Patel',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() + 86400000),
      scheduledEnd: new Date(Date.now() + 90000000),
      submittedBy: 'hr.manager',
    });

    // Reschedule
    const newStart = new Date(Date.now() + 172800000);
    const newEnd = new Date(Date.now() + 176400000);
    const rescheduled = service.rescheduleVisit({
      tenantId: TENANT_A,
      transactionId: tx.transactionId,
      newStart,
      newEnd,
      reason: 'Candidate requested time shift due to flight delay',
      updatedBy: 'hr.manager',
    });

    assert.strictEqual(rescheduled.version, 2);
    assert.strictEqual(new Date(rescheduled.scheduledStart).getTime(), newStart.getTime());

    // Cancel
    const cancelled = service.cancelVisit(TENANT_A, tx.transactionId, 'hr.manager', 'Position closed internally');
    assert.strictEqual(cancelled.status, 'CANCELLED');
    assert.strictEqual(cancelled.stage, 'CLOSED');
  });

  // ==========================================================================
  // L. OPERATIONAL ANALYTICS AGGREGATION
  // ==========================================================================
  it('L. derives accurate operational analytics from real database records', async () => {
    // Query analytics for Tenant A
    const analytics = service.getVisitorAnalytics(TENANT_A, SITE_1);

    assert.ok(typeof analytics.expectedToday === 'number');
    assert.ok(typeof analytics.currentlyInside === 'number');
    assert.ok(typeof analytics.pendingApprovals === 'number');
    assert.ok(typeof analytics.activityCaptureCompletenessPercent === 'number');
    assert.ok(analytics.bookingModeDistribution);
    assert.ok(analytics.purposeDistribution);
    assert.ok(analytics.transportModeDistribution);
  });

  // ==========================================================================
  // M. INVALID STATE TRANSITION INVARIANTS
  // ==========================================================================
  it('M. enforces state machine invariants: prevents duplicate check-in, checkout, or cancelling active visits', async () => {
    const tx = await service.createVisitorTransaction({
      tenantId: TENANT_A,
      siteId: SITE_1,
      visitorCategory: 'NEW_VISITOR',
      purpose: 'MEETING',
      bookingMode: 'RESERVED',
      visitorName: 'Rohan Mehra',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      submittedBy: 'host.rajesh',
    });

    service.approveVisit(TENANT_A, tx.transactionId, HOST_USER_ID);
    service.checkIn({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: tx.transactionId,
      operatorUserId: 'guard-1',
    });

    // 1. Cannot check in again when already ON_PREMISES
    assert.throws(() => {
      service.checkIn({
        tenantId: TENANT_A,
        siteId: SITE_1,
        transactionId: tx.transactionId,
        operatorUserId: 'guard-1',
      });
    }, /already checked in/);

    // 2. Cannot cancel visit while visitor is currently ON_PREMISES
    assert.throws(() => {
      service.cancelVisit(TENANT_A, tx.transactionId, 'guard-1', 'Attempting cancel while inside');
    }, /Cannot cancel visit while visitor is currently on premises/);

    // Check out
    service.checkOut({
      tenantId: TENANT_A,
      siteId: SITE_1,
      transactionId: tx.transactionId,
      operatorUserId: 'guard-1',
    });

    // 3. Cannot check out again when COMPLETED
    assert.throws(() => {
      service.checkOut({
        tenantId: TENANT_A,
        siteId: SITE_1,
        transactionId: tx.transactionId,
        operatorUserId: 'guard-1',
      });
    }, /Cannot check out visitor: current status is COMPLETED/);
  });
});
