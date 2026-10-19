import type { DomainEvent, EnterpriseRole } from '@vms/types';
export declare const EVENT_TYPES: {
    readonly VISITOR_CREATED: 'vms.visitor.created.v1';
    readonly VISITOR_UPDATED: 'vms.visitor.updated.v1';
    readonly APPOINTMENT_CREATED: 'vms.appointment.created.v1';
    readonly VISITOR_APPROVED: 'vms.visitor.approved.v1';
    readonly VISITOR_REJECTED: 'vms.visitor.rejected.v1';
    readonly CHECKIN_COMPLETED: 'vms.gate.checkin_completed.v1';
    readonly CHECKOUT_COMPLETED: 'vms.gate.checkout_completed.v1';
    readonly OVERSTAY_DETECTED: 'vms.security.overstay_detected.v1';
    readonly IDENTITY_VERIFIED: 'vms.identity.verified.v1';
    readonly FACE_VERIFIED: 'vms.identity.face_verified.v1';
    readonly DOCUMENT_VERIFIED: 'vms.compliance.doc_verified.v1';
    readonly DOCUMENT_EXPIRED: 'vms.compliance.doc_expired.v1';
    readonly CONTRACTOR_REGISTERED: 'vms.contractor.registered.v1';
    readonly WORKER_VERIFIED: 'vms.contractor.worker_verified.v1';
    readonly TRAINING_COMPLETED: 'vms.safety.training_completed.v1';
    readonly PERMIT_APPROVED: 'vms.safety.permit_approved.v1';
    readonly SERVICE_COMPLETED: 'vms.service.completed.v1';
    readonly MATERIAL_REGISTERED: 'vms.material.registered.v1';
    readonly MATERIAL_APPROVED: 'vms.material.approved.v1';
    readonly GATE_PASS_CREATED: 'vms.gate.pass_created.v1';
    readonly VEHICLE_REGISTERED: 'vms.vehicle.registered.v1';
    readonly VEHICLE_VERIFIED: 'vms.vehicle.verified.v1';
    readonly TRANSPORT_ACTIVITY_CREATED: 'vms.esg.transport_created.v1';
    readonly GHG_ACTIVITY_CREATED: 'vms.esg.activity_created.v1';
    readonly GHG_CALCULATED: 'vms.esg.ghg_calculated.v1';
    readonly EMERGENCY_DECLARED: 'vms.emergency.declared.v1';
    readonly MUSTER_STARTED: 'vms.emergency.muster_started.v1';
    readonly MUSTER_COMPLETED: 'vms.emergency.muster_completed.v1';
    readonly MASTER_RECORD_CREATED: 'vms.master.record_created.v1';
    readonly MASTER_RECORD_UPDATED: 'vms.master.record_updated.v1';
    readonly MASTER_RECORD_STATUS_CHANGED: 'vms.master.record_status_changed.v1';
    readonly WORKFLOW_VERSION_PUBLISHED: 'vms.workflow.version_published.v1';
    readonly WORKFLOW_INSTANCE_CREATED: 'vms.workflow.instance_created.v1';
    readonly WORKFLOW_STAGE_ENTERED: 'vms.workflow.stage_entered.v1';
    readonly APPROVAL_REQUIRED: 'vms.workflow.approval_required.v1';
    readonly APPROVAL_GRANTED: 'vms.workflow.approval_granted.v1';
    readonly APPROVAL_REJECTED: 'vms.workflow.approval_rejected.v1';
    readonly CHANGES_REQUESTED: 'vms.workflow.changes_requested.v1';
    readonly TASK_DELEGATED: 'vms.workflow.task_delegated.v1';
    readonly SLA_WARNING: 'vms.workflow.sla_warning.v1';
    readonly SLA_BREACH: 'vms.workflow.sla_breached.v1';
    readonly WORKFLOW_ESCALATED: 'vms.workflow.escalated.v1';
    readonly WORKFLOW_COMPLETED: 'vms.workflow.instance_completed.v1';
    readonly WORKFLOW_EXCEPTION: 'vms.workflow.exception.v1';
    readonly WORKFLOW_ELIGIBILITY_GRANTED: 'vms.workflow.eligibility_granted.v1';
};
export type EventTypeKey = keyof typeof EVENT_TYPES;
export type EventTypeValue = (typeof EVENT_TYPES)[EventTypeKey];
export declare function createDomainEvent<T>(params: {
    eventType: EventTypeValue;
    eventSource: string;
    tenantId: string;
    organizationId: string;
    siteId: string;
    data: T;
    actorId: string;
    actorRole: EnterpriseRole;
    correlationId?: string;
}): DomainEvent<T>;
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;
export interface IEventBus {
    publish<T>(event: DomainEvent<T>): Promise<void>;
    subscribe<T>(eventType: string, handler: EventHandler<T>): void;
}
/**
 * In-Memory Event Bus Implementation (Suitable for tests and modular monolith execution)
 */
export declare class InMemoryEventBus implements IEventBus {
    private handlers;
    publishedEvents: DomainEvent<any>[];
    publish<T>(event: DomainEvent<T>): Promise<void>;
    subscribe<T>(eventType: string, handler: EventHandler<T>): void;
    clear(): void;
}
