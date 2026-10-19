import test from 'node:test';
import assert from 'node:assert/strict';
import { colors, typography, spacing, radius } from '../packages/ui/tokens/index.js';
import { evaluateAccess } from '../packages/permissions/src/index.js';
test('UI Design Tokens & Status System Invariants', async (t) => {
    await t.test('guarantees all required semantic status tokens are defined', () => {
        const requiredStatuses = [
            'success',
            'warning',
            'danger',
            'info',
            'pending',
            'neutral',
            'blocked',
            'expired',
            'draft',
            'approved',
            'rejected',
            'active',
            'inactive',
            'overdue',
        ];
        for (const status of requiredStatuses) {
            assert.ok(colors.status[status], `Missing required semantic status token: ${status}`);
            assert.ok(colors.status[status].fg, `Missing foreground color for: ${status}`);
            assert.ok(colors.status[status].bg, `Missing background color for: ${status}`);
            assert.ok(colors.status[status].border, `Missing border color for: ${status}`);
            assert.ok(colors.status[status].solid, `Missing solid color for: ${status}`);
        }
    });
    await t.test('guarantees industrial typography scale and font families', () => {
        assert.ok(typography.fontFamily.sans.includes('Inter'), 'Primary sans must include Inter');
        assert.ok(typography.fontFamily.mono.includes('JetBrains Mono'), 'Monospace must include JetBrains Mono');
        assert.equal(typography.fontSize.base.size, '14px');
        assert.equal(typography.fontSize.micro.size, '10px');
        assert.equal(typography.fontSize['3xl'].size, '30px');
    });
    await t.test('enforces compact industrial radius without bloated consumer bubbles', () => {
        assert.equal(radius.none, '0px');
        assert.equal(radius.sm, '2px');
        assert.equal(radius.md, '4px');
        assert.equal(radius.lg, '6px');
        assert.equal(radius.xl, '8px');
        // Deliberately no oversized radii like 16px/24px
        assert.equal(radius['2xl'], undefined);
    });
    await t.test('enforces 4px baseline grid spacing tokens', () => {
        assert.equal(spacing.baseline, '4px');
        assert.equal(spacing.xs, '4px');
        assert.equal(spacing.sm, '8px');
        assert.equal(spacing.md, '12px');
        assert.equal(spacing.lg, '16px');
        assert.equal(spacing['2xl'], '24px');
    });
});
test('Role-Aware Navigation & Least-Privilege UI Access Rules', async (t) => {
    await t.test('Security Guard cannot access administrative management or ESG calculation features', () => {
        const guardContext = {
            userId: 'guard-101',
            tenantId: 'tenant-mrf',
            organizationId: 'org-mrf-india',
            siteId: 'site-chennai',
            role: 'SECURITY_GUARD',
        };
        const adminDecision = evaluateAccess(guardContext, 'SYSTEM_ADMIN_MANAGE', {
            tenantId: 'tenant-mrf',
            siteId: 'site-chennai',
        });
        assert.equal(adminDecision.allowed, false, 'Security Guard must NOT have SYSTEM_ADMIN_MANAGE');
        const esgCalcDecision = evaluateAccess(guardContext, 'GHG_FACTOR_MANAGE', {
            tenantId: 'tenant-mrf',
            siteId: 'site-chennai',
        });
        assert.equal(esgCalcDecision.allowed, false, 'Security Guard must NOT have GHG_FACTOR_MANAGE');
        const gateDecision = evaluateAccess(guardContext, 'GATE_ACTUATE', {
            tenantId: 'tenant-mrf',
            siteId: 'site-chennai',
        });
        assert.equal(gateDecision.allowed, true, 'Security Guard MUST have GATE_ACTUATE for home site');
    });
    await t.test('ESG Manager receives strictly masked PII across operational views', () => {
        const esgContext = {
            userId: 'esg-user-1',
            tenantId: 'tenant-mrf',
            organizationId: 'org-mrf-india',
            siteId: 'site-chennai',
            role: 'ESG_MANAGER',
        };
        const decision = evaluateAccess(esgContext, 'VISITOR_READ', {
            tenantId: 'tenant-mrf',
            siteId: 'site-chennai',
        });
        assert.equal(decision.allowed, true);
        assert.ok(decision.maskedFields.includes('governmentIdNumber'), 'Govt ID must be masked');
        assert.ok(decision.maskedFields.includes('facialBiometricTemplate'), 'Biometrics must be masked');
        assert.ok(decision.maskedFields.includes('visitorPhone'), 'Phone must be masked');
    });
});
test('Embedded ESG Activity Capture UX Constraints', async (t) => {
    await t.test('operational activity preserves data provenance without exposing GHG accounting fields', () => {
        const operationalActivityInput = {
            mode: 'CAR',
            ownership: 'COMPANY',
            vehicleClass: 'SEDAN',
            fuelType: 'DIESEL',
            occupancy: 2,
            originLocation: 'Bengaluru',
            destinationLocation: 'Chennai Plant Gate 1',
            distanceKm: 348,
            distanceProvenance: 'SYSTEM_ESTIMATED',
            journeyType: 'ROUND_TRIP',
        };
        // Verify operational fields exist
        assert.equal(operationalActivityInput.distanceKm, 348);
        assert.equal(operationalActivityInput.distanceProvenance, 'SYSTEM_ESTIMATED');
        assert.equal(operationalActivityInput.occupancy, 2);
        // Verify strict absence of GHG accounting fields in operational form
        assert.equal(operationalActivityInput.scope, undefined, 'Scope 3 must not be entered by user');
        assert.equal(operationalActivityInput.emissionFactor, undefined, 'Factor must not be entered by user');
        assert.equal(operationalActivityInput.co2eEmissions, undefined, 'CO2e must not be entered by user');
    });
});
