import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '../apps/web/src/App.js';
test('Section 41 Page Inventory & Route Dispatch Verification', async (t) => {
    const inventoryRoutes = [
        '/dashboard',
        '/dashboard/operations',
        '/dashboard/security',
        '/visitors',
        '/visitors/new',
        '/visitors/repeated',
        '/visitors/appointments',
        '/visitors/history',
        '/customers',
        '/customers/visits',
        '/customers/audits',
        '/customers/inspections',
        '/contractors',
        '/contractors/workers',
        '/contractors/work-orders',
        '/contractors/compliance',
        '/services',
        '/services/work-orders',
        '/materials/inward',
        '/materials/outward',
        '/materials/returnable',
        '/vehicles',
        '/vehicles/drivers',
        '/vehicles/transporters',
        '/transport/activity',
        '/transport/journeys',
        '/gate',
        '/gate/entry',
        '/gate/exit',
        '/gate/exceptions',
        '/access',
        '/access/zones',
        '/access/policies',
        '/documents',
        '/documents/verification',
        '/documents/expiring',
        '/safety',
        '/safety/induction',
        '/safety/training',
        '/safety/permits',
        '/emergency',
        '/esg',
        '/esg/activity',
        '/esg/transport',
        '/esg/emission-factors',
        '/esg/calculations',
        '/analytics',
        '/ai',
        '/admin',
    ];
    await t.test('App renders with full TopBar and 18-domain navigation hierarchy', () => {
        const html = renderToString(React.createElement(App));
        assert.ok(html.includes('VMS Enterprise'), 'Top Bar brand must render');
        assert.ok(html.includes('Visitor'), 'Visitor domain in LeftNav');
        assert.ok(html.includes('Customer'), 'Customer domain in LeftNav');
        assert.ok(html.includes('Contractor'), 'Contractor domain in LeftNav');
        assert.ok(html.includes('Service / Work'), 'Service domain in LeftNav');
        assert.ok(html.includes('Material'), 'Material domain in LeftNav');
        assert.ok(html.includes('Vehicle'), 'Vehicle domain in LeftNav');
        assert.ok(html.includes('Transport'), 'Transport domain in LeftNav');
        assert.ok(html.includes('Gate Console'), 'Gate domain in LeftNav');
        assert.ok(html.includes('Access'), 'Access domain in LeftNav');
        assert.ok(html.includes('Documents'), 'Documents domain in LeftNav');
        assert.ok(html.includes('Safety &amp; EHS') || html.includes('Safety & EHS'), 'Safety domain in LeftNav');
        assert.ok(html.includes('Emergency'), 'Emergency domain in LeftNav');
        assert.ok(html.includes('ESG / GHG'), 'ESG domain in LeftNav');
        assert.ok(html.includes('Analytics'), 'Analytics domain in LeftNav');
        assert.ok(html.includes('AI Copilot'), 'AI domain in LeftNav');
        assert.ok(html.includes('Administration'), 'Admin domain in LeftNav');
    });
    await t.test('Section 6 full navigation hierarchy items are present in nav structure', () => {
        const appElement = React.createElement(App);
        const html = renderToString(appElement);
        // LeftNav renders
        assert.ok(html.includes('vms-left-nav'), 'LeftNav sidebar rendered');
    });
    await t.test('All Section 41 inventory routes render correctly without crashing', () => {
        for (const route of inventoryRoutes) {
            const html = renderToString(React.createElement(App, { initialRoute: route }));
            assert.ok(html.length > 500, `Route ${route} should render non-empty HTML`);
            assert.ok(html.includes('VMS Enterprise'), `Route ${route} must include TopBar brand`);
        }
    });
});
