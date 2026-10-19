import type { WorkflowDefinition, WorkflowVersion, WorkflowInstance, WorkflowDomain, WorkflowStage, WorkflowTransition, WorkflowValidationResult, UserContext } from '@vms/types';
import { WorkflowRepository, AuditRepository } from '@vms/database';
export interface CreateDefinitionInput {
    domain: WorkflowDomain;
    code: string;
    name: string;
    description?: string;
    siteId?: string;
}
export declare class WorkflowEngine {
    private workflowRepo;
    private auditRepo;
    private validator;
    constructor(workflowRepo: WorkflowRepository, auditRepo: AuditRepository);
    /**
     * Initializes default canonical templates for a tenant if not present.
     */
    initializeTenantTemplates(tenantId: string, user: UserContext): Promise<void>;
    /**
     * Creates a new workflow definition header (Section 8).
     */
    createDefinition(input: CreateDefinitionInput, user: UserContext): Promise<WorkflowDefinition>;
    getDefinition(definitionId: string, tenantId: string): WorkflowDefinition | null;
    listDefinitions(domain?: WorkflowDomain, tenantId?: string): WorkflowDefinition[];
    /**
     * Creates a new DRAFT workflow version (Section 9).
     */
    createDraftVersion(definitionId: string, fromVersionId?: string, user?: UserContext): Promise<WorkflowVersion>;
    /**
     * Updates an existing DRAFT workflow version.
     * STRICT INVARIANT: If version is already PUBLISHED or IMMUTABLE, modifications are strictly rejected!
     */
    updateDraftVersion(versionId: string, stages: WorkflowStage[], transitions: WorkflowTransition[], user: UserContext): Promise<WorkflowVersion>;
    /**
     * Validates a workflow version using the static analysis validator (Section 14).
     */
    validateVersion(versionId: string): WorkflowValidationResult;
    /**
     * Publishes a workflow version (Section 9, 14).
     * Checks validation first, marks as immutable, and records audit trail.
     */
    publishVersion(versionId: string, user: UserContext): Promise<WorkflowVersion>;
    getVersion(versionId: string): WorkflowVersion | null;
    listVersions(definitionId: string): WorkflowVersion[];
    /**
     * Starts a new workflow instance for an operational transaction.
     * Enforces version retention: the instance retains its start version immutable across lifecycle.
     */
    startInstance(params: {
        definitionId: string;
        sourceTransactionId: string;
        sourceDomain: WorkflowDomain;
        user: UserContext;
    }): Promise<WorkflowInstance>;
    getInstance(instanceId: string, tenantId: string): WorkflowInstance | null;
    /**
     * Advances a workflow instance based on a trigger and context data.
     */
    transitionInstance(params: {
        instanceId: string;
        trigger: string;
        contextData?: Record<string, unknown>;
        actorUser: UserContext;
        remarks?: string;
    }): Promise<{
        instance: WorkflowInstance;
        nextStage: WorkflowStage;
        isCompleted: boolean;
        isRejected: boolean;
    }>;
}
