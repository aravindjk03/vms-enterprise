import { randomUUID } from 'node:crypto';
import { WorkflowValidator } from './workflow-validator.js';
import { CANONICAL_WORKFLOW_TEMPLATES } from './templates.js';
import { resolvePropertyPath } from '../rules/rule-evaluator.js';
export class WorkflowEngine {
    workflowRepo;
    auditRepo;
    validator = new WorkflowValidator();
    constructor(workflowRepo, auditRepo) {
        this.workflowRepo = workflowRepo;
        this.auditRepo = auditRepo;
    }
    /**
     * Initializes default canonical templates for a tenant if not present.
     */
    async initializeTenantTemplates(tenantId, user) {
        for (const tpl of CANONICAL_WORKFLOW_TEMPLATES) {
            const existing = this.workflowRepo.listDefinitions(tpl.domain, tenantId).find(d => d.code === tpl.code);
            if (!existing) {
                const def = await this.createDefinition({
                    domain: tpl.domain,
                    code: tpl.code,
                    name: tpl.name,
                    description: tpl.description,
                }, user);
                const version = await this.createDraftVersion(def.definitionId, undefined, user);
                await this.updateDraftVersion(version.versionId, tpl.stages, tpl.transitions, user);
                await this.publishVersion(version.versionId, user);
            }
        }
    }
    /**
     * Creates a new workflow definition header (Section 8).
     */
    async createDefinition(input, user) {
        // Only approved domains are allowed
        const validDomains = [
            'VISITOR', 'CUSTOMER', 'CONTRACTOR', 'SERVICE', 'MATERIAL', 'VEHICLE', 'DOCUMENT', 'SAFETY', 'OTHER_APPROVED_DOMAIN'
        ];
        if (!validDomains.includes(input.domain)) {
            throw new Error(`Invalid workflow domain: '${input.domain}' is not an approved enterprise domain.`);
        }
        const definitionId = randomUUID();
        const now = new Date();
        const def = {
            definitionId,
            tenantId: user.tenantId,
            siteId: input.siteId || user.siteId,
            domain: input.domain,
            code: input.code.trim().toUpperCase(),
            name: input.name.trim(),
            description: input.description || '',
            isCurrent: true,
            ownerId: user.userId,
            createdAt: now,
            updatedAt: now,
        };
        const created = this.workflowRepo.createDefinition(def, user.tenantId);
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'WORKFLOW_DEFINITION_CREATE',
            entity_type: 'WORKFLOW_DEFINITION',
            entity_id: definitionId,
            timestamp: now,
            request_id: randomUUID(),
            correlation_id: `wf-def-${definitionId}`,
            source: 'WorkflowEngine',
            after_snapshot: { domain: input.domain, code: def.code, name: def.name },
        }, user.tenantId);
        return created;
    }
    getDefinition(definitionId, tenantId) {
        return this.workflowRepo.getDefinition(definitionId, tenantId);
    }
    listDefinitions(domain, tenantId) {
        return this.workflowRepo.listDefinitions(domain, tenantId);
    }
    /**
     * Creates a new DRAFT workflow version (Section 9).
     */
    async createDraftVersion(definitionId, fromVersionId, user) {
        const existingVersions = this.workflowRepo.listVersions(definitionId);
        const nextVerNumber = existingVersions.length > 0
            ? Math.max(...existingVersions.map((v) => v.version_number || v.versionNumber || 1)) + 1
            : 1;
        let initialStages = [];
        let initialTransitions = [];
        if (fromVersionId) {
            const source = this.workflowRepo.getVersion(fromVersionId);
            if (source) {
                initialStages = JSON.parse(JSON.stringify(source.stages || []));
                initialTransitions = JSON.parse(JSON.stringify(source.transitions || []));
            }
        }
        else {
            // Default minimal valid skeleton
            const startId = randomUUID();
            const endId = randomUUID();
            initialStages = [
                { stageId: startId, stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
                { stageId: endId, stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 1 },
            ];
            initialTransitions = [
                { transitionId: randomUUID(), fromStageId: startId, toStageId: endId, trigger: 'INITIATE' },
            ];
        }
        const versionId = randomUUID();
        const now = new Date();
        const version = {
            versionId,
            definitionId,
            versionNumber: nextVerNumber,
            status: 'DRAFT',
            effectiveFrom: now,
            stages: initialStages,
            transitions: initialTransitions,
            immutable: false,
            createdAt: now,
            updatedAt: now,
        };
        const created = this.workflowRepo.createVersion(version);
        if (user) {
            this.auditRepo.logAudit({
                audit_id: randomUUID(),
                tenant_id: user.tenantId,
                actor_id: user.userId,
                actor_role: user.role,
                action: 'WORKFLOW_VERSION_DRAFT_CREATE',
                entity_type: 'WORKFLOW_VERSION',
                entity_id: versionId,
                timestamp: now,
                request_id: randomUUID(),
                correlation_id: `wf-ver-${versionId}`,
                source: 'WorkflowEngine',
                after_snapshot: { definitionId, versionNumber: nextVerNumber },
            }, user.tenantId);
        }
        return created;
    }
    /**
     * Updates an existing DRAFT workflow version.
     * STRICT INVARIANT: If version is already PUBLISHED or IMMUTABLE, modifications are strictly rejected!
     */
    async updateDraftVersion(versionId, stages, transitions, user) {
        const version = this.workflowRepo.getVersion(versionId);
        if (!version) {
            throw new Error(`Workflow version '${versionId}' does not exist.`);
        }
        // IMMUTABILITY CHECK (Section 9)
        if (version.immutable || version.status === 'PUBLISHED') {
            throw new Error(`Immutable workflow violation: Published workflow version '${version.versionNumber}' is immutable and cannot be modified. Create a new draft version to make changes.`);
        }
        version.stages = stages;
        version.transitions = transitions;
        version.updatedAt = new Date();
        // In-memory db update
        this.workflowRepo.db.update('workflow_versions', versionId, {
            stages,
            transitions,
            updated_at: new Date(),
        });
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'WORKFLOW_VERSION_UPDATE',
            entity_type: 'WORKFLOW_VERSION',
            entity_id: versionId,
            timestamp: new Date(),
            request_id: randomUUID(),
            correlation_id: `wf-upd-${versionId}`,
            source: 'WorkflowEngine',
            after_snapshot: { stageCount: stages.length, transitionCount: transitions.length },
        }, user.tenantId);
        return version;
    }
    /**
     * Validates a workflow version using the static analysis validator (Section 14).
     */
    validateVersion(versionId) {
        const version = this.workflowRepo.getVersion(versionId);
        if (!version) {
            throw new Error(`Workflow version '${versionId}' not found.`);
        }
        return this.validator.validate(version);
    }
    /**
     * Publishes a workflow version (Section 9, 14).
     * Checks validation first, marks as immutable, and records audit trail.
     */
    async publishVersion(versionId, user) {
        const version = this.workflowRepo.getVersion(versionId);
        if (!version) {
            throw new Error(`Workflow version '${versionId}' not found.`);
        }
        if (version.status === 'PUBLISHED') {
            return version; // Already published
        }
        // 1. Static Validation
        const validation = this.validator.validate(version);
        if (!validation.isValid) {
            const errorMsgs = validation.diagnostics.map(d => `[${d.code}] ${d.message}`).join('; ');
            throw new Error(`Cannot publish invalid workflow version: ${errorMsgs}`);
        }
        const now = new Date();
        // 2. Mark previous published versions as RETIRED/archived
        const allVersions = this.workflowRepo.listVersions(version.definitionId);
        for (const v of allVersions) {
            if (v.versionId !== versionId && v.status === 'PUBLISHED') {
                this.workflowRepo.db.update('workflow_versions', v.versionId, {
                    status: 'RETIRED',
                    effective_to: now,
                    is_current: false,
                });
            }
        }
        // 3. Mark target version as PUBLISHED & IMMUTABLE
        version.status = 'PUBLISHED';
        version.immutable = true;
        version.publishedBy = user.userId;
        version.publishedAt = now;
        version.updatedAt = now;
        this.workflowRepo.db.update('workflow_versions', versionId, {
            status: 'PUBLISHED',
            immutable: true,
            published_by: user.userId,
            published_at: now,
            is_current: true,
            updated_at: now,
        });
        // 4. Emit outbox event
        this.workflowRepo.recordOutboxEvent({
            outbox_id: randomUUID(),
            tenant_id: user.tenantId,
            event_type: 'vms.workflow.version_published.v1',
            payload: {
                definitionId: version.definitionId,
                versionId: version.versionId,
                versionNumber: version.versionNumber,
                publishedBy: user.userId,
                publishedAt: now.toISOString(),
            },
            status: 'PENDING',
            retry_count: 0,
        }, user.tenantId);
        // 5. Tamper-evident Audit log
        this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: user.tenantId,
            actor_id: user.userId,
            actor_role: user.role,
            action: 'WORKFLOW_VERSION_PUBLISH',
            entity_type: 'WORKFLOW_VERSION',
            entity_id: versionId,
            timestamp: now,
            request_id: randomUUID(),
            correlation_id: `wf-pub-${versionId}`,
            source: 'WorkflowEngine',
            after_snapshot: { versionNumber: version.versionNumber, definitionId: version.definitionId },
        }, user.tenantId);
        return version;
    }
    getVersion(versionId) {
        return this.workflowRepo.getVersion(versionId);
    }
    listVersions(definitionId) {
        return this.workflowRepo.listVersions(definitionId);
    }
    /**
     * Starts a new workflow instance for an operational transaction.
     * Enforces version retention: the instance retains its start version immutable across lifecycle.
     */
    async startInstance(params) {
        const def = this.workflowRepo.getDefinition(params.definitionId, params.user.tenantId);
        if (!def) {
            throw new Error(`Workflow definition '${params.definitionId}' not found.`);
        }
        // Find current published version
        const versions = this.workflowRepo.listVersions(params.definitionId);
        const published = versions.find((v) => v.status === 'PUBLISHED') || versions[0];
        if (!published) {
            throw new Error(`No published version found for workflow definition '${params.definitionId}'.`);
        }
        const startStage = (published.stages || []).find((s) => s.stageType === 'START');
        if (!startStage) {
            throw new Error('Workflow definition lacks a START stage.');
        }
        const instanceId = randomUUID();
        const now = new Date();
        const instance = {
            instanceId,
            tenantId: params.user.tenantId,
            definitionId: params.definitionId,
            versionId: published.versionId,
            sourceDomain: params.sourceDomain,
            sourceTransactionId: params.sourceTransactionId,
            currentStageId: startStage.stageId,
            status: 'IN_PROGRESS',
            startedAt: now,
            history: [
                {
                    stageId: startStage.stageId,
                    stageName: startStage.stageName,
                    enteredAt: now,
                    action: 'INITIATED',
                    actorId: params.user.userId,
                },
            ],
            createdAt: now,
            updatedAt: now,
        };
        const created = this.workflowRepo.createInstance(instance, params.user.tenantId);
        // Emit outbox event
        this.workflowRepo.recordOutboxEvent({
            outbox_id: randomUUID(),
            tenant_id: params.user.tenantId,
            event_type: 'vms.workflow.instance_created.v1',
            payload: {
                instanceId,
                sourceTransactionId: params.sourceTransactionId,
                sourceDomain: params.sourceDomain,
                versionId: published.versionId,
            },
            status: 'PENDING',
            retry_count: 0,
        }, params.user.tenantId);
        return created;
    }
    getInstance(instanceId, tenantId) {
        return this.workflowRepo.getInstance(instanceId, tenantId);
    }
    /**
     * Advances a workflow instance based on a trigger and context data.
     */
    async transitionInstance(params) {
        const inst = this.workflowRepo.getInstance(params.instanceId, params.actorUser.tenantId);
        if (!inst) {
            throw new Error(`Workflow instance '${params.instanceId}' not found.`);
        }
        if (inst.status === 'COMPLETED' || inst.status === 'REJECTED' || inst.status === 'CANCELLED') {
            throw new Error(`Cannot transition workflow instance in terminal state '${inst.status}'.`);
        }
        const version = this.workflowRepo.getVersion(inst.versionId);
        if (!version) {
            throw new Error(`Workflow version '${inst.versionId}' associated with instance '${params.instanceId}' not found.`);
        }
        // Find outgoing transitions from currentStageId matching trigger
        const outgoing = (version.transitions || []).filter((t) => t.fromStageId === inst.currentStageId && t.trigger.toUpperCase() === params.trigger.toUpperCase());
        if (outgoing.length === 0) {
            throw new Error(`Invalid transition: Trigger '${params.trigger}' not permitted from current stage.`);
        }
        // Evaluate conditions: conditional transitions take strict precedence over unconditional fallbacks
        const conditional = outgoing.filter((t) => t.conditions && t.conditions.length > 0);
        const unconditional = outgoing.filter((t) => !t.conditions || t.conditions.length === 0);
        let matchedTransition = null;
        const evaluateCond = (cond) => {
            const val = params.contextData ? resolvePropertyPath(params.contextData, cond.field) : undefined;
            switch (cond.operator) {
                case 'EQUALS':
                    return val === cond.value || String(val).toLowerCase() === String(cond.value).toLowerCase();
                case 'NOT_EQUALS':
                    return val !== cond.value && String(val).toLowerCase() !== String(cond.value).toLowerCase();
                case 'GREATER_THAN':
                    return Number(val) > Number(cond.value);
                case 'LESS_THAN':
                    return Number(val) < Number(cond.value);
                case 'CONTAINS':
                    return Array.isArray(val)
                        ? val.includes(cond.value)
                        : String(val).toLowerCase().includes(String(cond.value).toLowerCase());
                case 'IN':
                    return Array.isArray(cond.value) && cond.value.includes(val);
                case 'NOT_IN':
                    return Array.isArray(cond.value) && !cond.value.includes(val);
                case 'EXISTS':
                    return val !== undefined && val !== null && val !== '';
                case 'IS_VALID':
                    return val === true || val === 'VALID' || val === 'ACTIVE';
                case 'IS_EXPIRED':
                    if (val instanceof Date)
                        return val.getTime() < Date.now();
                    if (typeof val === 'string')
                        return new Date(val).getTime() < Date.now();
                    return false;
                default:
                    return false;
            }
        };
        // 1. Check conditional transitions first
        for (const t of conditional) {
            let isMatch = true;
            for (let i = 0; i < (t.conditions || []).length; i++) {
                const cond = t.conditions[i];
                const res = evaluateCond(cond);
                if (i === 0) {
                    isMatch = res;
                }
                else {
                    if (cond.logicGroup === 'OR') {
                        isMatch = isMatch || res;
                    }
                    else {
                        isMatch = isMatch && res;
                    }
                }
            }
            if (isMatch) {
                matchedTransition = t;
                break;
            }
        }
        // 2. Fall back to unconditional transition if no conditional matched
        if (!matchedTransition) {
            if (unconditional.length > 0) {
                matchedTransition = unconditional[0];
            }
            else {
                throw new Error(`Condition mismatch: No valid transition path found for context data.`);
            }
        }
        const nextStage = (version.stages || []).find((s) => s.stageId === matchedTransition.toStageId);
        if (!nextStage) {
            throw new Error(`Target stage '${matchedTransition.toStageId}' not found.`);
        }
        const now = new Date();
        const isCompleted = nextStage.stageType === 'END' && nextStage.stageCode !== 'REJECTED_END' && !nextStage.stageCode.includes('REJECT');
        const isRejected = nextStage.stageType === 'END' && (nextStage.stageCode === 'REJECTED_END' || nextStage.stageCode.includes('REJECT') || params.trigger.toUpperCase() === 'REJECT');
        inst.currentStageId = nextStage.stageId;
        if (isCompleted) {
            inst.status = 'COMPLETED';
            inst.completedAt = now;
        }
        else if (isRejected) {
            inst.status = 'REJECTED';
            inst.completedAt = now;
        }
        inst.history.push({
            stageId: nextStage.stageId,
            stageName: nextStage.stageName,
            enteredAt: now,
            action: params.trigger,
            actorId: params.actorUser.userId,
            remarks: params.remarks,
        });
        inst.updatedAt = now;
        // Update in database
        this.workflowRepo.updateInstance(inst.instanceId, {
            current_stage_id: nextStage.stageId,
            status: inst.status,
            completed_at: inst.completedAt,
            history: inst.history,
        }, params.actorUser.tenantId);
        // Emit Outbox event
        this.workflowRepo.recordOutboxEvent({
            outbox_id: randomUUID(),
            tenant_id: params.actorUser.tenantId,
            event_type: isCompleted
                ? 'vms.workflow.eligibility_granted.v1'
                : isRejected
                    ? 'vms.workflow.approval_rejected.v1'
                    : 'vms.workflow.stage_entered.v1',
            payload: {
                instanceId: inst.instanceId,
                stageId: nextStage.stageId,
                stageName: nextStage.stageName,
                sourceTransactionId: inst.sourceTransactionId,
                sourceDomain: inst.sourceDomain,
                status: inst.status,
            },
            status: 'PENDING',
            retry_count: 0,
        }, params.actorUser.tenantId);
        return {
            instance: inst,
            nextStage,
            isCompleted,
            isRejected,
        };
    }
}
