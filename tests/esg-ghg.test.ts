import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { TransportService } from '../services/transport/src/index.js';
import {
  GHGCalculationEngine,
  EmissionFactorRegistry,
  OrganizationalScopeRegistry,
} from '../services/ghg/src/index.js';
import type { SourceDomain } from '../packages/types/src/index.js';

describe('Cross-Domain ESG Activity Capture & GHG Calculation Engine', () => {
  const transportSvc = new TransportService();
  const ghgEngine = new GHGCalculationEngine();
  const testTenantId = randomUUID();
  const testSiteId = randomUUID();

  // Test matrix across all 6 independent business pipelines
  const testPipelines: Array<{
    domain: SourceDomain;
    transactionId: string;
    mode: 'CAR' | 'TRUCK' | 'BUS';
    fuel: 'PETROL' | 'DIESEL' | 'ELECTRIC';
    vehicleClass: 'SEDAN' | 'HEAVY_DUTY_TRUCK' | 'COACH_BUS';
    ownership: 'PERSONAL' | 'COMPANY' | 'TRANSPORTER' | 'HIRED';
    distance: number;
    occupancy: number;
    expectedScope: 'SCOPE_1' | 'SCOPE_3';
    expectedCategory: string;
  }> = [
    {
      domain: 'VISITOR',
      transactionId: 'VIS-2026-000123',
      mode: 'CAR',
      fuel: 'PETROL',
      vehicleClass: 'SEDAN',
      ownership: 'PERSONAL',
      distance: 100,
      occupancy: 1,
      expectedScope: 'SCOPE_3',
      expectedCategory: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
    },
    {
      domain: 'CUSTOMER',
      transactionId: 'CUST-2026-000456',
      mode: 'CAR',
      fuel: 'PETROL',
      vehicleClass: 'SEDAN',
      ownership: 'HIRED',
      distance: 200,
      occupancy: 2,
      expectedScope: 'SCOPE_3',
      expectedCategory: 'CAT_6_BUSINESS_TRAVEL',
    },
    {
      domain: 'CONTRACTOR',
      transactionId: 'CONT-2026-000789',
      mode: 'BUS',
      fuel: 'DIESEL',
      vehicleClass: 'COACH_BUS',
      ownership: 'COMPANY',
      distance: 50,
      occupancy: 25,
      expectedScope: 'SCOPE_3',
      expectedCategory: 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING',
    },
    {
      domain: 'SERVICE',
      transactionId: 'SERV-2026-000321',
      mode: 'CAR',
      fuel: 'PETROL',
      vehicleClass: 'SEDAN',
      ownership: 'HIRED',
      distance: 80,
      occupancy: 1,
      expectedScope: 'SCOPE_3',
      expectedCategory: 'CAT_1_PURCHASED_SERVICES',
    },
    {
      domain: 'MATERIAL',
      transactionId: 'MAT-2026-018274',
      mode: 'TRUCK',
      fuel: 'DIESEL',
      vehicleClass: 'HEAVY_DUTY_TRUCK',
      ownership: 'TRANSPORTER',
      distance: 300,
      occupancy: 1,
      expectedScope: 'SCOPE_3',
      expectedCategory: 'CAT_4_UPSTREAM_TRANSPORTATION',
    },
    {
      domain: 'VEHICLE',
      transactionId: 'VEH-2026-005612',
      mode: 'CAR',
      fuel: 'PETROL',
      vehicleClass: 'SEDAN',
      ownership: 'COMPANY',
      distance: 150,
      occupancy: 1,
      expectedScope: 'SCOPE_1', // Company-owned fleet combusts fuel directly -> Scope 1
      expectedCategory: 'DIRECT_MOBILE_COMBUSTION',
    },
  ];

  for (const item of testPipelines) {
    it(`captures ESG activity and calculates emissions for pipeline: ${item.domain}`, () => {
      // 1. Operational Form generates normalized transport
      const transport = transportSvc.createNormalizedTransport({
        tenantId: testTenantId,
        sourceDomain: item.domain,
        sourceTransactionId: item.transactionId,
        mode: item.mode,
        ownership: item.ownership,
        vehicleClass: item.vehicleClass,
        fuelType: item.fuel,
        usageType: item.occupancy > 1 ? 'SHARED' : 'INDIVIDUAL',
        occupancy: item.occupancy,
        originLocation: 'Origin Station',
        destinationLocation: 'Site Facility',
        distanceKm: item.distance,
        distanceProvenance: 'USER_PROVIDED',
      });

      // 2. Cross-domain activity capture normalizes record with provenance
      const esgActivity = ghgEngine.captureActivityFromTransport(testSiteId, transport);

      // Verify zero orphan invariant: source domain & source ID are preserved!
      assert.equal(esgActivity.sourceDomain, item.domain);
      assert.equal(esgActivity.sourceTransactionId, item.transactionId);
      assert.equal(esgActivity.dataProvenance, 'USER_PROVIDED');
      assert.equal(esgActivity.activityQuantity, item.distance);

      // 3. Backend GHG Calculation Engine computes emissions with factor binding
      const calculation = ghgEngine.calculateEmissions(esgActivity, transport);

      assert.equal(calculation.ghgScope, item.expectedScope);
      assert.equal(calculation.ghgCategory, item.expectedCategory);
      assert.ok(calculation.subcategory.length > 0);
      assert.ok(calculation.methodology.length > 0);
      assert.ok(calculation.emissionsKgCO2e >= 0);
      assert.ok(calculation.calculationHash.length > 0);
      assert.ok(calculation.factorVersion.length > 0);
      assert.equal(calculation.status, 'FINAL');
    });
  }

  it('supports configurable organizational scope mapping with tenant overrides', () => {
    const scopeRegistry = new OrganizationalScopeRegistry();
    const customTenantId = randomUUID();

    // Default baseline for VISITOR is CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING
    const defaultTransport = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-TEST-DEF',
      mode: 'CAR',
      ownership: 'PERSONAL',
      vehicleClass: 'SEDAN',
      fuelType: 'PETROL',
      usageType: 'INDIVIDUAL',
      originLocation: 'City A',
      destinationLocation: 'City B',
      distanceKm: 50,
    });
    const defaultMapping = scopeRegistry.resolveScopeMapping(testTenantId, 'VISITOR', defaultTransport);
    assert.equal(defaultMapping.category, 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING');

    // Register a tenant-specific custom override: map VISITOR to Scope 3 Cat 6 for this tenant
    scopeRegistry.registerRule({
      ruleId: 'TENANT-CUSTOM-VISITOR-RULE',
      tenantId: customTenantId,
      sourceDomain: 'VISITOR',
      scope: 'SCOPE_3',
      category: 'CAT_6_BUSINESS_TRAVEL',
      subcategory: 'TENANT_SPONSORED_VISITOR_TRAVEL',
      methodology: 'CUSTOM_CORPORATE_PROTOCOL_2026',
      priority: 50, // Higher than default 10
      isActive: true,
    });

    const customTransport = transportSvc.createNormalizedTransport({
      tenantId: customTenantId,
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-CUSTOM-01',
      mode: 'CAR',
      ownership: 'PERSONAL',
      vehicleClass: 'SEDAN',
      fuelType: 'PETROL',
      usageType: 'INDIVIDUAL',
      originLocation: 'City A',
      destinationLocation: 'City B',
      distanceKm: 50,
    });

    const customMapping = scopeRegistry.resolveScopeMapping(customTenantId, 'VISITOR', customTransport);
    assert.equal(customMapping.category, 'CAT_6_BUSINESS_TRAVEL');
    assert.equal(customMapping.subcategory, 'TENANT_SPONSORED_VISITOR_TRAVEL');
    assert.equal(customMapping.methodology, 'CUSTOM_CORPORATE_PROTOCOL_2026');
  });

  it('guarantees freight cargo emissions are NOT corrupted by truck cab occupancy', () => {
    // Heavy commercial truck transporting material with 2 drivers in cab
    const freightTransport = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'MATERIAL',
      sourceTransactionId: 'MAT-FREIGHT-01',
      mode: 'TRUCK',
      ownership: 'TRANSPORTER',
      vehicleClass: 'HEAVY_DUTY_TRUCK',
      fuelType: 'DIESEL',
      usageType: 'INDIVIDUAL',
      occupancy: 2, // 2 drivers in cabin
      originLocation: 'Steel Mill',
      destinationLocation: 'Chennai Plant',
      distanceKm: 300,
    });

    const esgActivity = ghgEngine.captureActivityFromTransport(testSiteId, freightTransport);
    const calc = ghgEngine.calculateEmissions(esgActivity, freightTransport);

    // Factor for ROAD-DIESEL-HEAVY-TRUCK 2026 is 0.8924 kgCO2e/km
    // Emissions MUST be 300 * 0.8924 = 267.72 kgCO2e
    // It must NOT be divided by 2 (which would incorrectly yield 133.86 kgCO2e)!
    assert.equal(calc.emissionsKgCO2e, 267.72);
    assert.equal(calc.activityQuantity, 300);
  });

  it('calculates zero emissions for active mobility (WALKING)', () => {
    const walkingTransport = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-WALK-01',
      mode: 'WALKING',
      ownership: 'PERSONAL',
      vehicleClass: 'OTHER',
      fuelType: 'OTHER',
      usageType: 'INDIVIDUAL',
      originLocation: 'Main Gate Booth',
      destinationLocation: 'Admin Building',
      distanceKm: 2.5,
    });

    const esgActivity = ghgEngine.captureActivityFromTransport(testSiteId, walkingTransport);
    const calc = ghgEngine.calculateEmissions(esgActivity, walkingTransport);

    assert.equal(calc.factorId, 'EF-ACTIVE-WALKING-2026');
    assert.equal(calc.factorValueUsed, 0.0000);
    assert.equal(calc.emissionsKgCO2e, 0.0);
  });

  it('resolves diverse transit modes: two-wheeler, train, flight, diesel car', () => {
    // Two-wheeler (motorcycle)
    const bike = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'CONTRACTOR',
      sourceTransactionId: 'CONT-BIKE-01',
      mode: 'TWO_WHEELER',
      ownership: 'PERSONAL',
      vehicleClass: 'TWO_WHEELER',
      fuelType: 'PETROL',
      usageType: 'INDIVIDUAL',
      originLocation: 'Worker Home',
      destinationLocation: 'Factory Gate',
      distanceKm: 20,
    });
    const bikeAct = ghgEngine.captureActivityFromTransport(testSiteId, bike);
    const bikeCalc = ghgEngine.calculateEmissions(bikeAct, bike);
    assert.equal(bikeCalc.factorId, 'EF-DEFRA-ROAD-TWO-WHEELER-2026');
    assert.equal(bikeCalc.factorValueUsed, 0.0815);

    // Train
    const train = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'CUSTOMER',
      sourceTransactionId: 'CUST-TRAIN-01',
      mode: 'TRAIN',
      ownership: 'PUBLIC',
      vehicleClass: 'OTHER',
      fuelType: 'ELECTRIC',
      usageType: 'PUBLIC_COMMUTE',
      originLocation: 'Central Station',
      destinationLocation: 'Suburban Terminal',
      distanceKm: 50,
    });
    const trainAct = ghgEngine.captureActivityFromTransport(testSiteId, train);
    const trainCalc = ghgEngine.calculateEmissions(trainAct, train);
    assert.equal(trainCalc.factorId, 'EF-DEFRA-RAIL-TRAIN-2026');
    assert.equal(trainCalc.factorValueUsed, 0.0354);

    // Flight
    const flight = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'CUSTOMER',
      sourceTransactionId: 'CUST-FLIGHT-01',
      mode: 'FLIGHT',
      ownership: 'PUBLIC',
      vehicleClass: 'OTHER',
      fuelType: 'OTHER',
      usageType: 'PUBLIC_COMMUTE',
      originLocation: 'San Francisco Airport',
      destinationLocation: 'Detroit Metro Airport',
      distanceKm: 800,
    });
    const flightAct = ghgEngine.captureActivityFromTransport(testSiteId, flight);
    const flightCalc = ghgEngine.calculateEmissions(flightAct, flight);
    assert.equal(flightCalc.factorId, 'EF-DEFRA-AIR-FLIGHT-2026');
    assert.equal(flightCalc.factorValueUsed, 0.2458);
  });

  it('guarantees emission factor versioning and historical calculation reproducibility', () => {
    const transport = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-HISTORICAL-01',
      mode: 'CAR',
      ownership: 'PERSONAL',
      vehicleClass: 'SEDAN',
      fuelType: 'PETROL',
      usageType: 'INDIVIDUAL',
      occupancy: 1,
      originLocation: 'City A',
      destinationLocation: 'City B',
      distanceKm: 100,
    });

    const esgActivity = ghgEngine.captureActivityFromTransport(testSiteId, transport);

    // Calculate with historical 2025 factor (0.1652 kgCO2e/km)
    const calc2025 = ghgEngine.calculateEmissions(esgActivity, transport, {
      specificVersion: '2025.1',
    });
    assert.equal(calc2025.factorVersion, '2025.1');
    assert.equal(calc2025.factorValueUsed, 0.1652);
    assert.equal(calc2025.emissionsKgCO2e, 16.52);

    // Calculate with active 2026 factor (0.1708 kgCO2e/km)
    const calc2026 = ghgEngine.calculateEmissions(esgActivity, transport, {
      specificVersion: '2026.1',
    });
    assert.equal(calc2026.factorVersion, '2026.1');
    assert.equal(calc2026.factorValueUsed, 0.1708);
    assert.equal(calc2026.emissionsKgCO2e, 17.08);

    // Both results remain distinct and reproducible; 2025 was NOT overwritten!
    assert.notEqual(calc2025.emissionsKgCO2e, calc2026.emissionsKgCO2e);
  });

  it('prevents overwriting existing factor versions (immutability)', () => {
    const registry = new EmissionFactorRegistry();
    assert.throws(() => {
      registry.registerFactor({
        factorId: 'EF-TEST-DUP',
        factorCode: 'ROAD-PETROL-CAR',
        version: '2026.1', // Already registered!
        source: 'TEST',
        factorValue: 0.999,
        unit: 'kgCO2e/km',
        geography: 'GLOBAL',
        reportingYear: 2026,
        methodology: 'GHG_PROTOCOL',
        validFrom: '2026-01-01T00:00:00Z',
        validTo: null,
        gasScope: 'CO2e',
        status: 'ACTIVE',
      });
    }, /already exists/);
  });

  it('accurately divides passenger emissions by occupancy count in carpools', () => {
    const soloTransport = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-SOLO',
      mode: 'CAR',
      ownership: 'PERSONAL',
      vehicleClass: 'SEDAN',
      fuelType: 'PETROL',
      usageType: 'INDIVIDUAL',
      occupancy: 1,
      originLocation: 'City A',
      destinationLocation: 'City B',
      distanceKm: 100,
    });
    const soloActivity = ghgEngine.captureActivityFromTransport(testSiteId, soloTransport);
    const soloCalc = ghgEngine.calculateEmissions(soloActivity, soloTransport);

    const carpoolTransport = transportSvc.createNormalizedTransport({
      tenantId: testTenantId,
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-CARPOOL',
      mode: 'CAR',
      ownership: 'PERSONAL',
      vehicleClass: 'SEDAN',
      fuelType: 'PETROL',
      usageType: 'CARPOOL',
      occupancy: 4, // 4 passengers sharing footprint
      originLocation: 'City A',
      destinationLocation: 'City B',
      distanceKm: 100,
    });
    const carpoolActivity = ghgEngine.captureActivityFromTransport(testSiteId, carpoolTransport);
    const carpoolCalc = ghgEngine.calculateEmissions(carpoolActivity, carpoolTransport);

    // Carpool passenger footprint must be 1/4th of solo footprint
    assert.equal(carpoolCalc.emissionsKgCO2e, Number((soloCalc.emissionsKgCO2e / 4).toFixed(4)));
  });
});
