import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { VisitorTransactionSchema, MaterialTransactionSchema, ContractorTransactionSchema, CommonTransactionEnvelopeSchema, NormalizedTransportActivitySchema, ScopeMappingRuleSchema, EmissionFactorSchema, } from '../packages/validation/src/index.js';
describe('Zod Validation & Common Transaction Envelope', () => {
    const tenantId = randomUUID();
    const organizationId = randomUUID();
    const siteId = randomUUID();
    it('validates clear distinction between Stage and Status', () => {
        // Valid combination: Stage = APPROVAL, Status = PENDING
        const validEnvelope = CommonTransactionEnvelopeSchema.parse({
            transactionId: 'VIS-2026-0001',
            tenantId,
            organizationId,
            siteId,
            sourceDomain: 'VISITOR',
            stage: 'APPROVAL',
            status: 'PENDING',
            createdAt: new Date(),
            createdBy: 'user-1',
            updatedAt: new Date(),
            updatedBy: 'user-1',
            version: 1,
        });
        assert.equal(validEnvelope.stage, 'APPROVAL');
        assert.equal(validEnvelope.status, 'PENDING');
    });
    it('validates a complete Visitor transaction', () => {
        const now = new Date();
        const end = new Date(now.getTime() + 3600000);
        const visitor = VisitorTransactionSchema.parse({
            transactionId: 'VIS-2026-0001',
            tenantId,
            organizationId,
            siteId,
            sourceDomain: 'VISITOR',
            stage: 'SCHEDULED',
            status: 'CONFIRMED',
            visitorCategory: 'AUDITOR',
            purpose: 'AUDIT',
            bookingMode: 'RESERVED',
            visitorName: 'Dr. Jane Goodall',
            visitorEmail: 'jane@audit.org',
            hostUserId: 'host-101',
            scheduledStart: now,
            scheduledEnd: end,
            createdBy: 'host-101',
            updatedBy: 'host-101',
            version: 1,
        });
        assert.equal(visitor.visitorName, 'Dr. Jane Goodall');
        assert.equal(visitor.visitorCategory, 'AUDITOR');
        assert.equal(visitor.sourceDomain, 'VISITOR');
    });
    it('rejects invalid Visitor transaction missing mandatory name', () => {
        const now = new Date();
        assert.throws(() => {
            VisitorTransactionSchema.parse({
                transactionId: 'VIS-INVALID',
                tenantId,
                organizationId,
                siteId,
                sourceDomain: 'VISITOR',
                stage: 'DRAFT',
                status: 'PENDING',
                visitorCategory: 'NEW_VISITOR',
                purpose: 'MEETING',
                visitorName: '', // Invalid empty name
                hostUserId: 'host-101',
                scheduledStart: now,
                scheduledEnd: now,
                createdBy: 'user-1',
                updatedBy: 'user-1',
            });
        });
    });
    it('validates Material transaction with inward challan and weights', () => {
        const material = MaterialTransactionSchema.parse({
            transactionId: 'MAT-2026-0192',
            tenantId,
            organizationId,
            siteId,
            sourceDomain: 'MATERIAL',
            stage: 'CHECK_IN',
            status: 'IN_PROGRESS',
            movementType: 'INWARD',
            classification: 'RETURNABLE',
            deliveryChallanNumber: 'DC-88912-A',
            transporterCompany: 'Apex Freight Ltd',
            vehicleRegistration: 'MH-12-AB-1234',
            grossWeightKg: 28500,
            tareWeightKg: 12100,
            netWeightKg: 16400,
            createdBy: 'gate-guard-1',
            updatedBy: 'gate-guard-1',
            version: 1,
        });
        assert.equal(material.classification, 'RETURNABLE');
        assert.equal(material.netWeightKg, 16400);
    });
    it('validates Contractor transaction with authorized worker count', () => {
        const contractor = ContractorTransactionSchema.parse({
            transactionId: 'CONT-2026-0004',
            tenantId,
            organizationId,
            siteId,
            sourceDomain: 'CONTRACTOR',
            stage: 'ACTIVE',
            status: 'ON_PREMISES',
            contractorCompanyName: 'Industrial Solutions Corp',
            workOrderNumber: 'WO-2026-9901',
            authorizedWorkerCount: 15,
            safetyPermitRequired: true,
            contractStartDate: new Date('2026-01-01'),
            contractEndDate: new Date('2026-12-31'),
            createdBy: 'ehs-lead',
            updatedBy: 'ehs-lead',
            version: 1,
        });
        assert.equal(contractor.authorizedWorkerCount, 15);
        assert.equal(contractor.safetyPermitRequired, true);
    });
    it('validates NormalizedTransportActivity with measurementMethod and ScopeMappingRule', () => {
        const transport = NormalizedTransportActivitySchema.parse({
            transportId: randomUUID(),
            tenantId,
            sourceDomain: 'MATERIAL',
            sourceTransactionId: 'MAT-9988',
            mode: 'TRUCK',
            ownership: 'TRANSPORTER',
            vehicleClass: 'HEAVY_DUTY_TRUCK',
            fuelType: 'DIESEL',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            originLocation: 'Quarry Hub',
            destinationLocation: 'Batching Plant',
            distanceKm: 85,
            measurementMethod: 'WEIGHBRIDGE_SCALE',
            distanceProvenance: 'MEASURED',
        });
        assert.equal(transport.measurementMethod, 'WEIGHBRIDGE_SCALE');
        assert.equal(transport.distanceProvenance, 'MEASURED');
        const rule = ScopeMappingRuleSchema.parse({
            ruleId: 'RULE-VAL-01',
            tenantId,
            sourceDomain: 'SERVICE',
            scope: 'SCOPE_3',
            category: 'CAT_1_PURCHASED_SERVICES',
            subcategory: 'MAINTENANCE_LOGISTICS',
            methodology: 'GHG_PROTOCOL_SCOPE_3_STANDARD',
            priority: 25,
            isActive: true,
        });
        assert.equal(rule.category, 'CAT_1_PURCHASED_SERVICES');
        assert.equal(rule.priority, 25);
        // Validate zero-emission factor (walking/biking)
        const zeroFactor = EmissionFactorSchema.parse({
            factorId: 'EF-ZERO-01',
            factorCode: 'ACTIVE-WALKING-ZERO-EMISSION',
            version: '2026.1',
            source: 'IPCC',
            factorValue: 0.0, // Zero emissions allowed!
            unit: 'kgCO2e/km',
            geography: 'GLOBAL',
            reportingYear: 2026,
            validFrom: '2026-01-01T00:00:00Z',
        });
        assert.equal(zeroFactor.factorValue, 0.0);
    });
});
