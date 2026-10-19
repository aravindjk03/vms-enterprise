import { randomUUID } from 'node:crypto';
export class TransactionalOutboxService {
    workflowRepo;
    eventBus;
    constructor(workflowRepo, eventBus) {
        this.workflowRepo = workflowRepo;
        this.eventBus = eventBus;
    }
    /**
     * Enqueues an event atomically into the transactional outbox ledger (Section 28).
     */
    enqueueEvent(eventType, payload, tenantId) {
        const outboxId = randomUUID();
        const event = {
            outboxId,
            tenantId,
            eventType,
            payload,
            status: 'PENDING',
            retryCount: 0,
            createdAt: new Date(),
        };
        this.workflowRepo.recordOutboxEvent(event, tenantId);
        return event;
    }
    /**
     * Processes all pending outbox events and reliably publishes them to the event bus.
     */
    async dispatchPendingEvents(tenantId) {
        const pending = this.workflowRepo.listPendingOutboxEvents(tenantId);
        let dispatched = 0;
        let failed = 0;
        for (const item of pending) {
            try {
                await this.eventBus.publish({
                    eventId: item.outbox_id || item.outboxId,
                    eventType: item.event_type || item.eventType,
                    eventSource: 'vms.workflow.outbox',
                    eventTimestamp: new Date().toISOString(),
                    tenantId: item.tenant_id || item.tenantId,
                    organizationId: '',
                    siteId: '',
                    correlationId: `outbox-${item.outbox_id || item.outboxId}`,
                    version: '1.0',
                    data: item.payload,
                    actorId: 'SYSTEM_OUTBOX',
                    actorRole: 'SUPER_ADMIN',
                });
                // Mark dispatched
                this.workflowRepo.db.update('workflow_outbox_events', item.outbox_id || item.outboxId, {
                    status: 'DISPATCHED',
                    dispatched_at: new Date(),
                }, item.tenant_id || item.tenantId);
                dispatched++;
            }
            catch (err) {
                failed++;
                const nextRetry = (item.retry_count || item.retryCount || 0) + 1;
                this.workflowRepo.db.update('workflow_outbox_events', item.outbox_id || item.outboxId, {
                    retry_count: nextRetry,
                    error_details: err?.message || 'Dispatch failure',
                    status: nextRetry >= 5 ? 'FAILED' : 'PENDING',
                }, item.tenant_id || item.tenantId);
            }
        }
        return { dispatched, failed };
    }
}
