import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { ContractorService } from '../services/contractor/src/contractor.service.js';
import { ContractorApiRouter } from '../services/contractor/src/contractor.api.js';
import type { UserContext } from '@vms/types';
import type {
  CreateContractorCompanyInput,
  CreateContractInput,
  CreateWorkOrderInput,
  RegisterContractorWorkerInput,
  AssignWorkerInput,
  CheckInContractorWorkerInput,
  CheckOutContractorWorkerInput,
  CorrectAttendanceInput,
  ContractorTransportInput,
} from '../services/contractor/src/types.js';

describe('Part 8: Complete Contractor Management Domain Verification', () => {
  let db: RelationalDatabase;
  let service: ContractorService;

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const SITE_1 = '33333333-3333-4333-8333-333333333331';
  const SITE_2 = '33333333-3333-4333-8333-333333333332';
  const MANAGER_USER_ID = '44444444-4444-4444-8444-444444444441';
  const GATE_ID = '55555555-5555-4555-8555-555555555551';

  beforeEach(() => {
    db = new RelationalDatabase();

    // 1. Seed Tenants
    db.insert('tenants', { tenant_id: TENANT_A, code: 'TENANT_A', name: 'Alpha Heavy Industries' });
    db.insert('tenants', { tenant_id: TENANT_B, code: 'TENANT_B', name: 'Beta Refining Corp' });

    // 2. Seed Organizations & Sites
    db.insert('organizations', { organization_id: 'org-a', tenant_id: TENANT_A, code: 'ORG_A', name: 'Alpha Plant Corp' }, TENANT_A);
    db.insert('sites', { site_id: SITE_1, tenant_id: TENANT_A, organization_id: 'org-a', code: 'SITE_CHENNAI', name: 'Chennai Heavy Fabrication' }, TENANT_A);
    db.insert('sites', { site_id: SITE_2, tenant_id: TENANT_A, organization_id: 'org-a', code: 'SITE_ENNORE', name: 'Ennore Marine Yard' }, TENANT_A);

    // 3. Seed Users
    db.insert('users', { user_id: MANAGER_USER_ID, tenant_id: TENANT_A, username: 'ehs.ramesh', email: 'ramesh@alpha.com' }, TENANT_A);
    db.insert('users', { user_id: 'user-guard-1', tenant_id: TENANT_A, username: 'guard.karthik', email: 'karthik@alpha.com' }, TENANT_A);

    // 4. Seed Gates
    db.insert('gates', { gate_id: GATE_ID, tenant_id: TENANT_A, site_id: SITE_1, code: 'GATE_NORTH', name: 'North Contractor Gate' }, TENANT_A);

    service = new ContractorService(db);
  });

  // ==========================================================================
  // 1. CONTRACTOR COMPANY CRUD & DUPLICATE DETECTION
  // ==========================================================================
  it('1. creates contractor company, resolves canonical external org, and rejects duplicates', async () => {
    const input: CreateContractorCompanyInput = {
      tenantId: TENANT_A,
      companyName: 'L&T Industrial Piping Ltd',
      tradeName: 'L&T Piping',
      vendorCode: 'VND-LT-001',
      registrationNumber: 'CIN-U12345TN2010PLC',
      contractorClassification: 'TIER_1_GENERAL',
      safetyRating: 'PLATINUM',
      responsibleInternalManagerId: MANAGER_USER_ID,
      primaryContactName: 'Rajesh Kumar',
      primaryContactPhone: '+91 98401 23456',
      primaryContactEmail: 'rajesh.kumar@lntpiping.com',
      approvedSiteIds: [SITE_1, SITE_2],
      insurancePolicyNumber: 'POL-ICICI-998877',
      insuranceExpiryDate: '2027-12-31',
    };

    const company = await service.createContractorCompany(input);
    assert.ok(company.companyId);
    assert.strictEqual(company.vendorCode, 'VND-LT-001');
    assert.strictEqual(company.safetyRating, 'PLATINUM');
    assert.strictEqual(company.contractorClassification, 'TIER_1_GENERAL');
    assert.strictEqual(company.status, 'ACTIVE');

    // Canonical external org was created/linked
    assert.ok(company.externalOrgId);
    const org = db.findById('external_organizations', company.externalOrgId, TENANT_A);
    assert.ok(org);
    assert.strictEqual(org.name, 'L&T Industrial Piping Ltd');

    // Duplicate detection by vendorCode
    await assert.rejects(
      async () => {
        await service.createContractorCompany({
          tenantId: TENANT_A,
          companyName: 'Different Name Corp',
          vendorCode: 'VND-LT-001',
        });
      },
      /DUPLICATE_COMPANY_DETECTED/
    );

    // Duplicate detection by company name
    await assert.rejects(
      async () => {
        await service.createContractorCompany({
          tenantId: TENANT_A,
          companyName: 'L&T Industrial Piping Ltd',
          vendorCode: 'VND-NEW-999',
        });
      },
      /DUPLICATE_COMPANY_DETECTED/
    );
  });

  it('2. updates contractor company details and records audit trail', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Apex Scaffoldings Pvt Ltd',
      vendorCode: 'VND-APX-002',
    });

    const updated = await service.updateContractorCompany(company.companyId, {
      tenantId: TENANT_A,
      tradeName: 'Apex Scaffolds India',
      safetyRating: 'GOLD',
      updatedBy: MANAGER_USER_ID,
    });

    assert.strictEqual(updated.tradeName, 'Apex Scaffolds India');
    assert.strictEqual(updated.safetyRating, 'GOLD');

    const auditLogs = db.findMany('audit_logs', { tenant_id: TENANT_A, entity_id: company.companyId }, TENANT_A);
    assert.ok(auditLogs.length >= 1);
  });

  // ==========================================================================
  // 2. CONTRACT MANAGEMENT & EXPIRY LIFECYCLE
  // ==========================================================================
  it('3. manages contract lifecycle, supports multiple contracts per company, and handles renewal', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Thermax Boiler Maintenance',
      vendorCode: 'VND-THX-003',
    });

    // Create Contract 1 (Active)
    const contractInput: CreateContractInput = {
      tenantId: TENANT_A,
      companyId: company.companyId,
      contractNumber: 'CTR-2026-BOILER-01',
      title: 'Boiler Overhaul & Pipe Refitting 2026',
      contractType: 'MAINTENANCE',
      contractOwnerUserId: MANAGER_USER_ID,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      scopeOfWork: 'Annual high pressure boiler servicing',
      authorizedSiteIds: [SITE_1],
      applicableDepartments: ['MECHANICAL', 'UTILITIES'],
      requiredQualifications: ['BOILER_ATTENDANT_CLASS_1', 'IBR_WELDER'],
      requiredComplianceDocuments: ['WORKMEN_COMPENSATION', 'ESI_REGISTRATION'],
    };

    const contract1 = await service.createContract(contractInput);
    assert.ok(contract1.contractId);
    assert.strictEqual(contract1.contractNumber, 'CTR-2026-BOILER-01');
    assert.strictEqual(contract1.status, 'ACTIVE');

    // Create Contract 2 (Multiple contracts per company)
    const contract2 = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      contractNumber: 'CTR-2026-SCRUBBER-02',
      title: 'Flue Gas Scrubber Retrofit',
      contractType: 'TURNKEY',
      contractOwnerUserId: MANAGER_USER_ID,
      startDate: '2026-06-01',
      endDate: '2027-05-31',
      authorizedSiteIds: [SITE_1, SITE_2],
    });
    assert.ok(contract2.contractId);

    const companyContracts = await service.getContractsByCompany(company.companyId, TENANT_A);
    assert.strictEqual(companyContracts.length, 2);

    // Contract renewal
    const renewed = await service.renewContract({
      tenantId: TENANT_A,
      contractId: contract1.contractId,
      newEndDate: '2027-12-31',
      renewalReason: 'Extended operational scope for turbine cooling integration',
      approvedByUserId: MANAGER_USER_ID,
    });
    assert.strictEqual(new Date(renewed.endDate).toISOString().slice(0, 10), '2027-12-31');
    assert.strictEqual(renewed.status, 'ACTIVE');

    // Rejects invalid renewal with earlier date
    await assert.rejects(
      async () => {
        await service.renewContract({
          tenantId: TENANT_A,
          contractId: contract1.contractId,
          newEndDate: '2026-06-01',
          renewalReason: 'Invalid retrospective date',
          approvedByUserId: MANAGER_USER_ID,
        });
      },
      /must be after current end date/
    );
  });

  // ==========================================================================
  // 3. WORK ORDER MANAGEMENT & WORKFLOW
  // ==========================================================================
  it('4. executes complete work order workflow: create, submit, approve, and enforces contract constraints', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Siemens Energy Services',
      vendorCode: 'VND-SMS-004',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'Turbine Generator Maintenance',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    // Create Work Order
    const woInput: CreateWorkOrderInput = {
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      workOrderNumber: 'WO-2026-TURBINE-001',
      title: 'TG-1 Rotor Inspection & Blading Overhaul',
      scopeOfWork: 'Complete rotor balancing and ultrasonic blade inspection',
      workCategory: 'SPECIALIZED_TECHNICAL',
      responsibleInternalManagerId: MANAGER_USER_ID,
      workLocation: 'Turbine Hall Bay 3',
      startDate: '2026-10-01',
      endDate: '2026-11-30',
      authorizedWorkerCount: 10,
      safetyPermitRequired: true,
      permitRequirements: ['HOT_WORK_PERMIT', 'CONFINED_SPACE_PERMIT'],
      requiredTraining: ['SAFETY_INDUCTION', 'CONFINED_SPACE_ENTRY'],
      requiredQualifications: ['CERTIFIED_NDT_LEVEL_2'],
    };

    const workOrder = await service.createWorkOrder(woInput);
    assert.ok(workOrder.workOrderId);
    assert.strictEqual(workOrder.status, 'DRAFT');
    assert.strictEqual(workOrder.authorizedWorkerCount, 10);
    assert.strictEqual(workOrder.safetyPermitRequired, true);

    // Submit Work Order
    const submitted = await service.submitWorkOrder({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      submittedByUserId: MANAGER_USER_ID,
    });
    assert.strictEqual(submitted.status, 'PENDING_APPROVAL');

    // Approve Work Order
    const approved = await service.approveWorkOrder({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      approvedByUserId: MANAGER_USER_ID,
      remarks: 'Approved with EHS clearance and confined space monitor assignment',
    });
    assert.strictEqual(approved.status, 'APPROVED');

    // Rejects creating work order on unauthorized site
    await assert.rejects(
      async () => {
        await service.createWorkOrder({
          ...woInput,
          workOrderNumber: 'WO-UNAUTH-SITE',
          siteId: SITE_2, // Not in contract.authorizedSiteIds
        });
      },
      /Site .* is not authorized under Contract/
    );
  });

  // ==========================================================================
  // 4. WORKER REGISTRATION & CANONICAL PERSON DEDUPLICATION
  // ==========================================================================
  it('5. registers contractor workers, detects returning workers, and deduplicates to canonical person identity', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Reliance Piping & Fabricators',
      vendorCode: 'VND-RLI-005',
    });

    // 1. Register First Worker
    const worker1 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Murugan Subramanian',
      badgeNumber: 'BDG-MUR-101',
      tradeSkill: 'HIGH_PRESSURE_PIPE_WELDER',
      workerCategory: 'SKILLED_TRADESPERSON',
      designation: 'Senior Welder',
      phone: '+91 98411 98411',
      email: 'murugan.welder@gmail.com',
      nationalIdNumber: 'AADHAAR-8899-7766-5544',
      medicalFitnessValid: true,
      medicalFitnessExpiry: '2027-06-30',
    });

    assert.ok(worker1.contractorWorkerId);
    assert.ok(worker1.personId);
    assert.strictEqual(worker1.tradeSkill, 'HIGH_PRESSURE_PIPE_WELDER');
    assert.strictEqual(worker1.status, 'ACTIVE');

    // Canonical person record was created
    const canonicalPerson = db.findById('persons', worker1.personId, TENANT_A);
    assert.ok(canonicalPerson);
    assert.strictEqual(canonicalPerson.display_name, 'Murugan Subramanian');

    // 2. Returning Worker Deduplication: Same worker registered under another contractor or re-contracted
    const company2 = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'GMR Infrastructure Contracting',
      vendorCode: 'VND-GMR-006',
    });

    const worker2 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company2.companyId,
      fullName: 'Murugan Subramanian', // Same person
      tradeSkill: 'PIPELINE_FITTER',
      phone: '+91 98411 98411', // Matching Phone!
      nationalIdNumber: 'AADHAAR-8899-7766-5544',
      medicalFitnessValid: true,
    });

    // Worker profile is distinct per company relationship, BUT reuses the EXACT same canonical personId!
    assert.notStrictEqual(worker2.contractorWorkerId, worker1.contractorWorkerId);
    assert.strictEqual(worker2.personId, worker1.personId, 'Must link to existing canonical person without duplicating identity');

    // 3. Duplicate check for same worker under SAME company
    const dupCheck = await service.checkWorkerDuplicate(TENANT_A, company.companyId, '+91 98411 98411', 'AADHAAR-8899-7766-5544');
    assert.strictEqual(dupCheck.isDuplicate, true);
  });

  // ==========================================================================
  // 5. WORKER ASSIGNMENT & REASSIGNMENT LIFECYCLE
  // ==========================================================================
  it('6. assigns workers to work orders, enforces headcount limits, and reassigns cleanly', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Linde Industrial Gases Maintenance',
      vendorCode: 'VND-LND-007',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'Cryogenic Plant Servicing',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    const wo1 = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: 'Cold Box Leak Repair',
      scopeOfWork: 'Cryogenic cold box vacuum testing',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      authorizedWorkerCount: 1, // Only 1 worker permitted!
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: wo1.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: wo1.workOrderId, approvedByUserId: MANAGER_USER_ID });

    const wo2 = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: 'Compressor Overhaul',
      scopeOfWork: 'Oxygen compressor motor winding replacement',
      startDate: '2026-10-01',
      endDate: '2026-11-30',
      authorizedWorkerCount: 5,
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: wo2.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: wo2.workOrderId, approvedByUserId: MANAGER_USER_ID });

    // Register 2 workers
    const worker1 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Arun Prakash',
      tradeSkill: 'CRYOGENIC_TECHNICIAN',
      medicalFitnessValid: true,
    });

    const worker2 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Dinesh Balan',
      tradeSkill: 'ELECTRICAL_FITTER',
      medicalFitnessValid: true,
    });

    // Assign Worker 1 to WO 1 (fills quota 1/1)
    const assign1 = await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: wo1.workOrderId,
      contractorWorkerId: worker1.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });
    assert.ok(assign1.assignmentId);
    assert.strictEqual(assign1.status, 'ACTIVE');

    // Attempt to assign Worker 2 to WO 1 -> should fail due to HEADCOUNT_EXCEEDED
    await assert.rejects(
      async () => {
        await service.assignWorker({
          tenantId: TENANT_A,
          workOrderId: wo1.workOrderId,
          contractorWorkerId: worker2.contractorWorkerId,
          assignedFrom: '2026-10-01',
          assignedTo: '2026-10-31',
        });
      },
      /HEADCOUNT_EXCEEDED/
    );

    // Reassign Worker 1 from WO 1 to WO 2
    const reassigned = await service.reassignWorker({
      tenantId: TENANT_A,
      currentAssignmentId: assign1.assignmentId,
      newWorkOrderId: wo2.workOrderId,
      assignedFrom: '2026-10-15',
      assignedTo: '2026-11-30',
      reassignedByUserId: MANAGER_USER_ID,
      reason: 'Urgent compressor specialist requirement',
    });

    assert.strictEqual(reassigned.workOrderId, wo2.workOrderId);
    assert.strictEqual(reassigned.status, 'ACTIVE');

    // Prior assignment is now REASSIGNED
    const prior = db.findById('contractor_assignments', assign1.assignmentId, TENANT_A);
    assert.strictEqual(prior!.status, 'REASSIGNED');

    // Now WO 1 has space, so Worker 2 can be assigned to WO 1
    const assign2 = await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: wo1.workOrderId,
      contractorWorkerId: worker2.contractorWorkerId,
      assignedFrom: '2026-10-16',
      assignedTo: '2026-10-31',
    });
    assert.ok(assign2.assignmentId);
  });

  // ==========================================================================
  // 6. MULTI-SOURCE COMPLIANCE ENGINE & SAFETY PREREQUISITES
  // ==========================================================================
  it('7. evaluates multi-source compliance: medical fitness, training records, qualifications, and safety permits', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Heavy Rigging Specialists Ltd',
      vendorCode: 'VND-HRS-008',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'Crane & Rigging Framework',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    const workOrder = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: 'High Mast Crane Lift',
      scopeOfWork: 'Rigging and tandem lift of 80T fractionator column',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      requiredTraining: ['SAFETY_INDUCTION', 'CRANE_SAFETY'],
      requiredQualifications: ['CERTIFIED_MASTER_RIGGER'],
      permitRequirements: ['CRITICAL_LIFT_PERMIT'],
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, approvedByUserId: MANAGER_USER_ID });

    const worker = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Senthil Nathan',
      tradeSkill: 'MASTER_RIGGER',
      medicalFitnessValid: true,
      medicalFitnessExpiry: '2027-01-01',
    });

    // Initially missing training and qualifications -> INELIGIBLE
    const eval1 = await service.evaluateWorkerCompliance({
      tenantId: TENANT_A,
      workerId: worker.contractorWorkerId,
      workOrderId: workOrder.workOrderId,
    });
    assert.strictEqual(eval1.decision, 'INELIGIBLE');
    assert.ok(eval1.failedRequirements.includes('Training: SAFETY_INDUCTION'));
    assert.ok(eval1.failedRequirements.includes('Training: CRANE_SAFETY'));
    assert.ok(eval1.failedRequirements.includes('Qualification: CERTIFIED_MASTER_RIGGER'));

    // Record Training 1: Safety Induction
    await service.recordWorkerTraining({
      tenantId: TENANT_A,
      workerId: worker.contractorWorkerId,
      trainingType: 'SAFETY_INDUCTION',
      completedDate: '2026-01-15',
      expiryDate: '2027-01-14',
      certificateNumber: 'TRN-IND-991',
      verifiedByUserId: MANAGER_USER_ID,
    });

    // Record Training 2: Crane Safety
    await service.recordWorkerTraining({
      tenantId: TENANT_A,
      workerId: worker.contractorWorkerId,
      trainingType: 'CRANE_SAFETY',
      completedDate: '2026-02-10',
      expiryDate: '2027-02-09',
      certificateNumber: 'TRN-CRN-552',
      verifiedByUserId: MANAGER_USER_ID,
    });

    // Record Qualification: Master Rigger
    await service.recordWorkerQualification({
      tenantId: TENANT_A,
      workerId: worker.contractorWorkerId,
      qualificationName: 'CERTIFIED_MASTER_RIGGER',
      issuingBody: 'National Rigging Board',
      issueDate: '2025-01-01',
      expiryDate: '2028-01-01',
      verifiedByUserId: MANAGER_USER_ID,
    });

    // Verify Safety Permit Record
    const permitRecords = db.findMany('contractor_compliance_records', {
      tenant_id: TENANT_A,
      contractor_worker_id: worker.contractorWorkerId,
      requirement_type: 'SAFETY_PERMIT',
    }, TENANT_A);
    if (permitRecords.length > 0) {
      await service.verifyComplianceDocument({
        tenantId: TENANT_A,
        recordId: permitRecords[0].record_id,
        documentRef: 'DOC-CRITICAL-LIFT-PERMIT-001',
        verifiedByUserId: MANAGER_USER_ID,
      });
    }

    // Now re-evaluate compliance -> ELIGIBLE
    const eval2 = await service.evaluateWorkerCompliance({
      tenantId: TENANT_A,
      workerId: worker.contractorWorkerId,
      workOrderId: workOrder.workOrderId,
    });
    assert.strictEqual(eval2.decision, 'ELIGIBLE');
    assert.strictEqual(eval2.failedRequirements.length, 0);

    // If medical fitness expires -> becomes INELIGIBLE
    await service.updateContractorWorker(worker.contractorWorkerId, {
      tenantId: TENANT_A,
      medicalFitnessValid: false,
      updatedBy: MANAGER_USER_ID,
    });

    const eval3 = await service.evaluateWorkerCompliance({
      tenantId: TENANT_A,
      workerId: worker.contractorWorkerId,
      workOrderId: workOrder.workOrderId,
    });
    assert.strictEqual(eval3.decision, 'INELIGIBLE');
    assert.ok(eval3.failedRequirements.includes('Medical Fitness Certificate'));
  });

  // ==========================================================================
  // 7. ATTENDANCE LEDGER & GATE OPERATIONS
  // ==========================================================================
  it('8. executes gate check-in, prevents unassigned/ineligible access, prevents double check-ins, and handles check-out', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'BHEL Fabrication Services',
      vendorCode: 'VND-BHL-009',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'Pressure Vessel Welding',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    const workOrder = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: 'Vessel Weld Seam UT Inspection',
      scopeOfWork: 'Weld seam preparation and ultrasonic testing',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, approvedByUserId: MANAGER_USER_ID });

    const worker = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Pradeep Chandran',
      tradeSkill: 'NDT_TECHNICIAN',
      medicalFitnessValid: true,
      medicalFitnessExpiry: '2027-01-01',
    });

    // Check-in without assignment -> Fails with NO_ACTIVE_ASSIGNMENT
    await assert.rejects(
      async () => {
        await service.checkInWorker({
          tenantId: TENANT_A,
          siteId: SITE_1,
          gateId: GATE_ID,
          workOrderId: workOrder.workOrderId,
          contractorWorkerId: worker.contractorWorkerId,
        });
      },
      /NO_ACTIVE_ASSIGNMENT/
    );

    // Assign worker to work order
    const assignment = await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });

    // Successful Check-In
    const entryTime = new Date('2026-10-12T08:00:00Z');
    const checkIn = await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      gateId: GATE_ID,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker.contractorWorkerId,
      assignmentId: assignment.assignmentId,
      shiftDate: '2026-10-12',
      entryTime,
      idempotencyKey: 'IDEMP-CHK-PRADEEP-01',
    });

    assert.ok(checkIn.attendanceId);
    assert.strictEqual(checkIn.presenceStatus, 'CHECKED_IN');
    assert.strictEqual(new Date(checkIn.shiftDate).toISOString().slice(0, 10), '2026-10-12');

    // Idempotent retry returns existing attendance record
    const idempRetry = await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      gateId: GATE_ID,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker.contractorWorkerId,
      assignmentId: assignment.assignmentId,
      shiftDate: '2026-10-12',
      idempotencyKey: 'IDEMP-CHK-PRADEEP-01',
    });
    assert.strictEqual(idempRetry.attendanceId, checkIn.attendanceId);

    // Double check-in prevention without idempotency key
    await assert.rejects(
      async () => {
        await service.checkInWorker({
          tenantId: TENANT_A,
          siteId: SITE_1,
          gateId: GATE_ID,
          workOrderId: workOrder.workOrderId,
          contractorWorkerId: worker.contractorWorkerId,
          shiftDate: '2026-10-12',
        });
      },
      /ALREADY_CHECKED_IN/
    );

    // Currently On-Site check
    const onSite = await service.getCurrentlyOnSite(TENANT_A, SITE_1);
    assert.strictEqual(onSite.length, 1);
    assert.strictEqual(onSite[0].attendanceId, checkIn.attendanceId);

    // Check-Out
    const exitTime = new Date('2026-10-12T17:30:00Z'); // 9.5 hours
    const checkOut = await service.checkOutWorker({
      tenantId: TENANT_A,
      attendanceId: checkIn.attendanceId,
      gateId: GATE_ID,
      exitTime,
    });

    assert.strictEqual(checkOut.presenceStatus, 'CHECKED_OUT');
    assert.strictEqual(checkOut.hoursWorked, 9.5);
    assert.ok(checkOut.exitTime);

    // Already checked-out rejection
    await assert.rejects(
      async () => {
        await service.checkOutWorker({
          tenantId: TENANT_A,
          attendanceId: checkIn.attendanceId,
        });
      },
      /ALREADY_CHECKED_OUT/
    );

    // On-site count is now 0
    const onSiteAfter = await service.getCurrentlyOnSite(TENANT_A, SITE_1);
    assert.strictEqual(onSiteAfter.length, 0);
  });

  // ==========================================================================
  // 8. ATTENDANCE CORRECTIONS & AUDIT TRAIL
  // ==========================================================================
  it('9. records attendance manual corrections, preserves original audit trail, and detects overstays', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Chennai Electrical Systems',
      vendorCode: 'VND-CES-010',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'Substation Switchgear Maintenance',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    const workOrder = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: '11kV Panel Maintenance',
      scopeOfWork: 'Vacuum circuit breaker testing',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, approvedByUserId: MANAGER_USER_ID });

    const worker = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Gokul Kannan',
      tradeSkill: 'SUBSTATION_ELECTRICIAN',
      medicalFitnessValid: true,
    });

    await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });

    // Check in 15 hours ago to simulate overstay
    const entryPast = new Date(Date.now() - 15 * 60 * 60 * 1000);
    const checkIn = await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      gateId: GATE_ID,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker.contractorWorkerId,
      shiftDate: entryPast.toISOString().slice(0, 10),
      entryTime: entryPast,
    });

    // Detect Overstay (max standard shift is 12h)
    const overstays = await service.getOverstayWorkers(TENANT_A, SITE_1, 12);
    assert.strictEqual(overstays.length, 1);
    assert.strictEqual(overstays[0].attendanceId, checkIn.attendanceId);
    assert.ok(overstays[0].hoursOnSite >= 14);

    // Apply manual correction
    const correctedExit = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const corrected = await service.correctAttendance({
      tenantId: TENANT_A,
      attendanceId: checkIn.attendanceId,
      correctedExitTime: correctedExit,
      correctedPresenceStatus: 'CHECKED_OUT',
      correctionReason: 'Worker left via Emergency Gate East during power drill; gate operator forgot badge punch',
      correctedByUserId: MANAGER_USER_ID,
    });

    assert.strictEqual(corrected.isManualCorrection, true);
    assert.strictEqual(corrected.presenceStatus, 'CHECKED_OUT');
    assert.ok(corrected.hoursWorked! > 0);

    // Audit log verifies correction reason was captured
    const correctionLogs = db.findMany('audit_logs', {
      tenant_id: TENANT_A,
      entity_id: checkIn.attendanceId,
      action: 'CORRECTION',
    }, TENANT_A);
    assert.strictEqual(correctionLogs.length, 1);
    assert.ok(correctionLogs[0].metadata?.correctionReason.includes('Emergency Gate East'));
  });

  // ==========================================================================
  // 9. GROUP TRANSPORT DEDUPLICATION & ZERO-BLOCKER INVARIANT
  // ==========================================================================
  it('10. handles group transport deduplication (shared bus) and enforces Zero-Blocker Invariant for GHG capture', async () => {
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Ashok Leyland Site Services',
      vendorCode: 'VND-ALL-011',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'Plant Shift Support Services',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    const workOrder = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: 'Shift Assembly Operations',
      scopeOfWork: 'Line operations shift 1',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      authorizedWorkerCount: 50,
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, approvedByUserId: MANAGER_USER_ID });

    // Register 2 workers sharing the SAME contractor shuttle bus
    const worker1 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Kishore Kumar',
      tradeSkill: 'ASSEMBLY_OPERATOR',
      medicalFitnessValid: true,
    });
    await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker1.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });

    const worker2 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Venkatesh Rao',
      tradeSkill: 'ASSEMBLY_OPERATOR',
      medicalFitnessValid: true,
    });
    await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker2.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });

    const sharedBusTransport: ContractorTransportInput = {
      mode: 'BUS',
      ownership: 'COMPANY',
      vehicleClass: 'COACH_BUS',
      fuelType: 'DIESEL',
      usageType: 'SHARED',
      originLocation: 'Tambaram Workforce Hub',
      destinationLocation: 'Chennai Heavy Fabrication Site 1',
      distanceKm: 28.5,
      isSharedVehicle: true,
      vehiclePlate: 'TN-11-SHUTTLE-4488',
    };

    // Worker 1 Check-In (creates first physical transport record)
    const chk1 = await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker1.contractorWorkerId,
      shiftDate: '2026-10-12',
      transport: sharedBusTransport,
    });

    assert.ok(chk1.transportActivityId);
    assert.ok(chk1.ghgActivityId);

    const initialTra = db.findById('transport_activities', chk1.transportActivityId!, TENANT_A);
    assert.strictEqual(initialTra!.occupancy, 1);

    // Worker 2 Check-In with same vehicle plate and origin (Deduplication!)
    const chk2 = await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker2.contractorWorkerId,
      shiftDate: '2026-10-12',
      transport: sharedBusTransport,
    });

    // Reuses the EXACT same physical transport activity ID
    assert.strictEqual(chk2.transportActivityId, chk1.transportActivityId, 'Group transport must deduplicate to single physical movement');

    // And occupancy is incremented to 2
    const updatedTra = db.findById('transport_activities', chk1.transportActivityId!, TENANT_A);
    assert.strictEqual(updatedTra!.occupancy, 2, 'Occupancy must increment to 2 on shared transport movement');

    // Zero-Blocker Invariant: Worker check-in must never fail even if GHG calculation engine encounters an issue
    const worker3 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Mani Maran',
      tradeSkill: 'ASSEMBLY_OPERATOR',
      medicalFitnessValid: true,
    });
    await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker3.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });

    const chk3 = await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker3.contractorWorkerId,
      shiftDate: '2026-10-12',
      transport: {
        mode: 'TWO_WHEELER',
        ownership: 'PERSONAL',
        vehicleClass: 'TWO_WHEELER',
        fuelType: 'PETROL',
        usageType: 'INDIVIDUAL',
        originLocation: 'Guindy',
        destinationLocation: 'Chennai Heavy Fabrication Site 1',
        distanceKm: 14.0,
      },
    });

    assert.ok(chk3.attendanceId);
    assert.strictEqual(chk3.presenceStatus, 'CHECKED_IN');
  });

  // ==========================================================================
  // 10. MULTI-TENANT ISOLATION (RLS) & DATABASE-DRIVEN ANALYTICS
  // ==========================================================================
  it('11. strictly enforces multi-tenant RLS isolation between Tenant A and Tenant B', async () => {
    // Seed records for Tenant A
    const compA = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Alpha Specific Contractors',
      vendorCode: 'VND-ALP-001',
    });

    const contractA = await service.createContract({
      tenantId: TENANT_A,
      companyId: compA.companyId,
      title: 'Alpha Contract',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    // Seed records for Tenant B
    const compB = await service.createContractorCompany({
      tenantId: TENANT_B,
      companyName: 'Beta Specific Contractors',
      vendorCode: 'VND-BET-001',
    });

    // Tenant B cannot see Tenant A's company
    const compQueryB = await service.getContractorCompanies({ tenantId: TENANT_B });
    assert.strictEqual(compQueryB.items.length, 1);
    assert.strictEqual(compQueryB.items[0].companyId, compB.companyId);

    const compQueryA = await service.getContractorCompanies({ tenantId: TENANT_A });
    assert.strictEqual(compQueryA.items.length, 1);
    assert.strictEqual(compQueryA.items[0].companyId, compA.companyId);

    // Cross-tenant update blocked (returns not found due to tenant scoping)
    await assert.rejects(
      async () => {
        await service.updateContractorCompany(compA.companyId, {
          tenantId: TENANT_B,
          tradeName: 'Hacked Alpha',
          updatedBy: 'MALICIOUS_USER',
        });
      },
      /not found/
    );

    // Cross-tenant contract query blocked
    const contractsB = await service.getContractsByCompany(compA.companyId, TENANT_B);
    assert.strictEqual(contractsB.length, 0);
  });

  it('12. calculates real database-driven analytics summary across companies, contracts, work orders, attendance, and compliance', async () => {
    // Seed 1 active company, 1 contract, 1 work order, 2 workers (1 compliant, 1 non-compliant), 1 checked-in
    const company = await service.createContractorCompany({
      tenantId: TENANT_A,
      companyName: 'Godrej Engineering Services',
      vendorCode: 'VND-GDJ-012',
    });

    const contract = await service.createContract({
      tenantId: TENANT_A,
      companyId: company.companyId,
      title: 'HVAC Plant Maintenance',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      authorizedSiteIds: [SITE_1],
    });

    const workOrder = await service.createWorkOrder({
      tenantId: TENANT_A,
      siteId: SITE_1,
      contractId: contract.contractId,
      companyId: company.companyId,
      title: 'Chiller Plant Overhaul',
      scopeOfWork: 'Compressor oil change and chiller descaling',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
    await service.submitWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, submittedByUserId: MANAGER_USER_ID });
    await service.approveWorkOrder({ tenantId: TENANT_A, workOrderId: workOrder.workOrderId, approvedByUserId: MANAGER_USER_ID });

    // Worker 1: Compliant
    const worker1 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Naveen Kumar',
      tradeSkill: 'HVAC_TECHNICIAN',
      medicalFitnessValid: true,
    });
    await service.assignWorker({
      tenantId: TENANT_A,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker1.contractorWorkerId,
      assignedFrom: '2026-10-01',
      assignedTo: '2026-10-31',
    });

    // Check in Worker 1
    await service.checkInWorker({
      tenantId: TENANT_A,
      siteId: SITE_1,
      workOrderId: workOrder.workOrderId,
      contractorWorkerId: worker1.contractorWorkerId,
      shiftDate: new Date().toISOString().slice(0, 10),
    });

    // Worker 2: Non-compliant (medical fitness false)
    const worker2 = await service.registerContractorWorker({
      tenantId: TENANT_A,
      companyId: company.companyId,
      fullName: 'Ravi Shankar',
      tradeSkill: 'DUCT_FITTER',
      medicalFitnessValid: false,
    });

    const analytics = await service.getContractorAnalytics(TENANT_A, SITE_1);
    assert.strictEqual(analytics.activeContractorCompanies, 1);
    assert.strictEqual(analytics.activeContracts, 1);
    assert.strictEqual(analytics.activeWorkOrders, 1);
    assert.strictEqual(analytics.assignedWorkers, 1);
    assert.strictEqual(analytics.currentlyOnSite, 1);
    assert.strictEqual(analytics.todayCheckIns, 1);
    assert.strictEqual(analytics.restrictedWorkersCount, 1);
  });

  // ==========================================================================
  // 11. REST API ROUTER & RBAC SECURITY
  // ==========================================================================
  it('13. executes REST API endpoints with RBAC role authorization via ContractorApiRouter', async () => {
    const router = new ContractorApiRouter(service);

    const adminContext: UserContext = {
      userId: MANAGER_USER_ID,
      tenantId: TENANT_A,
      organizationId: 'ORG-MAIN-001',
      role: 'SUPER_ADMIN',
      permissions: ['CONTRACTOR_MANAGE', 'CONTRACTOR_APPROVE', 'CONTRACTOR_GATE_CHECKIN', 'CONTRACTOR_VIEW'],
    };

    const guardContext: UserContext = {
      userId: 'user-guard-1',
      tenantId: TENANT_A,
      organizationId: 'ORG-MAIN-001',
      role: 'SECURITY_GUARD',
      permissions: ['CONTRACTOR_GATE_CHECKIN', 'CONTRACTOR_VIEW'],
    };

    // 1. Admin creates company via API
    const resCompany = await router.handleRequest(
      {
        method: 'POST',
        path: '/api/v1/contractors/companies',
        body: {
          companyName: 'API Test Piping Corp',
          vendorCode: 'VND-API-001',
        },
      },
      adminContext
    );
    assert.strictEqual(resCompany.statusCode, 201);
    const createdCompany = resCompany.data;
    assert.ok(createdCompany.companyId);

    // 2. Guard cannot create company (403 Forbidden)
    const resForbidden = await router.handleRequest(
      {
        method: 'POST',
        path: '/api/v1/contractors/companies',
        body: {
          companyName: 'Guard Unauthorized Company',
          vendorCode: 'VND-API-002',
        },
      },
      guardContext
    );
    assert.strictEqual(resForbidden.statusCode, 403);

    // 3. Guard can view companies (200 OK)
    const resList = await router.handleRequest(
      {
        method: 'GET',
        path: '/api/v1/contractors/companies',
      },
      guardContext
    );
    assert.strictEqual(resList.statusCode, 200);
    assert.ok(resList.data.items.length >= 1);

    // 4. Admin creates contract and work order
    const resContract = await router.handleRequest(
      {
        method: 'POST',
        path: '/api/v1/contractors/contracts',
        body: {
          companyId: createdCompany.companyId,
          title: 'API Test Contract',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          authorizedSiteIds: [SITE_1],
        },
      },
      adminContext
    );
    assert.strictEqual(resContract.statusCode, 201);

    const resWo = await router.handleRequest(
      {
        method: 'POST',
        path: '/api/v1/contractors/work-orders',
        body: {
          siteId: SITE_1,
          contractId: resContract.data.contractId,
          companyId: createdCompany.companyId,
          title: 'API Test Work Order',
          scopeOfWork: 'API testing scope',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
        },
      },
      adminContext
    );
    assert.strictEqual(resWo.statusCode, 201);

    // 5. Work order approval via API
    const resSubmit = await router.handleRequest(
      {
        method: 'POST',
        path: `/api/v1/contractors/work-orders/${resWo.data.workOrderId}/submit`,
      },
      adminContext
    );
    assert.strictEqual(resSubmit.statusCode, 200);

    const resApprove = await router.handleRequest(
      {
        method: 'POST',
        path: `/api/v1/contractors/work-orders/${resWo.data.workOrderId}/approve`,
        body: { remarks: 'Approved via API' },
      },
      adminContext
    );
    assert.strictEqual(resApprove.statusCode, 200);
    assert.strictEqual(resApprove.data.status, 'APPROVED');

    // 6. Analytics query via API
    const resAnalytics = await router.handleRequest(
      {
        method: 'GET',
        path: '/api/v1/contractors/analytics',
        query: { siteId: SITE_1 },
      },
      adminContext
    );
    assert.strictEqual(resAnalytics.statusCode, 200);
    assert.ok(resAnalytics.data.activeContractorCompanies >= 1);
  });
});
