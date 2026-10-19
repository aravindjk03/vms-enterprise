import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Import Part 5 Views and App
import { MasterDataView } from '../apps/web/src/views/MasterDataView.js';
import { WorkflowBuilderView } from '../apps/web/src/views/WorkflowBuilderView.js';
import { TaskCenterView } from '../apps/web/src/views/TaskCenterView.js';
import { RulesEngineView } from '../apps/web/src/views/RulesEngineView.js';
import { App } from '../apps/web/src/App.js';

describe('Part 5: UI Views & Routing Server-Side Rendering (SSR)', () => {
  it('1. Renders MasterDataView with category selector, domain ribbon, and records table', () => {
    const html = renderToString(React.createElement(MasterDataView, { userRole: 'SUPER_ADMIN' }));

    assert.ok(html.includes('Enterprise Master Data Management'), 'Missing title');
    assert.ok(html.includes('Controlled, versioned business categories'), 'Missing subtitle');
    assert.ok(html.includes('Import CSV'), 'Missing Import CSV button');
    assert.ok(html.includes('Add Master Record'), 'Missing Add Master Record button');
    assert.ok(html.includes('VIP_GUEST'), 'Missing sample VIP_GUEST record code');
    assert.ok(html.includes('HOT_WORK_CAT'), 'Missing sample HOT_WORK_CAT record code');
    assert.ok(html.includes('Sensitive Category'), 'Missing Sensitive Category badge');
  });

  it('2. Renders WorkflowBuilderView with 3-pane layout (Palette, Canvas, Inspector)', () => {
    const html = renderToString(React.createElement(WorkflowBuilderView, { userRole: 'SUPER_ADMIN' }));

    assert.ok(html.includes('Enterprise Workflow Builder'), 'Missing title');
    assert.ok(html.includes('Stage Palette'), 'Missing Stage Palette pane');
    assert.ok(html.includes('Workflow Canvas'), 'Missing Workflow Canvas pane');
    assert.ok(html.includes('Stage Inspector'), 'Missing Stage Inspector pane');
    assert.ok(html.includes('Validate Workflow'), 'Missing Validate button');
    assert.ok(html.includes('Domain Template:'), 'Missing Domain Template selector');
    assert.ok(html.includes('Published Version Protected') || html.includes('IMMUTABLE'), 'Missing immutability protection text');
  });

  it('3. Renders TaskCenterView with persona tabs, SLA indicators, and action buttons', () => {
    const html = renderToString(React.createElement(TaskCenterView, { userRole: 'SUPER_ADMIN' }));

    assert.ok(html.includes('Enterprise Task Center'), 'Missing title');
    assert.ok(html.includes('Pending Approvals'), 'Missing Pending Approvals tab');
    assert.ok(html.includes('Delegated Tasks'), 'Missing Delegated Tasks tab');
    assert.ok(html.includes('Overdue / Escalated'), 'Missing Overdue tab');
    assert.ok(html.includes('History / Completed'), 'Missing Completed tab');
    assert.ok(html.includes('VIS-9401'), 'Missing sample task reference');
    assert.ok(html.includes('Approve'), 'Missing Approve button');
    assert.ok(html.includes('Reject'), 'Missing Reject button');
    assert.ok(html.includes('Request Changes'), 'Missing Request Changes button');
    assert.ok(html.includes('Delegate'), 'Missing Delegate button');
  });

  it('4. Renders RulesEngineView with rules matrix and live policy simulator', () => {
    const html = renderToString(React.createElement(RulesEngineView));

    assert.ok(html.includes('Declarative Business Rules &amp; Policy Engine') || html.includes('Declarative Business Rules & Policy Engine'), 'Missing title');
    assert.ok(html.includes('Active Policies:'), 'Missing Active Policies ribbon');
    assert.ok(html.includes('Rules Hierarchy (Evaluated by Priority Order)'), 'Missing rules hierarchy');
    assert.ok(html.includes('Interactive Policy Simulator'), 'Missing simulator title');
    assert.ok(html.includes('Evaluate Policy Decision'), 'Missing evaluate button');
    assert.ok(html.includes('PRIORITY 1'), 'Missing priority badge');
  });

  it('5. App routes /tasks, /admin/master-data, /admin/workflows, and /admin/rules correctly', () => {
    // Tasks route
    const tasksAppHtml = renderToString(React.createElement(App, { initialRoute: '/tasks' }));
    assert.ok(tasksAppHtml.includes('Enterprise Task Center'));

    // Master Data admin route
    const masterDataAppHtml = renderToString(React.createElement(App, { initialRoute: '/admin/master-data' }));
    assert.ok(masterDataAppHtml.includes('Enterprise Master Data Management'));

    // Workflow Builder admin route
    const workflowAppHtml = renderToString(React.createElement(App, { initialRoute: '/admin/workflows' }));
    assert.ok(workflowAppHtml.includes('Enterprise Workflow Builder'));

    // Rules Engine admin route
    const rulesAppHtml = renderToString(React.createElement(App, { initialRoute: '/admin/rules' }));
    assert.ok(rulesAppHtml.includes('Declarative Business Rules &amp; Policy Engine') || rulesAppHtml.includes('Declarative Business Rules & Policy Engine'));
  });
});
