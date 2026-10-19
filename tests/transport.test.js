import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { TransportService } from '../services/transport/src/index.js';
describe('TransportService & Normalized Transport Model', () => {
    const service = new TransportService();
    const testTenantId = randomUUID();
    it('normalizes transport with independent dimensional vectors', () => {
        const activity = service.createNormalizedTransport({
            tenantId: testTenantId,
            sourceDomain: 'VISITOR',
            sourceTransactionId: 'VIS-2026-000101',
            mode: 'CAR',
            ownership: 'PERSONAL',
            vehicleClass: 'SEDAN',
            fuelType: 'PETROL',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            originLocation: 'Bengaluru',
            destinationLocation: 'Chennai Plant',
        });
        assert.equal(activity.mode, 'CAR');
        assert.equal(activity.ownership, 'PERSONAL');
        assert.equal(activity.fuelType, 'PETROL');
        assert.equal(activity.distanceKm, 348);
        assert.equal(activity.distanceProvenance, 'SYSTEM_ESTIMATED');
        assert.equal(activity.measurementMethod, 'GIS_ROUTING');
        assert.equal(activity.sourceDomain, 'VISITOR');
        assert.equal(activity.sourceTransactionId, 'VIS-2026-000101');
    });
    it('derives symmetric bidirectional routes and doubles distance for round-trips', () => {
        // Reverse direction (Chennai Plant -> Bengaluru) must find known 348km route symmetrically
        const forwardOneWay = service.createNormalizedTransport({
            tenantId: testTenantId,
            sourceDomain: 'CUSTOMER',
            sourceTransactionId: 'CUST-FWD-01',
            mode: 'CAR',
            ownership: 'COMPANY',
            vehicleClass: 'SEDAN',
            fuelType: 'PETROL',
            usageType: 'INDIVIDUAL',
            originLocation: 'Bengaluru',
            destinationLocation: 'Chennai Plant',
            journeyType: 'ONE_WAY',
        });
        assert.equal(forwardOneWay.distanceKm, 348);
        const reverseRoundTrip = service.createNormalizedTransport({
            tenantId: testTenantId,
            sourceDomain: 'CUSTOMER',
            sourceTransactionId: 'CUST-REV-01',
            mode: 'CAR',
            ownership: 'COMPANY',
            vehicleClass: 'SEDAN',
            fuelType: 'PETROL',
            usageType: 'INDIVIDUAL',
            originLocation: 'Chennai Plant',
            destinationLocation: 'Bengaluru',
            journeyType: 'ROUND_TRIP',
        });
        // Symmetrical lookup (348km) multiplied by 2 for ROUND_TRIP = 696km
        assert.equal(reverseRoundTrip.distanceKm, 696);
        assert.equal(reverseRoundTrip.journeyType, 'ROUND_TRIP');
    });
    it('handles intra-facility campus movements with 0 km and SYSTEM_CALCULATED provenance', () => {
        const campusTrip = service.createNormalizedTransport({
            tenantId: testTenantId,
            sourceDomain: 'SERVICE',
            sourceTransactionId: 'SERV-CAMPUS-01',
            mode: 'WALKING',
            ownership: 'PERSONAL',
            vehicleClass: 'OTHER',
            fuelType: 'OTHER',
            usageType: 'INDIVIDUAL',
            originLocation: 'Chennai Plant',
            destinationLocation: 'Chennai Plant',
        });
        assert.equal(campusTrip.distanceKm, 0);
        assert.equal(campusTrip.distanceProvenance, 'SYSTEM_CALCULATED');
    });
    it('preserves user provided distance and provenance when manually edited', () => {
        const activity = service.createNormalizedTransport({
            tenantId: testTenantId,
            sourceDomain: 'CUSTOMER',
            sourceTransactionId: 'CUST-2026-00045',
            mode: 'CAR',
            ownership: 'HIRED',
            vehicleClass: 'SUV',
            fuelType: 'HYBRID_PETROL',
            usageType: 'SHARED',
            occupancy: 3,
            originLocation: 'Bengaluru',
            destinationLocation: 'Chennai Plant',
            distanceKm: 365,
            distanceProvenance: 'USER_PROVIDED',
            measurementMethod: 'ODOMETER',
        });
        assert.equal(activity.distanceKm, 365);
        assert.equal(activity.distanceProvenance, 'USER_PROVIDED');
        assert.equal(activity.measurementMethod, 'ODOMETER');
        assert.equal(activity.occupancy, 3);
    });
    it('preserves measured provenance and defaults measurement method for weighbridge', () => {
        const activity = service.createNormalizedTransport({
            tenantId: testTenantId,
            sourceDomain: 'MATERIAL',
            sourceTransactionId: 'MAT-2026-00992',
            mode: 'TRUCK',
            ownership: 'TRANSPORTER',
            vehicleClass: 'HEAVY_DUTY_TRUCK',
            fuelType: 'DIESEL',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            originLocation: 'Mumbai Logistics Hub',
            destinationLocation: 'Pune Plant',
            distanceKm: 148,
            distanceProvenance: 'MEASURED',
            payloadWeightTonnes: 24.5,
        });
        assert.equal(activity.distanceProvenance, 'MEASURED');
        assert.equal(activity.measurementMethod, 'WEIGHBRIDGE_SCALE');
        assert.equal(activity.payloadWeightTonnes, 24.5);
        assert.equal(activity.sourceDomain, 'MATERIAL');
    });
    it('rejects invalid inputs such as negative distance or invalid occupancy', () => {
        assert.throws(() => {
            service.createNormalizedTransport({
                tenantId: testTenantId,
                sourceDomain: 'VISITOR',
                sourceTransactionId: 'VIS-ERR-01',
                mode: 'CAR',
                ownership: 'PERSONAL',
                vehicleClass: 'SEDAN',
                fuelType: 'PETROL',
                usageType: 'INDIVIDUAL',
                occupancy: 0, // Invalid: must be >= 1
                originLocation: 'Site A',
                destinationLocation: 'Site B',
                distanceKm: -10, // Invalid: cannot be negative
            });
        });
    });
});
