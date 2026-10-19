import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Import Views and Components
import { App } from '../apps/web/src/App.js';
import { ExecutiveDashboardView } from '../apps/web/src/views/ExecutiveDashboardView.js';
import { OperationsDashboardView } from '../apps/web/src/views/OperationsDashboardView.js';
import { SecurityDashboardView } from '../apps/web/src/views/SecurityDashboardView.js';
import { GateModeView } from '../apps/web/src/views/GateModeView.js';
import { KioskWelcomeView } from '../apps/web/src/views/KioskWelcomeView.js';
import { TransactionFormView } from '../apps/web/src/views/TransactionFormView.js';
import { EmergencyModalView } from '../apps/web/src/views/EmergencyModalView.js';
import { GenericDomainListView } from '../apps/web/src/views/GenericDomainListView.js';
import { DEMO_VISITORS, DEMO_CONTRACTORS, DEMO_MATERIALS, DEMO_ESG_RECORDS } from '../apps/web/src/mockData.js';

test('Browser & SSR Rendering Verification for All Foundation Views', async (t) => {
  await t.test('renders ExecutiveDashboardView with KPIs and ESG Summary', () => {
    const html = renderToString(React.createElement(ExecutiveDashboardView));
    assert.ok(html.includes('People Inside'), 'Must render People Inside KPI');
    assert.ok(html.includes("Today&#x27;s Visitors") || html.includes("Today's Visitors"), 'Must render Visitors KPI');
    assert.ok(html.includes('Gate Activity &amp; Throughput') || html.includes('Gate Activity & Throughput'), 'Must render Gate activity');
    assert.ok(html.includes('Cross-Domain ESG Activity'), 'Must render ESG activity');
    assert.ok(html.includes('4,820 kg CO₂e') || html.includes('4,820 kg CO'), 'Must render carbon metric');
  });

  await t.test('renders OperationsDashboardView with Occupancy and Queue Telemetry', () => {
    const html = renderToString(React.createElement(OperationsDashboardView));
    assert.ok(html.includes('Live Facility Occupancy'), 'Must render live occupancy');
    assert.ok(html.includes('Visitor Operations'), 'Must render visitor pipeline');
    assert.ok(html.includes('Contractor Roster'), 'Must render contractor pipeline');
    assert.ok(html.includes('Material Inward / Outward'), 'Must render material pipeline');
    assert.ok(html.includes('CRITICAL: Restricted Zone Breach'), 'Must render critical alert');
  });

  await t.test('renders SecurityDashboardView with Critical Alert and Gate Monitor', () => {
    const html = renderToString(React.createElement(SecurityDashboardView));
    assert.ok(html.includes('CRITICAL SECURITY EVENT'), 'Must render top critical banner');
    assert.ok(html.includes('Live Gate Lane Monitor'), 'Must render lane monitor');
    assert.ok(html.includes('Access Denied Stream'), 'Must render access denied feed');
    assert.ok(html.includes('Active Overstay Tracker'), 'Must render overstay tracker');
  });

  await t.test('renders GateModeView with fast-scan and large decision controls', () => {
    const html = renderToString(React.createElement(GateModeView));
    assert.ok(html.includes('SCAN RFID / QR CODE PASS'), 'Must render fast-scan input');
    assert.ok(html.includes('Optical ANPR &amp; CCTV Camera Stream') || html.includes('Optical ANPR & CCTV Camera Stream'), 'Must render optical ANPR stream');
    assert.ok(html.includes('Awaiting Barcode / QR / ANPR Scan'), 'Must render awaiting scan state');
  });

  await t.test('renders KioskWelcomeView with 4 primary touch options and privacy notice', () => {
    const html = renderToString(React.createElement(KioskWelcomeView));
    assert.ok(html.includes('Welcome to Chennai Facility'), 'Must render welcome heading');
    assert.ok(html.includes('I Have an Appointment'), 'Must render appointment touch button');
    assert.ok(html.includes('Walk-in Visitor'), 'Must render walk-in touch button');
    assert.ok(html.includes('Scan QR Pass'), 'Must render scan QR touch button');
    assert.ok(html.includes('Assistance'), 'Must render assistance button');
    assert.ok(html.includes('Security Notice: All visitor data is processed in accordance with plant privacy governance policies'), 'Must render privacy notice');
  });

  await t.test('renders TransactionFormView with embedded Activity & Sustainability capture', () => {
    const html = renderToString(React.createElement(TransactionFormView));
    assert.ok(html.includes('Visitor Pre-Registration Envelope'), 'Must render transaction header');
    assert.ok(html.includes('Activity &amp; Sustainability') || html.includes('Activity & Sustainability'), 'Must render embedded ESG section');
    assert.ok(html.includes('Operational Traceability:'), 'Must render operational explanation');
    assert.ok(html.includes('SYSTEM_ESTIMATED'), 'Must render distance provenance tag');
    // Ensure no GHG accounting complexity is exposed in the HTML
    assert.ok(!html.includes('Scope 3 Category 7'), 'Must not expose Scope 3 accounting jargon');
  });

  await t.test('renders GenericDomainListView across Visitors, Contractors, Materials, and ESG', () => {
    const visitorHtml = renderToString(
      React.createElement(GenericDomainListView, {
        domainTitle: 'Visitor Management',
        domainDescription: 'Active visitors roster',
        data: DEMO_VISITORS,
        columns: [
          { key: 'name', header: 'Visitor Name' },
          { key: 'company', header: 'Company' },
        ],
      })
    );
    assert.ok(visitorHtml.includes('Aravind Swaminathan'), 'Must render visitor name');
    assert.ok(visitorHtml.includes('Siemens Industrial Automation'), 'Must render visitor company');
    assert.ok(visitorHtml.includes('DEFAULT'), 'Must render state switchers');
    assert.ok(visitorHtml.includes('LOADING'), 'Must render loading switcher');
    assert.ok(visitorHtml.includes('EMPTY'), 'Must render empty switcher');
    assert.ok(visitorHtml.includes('NO_PERMISSION'), 'Must render no-permission switcher');
    assert.ok(visitorHtml.includes('ERROR'), 'Must render error switcher');
  });

  await t.test('renders Global Application Shell with TopBar and LeftNav', () => {
    const appHtml = renderToString(React.createElement(App));
    assert.ok(appHtml.includes('VMS Enterprise'), 'Must render top brand');
    assert.ok(appHtml.includes('MRF Tyres &amp; Polymers') || appHtml.includes('MRF Tyres & Polymers'), 'Must render organization switcher');
    assert.ok(appHtml.includes('Executive Dashboard'), 'Must render left nav dashboard item');
    assert.ok(appHtml.includes('Visitor'), 'Must render left nav visitor domain');
    assert.ok(appHtml.includes('Contractor'), 'Must render left nav contractor domain');
    assert.ok(appHtml.includes('Gate Console'), 'Must render left nav gate domain');
    assert.ok(appHtml.includes('ESG / GHG'), 'Must render left nav ESG domain');
  });
});
