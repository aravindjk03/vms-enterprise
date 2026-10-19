import type { TransactionalOutboxEvent } from '@vms/types';
import type { IEventBus } from '@vms/events';
import { WorkflowRepository } from '@vms/database';
export declare class TransactionalOutboxService {
    private workflowRepo;
    private eventBus;
    constructor(workflowRepo: WorkflowRepository, eventBus: IEventBus);
    /**
     * Enqueues an event atomically into the transactional outbox ledger (Section 28).
     */
    enqueueEvent(eventType: string, payload: Record<string, unknown>, tenantId: string): TransactionalOutboxEvent;
    /**
     * Processes all pending outbox events and reliably publishes them to the event bus.
     */
    dispatchPendingEvents(tenantId?: string): Promise<{
        dispatched: number;
        failed: number;
    }>;
}
