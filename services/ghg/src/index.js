import { randomUUID, createHash } from 'node:crypto';
import { ESGActivityRecordSchema, GHGCalculationResultSchema, EmissionFactorSchema, ScopeMappingRuleSchema, } from '@vms/validation';
// ============================================================================
// 1. CONFIGURABLE ORGANIZATIONAL SCOPE / CATEGORY MAPPING REGISTRY
// ============================================================================
export class OrganizationalScopeRegistry {
    rules = [];
    constructor() {
        this.seedDefaultRules();
    }
    seedDefaultRules() {
        const defaultRules = [
            // VISITOR: Scope 3 Cat 7 (Employee and Visitor Commuting)
            {
                ruleId: 'SCOPE-RULE-VISITOR-DEFAULT',
                sourceDomain: 'VISITOR',
                scope: 'SCOPE_3',
                category: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
                subcategory: 'VISITOR_TRANSIT',
                methodology: 'GHG_PROTOCOL_CORPORATE_STANDARD',
                priority: 10,
                isActive: true,
            },
            // CUSTOMER: Scope 3 Cat 6 (Business Travel / Commercial Visits)
            {
                ruleId: 'SCOPE-RULE-CUSTOMER-DEFAULT',
                sourceDomain: 'CUSTOMER',
                scope: 'SCOPE_3',
                category: 'CAT_6_BUSINESS_TRAVEL',
                subcategory: 'CUSTOMER_DELEGATION_TRAVEL',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
                priority: 10,
                isActive: true,
            },
            // CONTRACTOR: Scope 3 Cat 7 (Contingent Workforce Commuting)
            {
                ruleId: 'SCOPE-RULE-CONTRACTOR-DEFAULT',
                sourceDomain: 'CONTRACTOR',
                scope: 'SCOPE_3',
                category: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
                subcategory: 'CONTRACTOR_SHIFT_COMMUTE',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
                priority: 10,
                isActive: true,
            },
            // SERVICE: Scope 3 Cat 1 (Purchased Goods and Services / OEM Maintenance)
            {
                ruleId: 'SCOPE-RULE-SERVICE-DEFAULT',
                sourceDomain: 'SERVICE',
                scope: 'SCOPE_3',
                category: 'CAT_1_PURCHASED_SERVICES',
                subcategory: 'OEM_TECHNICIAN_LOGISTICS',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
                priority: 10,
                isActive: true,
            },
            // MATERIAL INBOUND: Scope 3 Cat 4 (Upstream Transportation & Distribution)
            {
                ruleId: 'SCOPE-RULE-MAT-INBOUND-DEFAULT',
                sourceDomain: 'MATERIAL',
                tripDirection: 'INBOUND',
                scope: 'SCOPE_3',
                category: 'CAT_4_UPSTREAM_TRANSPORTATION',
                subcategory: 'SUPPLY_CHAIN_INBOUND_FREIGHT',
                methodology: 'GLEC_FRAMEWORK_V3',
                priority: 20,
                isActive: true,
            },
            // MATERIAL OUTBOUND: Scope 3 Cat 9 (Downstream Transportation & Distribution)
            {
                ruleId: 'SCOPE-RULE-MAT-OUTBOUND-DEFAULT',
                sourceDomain: 'MATERIAL',
                tripDirection: 'OUTBOUND',
                scope: 'SCOPE_3',
                category: 'CAT_9_DOWNSTREAM_TRANSPORTATION',
                subcategory: 'PRODUCT_DISPATCH_FREIGHT',
                methodology: 'GLEC_FRAMEWORK_V3',
                priority: 20,
                isActive: true,
            },
            // VEHICLE COMPANY FLEET: Scope 1 (Direct Mobile Combustion)
            {
                ruleId: 'SCOPE-RULE-VEH-COMPANY-DEFAULT',
                sourceDomain: 'VEHICLE',
                ownership: 'COMPANY',
                scope: 'SCOPE_1',
                category: 'DIRECT_MOBILE_COMBUSTION',
                subcategory: 'INTERNAL_COMPANY_FLEET',
                methodology: 'GHG_PROTOCOL_DIRECT_EMISSIONS',
                priority: 20,
                isActive: true,
            },
            // VEHICLE THIRD PARTY / TRANSPORTER: Scope 3 Cat 4 (Upstream Transport)
            {
                ruleId: 'SCOPE-RULE-VEH-THIRD-PARTY-DEFAULT',
                sourceDomain: 'VEHICLE',
                scope: 'SCOPE_3',
                category: 'CAT_4_UPSTREAM_TRANSPORTATION',
                subcategory: 'THIRD_PARTY_LOGISTICS_VEHICLE',
                methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
                priority: 10,
                isActive: true,
            },
        ];
        for (const rule of defaultRules) {
            this.registerRule(rule);
        }
    }
    registerRule(rule) {
        const validated = ScopeMappingRuleSchema.parse(rule);
        // Remove if exists with same ID
        this.rules = this.rules.filter((r) => r.ruleId !== validated.ruleId);
        this.rules.push(validated);
        // Sort by priority descending (higher number = higher priority)
        this.rules.sort((a, b) => b.priority - a.priority);
    }
    resolveScopeMapping(tenantId, sourceDomain, transport, activityType) {
        const activeRules = this.rules.filter((r) => r.isActive);
        // 1. Try tenant-specific rule first
        if (tenantId) {
            const tenantMatch = activeRules.find((r) => {
                if (r.tenantId !== tenantId)
                    return false;
                if (r.sourceDomain !== sourceDomain)
                    return false;
                if (r.ownership && r.ownership !== transport.ownership)
                    return false;
                if (r.tripDirection && r.tripDirection !== transport.tripDirection)
                    return false;
                if (r.activityType && r.activityType !== activityType)
                    return false;
                return true;
            });
            if (tenantMatch) {
                return {
                    scope: tenantMatch.scope,
                    category: tenantMatch.category,
                    subcategory: tenantMatch.subcategory,
                    methodology: tenantMatch.methodology,
                };
            }
        }
        // 2. Global baseline rules
        const globalMatch = activeRules.find((r) => {
            if (r.tenantId !== undefined)
                return false; // Skip tenant overrides
            if (r.sourceDomain !== sourceDomain)
                return false;
            if (r.ownership && r.ownership !== transport.ownership)
                return false;
            if (r.tripDirection && r.tripDirection !== transport.tripDirection)
                return false;
            if (r.activityType && r.activityType !== activityType)
                return false;
            return true;
        });
        if (globalMatch) {
            return {
                scope: globalMatch.scope,
                category: globalMatch.category,
                subcategory: globalMatch.subcategory,
                methodology: globalMatch.methodology,
            };
        }
        // Fallback baseline
        return {
            scope: 'SCOPE_3',
            category: 'OTHER_INDIRECT_EMISSIONS',
            subcategory: 'GENERAL_ACTIVITY',
            methodology: 'GHG_PROTOCOL_CORPORATE_STANDARD',
        };
    }
}
// ============================================================================
// 2. IMMUTABLE EMISSION FACTOR REGISTRY
// ============================================================================
export class EmissionFactorRegistry {
    factors = new Map();
    constructor() {
        this.seedDefaultFactors();
    }
    seedDefaultFactors() {
        const defaultFactors = [
            // UK DEFRA 2025 Road Transport (Superseded)
            {
                factorId: 'EF-DEFRA-ROAD-PETROL-CAR-2025',
                factorCode: 'ROAD-PETROL-CAR',
                version: '2025.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.1652, // kgCO2e per km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2025,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2025-01-01T00:00:00Z',
                validTo: '2025-12-31T23:59:59Z',
                gasScope: 'CO2e',
                status: 'SUPERSEDED',
            },
            // UK DEFRA 2026 Road Transport Petrol Car (Active)
            {
                factorId: 'EF-DEFRA-ROAD-PETROL-CAR-2026',
                factorCode: 'ROAD-PETROL-CAR',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.1708, // kgCO2e per km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Road Transport Diesel Car 2026
            {
                factorId: 'EF-DEFRA-ROAD-DIESEL-CAR-2026',
                factorCode: 'ROAD-DIESEL-CAR',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.1712, // kgCO2e per km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Diesel Heavy Duty Truck 2026
            {
                factorId: 'EF-DEFRA-ROAD-DIESEL-HDV-2026',
                factorCode: 'ROAD-DIESEL-HEAVY-TRUCK',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.8924, // kgCO2e per km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Electric Vehicle Grid Factor (India CEA 2026)
            {
                factorId: 'EF-CEA-ELECTRIC-CAR-2026',
                factorCode: 'ROAD-ELECTRIC-CAR',
                version: '2026.1',
                source: 'CEA INDIA GRID',
                factorValue: 0.0521, // kgCO2e per km
                unit: 'kgCO2e/km',
                geography: 'IN',
                reportingYear: 2026,
                methodology: 'CEA_CO2_BASELINE',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Two-Wheeler / Motorcycle 2026
            {
                factorId: 'EF-DEFRA-ROAD-TWO-WHEELER-2026',
                factorCode: 'ROAD-TWO-WHEELER',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.0815, // kgCO2e per km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Commuter Bus 2026
            {
                factorId: 'EF-DEFRA-COMMUTER-BUS-2026',
                factorCode: 'ROAD-COMMUTER-BUS',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.0965, // kgCO2e per passenger-km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Rail Commuter Train 2026
            {
                factorId: 'EF-DEFRA-RAIL-TRAIN-2026',
                factorCode: 'RAIL-COMMUTER-TRAIN',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.0354, // kgCO2e per passenger-km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Domestic / Short-Haul Air Travel 2026
            {
                factorId: 'EF-DEFRA-AIR-FLIGHT-2026',
                factorCode: 'AIR-SHORT-HAUL',
                version: '2026.1',
                source: 'UK DEFRA / BEIS',
                factorValue: 0.2458, // kgCO2e per passenger-km
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
            // Zero-Emission Active Transport (Walking / Bicycle)
            {
                factorId: 'EF-ACTIVE-WALKING-2026',
                factorCode: 'ACTIVE-WALKING-ZERO-EMISSION',
                version: '2026.1',
                source: 'IPCC ACTIVE MOBILITY',
                factorValue: 0.0000, // 0 emissions
                unit: 'kgCO2e/km',
                geography: 'GLOBAL',
                reportingYear: 2026,
                methodology: 'GHG_PROTOCOL',
                validFrom: '2026-01-01T00:00:00Z',
                validTo: null,
                gasScope: 'CO2e',
                status: 'ACTIVE',
            },
        ];
        for (const factor of defaultFactors) {
            this.registerFactor(factor);
        }
    }
    registerFactor(factor) {
        const validated = EmissionFactorSchema.parse(factor);
        const key = `${validated.factorCode}:${validated.geography}`;
        const list = this.factors.get(key) || [];
        // Ensure version uniqueness
        const exists = list.some((f) => f.version === validated.version);
        if (exists) {
            throw new Error(`Emission factor version ${validated.version} already exists for code ${validated.factorCode}. Historical factors cannot be overwritten.`);
        }
        list.push(validated);
        this.factors.set(key, list);
    }
    /**
     * Finds the active emission factor valid on the specific transaction timestamp.
     * Reproduces historical calculations accurately!
     */
    resolveFactor(factorCode, geography, asOfDate = new Date(), specificVersion) {
        const list = this.factors.get(`${factorCode}:${geography}`) ||
            this.factors.get(`${factorCode}:GLOBAL`) || [];
        if (list.length === 0) {
            throw new Error(`No emission factor registered for code ${factorCode} in ${geography}.`);
        }
        if (specificVersion) {
            const match = list.find((f) => f.version === specificVersion);
            if (!match) {
                throw new Error(`Emission factor ${factorCode} version ${specificVersion} not found.`);
            }
            return match;
        }
        const isoDate = asOfDate.toISOString();
        const active = list.find((f) => {
            const isAfterStart = f.validFrom <= isoDate;
            const isBeforeEnd = !f.validTo || f.validTo >= isoDate;
            return isAfterStart && isBeforeEnd;
        });
        if (!active) {
            // Fallback to latest registered active version
            return list[list.length - 1];
        }
        return active;
    }
}
// ============================================================================
// 3. CORE GHG CALCULATION ENGINE
// ============================================================================
export class GHGCalculationEngine {
    factorRegistry;
    scopeRegistry;
    constructor(factorRegistry, scopeRegistry) {
        this.factorRegistry = factorRegistry || new EmissionFactorRegistry();
        this.scopeRegistry = scopeRegistry || new OrganizationalScopeRegistry();
    }
    getFactorRegistry() {
        return this.factorRegistry;
    }
    getScopeRegistry() {
        return this.scopeRegistry;
    }
    /**
     * Delegates to the Configurable Organizational Scope Registry.
     * Never hardcodes mapping in UI or engine core!
     */
    resolveScopeMapping(sourceDomain, transport, activityType) {
        return this.scopeRegistry.resolveScopeMapping(transport.tenantId, sourceDomain, transport, activityType);
    }
    /**
     * Maps transport dimensional vectors to standard emission factor codes.
     */
    resolveFactorCode(transport) {
        // 1. Active mobility (zero emissions)
        if (transport.mode === 'WALKING') {
            return 'ACTIVE-WALKING-ZERO-EMISSION';
        }
        // 2. Two-wheelers
        if (transport.mode === 'TWO_WHEELER' || transport.vehicleClass === 'TWO_WHEELER') {
            return 'ROAD-TWO-WHEELER';
        }
        // 3. Rail
        if (transport.mode === 'TRAIN') {
            return 'RAIL-COMMUTER-TRAIN';
        }
        // 4. Air travel
        if (transport.mode === 'FLIGHT') {
            return 'AIR-SHORT-HAUL';
        }
        // 5. Electric drive
        if (transport.fuelType === 'ELECTRIC') {
            return 'ROAD-ELECTRIC-CAR';
        }
        // 6. Bus
        if (transport.mode === 'BUS' ||
            transport.vehicleClass === 'MINI_BUS' ||
            transport.vehicleClass === 'COACH_BUS') {
            return 'ROAD-COMMUTER-BUS';
        }
        // 7. Heavy duty commercial freight / logistics trucks
        if (transport.vehicleClass === 'HEAVY_DUTY_TRUCK' ||
            transport.vehicleClass === 'TRAILER' ||
            transport.vehicleClass === 'CONTAINER_CARRIER' ||
            transport.vehicleClass === 'MEDIUM_DUTY_TRUCK') {
            return 'ROAD-DIESEL-HEAVY-TRUCK';
        }
        // 8. Diesel passenger vehicles
        if (transport.fuelType === 'DIESEL') {
            return 'ROAD-DIESEL-CAR';
        }
        // 9. Standard petrol passenger cars & vans
        return 'ROAD-PETROL-CAR';
    }
    /**
     * Generates a source-linked ESG activity record from operational transport.
     * Retains complete source provenance and resolves proper activity units.
     */
    captureActivityFromTransport(siteId, transport) {
        let activityType = 'COMMUTER_TRAVEL';
        let activityUnit = 'KM';
        let activityQuantity = transport.distanceKm;
        if (transport.sourceDomain === 'MATERIAL') {
            activityType = transport.tripDirection === 'OUTBOUND'
                ? 'DOWNSTREAM_LOGISTICS'
                : 'UPSTREAM_LOGISTICS';
            // If freight carries weighed payload, capture as TONNE_KM
            if (transport.payloadWeightTonnes && transport.payloadWeightTonnes > 0) {
                activityUnit = 'TONNE_KM';
                activityQuantity = Number((transport.distanceKm * transport.payloadWeightTonnes).toFixed(3));
            }
            else {
                activityUnit = 'KM';
                activityQuantity = transport.distanceKm;
            }
        }
        else if (transport.sourceDomain === 'CUSTOMER') {
            activityType = 'BUSINESS_TRAVEL';
            activityUnit = 'KM';
            activityQuantity = transport.distanceKm;
        }
        else if (transport.sourceDomain === 'VEHICLE' && transport.fuelConsumedLitres) {
            activityType = 'FLEET_FUEL';
            activityUnit = 'LITRES';
            activityQuantity = transport.fuelConsumedLitres;
        }
        const record = {
            esgActivityId: randomUUID(),
            tenantId: transport.tenantId,
            siteId,
            sourceDomain: transport.sourceDomain,
            sourceTransactionId: transport.sourceTransactionId,
            transportId: transport.transportId,
            activityType,
            activityQuantity,
            activityUnit,
            dataProvenance: transport.distanceProvenance,
            createdAt: new Date(),
        };
        return ESGActivityRecordSchema.parse(record);
    }
    /**
     * Executes mathematically sound GHG emission calculation with versioned factor binding.
     * Evaluates occupancy distribution only for passenger mobility (not freight/fuel!).
     * Generates RFC 8785 canonical JSON cryptographic hash for auditability.
     */
    calculateEmissions(activity, transport, options) {
        const factorCode = this.resolveFactorCode(transport);
        const geography = options?.geography || 'GLOBAL';
        const factor = this.factorRegistry.resolveFactor(factorCode, geography, options?.asOfDate || activity.createdAt, options?.specificVersion);
        const mapping = this.resolveScopeMapping(activity.sourceDomain, transport, activity.activityType);
        // Occupancy distribution applies strictly to passenger travel sharing passenger-km.
        // Freight cargo (MATERIAL domain, heavy trucks) and fleet fuel combustion are NEVER divided by cab occupancy!
        const isPassengerTransport = activity.sourceDomain !== 'MATERIAL' &&
            activity.activityType !== 'FLEET_FUEL' &&
            !['HEAVY_DUTY_TRUCK', 'TRAILER', 'CONTAINER_CARRIER', 'MEDIUM_DUTY_TRUCK'].includes(transport.vehicleClass);
        const effectiveQuantity = isPassengerTransport
            ? activity.activityQuantity / Math.max(1, transport.occupancy)
            : activity.activityQuantity;
        const emissionsKgCO2e = Number((effectiveQuantity * factor.factorValue).toFixed(4));
        // Canonical JSON representation (RFC 8785) for deterministic, tamper-proof SHA-256 audit hash
        const canonicalPayload = JSON.stringify({
            activityQuantity: effectiveQuantity,
            calculatedAt: activity.createdAt.toISOString(),
            emissionsKgCO2e,
            esgActivityId: activity.esgActivityId,
            factorId: factor.factorId,
            factorValueUsed: factor.factorValue,
            factorVersion: factor.version,
            ghgCategory: mapping.category,
            ghgScope: mapping.scope,
            methodology: mapping.methodology,
            subcategory: mapping.subcategory,
            tenantId: activity.tenantId,
        });
        const calculationHash = createHash('sha256').update(canonicalPayload).digest('hex').substring(0, 32);
        const result = {
            calculationId: randomUUID(),
            tenantId: activity.tenantId,
            esgActivityId: activity.esgActivityId,
            factorId: factor.factorId,
            factorVersion: factor.version,
            ghgScope: mapping.scope,
            ghgCategory: mapping.category,
            subcategory: mapping.subcategory,
            methodology: mapping.methodology,
            factorValueUsed: factor.factorValue,
            activityQuantity: effectiveQuantity,
            emissionsKgCO2e,
            calculationHash,
            calculatedAt: new Date(),
            status: 'FINAL',
        };
        return GHGCalculationResultSchema.parse(result);
    }
}
