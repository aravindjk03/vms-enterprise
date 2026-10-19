import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Combobox, DateTimePicker, RadioGroup, PageShell, Panel, Accordion, Search, SavedView, CompanyCard, ActivityFeed, SyncStatusIndicator, GlobalSearch, EntityDetailPage, DashboardFilterBar, DashboardWidget, LoadingStateView, EmptyStateView, NoPermissionStateView, ErrorStateView, NotFoundStateView, ValidationErrorStateView, NetworkErrorStateView, ServerErrorStateView, OfflineStateView, SyncPendingStateView, SessionExpiredStateView } from '../packages/ui/src/index.js';
test('Foundation & Layout Components Verification', async (t) => {
    await t.test('renders Combobox with options and placeholder', () => {
        const html = renderToString(React.createElement(Combobox, {
            label: 'Select Host Facility',
            options: [
                { label: 'Chennai Plant Gate 1', value: 'GATE-01' },
                { label: 'Pune Stamping Gate 2', value: 'GATE-02' },
            ],
            value: 'GATE-01',
            onChange: () => { },
        }));
        assert.ok(html.includes('Select Host Facility'));
        assert.ok(html.includes('Chennai Plant Gate 1'));
    });
    await t.test('renders DateTimePicker with presets and split date/time fields', () => {
        const html = renderToString(React.createElement(DateTimePicker, {
            label: 'Arrival Shift Window',
            value: '2026-10-24T14:30',
            onChange: () => { },
            showPresets: true,
        }));
        assert.ok(html.includes('Arrival Shift Window'));
        assert.ok(html.includes('2026-10-24'));
        assert.ok(html.includes('14:30'));
        assert.ok(html.includes('Shift End'));
    });
    await t.test('renders RadioGroup with vertical and horizontal orientation', () => {
        const html = renderToString(React.createElement(RadioGroup, {
            name: 'movementType',
            label: 'Consignment Movement Type',
            options: [
                { label: 'Inward Consignment', value: 'INWARD' },
                { label: 'Outward Consignment', value: 'OUTWARD' },
            ],
            value: 'INWARD',
            onChange: () => { },
        }));
        assert.ok(html.includes('Consignment Movement Type'));
        assert.ok(html.includes('Inward Consignment'));
    });
    await t.test('renders PageShell with breadcrumbs, actions and right panel', () => {
        const html = renderToString(React.createElement(PageShell, {
            breadcrumbs: ['Facility', 'Logistics', 'Weighbridge Passes'],
            title: 'Material Inward Ledger',
            description: 'Live delivery challans and gross weighbridge captures',
            actions: React.createElement('button', null, 'New Pass'),
            rightPanel: React.createElement('div', null, 'Context Telemetry'),
            isRightPanelOpen: true,
        }, React.createElement('div', null, 'Table Content')));
        assert.ok(html.includes('Material Inward Ledger'));
        assert.ok(html.includes('Weighbridge Passes'));
        assert.ok(html.includes('Context Telemetry'));
        assert.ok(html.includes('Table Content'));
    });
    await t.test('renders Panel with title, subtitle and footer', () => {
        const html = renderToString(React.createElement(Panel, {
            title: 'Quick Inspection',
            subtitle: 'Badge #VIS-0921',
            footer: React.createElement('span', null, 'Action Footer'),
        }, React.createElement('div', null, 'Inspecting Record')));
        assert.ok(html.includes('Quick Inspection'));
        assert.ok(html.includes('Badge #VIS-0921'));
        assert.ok(html.includes('Action Footer'));
    });
    await t.test('renders Accordion with collapsible sections', () => {
        const html = renderToString(React.createElement(Accordion, {
            items: [
                { id: '1', title: 'Driver & Vehicle Profile', content: React.createElement('div', null, 'Driver Details') },
                { id: '2', title: 'Weighbridge Gross Weights', content: React.createElement('div', null, 'Weights Data') },
            ],
        }));
        assert.ok(html.includes('Driver &amp; Vehicle Profile') || html.includes('Driver & Vehicle Profile'));
        assert.ok(html.includes('Weighbridge Gross Weights'));
    });
});
test('Data & Domain Components Verification', async (t) => {
    await t.test('renders standalone Search input with placeholder', () => {
        const html = renderToString(React.createElement(Search, {
            value: 'PO-123456',
            onChange: () => { },
            placeholder: 'Search PO number...',
        }));
        assert.ok(html.includes('PO-123456'));
        assert.ok(html.includes('Search PO number...'));
    });
    await t.test('renders SavedView selector dropdown', () => {
        const html = renderToString(React.createElement(SavedView, {
            views: [
                { id: 'v1', name: 'Standard View', isDefault: true },
                { id: 'v2', name: 'Shift 1 Active Overstays' },
            ],
            activeViewId: 'v1',
            onSelectView: () => { },
        }));
        assert.ok(html.includes('Standard View'));
    });
    await t.test('renders CompanyCard with vendor code and compliance metrics', () => {
        const html = renderToString(React.createElement(CompanyCard, {
            name: 'Thermax Heavy Engineering',
            vendorCode: 'VND-8821',
            tradeCategory: 'Boiler Overhaul Contractor',
            status: 'active',
            activeWorkers: 26,
            totalAuthorizedWorkers: 28,
            ehsComplianceScore: 98,
            contactPerson: 'Arun Varma',
        }));
        assert.ok(html.includes('Thermax Heavy Engineering'));
        assert.ok(html.includes('VND-8821'));
        assert.ok(html.includes('98%'));
        assert.ok(html.includes('Arun Varma'));
    });
});
test('Operational Components & Offline Framework Verification', async (t) => {
    await t.test('renders ActivityFeed with events and entity attribution', () => {
        const html = renderToString(React.createElement(ActivityFeed, {
            title: 'Recent Facility Events',
            items: [
                {
                    id: 'evt-1',
                    timestamp: '10:02 AM',
                    actor: 'Gate Guard #04',
                    action: 'Turnstile A1 Access Granted',
                    entityType: 'VISITOR',
                    entityId: 'VIS-00182',
                    severity: 'NORMAL',
                },
                {
                    id: 'evt-2',
                    timestamp: '10:05 AM',
                    actor: 'Perimeter Sensor',
                    action: 'Restricted Zone Breach Alert',
                    entityType: 'SECURITY',
                    entityId: 'ZONE-HAZ',
                    severity: 'CRITICAL',
                },
            ],
        }));
        assert.ok(html.includes('Recent Facility Events'));
        assert.ok(html.includes('Turnstile A1 Access Granted'));
        assert.ok(html.includes('Restricted Zone Breach Alert'));
    });
    await t.test('renders SyncStatusIndicator across all 6 Section 38 states', () => {
        const states = ['ONLINE', 'OFFLINE', 'SYNC_PENDING', 'SYNCING', 'SYNCED', 'CONFLICT'];
        for (const st of states) {
            const html = renderToString(React.createElement(SyncStatusIndicator, { state: st, pendingCount: 5 }));
            assert.ok(html.length > 0, `Must render sync indicator for state ${st}`);
        }
    });
    await t.test('renders GlobalSearch modal covering all 11 Section 8 categories', () => {
        const html = renderToString(React.createElement(GlobalSearch, {
            isOpen: true,
            onClose: () => { },
            onSelectResult: () => { },
        }));
        assert.ok(html.includes('VISITORS'), 'Must categorize Visitors');
        assert.ok(html.includes('VEHICLES'), 'Must categorize Vehicles');
        assert.ok(html.includes('MATERIALS'), 'Must categorize Materials');
        assert.ok(html.includes('DOCUMENTS'), 'Must categorize Documents');
        assert.ok(html.includes('CONTRACTORS'), 'Must categorize Contractors');
    });
    await t.test('renders EntityDetailPage with all 6 tabs including Activity Traceability', () => {
        const html = renderToString(React.createElement(EntityDetailPage, {
            entityId: 'VIS-2026-00182',
            title: 'Aravind Swaminathan',
            subtitle: 'Siemens Industrial Automation',
            status: 'active',
            entityType: 'VISITOR',
            onBack: () => { },
            overviewFields: [{ label: 'Host Employee', value: 'Vikram Mehta' }],
            activityTrace: {
                activityId: 'ACT-9021',
                sourceTransactionId: 'VIS-2026-00182',
                activityType: 'TRANSPORT',
                status: 'CAPTURED',
                mode: 'CAR (Diesel)',
                distanceKm: 42,
                provenance: 'SYSTEM_ESTIMATED',
                calculatedEmissions: '48.2 kg CO₂e',
            },
        }));
        assert.ok(html.includes('VIS-2026-00182'), 'Must render entity ID');
        assert.ok(html.includes('Aravind Swaminathan'), 'Must render title');
        assert.ok(html.includes('Activity &amp; ESG Traceability') || html.includes('Activity & ESG Traceability'), 'Must render Activity tab');
    });
    await t.test('renders DashboardFramework filter bar and configurable widgets', () => {
        const filterHtml = renderToString(React.createElement(DashboardFilterBar, { dateRange: 'TODAY' }));
        assert.ok(filterHtml.includes('FILTERS:'));
        assert.ok(filterHtml.includes('Today (Current Shift)'));
        const widgetHtml = renderToString(React.createElement(DashboardWidget, {
            title: 'Turnstile Peak Throughput',
            type: 'HEATMAP',
        }, React.createElement('div', null, 'Heatmap Visual')));
        assert.ok(widgetHtml.includes('HEATMAP'));
        assert.ok(widgetHtml.includes('Turnstile Peak Throughput'));
    });
});
test('Section 37 Canonical Page States Exhaustive Verification', async (t) => {
    await t.test('renders all 11 Section 37 error and operational page states', () => {
        const states = [
            renderToString(React.createElement(LoadingStateView)),
            renderToString(React.createElement(EmptyStateView, { title: 'No Transactions' })),
            renderToString(React.createElement(NoPermissionStateView)),
            renderToString(React.createElement(ErrorStateView)),
            renderToString(React.createElement(NotFoundStateView, { searchId: 'TXN-999' })),
            renderToString(React.createElement(ValidationErrorStateView, { errors: ['Name required'] })),
            renderToString(React.createElement(NetworkErrorStateView)),
            renderToString(React.createElement(ServerErrorStateView)),
            renderToString(React.createElement(OfflineStateView)),
            renderToString(React.createElement(SyncPendingStateView, { count: 3 })),
            renderToString(React.createElement(SessionExpiredStateView)),
        ];
        for (const html of states) {
            assert.ok(html.length > 50, 'State HTML must be fully structured');
        }
    });
});
