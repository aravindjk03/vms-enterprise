import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RelationalDatabase, WorkflowRepository } from '@vms/database';
import { InMemoryEventBus } from '@vms/events';
import { TransactionalOutboxService } from '../services/workflow/src/events/outbox-service.js';
describe('Part 5: Transactional Outbox Pattern & Event Reliability (Sections 27, 28)', () => {
    const db = new RelationalDatabase();
    const workflowRepo = new WorkflowRepository(db);
    const eventBus = new InMemoryEventBus();
    const outboxService = new TransactionalOutboxService(workflowRepo, eventBus);
    const tenantId = 'tenant-outbox-test';
    it('1. Atomically enqueues domain events into outbox ledger with PENDING status', () => {
        const event = outboxService.enqueueEvent('vms.workflow.approval_required.v1', { taskId: 'task-101', instanceId: 'inst-101', assignedRole: 'SECURITY_MANAGER' }, tenantId);
        assert.ok(event.outboxId);
        assert.strictEqual(event.status, 'PENDING');
        assert.strictEqual(event.retryCount, 0);
        assert.strictEqual(event.tenantId, tenantId);
        const pending = workflowRepo.listPendingOutboxEvents(tenantId);
        assert.strictEqual(pending.length, 1);
        assert.strictEqual(pending[0].outbox_id || pending[0].outboxId, event.outboxId);
    });
    it('2. Dispatches pending outbox events to EventBus and transitions status to DISPATCHED', async () => {
        let subscriberReceived = false;
        eventBus.subscribe('vms.workflow.approval_required.v1', (e) => {
            subscriberReceived = true;
            assert.strictEqual(e.data.taskId, 'task-101');
        });
        const result = await outboxService.dispatchPendingEvents(tenantId);
        assert.strictEqual(result.dispatched, 1);
        assert.strictEqual(result.failed, 0);
        assert.strictEqual(subscriberReceived, true);
        // Outbox item is now DISPATCHED
        const remainingPending = workflowRepo.listPendingOutboxEvents(tenantId);
        assert.strictEqual(remainingPending.length, 0);
        const allEvents = workflowRepo.db.findMany('workflow_outbox_events', { tenant_id: tenantId });
        assert.strictEqual(allEvents[0].status, 'DISPATCHED');
        assert.ok(allEvents[0].dispatched_at);
    });
    it('3. Handles dispatch failures by incrementing retry count and recording error diagnostics', async () => {
        // Enqueue an event
        const event = outboxService.enqueueEvent('vms.workflow.error_prone.v1', { data: 'test' }, tenantId);
        // Mock failing eventBus for this specific event
        const failingBus = {
            publish: async () => {
                throw new Error('Connection timeout to upstream message broker');
            },
            subscribe: () => { },
        };
        const failingOutboxService = new TransactionalOutboxService(workflowRepo, failingBus);
        // Attempt dispatch
        const result = await failingOutboxService.dispatchPendingEvents(tenantId);
        assert.strictEqual(result.dispatched, 0);
        assert.strictEqual(result.failed, 1);
        // Event should still be PENDING with retryCount = 1
        const rawEvent = workflowRepo.db.findById('workflow_outbox_events', event.outboxId);
        assert.strictEqual(rawEvent.status, 'PENDING');
        assert.strictEqual(rawEvent.retry_count, 1);
        assert.strictEqual(rawEvent.error_details, 'Connection timeout to upstream message broker');
    });
    it('4. Marks event as FAILED when maximum retry threshold (>= 5) is exceeded', async () => {
        // Set retry_count to 4 directly in db
        const pendingEvents = workflowRepo.listPendingOutboxEvents(tenantId);
        const targetEvent = pendingEvents[0];
        workflowRepo.db.update('workflow_outbox_events', targetEvent.outbox_id || targetEvent.outboxId, {
            retry_count: 4,
        });
        const failingBus = {
            publish: async () => {
                throw new Error('Permanent network partition');
            },
            subscribe: () => { },
        };
        const failingOutboxService = new TransactionalOutboxService(workflowRepo, failingBus);
        const result = await failingOutboxService.dispatchPendingEvents(tenantId);
        assert.strictEqual(result.failed, 1);
        // Status is now FAILED
        const updated = workflowRepo.db.findById('workflow_outbox_events', targetEvent.outbox_id || targetEvent.outboxId);
        assert.strictEqual(updated.status, 'FAILED');
        assert.strictEqual(updated.retry_count, 5);
    });
});
