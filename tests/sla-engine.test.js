import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RelationalDatabase, WorkflowRepository, AuditRepository } from '@vms/database';
import { SlaEngine } from '../services/workflow/src/sla/sla-engine.js';
describe('Part 5: SlaEngine & Escalation Rules (Section 22)', () => {
    const db = new RelationalDatabase();
    const workflowRepo = new WorkflowRepository(db);
    const auditRepo = new AuditRepository(db);
    const slaEngine = new SlaEngine(workflowRepo, auditRepo);
    const tenantId = 'tenant-sla-test';
    it('1. Task within SLA timeframe remains ON_SCHEDULE without action', async () => {
        const now = new Date('2026-10-10T10:00:00Z');
        const task = {
            taskId: 'task-on-time',
            instanceId: 'inst-01',
            stageId: 'stg-01',
            tenantId,
            sourceDomain: 'VISITOR',
            sourceTransactionId: 'VIS-001',
            status: 'PENDING',
            slaWarningAt: new Date('2026-10-10T11:00:00Z'),
            slaDueAt: new Date('2026-10-10T12:00:00Z'),
            slaBreached: false,
            slaEscalated: false,
            submittedAt: new Date('2026-10-10T09:00:00Z'),
        };
        workflowRepo.createTask(task);
        const results = await slaEngine.evaluatePendingTasks(tenantId, now);
        const res = results.find((r) => r.taskId === 'task-on-time');
        assert.ok(res);
        assert.strictEqual(res.slaStatus, 'ON_SCHEDULE');
        assert.strictEqual(res.actionTaken, 'NONE');
    });
    it('2. Triggers SLA warning when threshold warning time has passed', async () => {
        // Current time is between warningAt and dueAt
        const asOf = new Date('2026-10-10T11:30:00Z');
        const task = {
            taskId: 'task-warning',
            instanceId: 'inst-02',
            stageId: 'stg-01',
            tenantId,
            sourceDomain: 'VISITOR',
            sourceTransactionId: 'VIS-002',
            status: 'PENDING',
            slaWarningAt: new Date('2026-10-10T11:00:00Z'),
            slaDueAt: new Date('2026-10-10T12:00:00Z'),
            slaBreached: false,
            slaEscalated: false,
            submittedAt: new Date('2026-10-10T09:00:00Z'),
        };
        workflowRepo.createTask(task);
        const results = await slaEngine.evaluatePendingTasks(tenantId, asOf);
        const res = results.find((r) => r.taskId === 'task-warning');
        assert.ok(res);
        assert.strictEqual(res.slaStatus, 'WARNING_TRIGGERED');
        assert.strictEqual(res.actionTaken, 'WARNING_DISPATCHED');
        // Check outbox for warning event
        const events = workflowRepo.listPendingOutboxEvents(tenantId);
        assert.ok(events.some((e) => (e.event_type || e.eventType) === 'vms.workflow.sla_warning.v1'));
    });
    it('3. Auto-escalates task on SLA breach, sets flags, and enqueues escalation events', async () => {
        // Current time is past dueAt
        const asOf = new Date('2026-10-10T12:30:00Z');
        const task = {
            taskId: 'task-breach',
            instanceId: 'inst-03',
            stageId: 'stg-01',
            tenantId,
            sourceDomain: 'CONTRACTOR',
            sourceTransactionId: 'CONT-001',
            status: 'PENDING',
            slaWarningAt: new Date('2026-10-10T11:00:00Z'),
            slaDueAt: new Date('2026-10-10T12:00:00Z'),
            slaBreached: false,
            slaEscalated: false,
            submittedAt: new Date('2026-10-10T09:00:00Z'),
        };
        workflowRepo.createTask(task);
        const results = await slaEngine.evaluatePendingTasks(tenantId, asOf);
        const res = results.find((r) => r.taskId === 'task-breach');
        assert.ok(res);
        assert.strictEqual(res.slaStatus, 'BREACHED');
        assert.strictEqual(res.actionTaken, 'ESCALATED');
        // Verify task updated in database
        const updated = workflowRepo.getTask('task-breach');
        assert.ok(updated);
        assert.strictEqual(updated.status, 'ESCALATED');
        assert.strictEqual(updated.sla_breached || updated.slaBreached, true);
        assert.strictEqual(updated.sla_escalated || updated.slaEscalated, true);
        assert.strictEqual(updated.escalation_count || updated.escalationCount, 1);
        // Verify outbox events
        const events = workflowRepo.listPendingOutboxEvents(tenantId);
        assert.ok(events.some((e) => (e.event_type || e.eventType) === 'vms.workflow.sla_breached.v1'));
        assert.ok(events.some((e) => (e.event_type || e.eventType) === 'vms.workflow.escalated.v1'));
        // Verify audit log
        const auditLogs = auditRepo.getAuditHistory('APPROVAL_TASK', 'task-breach', tenantId);
        assert.ok(auditLogs.some((a) => a.action === 'WORKFLOW_SLA_BREACH_ESCALATED'));
    });
    it('4. Deduplication: prevents alert flood by not re-escalating already escalated task', async () => {
        const asOf = new Date('2026-10-10T13:00:00Z');
        const countEventsBefore = workflowRepo.listPendingOutboxEvents(tenantId).length;
        // Run again with task that was already escalated in step 3
        const results = await slaEngine.evaluatePendingTasks(tenantId, asOf);
        const res = results.find((r) => r.taskId === 'task-breach');
        assert.ok(res);
        assert.strictEqual(res.slaStatus, 'ESCALATED');
        assert.strictEqual(res.actionTaken, 'ALREADY_ESCALATED');
        const countEventsAfter = workflowRepo.listPendingOutboxEvents(tenantId).length;
        assert.strictEqual(countEventsAfter, countEventsBefore, 'No duplicate escalation events should be emitted');
    });
    it('5. Deduplication: prevents warning alert flood on repeated evaluation ticks', async () => {
        const taskWarn = {
            taskId: 'task-warn-flood',
            instanceId: 'inst-03',
            stageId: 'stg-01',
            tenantId,
            sourceDomain: 'VISITOR',
            sourceTransactionId: 'TXN-WFLOOD',
            assignedToUserId: 'approver-01',
            status: 'PENDING',
            submittedAt: new Date('2026-10-10T10:00:00Z'),
            slaWarningAt: new Date('2026-10-10T10:30:00Z'),
            slaDueAt: new Date('2026-10-10T11:00:00Z'),
        };
        workflowRepo.createTask(taskWarn);
        // First evaluation during warning period
        const asOf1 = new Date('2026-10-10T10:45:00Z');
        const countBefore = workflowRepo.listPendingOutboxEvents(tenantId).length;
        const res1 = await slaEngine.evaluatePendingTasks(tenantId, asOf1);
        const item1 = res1.find((r) => r.taskId === 'task-warn-flood');
        assert.strictEqual(item1?.slaStatus, 'WARNING_TRIGGERED');
        assert.strictEqual(item1?.actionTaken, 'WARNING_DISPATCHED');
        const countAfterFirst = workflowRepo.listPendingOutboxEvents(tenantId).length;
        assert.strictEqual(countAfterFirst, countBefore + 1, 'Warning outbox event should be dispatched once');
        // Second evaluation (e.g. 1 minute later) still during warning period
        const asOf2 = new Date('2026-10-10T10:46:00Z');
        const res2 = await slaEngine.evaluatePendingTasks(tenantId, asOf2);
        const item2 = res2.find((r) => r.taskId === 'task-warn-flood');
        assert.strictEqual(item2?.slaStatus, 'WARNING_TRIGGERED');
        assert.strictEqual(item2?.actionTaken, 'ALREADY_WARNED');
        const countAfterSecond = workflowRepo.listPendingOutboxEvents(tenantId).length;
        assert.strictEqual(countAfterSecond, countAfterFirst, 'No duplicate warning event should be emitted');
    });
});
