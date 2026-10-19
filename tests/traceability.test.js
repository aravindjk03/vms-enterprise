import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { RelationalDatabase, MigrationRunner, OperationalCapturePipeline, TraceabilityEngine, } from '../packages/database/src/index.js';
describe('Section 61 Critical Traceability & Provenance Chain Verification', () => {
    let db;
    let runner;
    let pipeline;
    let engine;
    const tenantId = '00000000-0000-0000-0000-000000000001'; // GLOBAL-MFG
    const siteDetroit = '00000000-0000-0000-0000-000000000101'; // DETROIT-ASSEMBLY
    const siteChennai = '00000000-0000-0000-0000-000000000102'; // CHENNAI-PLANT
    beforeEach(async () => {
        db = new RelationalDatabase();
        runner = new MigrationRunner(db);
        await runner.runMigrations();
        pipeline = new OperationalCapturePipeline(db);
        engine = new TraceabilityEngine(db);
    });
    it('Pipeline 1 (VISITOR): captures activity and resolves full bidirectional provenance chain', async () => {
        // 1. Create a person
        const personId = randomUUID();
        db.setTenantContext(tenantId);
        db.insert('persons', {
            person_id: personId,
            tenant_id: tenantId,
            first_name: 'Emily',
            last_name: 'Watson',
            display_name: 'Emily Watson',
            nationality: 'USA',
        }, tenantId);
        // 2. Execute operational capture pipeline for VISITOR
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'VISITOR',
            transactionData: {
                person_id: personId,
                host_user_id: '00000000-0000-0000-0000-000000000601',
                scheduled_start: new Date('2026-10-10T09:00:00Z'),
                scheduled_end: new Date('2026-10-10T17:00:00Z'),
            },
            transportData: {
                origin: 'Detroit Metro Airport',
                destination: 'Detroit Assembly Complex',
                distance: 42.5,
                mode: 'CAR',
                fuelType: 'PETROL',
                occupancy: 1,
                ownership: 'PERSONAL',
                measurementMethod: 'MAP_API',
                personId,
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.calculationStatus, 'CALCULATED');
        assert.ok(result.ghgActivity);
        assert.ok(result.calculationResult);
        assert.ok(result.calculationResult.co2e > 0);
        // 3. Trace provenance starting from GHG Activity ID
        const chain = engine.traceFromGHGActivity(result.ghgActivity.id, tenantId);
        assert.strictEqual(chain.sourceDomain, 'VISITOR');
        assert.strictEqual(chain.sourceTransactionId, result.sourceTransactionId);
        assert.strictEqual(chain.person?.display_name, 'Emily Watson');
        assert.strictEqual(chain.site?.code, 'DETROIT-ASSEMBLY');
        assert.strictEqual(chain.ghgActivity.scope, 'SCOPE_3');
        assert.strictEqual(chain.ghgActivity.category, 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING');
        assert.strictEqual(chain.ghgCalculation?.calculation_status, 'SUCCESS');
        assert.strictEqual(chain.emissionFactorVersion?.factor_id, 'EF-DEFRA-ROAD-PETROL-CAR');
        assert.strictEqual(chain.emissionFactorVersion?.version_tag, '2026.1');
        // 4. Verify canonical proof string formatting
        assert.ok(chain.provenanceProof.includes('GHG Result'));
        assert.ok(chain.provenanceProof.includes('GHG Activity'));
        assert.ok(chain.provenanceProof.includes('Transport Activity'));
        assert.ok(chain.provenanceProof.includes('Source Transaction (VISITOR:'));
        assert.ok(chain.provenanceProof.includes('Operational Data (Site: DETROIT-ASSEMBLY, Person: Emily Watson)'));
        // 5. Verify integrity check
        const verification = engine.verifyProvenanceIntegrity(result.ghgActivity.id, tenantId);
        assert.strictEqual(verification.valid, true);
        assert.strictEqual(verification.reasons.length, 0);
        // 6. Test reverse traversal from source transaction ID
        const reverseChains = engine.traceFromSourceTransaction('VISITOR', result.sourceTransactionId, tenantId);
        assert.strictEqual(reverseChains.length, 1);
        assert.strictEqual(reverseChains[0].ghgActivity.id, result.ghgActivity.id);
    });
    it('Pipeline 2 (MATERIAL): captures multi-line items, returnable containers, freight weight, and resolves provenance', async () => {
        db.setTenantContext(tenantId);
        // 1. Create a driver person & vehicle
        const driverId = randomUUID();
        db.insert('persons', {
            person_id: driverId,
            tenant_id: tenantId,
            first_name: 'Robert',
            last_name: 'Trucker',
            display_name: 'Robert Trucker',
        }, tenantId);
        const vehicleId = randomUUID();
        db.insert('vehicles', {
            vehicle_id: vehicleId,
            tenant_id: tenantId,
            registration_plate: 'MI-FREIGHT-99',
        }, tenantId);
        // 2. Create Material PO
        const poId = randomUUID();
        db.insert('purchase_orders', {
            po_id: poId,
            tenant_id: tenantId,
            po_number: 'PO-2026-STEEL-01',
            supplier_org_id: '00000000-0000-0000-0000-000000000801',
            issue_date: '2026-10-01',
            currency: 'USD',
            status: 'ISSUED',
        }, tenantId);
        // 3. Execute Material capture with multiple line items & returnable pallets
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'MATERIAL',
            transactionData: {
                po_id: poId,
                driver_person_id: driverId,
                vehicle_id: vehicleId,
                movement_type: 'INWARD',
                delivery_challan_number: 'DC-STEEL-4481',
                lines: [
                    {
                        line_id: 'LINE-01',
                        material_id: '00000000-0000-0000-0000-000000000901',
                        description: 'Hot Rolled Steel Coils',
                        quantity: 25,
                        unit: 'TONNE',
                        is_returnable: false,
                    },
                    {
                        line_id: 'LINE-02',
                        material_id: '00000000-0000-0000-0000-000000000902',
                        description: 'Heavy Returnable Shipping Skids',
                        quantity: 10,
                        unit: 'PALLET',
                        is_returnable: true,
                    },
                ],
            },
            transportData: {
                origin: 'Gary Steel Works, Indiana',
                destination: 'Detroit Assembly Complex',
                distance: 380,
                payloadWeightTonnes: 25.0, // 25 Tonnes freight payload
                mode: 'TRUCK',
                vehicleType: 'HEAVY_DUTY_TRUCK',
                fuelType: 'DIESEL',
                ownership: 'TRANSPORTER',
                measurementMethod: 'WEIGHBRIDGE',
                direction: 'INBOUND',
                personId: driverId,
                vehicleId,
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.calculationStatus, 'CALCULATED');
        assert.strictEqual(result.ghgActivity?.activity_type, 'FREIGHT_DISTANCE_WEIGHT');
        assert.strictEqual(result.ghgActivity?.quantity_unit, 'tonne-km');
        assert.strictEqual(result.ghgActivity?.quantity, 380 * 25.0); // 9500 tonne-km
        // Record return of returnable skids
        db.insert('material_returns', {
            return_id: randomUUID(),
            tenant_id: tenantId,
            material_transaction_line_id: 'LINE-02',
            return_transaction_id: result.sourceTransactionId,
            quantity_returned: 10,
            return_date: new Date(),
            condition_status: 'INTACT_GOOD',
            created_at: new Date(),
        }, tenantId);
        // Trace provenance
        const chain = engine.traceFromGHGActivity(result.ghgActivity.id, tenantId);
        assert.strictEqual(chain.sourceDomain, 'MATERIAL');
        assert.strictEqual(chain.purchaseOrder?.po_number, 'PO-2026-STEEL-01');
        assert.strictEqual(chain.materialLines?.length, 2);
        assert.strictEqual(chain.materialReturns?.length, 1);
        assert.strictEqual(chain.materialReturns[0].quantity_returned, 10);
        assert.strictEqual(chain.person?.display_name, 'Robert Trucker');
        assert.strictEqual(chain.ghgActivity.scope, 'SCOPE_3');
        assert.strictEqual(chain.ghgActivity.category, 'CAT_4_UPSTREAM_TRANSPORTATION');
    });
    it('Pipeline 3 (CUSTOMER): captures multi-participant delegation visits and resolves account hierarchy', async () => {
        db.setTenantContext(tenantId);
        // 1. Create 2 customer participants
        const leadPersonId = randomUUID();
        db.insert('persons', {
            person_id: leadPersonId,
            tenant_id: tenantId,
            first_name: 'David',
            last_name: 'Lead',
            display_name: 'David Lead VP',
        }, tenantId);
        const delegatePersonId = randomUUID();
        db.insert('persons', {
            person_id: delegatePersonId,
            tenant_id: tenantId,
            first_name: 'Sarah',
            last_name: 'Delegate',
            display_name: 'Sarah Delegate Engineer',
        }, tenantId);
        // 2. Execute Customer Visit capture
        const result = await pipeline.execute({
            tenantId,
            siteId: siteChennai,
            sourceDomain: 'CUSTOMER',
            transactionData: {
                customer_account_id: '00000000-0000-0000-0000-000000000821',
                title: 'Quarterly Strategic OEM Audit',
                participants: [
                    { person_id: leadPersonId, is_lead: true },
                    { person_id: delegatePersonId, is_lead: false },
                ],
            },
            transportData: {
                origin: 'Chennai International Airport',
                destination: 'Chennai Precision Plant',
                distance: 28,
                mode: 'CAR',
                fuelType: 'PETROL',
                occupancy: 2, // Delegation carpool
                ownership: 'HIRED',
                measurementMethod: 'MAP_API',
                personId: leadPersonId,
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.calculationStatus, 'CALCULATED');
        const chain = engine.traceFromGHGActivity(result.ghgActivity.id, tenantId);
        assert.strictEqual(chain.sourceDomain, 'CUSTOMER');
        assert.strictEqual(chain.customerAccount?.account_name, 'Acme Global Account');
        assert.strictEqual(chain.customerParticipants?.length, 2);
        assert.strictEqual(chain.person?.display_name, 'David Lead VP');
        assert.strictEqual(chain.ghgActivity.scope, 'SCOPE_3');
        assert.strictEqual(chain.ghgActivity.category, 'CAT_6_BUSINESS_TRAVEL');
    });
    it('Pipeline 4 (CONTRACTOR): captures workforce shift commute and resolves Contractor Company -> Contract -> WO -> Worker', async () => {
        db.setTenantContext(tenantId);
        // 1. Execute Contractor Work Order capture
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'CONTRACTOR',
            transactionData: {
                company_id: '00000000-0000-0000-0000-000000000841',
                contract_id: '00000000-0000-0000-0000-000000000851',
                authorized_worker_count: 15,
                scope_of_work: 'Annual Hydraulic Press Overhaul',
            },
            transportData: {
                origin: 'Contractor Regional Staging Depot',
                destination: 'Detroit Assembly Complex',
                distance: 35,
                mode: 'BUS',
                vehicleType: 'COACH_BUS',
                fuelType: 'DIESEL',
                occupancy: 15,
                ownership: 'HIRED',
                measurementMethod: 'ODOMETER_LOG',
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.calculationStatus, 'CALCULATED');
        const chain = engine.traceFromGHGActivity(result.ghgActivity.id, tenantId);
        assert.strictEqual(chain.sourceDomain, 'CONTRACTOR');
        assert.strictEqual(chain.contractorCompany?.vendor_code, 'VEND-APEX-99');
        assert.strictEqual(chain.contractorContract?.contract_number, 'CONTR-2026-APEX');
        assert.ok(chain.contractorWorkers && chain.contractorWorkers.length >= 1);
        assert.strictEqual(chain.ghgActivity.scope, 'SCOPE_3');
        assert.strictEqual(chain.ghgActivity.category, 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING');
    });
    it('Pipeline 5 (SERVICE): captures OEM service order and resolves Service Provider -> Equipment Tag', async () => {
        db.setTenantContext(tenantId);
        const result = await pipeline.execute({
            tenantId,
            siteId: siteChennai,
            sourceDomain: 'SERVICE',
            transactionData: {
                service_provider_id: '00000000-0000-0000-0000-000000000871',
                equipment_tag: 'ROBOTIC-WELD-CELL-09',
                maintenance_lead_id: '00000000-0000-0000-0000-000000000601',
            },
            transportData: {
                origin: 'OEM Technical Service Hub, Chennai',
                destination: 'Chennai Precision Plant',
                distance: 18,
                mode: 'CAR',
                ownership: 'PERSONAL',
                occupancy: 1,
            },
        });
        assert.strictEqual(result.success, true);
        const chain = engine.traceFromGHGActivity(result.ghgActivity.id, tenantId);
        assert.strictEqual(chain.sourceDomain, 'SERVICE');
        assert.strictEqual(chain.serviceProvider?.provider_code, 'SP-KUKA-01');
        assert.strictEqual(chain.sourceTransaction.equipment_tag, 'ROBOTIC-WELD-CELL-09');
        assert.strictEqual(chain.ghgActivity.scope, 'SCOPE_3');
        assert.strictEqual(chain.ghgActivity.category, 'CAT_1_PURCHASED_SERVICES');
    });
    it('Pipeline 6 (VEHICLE): captures company fleet transport and assigns Scope 1 direct mobile combustion', async () => {
        db.setTenantContext(tenantId);
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'VEHICLE',
            transactionData: {
                registration_plate: 'DET-FLEET-101',
            },
            transportData: {
                origin: 'Plant Gate 2',
                destination: 'Warehouse Hub',
                distance: 12,
                mode: 'CAR',
                ownership: 'COMPANY', // Company owned fleet vehicle!
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.ghgActivity?.scope, 'SCOPE_1');
        assert.strictEqual(result.ghgActivity?.category, 'DIRECT_MOBILE_COMBUSTION');
    });
    it('Delayed/Failed Calculation Invariant: operational transaction stays 100% valid when GHG calculation is delayed', async () => {
        db.setTenantContext(tenantId);
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'VISITOR',
            transactionData: {
                person_id: '00000000-0000-0000-0000-000000000701',
                host_user_id: '00000000-0000-0000-0000-000000000601',
            },
            transportData: {
                origin: 'Origin Point',
                destination: 'Destination Point',
                distance: 25,
            },
            options: {
                simulateDelay: true, // Async queue delay simulated!
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.calculationStatus, 'PENDING');
        assert.strictEqual(result.calculationResult, undefined);
        // Verify operational transaction is persisted and valid in the database
        const savedTx = db.findById('visitor_transactions', result.sourceTransactionId, tenantId);
        assert.ok(savedTx, 'Visitor operational transaction MUST exist and remain completely valid');
        assert.strictEqual(savedTx.reference_number.startsWith('VIS-2026-'), true);
        const savedTrn = db.findById('transport_activities', result.transportActivity.id, tenantId);
        assert.ok(savedTrn, 'Transport activity MUST exist');
        const savedGHG = db.findById('ghg_activities', result.ghgActivity.id, tenantId);
        assert.ok(savedGHG, 'GHG Activity MUST exist with PENDING status');
        assert.strictEqual(savedGHG.calculation_status, 'PENDING');
    });
    it('Delayed/Failed Calculation Invariant: operational transaction stays 100% valid when GHG calculation fails', async () => {
        db.setTenantContext(tenantId);
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'VISITOR',
            transactionData: {
                person_id: '00000000-0000-0000-0000-000000000701',
                host_user_id: '00000000-0000-0000-0000-000000000601',
            },
            transportData: {
                origin: 'Origin Point',
                destination: 'Destination Point',
                distance: 25,
            },
            options: {
                simulateFailure: true, // Async calculation engine failure simulated!
            },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.calculationStatus, 'FAILED');
        assert.ok(result.calculationError);
        // Verify operational transaction is STILL persisted and valid
        const savedTx = db.findById('visitor_transactions', result.sourceTransactionId, tenantId);
        assert.ok(savedTx, 'Visitor operational transaction MUST exist despite calculation failure');
        const savedGHG = db.findById('ghg_activities', result.ghgActivity.id, tenantId);
        assert.ok(savedGHG);
        assert.strictEqual(savedGHG.calculation_status, 'FAILED');
    });
    it('resolves provenance via traceFromGHGCalculation directly', async () => {
        db.setTenantContext(tenantId);
        const result = await pipeline.execute({
            tenantId,
            siteId: siteDetroit,
            sourceDomain: 'VISITOR',
            transactionData: {
                person_id: '00000000-0000-0000-0000-000000000701',
                host_user_id: '00000000-0000-0000-0000-000000000601',
            },
            transportData: {
                origin: 'Downtown Detroit',
                destination: 'Detroit Assembly Complex',
                distance: 15,
            },
        });
        assert.ok(result.calculationResult);
        const chain = engine.traceFromGHGCalculation(result.calculationResult.id, tenantId);
        assert.strictEqual(chain.ghgActivity.id, result.ghgActivity.id);
        assert.strictEqual(chain.sourceDomain, 'VISITOR');
        assert.strictEqual(chain.sourceTransactionId, result.sourceTransactionId);
    });
});
