export const EVENT_TYPES = {
    // Visitor & Customer
    VISITOR_CREATED: 'vms.visitor.created.v1',
    VISITOR_UPDATED: 'vms.visitor.updated.v1',
    APPOINTMENT_CREATED: 'vms.appointment.created.v1',
    VISITOR_APPROVED: 'vms.visitor.approved.v1',
    VISITOR_REJECTED: 'vms.visitor.rejected.v1',
    CHECKIN_COMPLETED: 'vms.gate.checkin_completed.v1',
    CHECKOUT_COMPLETED: 'vms.gate.checkout_completed.v1',
    OVERSTAY_DETECTED: 'vms.security.overstay_detected.v1',
    // Identity & Documents
    IDENTITY_VERIFIED: 'vms.identity.verified.v1',
    FACE_VERIFIED: 'vms.identity.face_verified.v1',
    DOCUMENT_VERIFIED: 'vms.compliance.doc_verified.v1',
    DOCUMENT_EXPIRED: 'vms.compliance.doc_expired.v1',
    // Contractor & Service
    CONTRACTOR_REGISTERED: 'vms.contractor.registered.v1',
    WORKER_VERIFIED: 'vms.contractor.worker_verified.v1',
    TRAINING_COMPLETED: 'vms.safety.training_completed.v1',
    PERMIT_APPROVED: 'vms.safety.permit_approved.v1',
    SERVICE_COMPLETED: 'vms.service.completed.v1',
    // Material & Vehicle
    MATERIAL_REGISTERED: 'vms.material.registered.v1',
    MATERIAL_APPROVED: 'vms.material.approved.v1',
    GATE_PASS_CREATED: 'vms.gate.pass_created.v1',
    VEHICLE_REGISTERED: 'vms.vehicle.registered.v1',
    VEHICLE_VERIFIED: 'vms.vehicle.verified.v1',
    // ESG & Sustainability
    TRANSPORT_ACTIVITY_CREATED: 'vms.esg.transport_created.v1',
    GHG_ACTIVITY_CREATED: 'vms.esg.activity_created.v1',
    GHG_CALCULATED: 'vms.esg.ghg_calculated.v1',
    // Emergency
    EMERGENCY_DECLARED: 'vms.emergency.declared.v1',
    MUSTER_STARTED: 'vms.emergency.muster_started.v1',
    MUSTER_COMPLETED: 'vms.emergency.muster_completed.v1',
    // Master Data & Governance (Part 5)
    MASTER_RECORD_CREATED: 'vms.master.record_created.v1',
    MASTER_RECORD_UPDATED: 'vms.master.record_updated.v1',
    MASTER_RECORD_STATUS_CHANGED: 'vms.master.record_status_changed.v1',
    // Workflow, Approval, SLA & Outbox (Part 5)
    WORKFLOW_VERSION_PUBLISHED: 'vms.workflow.version_published.v1',
    WORKFLOW_INSTANCE_CREATED: 'vms.workflow.instance_created.v1',
    WORKFLOW_STAGE_ENTERED: 'vms.workflow.stage_entered.v1',
    APPROVAL_REQUIRED: 'vms.workflow.approval_required.v1',
    APPROVAL_GRANTED: 'vms.workflow.approval_granted.v1',
    APPROVAL_REJECTED: 'vms.workflow.approval_rejected.v1',
    CHANGES_REQUESTED: 'vms.workflow.changes_requested.v1',
    TASK_DELEGATED: 'vms.workflow.task_delegated.v1',
    SLA_WARNING: 'vms.workflow.sla_warning.v1',
    SLA_BREACH: 'vms.workflow.sla_breached.v1',
    WORKFLOW_ESCALATED: 'vms.workflow.escalated.v1',
    WORKFLOW_COMPLETED: 'vms.workflow.instance_completed.v1',
    WORKFLOW_EXCEPTION: 'vms.workflow.exception.v1',
    WORKFLOW_ELIGIBILITY_GRANTED: 'vms.workflow.eligibility_granted.v1',
};
export function createDomainEvent(params) {
    return {
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        eventType: params.eventType,
        eventSource: params.eventSource,
        eventTimestamp: new Date().toISOString(),
        tenantId: params.tenantId,
        organizationId: params.organizationId,
        siteId: params.siteId,
        correlationId: params.correlationId || `corr-${Date.now()}`,
        version: '1.0',
        data: params.data,
        actorId: params.actorId,
        actorRole: params.actorRole,
    };
}
/**
 * In-Memory Event Bus Implementation (Suitable for tests and modular monolith execution)
 */
export class InMemoryEventBus {
    handlers = new Map();
    publishedEvents = [];
    async publish(event) {
        this.publishedEvents.push(event);
        const subscribers = this.handlers.get(event.eventType) || [];
        for (const handler of subscribers) {
            await handler(event);
        }
    }
    subscribe(eventType, handler) {
        const list = this.handlers.get(eventType) || [];
        list.push(handler);
        this.handlers.set(eventType, list);
    }
    clear() {
        this.handlers.clear();
        this.publishedEvents = [];
    }
}
