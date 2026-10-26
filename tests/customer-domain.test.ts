import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { CustomerService } from '../services/customer/src/customer.service.js';
import { CustomerApiRouter } from '../services/customer/src/customer.api.js';
import type { UserContext } from '@vms/types';
import type {
  CreateCustomerAccountInput,
  CreateCustomerRepresentativeInput,
  CreateCustomerVisitInput,
  GateCheckInCustomerInput,
  GateCheckOutCustomerInput,
} from '../services/customer/src/types.js';

describe('Part 7: Complete Customer Management Domain Verification', () => {
  let db: RelationalDatabase;
  let service: CustomerService;

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const SITE_1 = '33333333-3333-4333-8333-333333333331';
  const SITE_2 = '33333333-3333-4333-8333-333333333332';
  const HOST_USER_ID = '44444444-4444-4444-8444-444444444441';
  const GATE_ID = '55555555-5555-4555-8555-555555555551';

  beforeEach(() => {
    db = new RelationalDatabase();

    // 1. Seed Tenant A & B
    db.insert('tenants', { tenant_id: TENANT_A, code: 'TENANT_A', name: 'Alpha Manufacturing' });
    db.insert('tenants', { tenant_id: TENANT_B, code: 'TENANT_B', name: 'Beta Logistics' });

    // 2. Seed Organizations & Sites
    db.insert('organizations', { organization_id: 'org-a', tenant_id: TENANT_A, code: 'ORG_A', name: 'Alpha Plant Corp' }, TENANT_A);
    db.insert('sites', { site_id: SITE_1, tenant_id: TENANT_A, organization_id: 'org-a', code: 'SITE_CHENNAI', name: 'Chennai Industrial Plant' }, TENANT_A);
    db.insert('sites', { site_id: SITE_2, tenant_id: TENANT_A, organization_id: 'org-a', code: 'SITE_COIMBATORE', name: 'Coimbatore Foundry' }, TENANT_A);

    // 3. Seed Users
    db.insert('users', { user_id: HOST_USER_ID, tenant_id: TENANT_A, username: 'host.vikram', email: 'vikram@alpha.com' }, TENANT_A);
    db.insert('users', { user_id: 'user-manager-1', tenant_id: TENANT_A, username: 'suresh.babu', email: 'suresh@alpha.com' }, TENANT_A);

    // 4. Seed Gates
    db.insert('gates', { gate_id: GATE_ID, tenant_id: TENANT_A, site_id: SITE_1, code: 'GATE_MAIN', name: 'Main Plant Gate 1' }, TENANT_A);

    // 5. Seed Canonical Customer Visit Types
    const visitTypes = [
      { code: 'CUSTOMER_MEETING', name: 'Customer Meeting' },
      { code: 'CUSTOMER_AUDIT', name: 'Customer Audit' },
      { code: 'CUSTOMER_INSPECTION', name: 'Customer Inspection' },
      { code: 'QUALITY_VISIT', name: 'Quality Visit' },
      { code: 'TECHNICAL_VISIT', name: 'Technical Visit' },
      { code: 'PLANT_VISIT', name: 'Plant Visit' },
      { code: 'MANAGEMENT_VISIT', name: 'Management Visit' },
      { code: 'DELEGATION_VISIT', name: 'Delegation Visit' },
      { code: 'PRODUCT_REVIEW', name: 'Product Review' },
      { code: 'PROCESS_REVIEW', name: 'Process Review' },
      { code: 'OTHER', name: 'Other Visit' },
    ];
    for (const vt of visitTypes) {
      db.insert('customer_visit_types', {
        visit_type_id: `vt-${vt.code.toLowerCase()}`,
        code: vt.code,
        name: vt.name,
        is_active: true,
      });
    }

    service = new CustomerService(db);
  });

  // ==========================================================================
  // 1. CUSTOMER ACCOUNT CRUD & DUPLICATE DETECTION
  // ==========================================================================
  it('1. creates customer account, resolves external organization, and rejects duplicates', async () => {
    const input: CreateCustomerAccountInput = {
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-TSLA',
      legalName: 'Voltaris Motors Global Powertrain Inc.',
      tradeName: 'Voltaris Inc.',
      classification: 'OEM_CUSTOMER',
      tier: 'GLOBAL_ENTERPRISE',
      registrationNumber: 'EIN-88192019',
      commercialOwnerUserId: HOST_USER_ID,
      approvedSiteIds: [SITE_1],
      defaultNdaRequired: true,
      defaultPhotographyPolicy: 'PROHIBITED',
      defaultEscortRequired: true,
      defaultVisitRequirements: ['Mandatory PPE', 'Safety Induction'],
    };

    const account = await service.createCustomerAccount(input);
    assert.ok(account.customerAccountId);
    assert.strictEqual(account.accountCode, 'CUS-ACC-TSLA');
    assert.strictEqual(account.classification, 'OEM_CUSTOMER');
    assert.strictEqual(account.tier, 'GLOBAL_ENTERPRISE');
    assert.strictEqual(account.defaultPhotographyPolicy, 'PROHIBITED');

    // Duplicate detection by accountCode
    await assert.rejects(
      async () => {
        await service.createCustomerAccount({
          ...input,
          legalName: 'Voltaris Another Subsidiary',
        });
      },
      /already exists/
    );

    // Retrieve account by ID
    const retrieved = await service.getCustomerAccountById(TENANT_A, account.customerAccountId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved?.legalName, 'Voltaris Motors Global Powertrain Inc.');
  });

  // ==========================================================================
  // 2. CUSTOMER REPRESENTATIVES & CANONICAL PERSON DEDUPLICATION
  // ==========================================================================
  it('2. registers customer representatives and deduplicates canonical person by phone and email', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-TYTA',
      legalName: 'Kintaro Motor Manufacturing Asia',
      classification: 'OEM_CUSTOMER',
      tier: 'GLOBAL_ENTERPRISE',
    });

    const repInput: CreateCustomerRepresentativeInput = {
      tenantId: TENANT_A,
      customerAccountId: account.customerAccountId,
      fullName: 'Kenji Takahashi',
      email: 'kenji.takahashi@kintaro.com',
      phone: '+65-6888-9120',
      jobTitle: 'Chief Quality Auditor',
      department: 'TPS Audit Division',
      isPrimary: true,
    };

    const rep = await service.createCustomerRepresentative(repInput);
    assert.ok(rep.repId);
    assert.ok(rep.personId);
    assert.strictEqual(rep.fullName, 'Kenji Takahashi');
    assert.strictEqual(rep.identityVerificationStatus, 'VERIFIED');

    // Adding same person with identical phone/email for another department reuses canonical personId
    const rep2 = await service.createCustomerRepresentative({
      ...repInput,
      jobTitle: 'Executive TPS Consultant',
      isPrimary: false,
    });
    assert.strictEqual(rep2.personId, rep.personId, 'Must link to the same canonical person profile');

    // Least-privilege PII masking: ESG_MANAGER gets masked contact details
    const repsForESG = await service.listCustomerRepresentatives(TENANT_A, account.customerAccountId, 'ESG_MANAGER');
    assert.ok(repsForESG[0].phone.includes('***'), 'Phone must be masked for non-receptionist role');
    assert.ok(repsForESG[0].email?.includes('***'), 'Email must be masked for non-receptionist role');

    // Receptionist / Admin gets unmasked details
    const repsForAdmin = await service.listCustomerRepresentatives(TENANT_A, account.customerAccountId, 'SUPER_ADMIN');
    assert.strictEqual(repsForAdmin[0].phone, '+65-6888-9120');
  });

  // ==========================================================================
  // 3. PRECEDENCE-BASED REQUIREMENT RESOLUTION
  // ==========================================================================
  it('3. enforces precedence hierarchy: Site Security Rules > Global Defaults > Customer Account Rules > Visit Type Requirements', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-Bavaro',
      legalName: 'Bavaro Group Chassis Systems',
      classification: 'STRATEGIC_CUSTOMER',
      tier: 'TIER_1_STRATEGIC',
      defaultPhotographyPolicy: 'PERMITTED', // Customer preference is PERMITTED
      defaultEscortRequired: false,
    });

    // Site has strict mandatory rule: Photography is strictly PROHIBITED
    db.insert('site_security_rules', {
      rule_id: 'rule-site-1-photo',
      site_id: SITE_1,
      rule_type: 'PHOTO_RESTRICTION',
      policy_value: 'PROHIBITED',
      is_mandatory: true,
    });

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Executive Partnership Meeting',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() + 2 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
      participants: [
        { fullName: 'Marcus Weber', email: 'marcus@bavaro.com', phone: '+49-89-123', isLead: true },
      ],
    });

    // The resolved photography policy must be PROHIBITED because site security overrides customer preference!
    assert.strictEqual(visit.photographyPolicy, 'PROHIBITED', 'Site safety rule must strictly override customer preference');

    // Requirements array must include the mandatory Photo Restriction
    const reqs = await service.getCustomerVisitRequirements(TENANT_A, visit.transactionId);
    const photoReq = reqs.find(r => r.requirementType === 'PHOTO_RESTRICTION');
    assert.ok(photoReq, 'Must include mandatory site photo restriction requirement');
    assert.strictEqual(photoReq?.isMandatory, true);
  });

  // ==========================================================================
  // 4. CUSTOMER AUDIT & INSPECTION LIFECYCLES WITH CLOSURE REPORT
  // ==========================================================================
  it('4. executes CUSTOMER_AUDIT and CUSTOMER_INSPECTION visits with lead inspectors and formal signoffs', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-BSCH',
      legalName: 'Robert Brannick Mobility Solutions',
      classification: 'QUALITY_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    // 1. Create Customer Audit
    const auditVisit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_AUDIT',
      title: 'IATF 16949 / VDA 6.3 Customer Process Audit',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() - 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 5 * 60 * 60 * 1000),
      auditDetails: {
        auditType: 'PROCESS_AUDIT',
        auditScope: 'Radial tire extruders and ultrasonic bead inspection lines',
        leadAuditorName: 'Elena Rostova',
      },
      participants: [
        { fullName: 'Elena Rostova', email: 'elena@brannick.de', phone: '+49-711-811', isLead: true },
      ],
    });

    assert.strictEqual(auditVisit.visitTypeCode, 'CUSTOMER_AUDIT');
    assert.strictEqual(auditVisit.auditDetails?.auditType, 'PROCESS_AUDIT');
    assert.strictEqual(auditVisit.auditDetails?.leadAuditorName, 'Elena Rostova');

    // Approve visit
    await service.approveCustomerVisit(TENANT_A, auditVisit.transactionId, HOST_USER_ID, 'Audit agenda verified');

    // Gate check-in
    await service.checkInCustomerVisit({
      tenantId: TENANT_A,
      transactionId: auditVisit.transactionId,
      gateId: GATE_ID,
      operatorUserId: 'guard-1',
    });

    // Formal visit closure with findings report
    const closedAudit = await service.closeCustomerVisit({
      tenantId: TENANT_A,
      transactionId: auditVisit.transactionId,
      closedByUserId: HOST_USER_ID,
      notes: 'VDA 6.3 Process audit completed. 2 minor observations documented in PPAP tracker.',
      followUpRequired: true,
      evidenceDocumentRefs: ['DOC-AUDIT-VDA-2026-01'],
    });

    assert.strictEqual(closedAudit.stage, 'CLOSED');
    assert.ok(closedAudit.closureSummary?.completed);
    assert.strictEqual(closedAudit.closureSummary?.followUpRequired, true);
    assert.ok(closedAudit.closureSummary?.notes.includes('VDA 6.3'));
  });

  // ==========================================================================
  // 5. DELEGATION MANAGEMENT & PARTIAL ARRIVAL/DEPARTURE
  // ==========================================================================
  it('5. manages multi-participant delegations, tracking partial arrivals and departures', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-TYTA2',
      legalName: 'Kintaro Motor Corp Global',
      classification: 'OEM_CUSTOMER',
      tier: 'GLOBAL_ENTERPRISE',
    });

    const delegationVisit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'DELEGATION_VISIT',
      bookingMode: 'DELEGATION',
      title: 'Executive TPS Benchmarking Delegation',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() - 30 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
      participants: [
        { fullName: 'Kenji Takahashi', email: 'kenji@kintaro.com', phone: '+65-111', isLead: true },
        { fullName: 'Hiroshi Sato', email: 'hiroshi@kintaro.com', phone: '+65-222', isLead: false },
        { fullName: 'Yuki Nomura', email: 'yuki@kintaro.com', phone: '+65-333', isLead: false },
      ],
    });

    assert.strictEqual(delegationVisit.bookingMode, 'DELEGATION');

    // Approve
    await service.approveCustomerVisit(TENANT_A, delegationVisit.transactionId, HOST_USER_ID);

    // Initial delegation summary
    let delegationView = await service.getCustomerDelegationSummary(TENANT_A, delegationVisit.transactionId);
    assert.strictEqual(delegationView.totalParticipants, 3);
    assert.strictEqual(delegationView.arrivedParticipants, 0);

    // Partial Arrival: Only participant 1 and 2 arrive at Gate 1
    const parts = delegationView.participants;
    await service.checkInParticipant(TENANT_A, delegationVisit.transactionId, parts[0].participantId, GATE_ID);
    await service.checkInParticipant(TENANT_A, delegationVisit.transactionId, parts[1].participantId, GATE_ID);

    delegationView = await service.getCustomerDelegationSummary(TENANT_A, delegationVisit.transactionId);
    assert.strictEqual(delegationView.arrivedParticipants, 2);
    assert.strictEqual(delegationView.checkedInParticipants, 2);
    assert.strictEqual(delegationView.expectedParticipants, 1);

    // 1 participant departs early
    await service.checkOutParticipant(TENANT_A, delegationVisit.transactionId, parts[0].participantId, GATE_ID);

    delegationView = await service.getCustomerDelegationSummary(TENANT_A, delegationVisit.transactionId);
    assert.strictEqual(delegationView.departedParticipants, 1);
    assert.strictEqual(delegationView.checkedInParticipants, 1);
  });

  // ==========================================================================
  // 6. GROUP TRANSPORT DEDUPLICATION & EMBEDDED GHG CAPTURE
  // ==========================================================================
  it('6. applies group transport deduplication (1 vehicle movement) and captures Scope 3 Cat 6 GHG activity', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-TSLA-TRP',
      legalName: 'Voltaris Engineering Delegation',
      classification: 'OEM_CUSTOMER',
      tier: 'GLOBAL_ENTERPRISE',
    });

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'DELEGATION_VISIT',
      title: 'Voltaris Battery Engineering Delegation',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() + 10 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 6 * 60 * 60 * 1000),
      participants: [
        { fullName: 'David Vance', email: 'dvance@voltaris.com', phone: '+1-512-001', isLead: true },
        { fullName: 'Sophia Lin', email: 'slin@voltaris.com', phone: '+1-512-002', isLead: false },
        { fullName: 'Liam Connor', email: 'lconnor@voltaris.com', phone: '+1-512-003', isLead: false },
      ],
      transport: {
        mode: 'CAR',
        ownership: 'HIRED',
        vehicleClass: 'SEDAN',
        fuelType: 'ELECTRIC',
        usageType: 'SHARED',
        occupancy: 3,
        originLocation: 'Chennai Airport',
        destinationLocation: 'Chennai Radial Tyre Plant',
        distanceKm: 42,
        isSharedDelegationVehicle: true,
        vehiclePlate: 'TN-09-EV-9999',
      },
    });

    assert.ok(visit.transportActivityId, 'Must create normalized transport activity');
    assert.ok(visit.ghgActivityId, 'Must create embedded GHG activity');

    // Retrieve GHG Activity from DB to verify source domain and scope
    const ghgActivity = db.findById('ghg_activities', visit.ghgActivityId, TENANT_A);
    assert.ok(ghgActivity);
    assert.strictEqual(ghgActivity.source_domain, 'CUSTOMER', 'Source domain must strictly be CUSTOMER');
    assert.strictEqual(ghgActivity.scope, 'SCOPE_3');
    assert.strictEqual(ghgActivity.category, 'Scope 3 Category 6: Business Travel');
    assert.strictEqual(ghgActivity.activity_quantity, 42);
    assert.strictEqual(ghgActivity.activity_unit, 'KM');

    // Verify GHG calculation record
    const ghgCalcs = db.findMany('ghg_calculations', { ghg_activity_id: visit.ghgActivityId });
    assert.strictEqual(ghgCalcs.length, 1, 'Must find calculation record for activity');
    const ghgCalc = ghgCalcs[0];
    assert.ok(ghgCalc.emissions_kg_co2e > 0, 'Emissions must be greater than zero');
    assert.strictEqual(ghgCalc.scope, 'SCOPE_3');
  });

  // ==========================================================================
  // 7. BILATERAL NDA VERIFICATION & CHECK-IN GATING
  // ==========================================================================
  it('7. strictly blocks gate check-in when bilateral NDA requirement is unfulfilled or missing', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-NDA-FAIL',
      legalName: 'Confidential Motors Ltd',
      classification: 'STRATEGIC_CUSTOMER',
      tier: 'KEY_ACCOUNT',
      defaultNdaRequired: true,
    });

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Top Secret Concept Review',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() - 10 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      ndaSigned: false, // NDA NOT SIGNED
      participants: [
        { fullName: 'Secret Agent', email: 'agent@confidential.com', phone: '+1-000-000', isLead: true },
      ],
    });

    await service.approveCustomerVisit(TENANT_A, visit.transactionId, HOST_USER_ID);

    // Attempting check-in MUST be blocked because bilateral NDA is unfulfilled!
    await assert.rejects(
      async () => {
        await service.checkInCustomerVisit({
          tenantId: TENANT_A,
          transactionId: visit.transactionId,
          gateId: GATE_ID,
          operatorUserId: 'guard-1',
        });
      },
      /Bilateral NDA/
    );

    // Fulfill NDA requirement
    await service.verifyCustomerNda(TENANT_A, visit.transactionId, 'NDA-2026-CONFIDENTIAL-99');

    // Check-in now succeeds
    const checkedIn = await service.checkInCustomerVisit({
      tenantId: TENANT_A,
      transactionId: visit.transactionId,
      gateId: GATE_ID,
      operatorUserId: 'guard-1',
    });
    assert.strictEqual(checkedIn.stage, 'IN_PROGRESS');
  });

  // ==========================================================================
  // 8. OVERSTAY DETECTION & SLA BREACH VISIBILITY
  // ==========================================================================
  it('8. detects active customer visits past scheduled end and marks overstay', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-OVER',
      legalName: 'Overstay Motors Corp',
      classification: 'EXISTING_CUSTOMER',
      tier: 'STANDARD',
    });

    // Scheduled end was 45 minutes ago
    const pastStart = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 45 * 60 * 1000);

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Meeting that dragged on',
      hostUserId: HOST_USER_ID,
      scheduledStart: pastStart,
      scheduledEnd: pastEnd,
      ndaSigned: true,
      ndaDocumentRef: 'NDA-OVER-01',
      participants: [
        { fullName: 'Late Visitor', email: 'late@motors.com', phone: '+91-9999999999', isLead: true },
      ],
    });

    await service.approveCustomerVisit(TENANT_A, visit.transactionId, HOST_USER_ID);
    await service.checkInCustomerVisit({
      tenantId: TENANT_A,
      transactionId: visit.transactionId,
      gateId: GATE_ID,
      operatorUserId: 'guard-1',
    });

    // Trigger overstay inspection
    const overstays = await service.getOverstayCustomerVisits(TENANT_A, SITE_1);
    assert.ok(overstays.length >= 1);
    const found = overstays.find(o => o.transactionId === visit.transactionId);
    assert.ok(found);
    assert.ok((found?.overstayMinutes || 0) >= 40);
  });

  // ==========================================================================
  // 9. RESCHEDULE & CANCELLATION WITH AUDIT TRAIL
  // ==========================================================================
  it('9. supports visit reschedule with version increment and auditable cancellation', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-RESCHED',
      legalName: 'Flexible Client LLC',
      classification: 'EXISTING_CUSTOMER',
      tier: 'STANDARD',
    });

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Upcoming Discussion',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 26 * 60 * 60 * 1000),
      participants: [
        { fullName: 'Alice Cooper', email: 'alice@client.com', phone: '+1-555-0100', isLead: true },
      ],
    });

    assert.strictEqual(visit.version, 1);

    // Reschedule
    const newStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const newEnd = new Date(Date.now() + 50 * 60 * 60 * 1000);
    const rescheduled = await service.rescheduleCustomerVisit(
      TENANT_A,
      visit.transactionId,
      newStart,
      newEnd,
      HOST_USER_ID,
      'Client flight delayed'
    );

    assert.strictEqual(rescheduled.version, 2, 'Version must increment upon reschedule');
    assert.strictEqual(rescheduled.scheduledStart.getTime(), newStart.getTime());

    // Cancel visit
    const cancelled = await service.cancelCustomerVisit(
      TENANT_A,
      visit.transactionId,
      HOST_USER_ID,
      'Trip cancelled by executive sponsor'
    );
    assert.strictEqual(cancelled.status, 'CANCELLED');
    assert.strictEqual(cancelled.stage, 'CANCELLED');
  });

  // ==========================================================================
  // 10. MULTI-TENANT & CROSS-SITE ISOLATION
  // ==========================================================================
  it('10. strictly prevents cross-tenant access to customer accounts and visit transactions', async () => {
    const accountA = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-TEN-A',
      legalName: 'Tenant A Customer Only',
      classification: 'EXISTING_CUSTOMER',
      tier: 'STANDARD',
    });

    // Tenant B querying Tenant A account returns null
    const crossQuery = await service.getCustomerAccountById(TENANT_B, accountA.customerAccountId);
    assert.strictEqual(crossQuery, null, 'Must not access another tenant customer account');

    // Tenant B cannot create visit under Tenant A customer account
    await assert.rejects(
      async () => {
        await service.createCustomerVisit({
          tenantId: TENANT_B,
          siteId: SITE_1,
          customerAccountId: accountA.customerAccountId,
          visitTypeCode: 'CUSTOMER_MEETING',
          title: 'Cross-tenant illegal visit',
          hostUserId: HOST_USER_ID,
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          participants: [{ fullName: 'Intruder', email: 'bad@bad.com', phone: '+0', isLead: true }],
        });
      },
      /not found/
    );
  });

  // ==========================================================================
  // 11. OPERATIONAL ANALYTICS DERIVED FROM REAL PERSISTED DATA
  // ==========================================================================
  it('11. derives live operational and ESG analytics strictly from persisted database records', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-ANALYTICS',
      legalName: 'Analytics Test Client',
      classification: 'OEM_CUSTOMER',
      tier: 'GLOBAL_ENTERPRISE',
    });

    await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_AUDIT',
      title: 'Audit Today',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      participants: [{ fullName: 'Auditor One', email: 'one@client.com', phone: '+1-111', isLead: true }],
      transport: {
        mode: 'CAR',
        ownership: 'PERSONAL',
        vehicleClass: 'SEDAN',
        fuelType: 'PETROL',
        usageType: 'INDIVIDUAL',
        occupancy: 1,
        originLocation: 'City',
        destinationLocation: 'Plant',
        distanceKm: 30,
      },
    });

    const summary = await service.getCustomerAnalyticsSummary(TENANT_A, SITE_1);
    assert.ok(summary.activeCustomerAccounts >= 1);
    assert.ok(summary.expectedVisitsToday >= 1);
    assert.ok(summary.auditVisits >= 1);
    assert.strictEqual(summary.transportModeDistribution['CAR'], 1);
  });

  // ==========================================================================
  // 12. MULTI-VEHICLE DELEGATIONS (ADDITIONAL TRANSPORTS)
  // ==========================================================================
  it('12. processes multi-vehicle customer delegations and aggregates all transport activities into traceability', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-MULTI-TRP',
      legalName: 'Global Heavy Machinery Delegation',
      classification: 'STRATEGIC_CUSTOMER',
      tier: 'GLOBAL_ENTERPRISE',
    });

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'DELEGATION_VISIT',
      bookingMode: 'DELEGATION',
      title: 'Global Delegation in 3 Convoy Vehicles',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(Date.now() + 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
      participants: [
        { fullName: 'VP Automotive', email: 'vp@machinery.com', phone: '+1-555-101', isLead: true },
        { fullName: 'Chief Engineer', email: 'ce@machinery.com', phone: '+1-555-102', isLead: false },
        { fullName: 'Procurement Director', email: 'pd@machinery.com', phone: '+1-555-103', isLead: false },
        { fullName: 'Quality Lead', email: 'ql@machinery.com', phone: '+1-555-104', isLead: false },
      ],
      transport: {
        mode: 'CAR',
        ownership: 'HIRED',
        vehicleClass: 'SEDAN',
        fuelType: 'PETROL',
        usageType: 'SHARED',
        occupancy: 2,
        originLocation: 'Hotel Grand Chennai',
        destinationLocation: 'Chennai Industrial Plant',
        distanceKm: 25,
        vehiclePlate: 'TN-01-AB-1001',
      },
      additionalTransports: [
        {
          mode: 'CAR',
          ownership: 'HIRED',
          vehicleClass: 'SUV',
          fuelType: 'DIESEL',
          usageType: 'SHARED',
          occupancy: 1,
          originLocation: 'Airport Terminal 2',
          destinationLocation: 'Chennai Industrial Plant',
          distanceKm: 35,
          vehiclePlate: 'TN-01-AB-1002',
        },
        {
          mode: 'CAR',
          ownership: 'COMPANY',
          vehicleClass: 'LIGHT_COMMERCIAL_VAN',
          fuelType: 'ELECTRIC',
          usageType: 'SHARED',
          occupancy: 1,
          originLocation: 'Technology Center',
          destinationLocation: 'Chennai Industrial Plant',
          distanceKm: 20,
          vehiclePlate: 'TN-01-EV-1003',
        },
      ],
    });

    // Delegation summary reflects all 3 vehicles
    const delegationView = await service.getCustomerDelegationSummary(TENANT_A, visit.transactionId);
    assert.strictEqual(delegationView.vehiclesCount, 3, 'Must register exactly 3 convoy vehicles');

    // Traceability retrieves all 3 transport activities, 3 ESG activities, and 3 calculations
    const traceability = service.getCustomerActivityTraceability(TENANT_A, visit.transactionId);
    assert.strictEqual(traceability.transportActivities.length, 3, 'Traceability must include all 3 transport activities');
    assert.strictEqual(traceability.esgActivities.length, 3, 'Traceability must include all 3 ESG activities');
    assert.strictEqual(traceability.ghgCalculations.length, 3, 'Traceability must include all 3 GHG calculations');
  });

  // ==========================================================================
  // 13. TENANT-SCOPED IDEMPOTENCY KEY COLLISION SAFETY
  // ==========================================================================
  it('13. prevents cross-tenant idempotency collisions when tenants submit identical keys', async () => {
    // Seed account for Tenant B
    db.insert('organizations', { organization_id: 'org-b', tenant_id: TENANT_B, code: 'ORG_B', name: 'Beta Logistics Corp' }, TENANT_B);
    db.insert('sites', { site_id: 'site-b-1', tenant_id: TENANT_B, organization_id: 'org-b', code: 'SITE_B_MUMBAI', name: 'Mumbai Logistics Hub' }, TENANT_B);
    db.insert('users', { user_id: 'user-b-host', tenant_id: TENANT_B, username: 'host.beta', email: 'host@beta.com' }, TENANT_B);

    const accountA = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-IDEMP-A',
      legalName: 'Tenant A Global Client',
      classification: 'OEM_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    const accountB = await service.createCustomerAccount({
      tenantId: TENANT_B,
      accountCode: 'CUS-IDEMP-B',
      legalName: 'Tenant B Global Client',
      classification: 'OEM_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    const SHARED_KEY = 'IDEMP-SHARED-KEY-2026';

    const visitA = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: accountA.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Tenant A Strategic Review',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      participants: [{ fullName: 'Delegate A', isLead: true }],
      idempotencyKey: SHARED_KEY,
    });

    const visitB = await service.createCustomerVisit({
      tenantId: TENANT_B,
      siteId: 'site-b-1',
      customerAccountId: accountB.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Tenant B Strategic Review',
      hostUserId: 'user-b-host',
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      participants: [{ fullName: 'Delegate B', isLead: true }],
      idempotencyKey: SHARED_KEY,
    });

    // Both succeed and have completely distinct transaction IDs
    assert.notStrictEqual(visitA.transactionId, visitB.transactionId);

    // Retrying with Tenant A returns visitA without creating a new record
    const retryA = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: accountA.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Tenant A Strategic Review',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      participants: [{ fullName: 'Delegate A', isLead: true }],
      idempotencyKey: SHARED_KEY,
    });
    assert.strictEqual(retryA.transactionId, visitA.transactionId);
  });

  // ==========================================================================
  // 14. REAL WORKFLOW & APPROVAL INSTANCES PERSISTENCE & TRANSITIONS
  // ==========================================================================
  it('14. persists genuine workflow and approval instance records and synchronizes transitions', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-WF-TEST',
      legalName: 'Workflow Test Partner',
      classification: 'OEM_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_AUDIT',
      title: 'IATF Audit Requiring Real Workflow',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
      participants: [{ fullName: 'Lead Auditor', isLead: true }],
    });

    // Inspect real db records
    const wfList = db.findMany('workflow_instances', { source_transaction_id: visit.transactionId }, TENANT_A);
    assert.strictEqual(wfList.length, 1, 'Workflow instance must be inserted into database');
    assert.strictEqual(wfList[0].status, 'IN_PROGRESS');

    const appList = db.findMany('approval_instances', { source_transaction_id: visit.transactionId }, TENANT_A);
    assert.strictEqual(appList.length, 1, 'Approval instance must be inserted into database');
    assert.strictEqual(appList[0].status, 'PENDING');

    // Execute approval
    await service.approveVisit(TENANT_A, visit.transactionId, HOST_USER_ID, 'Executive host approval');

    const updatedWf = db.findMany('workflow_instances', { source_transaction_id: visit.transactionId }, TENANT_A)[0];
    assert.strictEqual(updatedWf.status, 'COMPLETED');
    assert.strictEqual(updatedWf.current_stage_id, 'stg-cust-end');

    const updatedApp = db.findMany('approval_instances', { source_transaction_id: visit.transactionId }, TENANT_A)[0];
    assert.strictEqual(updatedApp.status, 'APPROVED');
  });

  // ==========================================================================
  // 15. CROSS-SITE GATE CHECK-IN REJECTION
  // ==========================================================================
  it('15. rejects gate check-in when operator attempts check-in at unauthorized plant site', async () => {
    // Seed gate at Site 2 (Coimbatore Foundry)
    const GATE_SITE_2 = 'gate-coimbatore-01';
    db.insert('gates', { gate_id: GATE_SITE_2, tenant_id: TENANT_A, site_id: SITE_2, code: 'GATE_CBE', name: 'Coimbatore Foundry Gate' }, TENANT_A);

    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-SITE-SEC',
      legalName: 'Secure Client Group',
      classification: 'STRATEGIC_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    // Visit is scheduled strictly for SITE_1 (Chennai Industrial Plant)
    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Chennai Plant Review',
      hostUserId: HOST_USER_ID,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      ndaSigned: true,
      participants: [{ fullName: 'Site Delegate', isLead: true }],
    });

    await service.approveVisit(TENANT_A, visit.transactionId, HOST_USER_ID);

    // Operator at Site 2 gate attempts check-in for Site 1 visit
    await assert.rejects(
      async () => {
        await service.checkInCustomerVisit({
          tenantId: TENANT_A,
          transactionId: visit.transactionId,
          gateId: GATE_SITE_2,
          operatorUserId: 'guard-cbe',
        });
      },
      /Cross-site access violation/
    );
  });

  // ==========================================================================
  // 16. EXPIRED APPOINTMENT CHECK-IN REJECTION
  // ==========================================================================
  it('16. strictly blocks check-in when appointment window has expired by more than 4 hours', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-EXPIRY-CHK',
      legalName: 'Expired Appointment Co',
      classification: 'EXISTING_CUSTOMER',
      tier: 'STANDARD',
    });

    // Scheduled end was 6 hours ago
    const expiredStart = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const expiredEnd = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const visit = await service.createCustomerVisit({
      tenantId: TENANT_A,
      siteId: SITE_1,
      customerAccountId: account.customerAccountId,
      visitTypeCode: 'CUSTOMER_MEETING',
      title: 'Meeting that was missed hours ago',
      hostUserId: HOST_USER_ID,
      scheduledStart: expiredStart,
      scheduledEnd: expiredEnd,
      ndaSigned: true,
      participants: [{ fullName: 'Belated Delegate', isLead: true }],
    });

    await service.approveVisit(TENANT_A, visit.transactionId, HOST_USER_ID);

    await assert.rejects(
      async () => {
        await service.checkInCustomerVisit({
          tenantId: TENANT_A,
          transactionId: visit.transactionId,
          gateId: GATE_ID,
          operatorUserId: 'guard-1',
        });
      },
      /Appointment window has expired/
    );
  });

  // ==========================================================================
  // 17. POLICY CONFLICT DETECTION
  // ==========================================================================
  it('17. detects policy conflict when customer exception conflicts with mandatory site rule', async () => {
    const account = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-CONFLICT',
      legalName: 'Conflict Seeker Inc',
      classification: 'OEM_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    // Site strictly prohibits photography
    db.insert('site_security_rules', {
      rule_id: 'rule-site-1-photo-strict',
      site_id: SITE_1,
      rule_type: 'PHOTO_RESTRICTION',
      policy_value: 'PROHIBITED',
      is_mandatory: true,
    });

    // Submitting with photographyPolicy: 'PERMITTED' must throw controlled policy conflict error
    await assert.rejects(
      async () => {
        await service.createCustomerVisit({
          tenantId: TENANT_A,
          siteId: SITE_1,
          customerAccountId: account.customerAccountId,
          visitTypeCode: 'CUSTOMER_MEETING',
          title: 'Visit demanding photography',
          hostUserId: HOST_USER_ID,
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          photographyPolicy: 'PERMITTED',
          participants: [{ fullName: 'Photographer', isLead: true }],
        });
      },
      /Policy conflict: Cannot override mandatory site security rule/
    );
  });

  // ==========================================================================
  // 18. CUSTOMER ACCOUNTS SITE FILTERING
  // ==========================================================================
  it('18. filters customer accounts by approved site boundary', async () => {
    const accSite1 = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-APPROVED-S1',
      legalName: 'Chennai Only Supplier',
      classification: 'OEM_CUSTOMER',
      tier: 'STANDARD',
      approvedSiteIds: [SITE_1],
    });

    const accSite2 = await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-APPROVED-S2',
      legalName: 'Coimbatore Only Supplier',
      classification: 'OEM_CUSTOMER',
      tier: 'STANDARD',
      approvedSiteIds: [SITE_2],
    });

    const s1Accounts = service.getCustomerAccounts({ tenantId: TENANT_A, siteId: SITE_1 });
    const codes = s1Accounts.items.map(a => a.accountCode);
    assert.ok(codes.includes('CUS-APPROVED-S1'));
    assert.strictEqual(codes.includes('CUS-APPROVED-S2'), false);
  });

  // ==========================================================================
  // 19. EXPORT AUTHORIZATION & PRIVACY AUDIT TRAIL
  // ==========================================================================
  it('19. enforces RBAC authorization and audit trail for customer data exports', async () => {
    await service.createCustomerAccount({
      tenantId: TENANT_A,
      accountCode: 'CUS-ACC-EXPORT-01',
      legalName: 'Export Target Corp',
      classification: 'OEM_CUSTOMER',
      tier: 'KEY_ACCOUNT',
    });

    const hostUser: UserContext = {
      userId: HOST_USER_ID,
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'HOST',
    };

    const adminUser: UserContext = {
      userId: 'admin-1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SUPER_ADMIN',
    };

    // HOST cannot export customer accounts
    await assert.rejects(
      async () => {
        await service.exportCustomerAccounts(hostUser, { tenantId: TENANT_A });
      },
      /AUTHORIZATION_DENIED/
    );

    // SUPER_ADMIN successfully exports customer accounts
    const result = await service.exportCustomerAccounts(adminUser, { tenantId: TENANT_A });
    assert.strictEqual(result.datasetName, 'CUSTOMER_ACCOUNTS');
    assert.ok(result.recordCount >= 1);
    assert.ok(result.exportId.startsWith('exp-'));

    // Check forensic audit trail
    const auditLogs = db.findMany('audit_logs', { tenant_id: TENANT_A, action: 'EXPORT' }, TENANT_A);
    assert.ok(auditLogs.length >= 1);
  });

  // ==========================================================================
  // 20. CUSTOMER API ROUTER END-TO-END HANDLING & RBAC
  // ==========================================================================
  it('20. executes REST endpoints via CustomerApiRouter enforcing authentication and RBAC', async () => {
    const router = new CustomerApiRouter(service);

    const adminUser: UserContext = {
      userId: 'admin-1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SUPER_ADMIN',
    };

    const guardUser: UserContext = {
      userId: 'guard-1',
      tenantId: TENANT_A,
      organizationId: 'org-a',
      role: 'SECURITY_GUARD',
    };

    // Unauthenticated request returns 401
    const unauth = await router.handleRequest({ path: '/api/v1/customers', method: 'GET' }, null as any);
    assert.strictEqual(unauth.statusCode, 401);

    // Guard attempting to create customer account returns 403
    const forbidden = await router.handleRequest(
      {
        path: '/api/v1/customers',
        method: 'POST',
        body: { legalName: 'Forbidden Inc', accountCode: 'CUS-FORBID' },
      },
      guardUser
    );
    assert.strictEqual(forbidden.statusCode, 403);

    // Admin creates customer account returns 201
    const createdRes = await router.handleRequest(
      {
        path: '/api/v1/customers',
        method: 'POST',
        body: { legalName: 'Router Created Client', accountCode: 'CUS-ROUTER-01', classification: 'OEM_CUSTOMER', tier: 'KEY_ACCOUNT' },
      },
      adminUser
    );
    assert.strictEqual(createdRes.statusCode, 201);
    assert.strictEqual(createdRes.data.accountCode, 'CUS-ROUTER-01');

    // Query analytics returns 200
    const analyticsRes = await router.handleRequest(
      { path: '/api/v1/customer-analytics', method: 'GET', query: { siteId: SITE_1 } },
      adminUser
    );
    assert.strictEqual(analyticsRes.statusCode, 200);
    assert.ok(analyticsRes.data.activeCustomerAccounts >= 1);
  });
});
