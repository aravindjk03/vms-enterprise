/**
 * VMS Enterprise: Operational Activity Capture & GHG Calculation Pipeline
 * 5-Step Transactional Execution Engine:
 * Step 1: Source Domain Transaction Processing
 * Step 2: Reusable Transport Activity Normalization & Insertion
 * Step 3: GHG Activity Record Generation (Pending Calculation)
 * Step 4: Domain Event Emission & Outbox Logging
 * Step 5: Asynchronous Calculation Execution & Factor Version Snapshotting
 *
 * CRITICAL INVARIANT: Operational transactions remain 100% valid even if GHG calculation
 * is delayed or encounters calculation errors.
 */
import { randomUUID } from 'node:crypto';
export class OperationalCapturePipeline {
    db;
    refCounter = 1000;
    constructor(db) {
        this.db = db;
    }
    /**
     * Executes the 5-step operational activity capture pipeline with transactional guarantees
     */
    async execute(input) {
        const { tenantId, siteId, sourceDomain, transactionData, transportData, options } = input;
        const originalTenantContext = this.db.getTenantContext();
        try {
            this.db.setTenantContext(tenantId);
            this.db.beginTransaction();
            // ========================================================================
            // STEP 1: Source Domain Transaction Processing
            // ========================================================================
            const sourceTx = this.processSourceTransaction(sourceDomain, tenantId, siteId, transactionData);
            const sourceTxId = sourceTx.transaction_id || sourceTx.work_order_id || sourceTx.id;
            // ========================================================================
            // STEP 2: Normalized Transport Activity Creation
            // ========================================================================
            let transportActivity;
            if (transportData) {
                transportActivity = this.createTransportActivity(tenantId, siteId, sourceDomain, sourceTxId, transportData);
            }
            // ========================================================================
            // STEP 3: GHG Activity Record Generation (Initialized as PENDING)
            // ========================================================================
            let ghgActivity;
            if (transportActivity) {
                ghgActivity = this.createGHGActivity(tenantId, siteId, sourceDomain, sourceTxId, transportActivity);
            }
            // ========================================================================
            // STEP 4: Domain Event Emission & Outbox Logging
            // ========================================================================
            const domainEvent = this.emitDomainEvent(tenantId, sourceDomain, sourceTxId, transportActivity, ghgActivity);
            // Commit the operational steps (Steps 1-4)
            this.db.commit();
            // ========================================================================
            // STEP 5: Asynchronous Calculation Execution & Factor Version Snapshotting
            // (Operational integrity invariant: operational transaction is committed.
            // Calculation errors or delays NEVER invalidate the operational transaction.)
            // ========================================================================
            let calculationResult;
            let calculationStatus = 'SKIPPED';
            let calculationError;
            if (ghgActivity) {
                if (options?.simulateDelay) {
                    // Calculation is delayed / queued in async queue
                    calculationStatus = 'PENDING';
                }
                else if (options?.simulateFailure) {
                    // Simulated calculation failure (e.g. calculation engine timeout)
                    calculationStatus = 'FAILED';
                    calculationError = 'Simulated asynchronous calculation engine failure';
                    this.updateGHGActivityStatus(ghgActivity.id, 'FAILED', tenantId);
                }
                else {
                    try {
                        const calcOutcome = this.executeCalculation(ghgActivity, transportActivity, options?.factorVersionTag, options?.geography);
                        calculationResult = calcOutcome.calculation;
                        ghgActivity = calcOutcome.updatedActivity;
                        calculationStatus = 'CALCULATED';
                    }
                    catch (err) {
                        calculationStatus = 'FAILED';
                        calculationError = err.message || 'Unknown GHG calculation error';
                        this.updateGHGActivityStatus(ghgActivity.id, 'FAILED', tenantId);
                    }
                }
            }
            return {
                success: true,
                sourceDomain,
                sourceTransactionId: sourceTxId,
                sourceTransaction: sourceTx,
                transportActivity,
                ghgActivity,
                calculationResult,
                domainEvent,
                calculationStatus,
                calculationError,
            };
        }
        catch (err) {
            // Rollback operational transaction if Step 1-4 fails
            try {
                this.db.rollback();
            }
            catch {
                // Transaction may not be active
            }
            throw err;
        }
        finally {
            this.db.setTenantContext(originalTenantContext);
        }
    }
    // --------------------------------------------------------------------------
    // Step 1 Helper: Domain Transaction Processing
    // --------------------------------------------------------------------------
    processSourceTransaction(domain, tenantId, siteId, data) {
        const seq = ++this.refCounter;
        switch (domain) {
            case 'VISITOR': {
                const pk = data.transaction_id || randomUUID();
                const ref = data.reference_number || `VIS-2026-${String(seq).padStart(6, '0')}`;
                return this.db.insert('visitor_transactions', {
                    transaction_id: pk,
                    reference_number: ref,
                    tenant_id: tenantId,
                    site_id: siteId,
                    person_id: data.person_id,
                    visitor_type_id: data.visitor_type_id || null,
                    purpose_id: data.purpose_id || null,
                    host_user_id: data.host_user_id,
                    booking_mode: data.booking_mode || 'RESERVED',
                    scheduled_start: data.scheduled_start || new Date(),
                    scheduled_end: data.scheduled_end || new Date(Date.now() + 3600000),
                    stage: data.stage || 'SCHEDULED',
                    status: data.status || 'CONFIRMED',
                    version: 1,
                    created_by: data.created_by || 'SYSTEM',
                    updated_by: data.updated_by || 'SYSTEM',
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
            }
            case 'CUSTOMER': {
                const pk = data.transaction_id || randomUUID();
                const ref = data.reference_number || `CUST-2026-${String(seq).padStart(6, '0')}`;
                const visit = this.db.insert('customer_visit_transactions', {
                    transaction_id: pk,
                    reference_number: ref,
                    tenant_id: tenantId,
                    site_id: siteId,
                    customer_account_id: data.customer_account_id,
                    executive_host_id: data.executive_host_id || '00000000-0000-0000-0000-000000000601',
                    title: data.title || 'Executive Customer Engagement',
                    scheduled_start: data.scheduled_start || new Date(),
                    scheduled_end: data.scheduled_end || new Date(Date.now() + 7200000),
                    nda_signed: data.nda_signed ?? true,
                    stage: data.stage || 'SCHEDULED',
                    status: data.status || 'CONFIRMED',
                    version: 1,
                    created_by: data.created_by || 'SYSTEM',
                    updated_by: data.updated_by || 'SYSTEM',
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
                // Optional participants insertion
                if (Array.isArray(data.participants)) {
                    for (const p of data.participants) {
                        this.db.insert('customer_visit_participants', {
                            participant_id: p.participant_id || randomUUID(),
                            customer_visit_id: pk,
                            person_id: p.person_id,
                            is_lead: p.is_lead ?? false,
                            created_at: new Date(),
                        });
                    }
                }
                return visit;
            }
            case 'CONTRACTOR': {
                const pk = data.work_order_id || randomUUID();
                const ref = data.reference_number || `CONT-2026-${String(seq).padStart(6, '0')}`;
                return this.db.insert('contractor_work_orders', {
                    work_order_id: pk,
                    reference_number: ref,
                    tenant_id: tenantId,
                    site_id: siteId,
                    contract_id: data.contract_id,
                    company_id: data.company_id,
                    work_order_number: data.work_order_number || `WO-${seq}`,
                    scope_of_work: data.scope_of_work || 'Turnkey Electrical Maintenance',
                    authorized_worker_count: data.authorized_worker_count || 5,
                    safety_permit_required: data.safety_permit_required ?? true,
                    start_date: data.start_date || '2026-10-01',
                    end_date: data.end_date || '2026-10-31',
                    stage: data.stage || 'ACTIVE',
                    status: data.status || 'IN_PROGRESS',
                    version: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
            }
            case 'SERVICE': {
                const pk = data.work_order_id || randomUUID();
                const ref = data.reference_number || `SRV-2026-${String(seq).padStart(6, '0')}`;
                return this.db.insert('service_work_orders', {
                    work_order_id: pk,
                    reference_number: ref,
                    tenant_id: tenantId,
                    site_id: siteId,
                    service_provider_id: data.service_provider_id,
                    equipment_tag: data.equipment_tag || 'CNC-SPINDLE-04',
                    maintenance_lead_id: data.maintenance_lead_id || '00000000-0000-0000-0000-000000000601',
                    scheduled_start: data.scheduled_start || new Date(),
                    scheduled_end: data.scheduled_end || new Date(Date.now() + 14400000),
                    inward_tools_declared: data.inward_tools_declared ?? true,
                    service_completed: data.service_completed ?? false,
                    stage: data.stage || 'ACTIVE',
                    status: data.status || 'IN_PROGRESS',
                    version: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
            }
            case 'MATERIAL': {
                const pk = data.transaction_id || randomUUID();
                const ref = data.reference_number || `MAT-2026-${String(seq).padStart(6, '0')}`;
                const matTx = this.db.insert('material_transactions', {
                    transaction_id: pk,
                    reference_number: ref,
                    tenant_id: tenantId,
                    site_id: siteId,
                    movement_type: data.movement_type || 'INWARD',
                    classification: data.classification || 'RAW_MATERIAL',
                    delivery_challan_number: data.delivery_challan_number || `DC-${seq}`,
                    po_id: data.po_id || null,
                    supplier_org_id: data.supplier_org_id || null,
                    transporter_org_id: data.transporter_org_id || null,
                    vehicle_id: data.vehicle_id || null,
                    driver_person_id: data.driver_person_id || null,
                    gross_weight_kg: data.gross_weight_kg || 15000,
                    tare_weight_kg: data.tare_weight_kg || 5000,
                    net_weight_kg: data.net_weight_kg || 10000,
                    stage: data.stage || 'CHECK_IN',
                    status: data.status || 'ON_PREMISES',
                    version: 1,
                    created_by: data.created_by || 'SYSTEM',
                    updated_by: data.updated_by || 'SYSTEM',
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
                // Insert line items if provided
                if (Array.isArray(data.lines)) {
                    let lineNo = 1;
                    for (const line of data.lines) {
                        this.db.insert('material_transaction_lines', {
                            line_id: line.line_id || randomUUID(),
                            material_transaction_id: pk,
                            material_id: line.material_id,
                            line_number: lineNo++,
                            description: line.description || 'Raw Material Inward',
                            quantity: line.quantity || 100,
                            unit: line.unit || 'TONNE',
                            is_returnable: line.is_returnable ?? false,
                            returned_quantity: 0,
                            created_at: new Date(),
                        });
                    }
                }
                return matTx;
            }
            case 'VEHICLE': {
                // Vehicle domain operational transaction
                const pk = data.vehicle_id || randomUUID();
                return this.db.insert('vehicles', {
                    vehicle_id: pk,
                    tenant_id: tenantId,
                    registration_plate: data.registration_plate || `MI-${seq}-TRK`,
                    status: 'ACTIVE',
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
            }
            default:
                throw new Error(`Unsupported source domain: ${domain}`);
        }
    }
    // --------------------------------------------------------------------------
    // Step 2 Helper: Transport Activity Normalization
    // --------------------------------------------------------------------------
    createTransportActivity(tenantId, siteId, domain, sourceTxId, input) {
        const seq = ++this.refCounter;
        const ref = `TRA-2026-${String(seq).padStart(6, '0')}`;
        return this.db.insert('transport_activities', {
            id: randomUUID(),
            reference_number: ref,
            tenant_id: tenantId,
            site_id: siteId,
            source_domain: domain,
            source_transaction_id: sourceTxId,
            person_id: input.personId,
            vehicle_id: input.vehicleId,
            organization_id: input.organizationId,
            origin_location_name: input.origin,
            destination_location_name: input.destination,
            distance: input.distance,
            distance_unit: input.distanceUnit || 'km',
            journey_type: input.journeyType || 'ONE_WAY',
            direction: input.direction || 'INBOUND',
            usage_type: input.ownership || 'PERSONAL',
            occupancy: input.occupancy || 1,
            payload_weight_tonnes: input.payloadWeightTonnes,
            fuel_consumed_litres: input.fuelConsumedLitres,
            measurement_method: input.measurementMethod || 'MAP_API',
            data_source: input.dataSource || 'DISPATCH_LOG',
            estimated_flag: input.measurementMethod !== 'ODOMETER_LOG' && input.measurementMethod !== 'WEIGHBRIDGE',
            activity_date: input.activityDate || new Date().toISOString().split('T')[0],
            created_at: new Date(),
            updated_at: new Date(),
        }, tenantId);
    }
    // --------------------------------------------------------------------------
    // Step 3 Helper: GHG Activity Generation
    // --------------------------------------------------------------------------
    createGHGActivity(tenantId, siteId, domain, sourceTxId, transport) {
        const seq = ++this.refCounter;
        const ref = `GHA-2026-${String(seq).padStart(6, '0')}`;
        // Determine Scope & Category mapping based on domain
        const mapping = this.resolveScopeMapping(domain, transport.direction, transport.usage_type);
        const isFreight = (transport.payload_weight_tonnes !== undefined && transport.payload_weight_tonnes > 0);
        const activityType = isFreight ? 'FREIGHT_DISTANCE_WEIGHT' : 'PASSENGER_DISTANCE';
        const quantity = isFreight
            ? transport.distance * (transport.payload_weight_tonnes || 1)
            : transport.distance;
        const quantityUnit = isFreight ? 'tonne-km' : 'passenger-km';
        return this.db.insert('ghg_activities', {
            id: randomUUID(),
            reference_number: ref,
            tenant_id: tenantId,
            site_id: siteId,
            source_domain: domain,
            source_transaction_id: sourceTxId,
            source_activity_id: transport.id,
            activity_type: activityType,
            activity_date: transport.activity_date,
            quantity,
            quantity_unit: quantityUnit,
            distance: transport.distance,
            distance_unit: transport.distance_unit,
            occupancy: transport.occupancy,
            scope: mapping.scope,
            category: mapping.category,
            subcategory: mapping.subcategory,
            methodology_id: mapping.methodology,
            data_quality: transport.estimated_flag ? 'ESTIMATED_SECONDARY' : 'MEASURED_PRIMARY',
            calculation_status: 'PENDING',
            verification_status: 'UNVERIFIED',
            created_at: new Date(),
            updated_at: new Date(),
        }, tenantId);
    }
    // --------------------------------------------------------------------------
    // Step 4 Helper: Domain Event Emission
    // --------------------------------------------------------------------------
    emitDomainEvent(tenantId, domain, sourceTxId, transport, ghg) {
        return this.db.insert('domain_events', {
            event_id: randomUUID(),
            tenant_id: tenantId,
            event_type: `operational.${domain.toLowerCase()}.captured`,
            source_domain: domain,
            source_entity_id: sourceTxId,
            occurred_at: new Date(),
            payload: {
                sourceTransactionId: sourceTxId,
                transportActivityId: transport?.id,
                ghgActivityId: ghg?.id,
                transportReference: transport?.reference_number,
                ghgReference: ghg?.reference_number,
            },
            version: '1.0.0',
        }, tenantId);
    }
    // --------------------------------------------------------------------------
    // Step 5 Helper: GHG Calculation & Emission Factor Versioning
    // --------------------------------------------------------------------------
    executeCalculation(ghgActivity, transport, versionTag = '2026.1', geography = 'GLOBAL') {
        // 1. Resolve factor based on transport characteristics
        const factorId = this.resolveEmissionFactorId(ghgActivity.source_domain, transport);
        // 2. Query factor version from immutable ledger
        const versions = this.db.findMany('emission_factor_versions', {
            factor_id: factorId,
            version_tag: versionTag,
        });
        const factorVersion = versions.find(v => v.geography === geography) || versions[0];
        if (!factorVersion) {
            throw new Error(`Emission factor version not found for factor '${factorId}', version '${versionTag}'`);
        }
        // 3. Compute emissions
        let co2e = 0;
        if (factorId === 'EF-ACTIVE-WALKING') {
            co2e = 0;
        }
        else if (ghgActivity.activity_type === 'FREIGHT_DISTANCE_WEIGHT') {
            const payload = transport.payload_weight_tonnes || 1;
            co2e = Number((transport.distance * payload * factorVersion.factor_value).toFixed(4));
        }
        else {
            const occ = Math.max(1, transport.occupancy || 1);
            co2e = Number(((transport.distance * factorVersion.factor_value) / occ).toFixed(4));
        }
        // 4. Record calculation in immutable calculation ledger
        const calcRecord = this.db.insert('ghg_calculations', {
            id: randomUUID(),
            ghg_activity_id: ghgActivity.id,
            emission_factor_id: factorVersion.factor_id,
            emission_factor_version: factorVersion.version_tag,
            methodology_id: factorVersion.methodology,
            input_snapshot: {
                distance: transport.distance,
                occupancy: transport.occupancy,
                payloadWeightTonnes: transport.payload_weight_tonnes,
                factorValue: factorVersion.factor_value,
                factorUnit: factorVersion.unit,
                reportingYear: factorVersion.reporting_year,
            },
            calculation_timestamp: new Date(),
            co2e,
            co2: Number((co2e * 0.95).toFixed(4)),
            ch4: Number((co2e * 0.03).toFixed(4)),
            n2o: Number((co2e * 0.02).toFixed(4)),
            calculation_status: 'SUCCESS',
            calculation_version: 1,
            created_by: 'OPERATIONAL_CAPTURE_PIPELINE',
        });
        // 5. Update GHG Activity status
        const updatedActivity = this.db.update('ghg_activities', ghgActivity.id, {
            calculation_status: 'CALCULATED',
            co2e,
            co2: calcRecord.co2,
            ch4: calcRecord.ch4,
            n2o: calcRecord.n2o,
            emission_factor_id: factorVersion.factor_id,
            emission_factor_version: factorVersion.version_tag,
        });
        return { calculation: calcRecord, updatedActivity };
    }
    updateGHGActivityStatus(id, status, tenantId) {
        try {
            this.db.update('ghg_activities', id, { calculation_status: status }, tenantId);
        }
        catch {
            // Ignore update error in failure branches
        }
    }
    resolveScopeMapping(domain, direction, ownership) {
        if (domain === 'VISITOR') {
            return {
                scope: 'SCOPE_3',
                category: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
                subcategory: 'VISITOR_TRANSIT',
                methodology: 'GHG_PROTOCOL_CORPORATE_STANDARD',
            };
        }
        if (domain === 'CUSTOMER') {
            return {
                scope: 'SCOPE_3',
                category: 'CAT_6_BUSINESS_TRAVEL',
                subcategory: 'CUSTOMER_DELEGATION_TRAVEL',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
            };
        }
        if (domain === 'CONTRACTOR') {
            return {
                scope: 'SCOPE_3',
                category: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
                subcategory: 'CONTRACTOR_SHIFT_COMMUTE',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
            };
        }
        if (domain === 'SERVICE') {
            return {
                scope: 'SCOPE_3',
                category: 'CAT_1_PURCHASED_SERVICES',
                subcategory: 'OEM_TECHNICIAN_LOGISTICS',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
            };
        }
        if (domain === 'MATERIAL') {
            if (direction === 'OUTBOUND') {
                return {
                    scope: 'SCOPE_3',
                    category: 'CAT_9_DOWNSTREAM_TRANSPORTATION',
                    subcategory: 'PRODUCT_DISPATCH_FREIGHT',
                    methodology: 'GLEC_FRAMEWORK_V3',
                };
            }
            return {
                scope: 'SCOPE_3',
                category: 'CAT_4_UPSTREAM_TRANSPORTATION',
                subcategory: 'SUPPLY_CHAIN_INBOUND_FREIGHT',
                methodology: 'GLEC_FRAMEWORK_V3',
            };
        }
        if (domain === 'VEHICLE') {
            if (ownership === 'COMPANY') {
                return {
                    scope: 'SCOPE_1',
                    category: 'DIRECT_MOBILE_COMBUSTION',
                    subcategory: 'INTERNAL_COMPANY_FLEET',
                    methodology: 'GHG_PROTOCOL_DIRECT_EMISSIONS',
                };
            }
            return {
                scope: 'SCOPE_3',
                category: 'CAT_4_UPSTREAM_TRANSPORTATION',
                subcategory: 'THIRD_PARTY_LOGISTICS_VEHICLE',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
            };
        }
        return {
            scope: 'SCOPE_3',
            category: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
            subcategory: 'GENERAL_TRANSIT',
            methodology: 'GHG_PROTOCOL_CORPORATE_STANDARD',
        };
    }
    resolveEmissionFactorId(domain, transport) {
        if (domain === 'MATERIAL') {
            return 'EF-DEFRA-ROAD-DIESEL-HDV';
        }
        if (domain === 'CONTRACTOR') {
            return 'EF-DEFRA-COMMUTER-BUS';
        }
        if (transport.usage_type === 'WALKING' || transport.distance === 0) {
            return 'EF-ACTIVE-WALKING';
        }
        return 'EF-DEFRA-ROAD-PETROL-CAR';
    }
}
