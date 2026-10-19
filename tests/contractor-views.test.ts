import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Import App and ContractorManagementView
import { App } from '../apps/web/src/App.js';
import { ContractorManagementView } from '../apps/web/src/views/contractor/ContractorManagementView.js';

test('Part 8: Contractor Management View & SSR Rendering Verification', async (t) => {
  await t.test('1. renders ContractorManagementView Executive Dashboard with KPIs and Scope 3 Footprint', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'DASHBOARD' }));
    assert.ok(html.includes('Contractor Management &amp; Workforce Compliance') || html.includes('Contractor Management & Workforce Compliance'));
    assert.ok(html.includes('Active Companies'));
    assert.ok(html.includes('Active Work Orders'));
    assert.ok(html.includes('Currently On Site (Occupancy)'));
    assert.ok(html.includes('Compliance Pass Rate'));
    assert.ok(html.includes('Scope 3 Cat 7'));
  });

  await t.test('2. renders Contractor Companies subview with vendor directory and safety ratings', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'COMPANIES' }));
    assert.ok(html.includes('Registered Contractor Organizations'));
    assert.ok(html.includes('Apex Industrial Infrastructure Ltd'));
    assert.ok(html.includes('VoltTech Power &amp; Automation') || html.includes('VoltTech Power & Automation'));
    assert.ok(html.includes('VEND-INFRA-01'));
  });

  await t.test('3. renders Contracts subview with commercial validity and scope of work', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'CONTRACTS' }));
    assert.ok(html.includes('Commercial Contracts &amp; Master Service Agreements') || html.includes('Commercial Contracts & Master Service Agreements'));
    assert.ok(html.includes('CON-2026-0041'));
    assert.ok(html.includes('Plant Structural Retrofitting'));
    assert.ok(html.includes('New Contract'));
  });

  await t.test('4. renders Work Orders subview with authorized worker caps and safety permits', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'WORK_ORDERS' }));
    assert.ok(html.includes('Authorized Work Orders'));
    assert.ok(html.includes('WO-INFRA-8801'));
    assert.ok(html.includes('Bay 2 Overhead Crane Track Alignment'));
    assert.ok(html.includes('Create Work Order'));
  });

  await t.test('5. renders Worker Directory subview with trade skills and badges', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'WORKER_DIRECTORY' }));
    assert.ok(html.includes('Contractor Workforce Directory'));
    assert.ok(html.includes('Ramesh K. Yadav'));
    assert.ok(html.includes('Mohammad Farooq'));
    assert.ok(html.includes('Register Worker'));
  });

  await t.test('6. renders Returning Workers subview with canonical identity deduplication', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'RETURNING_WORKERS' }));
    assert.ok(html.includes('Returning Contractor Workers Roster'));
    assert.ok(html.includes('Ramesh K. Yadav'));
  });

  await t.test('7. renders Worker Assignments subview with work order scoping', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'ASSIGNMENTS' }));
    assert.ok(html.includes('Worker-to-Work Order Assignments'));
    assert.ok(html.includes('Ramesh K. Yadav'));
    assert.ok(html.includes('WO-2026-PIPE-101'));
    assert.ok(html.includes('Reassign'));
  });

  await t.test('8. renders Attendance Ledger subview with check-in/out and manual corrections', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'CONTRACTOR_ATTENDANCE' }));
    assert.ok(html.includes('Daily Contractor Attendance Ledger'));
    assert.ok(html.includes('Ramesh K. Yadav'));
    assert.ok(html.includes('Turnstile Check-In'));
    assert.ok(html.includes('Correct'));
  });

  await t.test('9. renders Contractor Transport & ESG Traceability subview with Scope 3 Cat 7 provenance', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'CONTRACTOR_TRANSPORT' }));
    assert.ok(html.includes('Contractor Mobility &amp; Scope 3 Category 7 Traceability') || html.includes('Contractor Mobility & Scope 3 Category 7 Traceability'));
    assert.ok(html.includes('GHG Protocol Scope 3 Cat 7'));
    assert.ok(html.includes('Zero-Blocker Invariant: Group transport deduplication applied'));
  });

  await t.test('10. App component routes /contractors and sub-routes to ContractorManagementView', () => {
    const html1 = renderToString(React.createElement(App, { initialRoute: '/contractors' }));
    assert.ok(html1.includes('Contractor Management &amp; Workforce Compliance') || html1.includes('Contractor Management & Workforce Compliance'));

    const html2 = renderToString(React.createElement(App, { initialRoute: '/contractors/companies' }));
    assert.ok(html2.includes('Registered Contractor Organizations'));

    const html3 = renderToString(React.createElement(App, { initialRoute: '/contractors/contracts' }));
    assert.ok(html3.includes('Commercial Contracts &amp; Master Service Agreements') || html3.includes('Commercial Contracts & Master Service Agreements'));

    const html4 = renderToString(React.createElement(App, { initialRoute: '/contractors/work-orders' }));
    assert.ok(html4.includes('Authorized Work Orders'));

    const html5 = renderToString(React.createElement(App, { initialRoute: '/contractors/workers' }));
    assert.ok(html5.includes('Contractor Workforce Directory'));

    const html6 = renderToString(React.createElement(App, { initialRoute: '/contractors/attendance' }));
    assert.ok(html6.includes('Daily Contractor Attendance Ledger'));

    const html7 = renderToString(React.createElement(App, { initialRoute: '/contractors/transport' }));
    assert.ok(html7.includes('Contractor Mobility &amp; Scope 3 Category 7 Traceability') || html7.includes('Contractor Mobility & Scope 3 Category 7 Traceability'));

    const html8 = renderToString(React.createElement(App, { initialRoute: '/contractors/compliance' }));
    assert.ok(html8.includes('Multi-Source Workforce Compliance Ledger'));

    const html9 = renderToString(React.createElement(App, { initialRoute: '/contractors/expected' }));
    assert.ok(html9.includes('Scheduled &amp; Expected Workforce Roster') || html9.includes('Scheduled & Expected Workforce Roster'));

    const html10 = renderToString(React.createElement(App, { initialRoute: '/contractors/approvals' }));
    assert.ok(html10.includes('Pending Contractor Approvals &amp; Governance Actions') || html10.includes('Pending Contractor Approvals & Governance Actions'));

    const html11 = renderToString(React.createElement(App, { initialRoute: '/contractors/history' }));
    assert.ok(html11.includes('Historical Contractor Shift &amp; Deployment Archives') || html11.includes('Historical Contractor Shift & Deployment Archives'));

    const html12 = renderToString(React.createElement(App, { initialRoute: '/contractors/exceptions' }));
    assert.ok(html12.includes('Contractor Exceptions, Lapses &amp; Compliance Breaches') || html12.includes('Contractor Exceptions, Lapses & Compliance Breaches'));
  });

  await t.test('11. renders Compliance subview with trade licenses, medical fitness, and permits', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'COMPLIANCE' }));
    assert.ok(html.includes('Multi-Source Workforce Compliance Ledger'));
    assert.ok(html.includes('DOC-IND-2026-901'));
    assert.ok(html.includes('DOC-QUAL-2024-441'));
    assert.ok(html.includes('DOC-LIC-CEA-8812'));
  });

  await t.test('12. renders Expected Workforce subview with shift patterns and authorization', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'EXPECTED_WORKFORCE' }));
    assert.ok(html.includes('Scheduled &amp; Expected Workforce Roster') || html.includes('Scheduled & Expected Workforce Roster'));
    assert.ok(html.includes('Ramesh K. Yadav'));
    assert.ok(html.includes('Mohammad Farooq'));
    assert.ok(html.includes('DAY_SHIFT'));
  });

  await t.test('13. renders Pending Approvals subview with work order actions', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'PENDING_APPROVALS' }));
    assert.ok(html.includes('Pending Contractor Approvals &amp; Governance Actions') || html.includes('Pending Contractor Approvals & Governance Actions'));
    assert.ok(html.includes('WO-INFRA-8801'));
    assert.ok(html.includes('Approve'));
  });

  await t.test('14. renders Contractor History subview with historical attendance archives', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'CONTRACTOR_HISTORY' }));
    assert.ok(html.includes('Historical Contractor Shift &amp; Deployment Archives') || html.includes('Historical Contractor Shift & Deployment Archives'));
    assert.ok(html.includes('att-501'));
  });

  await t.test('15. renders Exceptions subview with restricted workers and medical lapses', () => {
    const html = renderToString(React.createElement(ContractorManagementView, { initialSubView: 'EXCEPTIONS' }));
    assert.ok(html.includes('Contractor Exceptions, Lapses &amp; Compliance Breaches') || html.includes('Contractor Exceptions, Lapses & Compliance Breaches'));
    assert.ok(html.includes('Virendra Singh Rawat'));
    assert.ok(html.includes('Medical Fitness Expired'));
  });
});
