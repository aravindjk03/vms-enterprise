import { describe, it } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { RelationalDatabase, WorkflowRepository, AuditRepository } from '@vms/database';
import { WorkflowEngine } from '../services/workflow/src/engine/workflow-engine.js';
import { CANONICAL_WORKFLOW_TEMPLATES } from '../services/workflow/src/engine/templates.js';
describe('Part 5: WorkflowEngine Core Engine (Sections 8, 9, 10, 11)', () => {
    const db = new RelationalDatabase();
    const workflowRepo = new WorkflowRepository(db);
    const auditRepo = new AuditRepository(db);
    const engine = new WorkflowEngine(workflowRepo, auditRepo);
    const adminUser = {
        userId: 'admin-01',
        tenantId: 'tenant-wf-test',
        organizationId: 'org-01',
        role: 'SUPER_ADMIN',
    };
    const regularUser = {
        userId: 'user-02',
        tenantId: 'tenant-wf-test',
        organizationId: 'org-01',
        role: 'SITE_ADMIN',
    };
    let testDefId;
    it('1. Workflow Definition creation accepts approved domains and rejects unapproved domains', async () => {
        // Valid domain creation
        const def = await engine.createDefinition({
            domain: 'VISITOR',
            code: 'WF_VISITOR_STANDARD',
            name: 'Standard Visitor Approval Workflow',
            description: 'Multi-stage visitor verification pipeline',
        }, adminUser);
        assert.ok(def.definitionId);
        assert.strictEqual(def.code, 'WF_VISITOR_STANDARD');
        assert.strictEqual(def.domain, 'VISITOR');
        assert.strictEqual(def.tenantId, 'tenant-wf-test');
        testDefId = def.definitionId;
        // Verify audit log
        const auditLogs = auditRepo.getAuditHistory('WORKFLOW_DEFINITION', def.definitionId, 'tenant-wf-test');
        assert.strictEqual(auditLogs.length, 1);
        assert.strictEqual(auditLogs[0].action, 'WORKFLOW_DEFINITION_CREATE');
        // Unapproved domain rejection
        await assert.rejects(async () => {
            await engine.createDefinition({
                domain: 'INVALID_DOMAIN',
                code: 'WF_INVALID',
                name: 'Invalid Workflow',
            }, adminUser);
        }, /Invalid workflow domain: 'INVALID_DOMAIN' is not an approved enterprise domain/);
    });
    it('2. Creates a minimal valid draft version v1 with audit log', async () => {
        const draft = await engine.createDraftVersion(testDefId, undefined, adminUser);
        assert.ok(draft.versionId);
        assert.strictEqual(draft.versionNumber, 1);
        assert.strictEqual(draft.status, 'DRAFT');
        assert.strictEqual(draft.immutable, false);
        assert.strictEqual(draft.stages.length, 2); // START & END skeleton
        assert.strictEqual(draft.transitions.length, 1);
        const auditLogs = auditRepo.getAuditHistory('WORKFLOW_VERSION', draft.versionId, 'tenant-wf-test');
        assert.strictEqual(auditLogs.length, 1);
        assert.strictEqual(auditLogs[0].action, 'WORKFLOW_VERSION_DRAFT_CREATE');
    });
    it('3. Updates DRAFT version with custom stages and transitions', async () => {
        const versions = engine.listVersions(testDefId);
        const draft = versions[0];
        const sStart = draft.stages[0].stageId;
        const sAppr = randomUUID();
        const sEnd = draft.stages[1].stageId;
        const newStages = [
            { stageId: sStart, stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
            {
                stageId: sAppr,
                stageCode: 'HOST_APPR',
                stageName: 'Host Approval',
                stageType: 'APPROVAL',
                orderIndex: 1,
                approvalPolicy: 'SINGLE',
                assignmentRules: [{ approverType: 'ROLE', targetRole: 'SITE_ADMIN', allowSelfApproval: false }],
                slaConfig: { slaMinutes: 60, warningMinutes: 45, escalateToManager: true },
            },
            { stageId: sEnd, stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 2 },
        ];
        const newTransitions = [
            { transitionId: randomUUID(), fromStageId: sStart, toStageId: sAppr, trigger: 'SUBMIT' },
            { transitionId: randomUUID(), fromStageId: sAppr, toStageId: sEnd, trigger: 'APPROVE' },
        ];
        const updated = await engine.updateDraftVersion(draft.versionId, newStages, newTransitions, adminUser);
        assert.strictEqual(updated.stages.length, 3);
        assert.strictEqual(updated.transitions.length, 2);
        const auditLogs = auditRepo.getAuditHistory('WORKFLOW_VERSION', draft.versionId, 'tenant-wf-test');
        assert.strictEqual(auditLogs.length, 2);
        assert.strictEqual(auditLogs[1].action, 'WORKFLOW_VERSION_UPDATE');
    });
    it('4. Rejects publishing an invalid workflow version (Static analysis gate)', async () => {
        const draft = await engine.createDraftVersion(testDefId, undefined, adminUser);
        // Make it invalid by removing END stage
        await engine.updateDraftVersion(draft.versionId, [draft.stages[0]], [], adminUser);
        await assert.rejects(async () => {
            await engine.publishVersion(draft.versionId, adminUser);
        }, /Cannot publish invalid workflow version: \[MISSING_END_STAGE\]/);
    });
    it('5. Publishes valid workflow version, sets IMMUTABLE flag, and records outbox event', async () => {
        const versions = engine.listVersions(testDefId);
        const draft = versions.find((v) => v.status === 'DRAFT' && v.stages.length === 3);
        const published = await engine.publishVersion(draft.versionId, adminUser);
        assert.strictEqual(published.status, 'PUBLISHED');
        assert.strictEqual(published.immutable, true);
        assert.strictEqual(published.publishedBy, 'admin-01');
        // Outbox event recorded
        const pendingEvents = workflowRepo.listPendingOutboxEvents('tenant-wf-test');
        const pubEvent = pendingEvents.find((e) => (e.event_type || e.eventType) === 'vms.workflow.version_published.v1');
        assert.ok(pubEvent, 'Missing vms.workflow.version_published.v1 event in outbox');
    });
    it('6. Strict Invariant: Updating a PUBLISHED or IMMUTABLE version throws error', async () => {
        const versions = engine.listVersions(testDefId);
        const published = versions.find((v) => v.status === 'PUBLISHED');
        await assert.rejects(async () => {
            await engine.updateDraftVersion(published.versionId, [], [], adminUser);
        }, /Immutable workflow violation: Published workflow version '.*' is immutable and cannot be modified/);
    });
    it('7. Creating new draft from existing published version clones structure and increments version number', async () => {
        const versions = engine.listVersions(testDefId);
        const published = versions.find((v) => v.status === 'PUBLISHED');
        const draftV2 = await engine.createDraftVersion(testDefId, published.versionId, adminUser);
        assert.strictEqual(draftV2.versionNumber, 3);
        assert.ok(draftV2.versionNumber > published.versionNumber);
        assert.strictEqual(draftV2.status, 'DRAFT');
        assert.strictEqual(draftV2.immutable, false);
        assert.strictEqual(draftV2.stages.length, published.stages.length);
        assert.strictEqual(draftV2.transitions.length, published.transitions.length);
    });
    it('8. Starts workflow instance bound immutably to current published version', async () => {
        const instance = await engine.startInstance({
            definitionId: testDefId,
            sourceTransactionId: 'VIS-TEST-001',
            sourceDomain: 'VISITOR',
            user: regularUser,
        });
        assert.ok(instance.instanceId);
        assert.strictEqual(instance.sourceTransactionId, 'VIS-TEST-001');
        assert.strictEqual(instance.status, 'IN_PROGRESS');
        assert.strictEqual(instance.history.length, 1);
        assert.strictEqual(instance.history[0].action, 'INITIATED');
        const publishedVersion = engine.listVersions(testDefId).find((v) => v.status === 'PUBLISHED');
        assert.strictEqual(instance.versionId, publishedVersion.versionId);
        // Verify outbox event
        const pendingEvents = workflowRepo.listPendingOutboxEvents('tenant-wf-test');
        const instEvent = pendingEvents.find((e) => (e.event_type || e.eventType) === 'vms.workflow.instance_created.v1');
        assert.ok(instEvent);
    });
    it('9. Executes conditional stage transitions and handles condition evaluation', async () => {
        // Create conditional workflow: START -> EVAL -> (VIP -> VIP_APPR | REGULAR -> REG_APPR) -> END
        const condDef = await engine.createDefinition({ domain: 'CUSTOMER', code: 'WF_CONDITIONAL_TEST', name: 'Conditional Workflow' }, adminUser);
        const sStart = randomUUID();
        const sApprVip = randomUUID();
        const sApprReg = randomUUID();
        const sEnd = randomUUID();
        const stages = [
            { stageId: sStart, stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
            {
                stageId: sApprVip,
                stageCode: 'VIP_APPR',
                stageName: 'Executive VIP Approval',
                stageType: 'APPROVAL',
                orderIndex: 1,
                approvalPolicy: 'SINGLE',
                assignmentRules: [{ approverType: 'ROLE', targetRole: 'SUPER_ADMIN' }],
            },
            {
                stageId: sApprReg,
                stageCode: 'REG_APPR',
                stageName: 'Standard Operations Approval',
                stageType: 'APPROVAL',
                orderIndex: 2,
                approvalPolicy: 'SINGLE',
                assignmentRules: [{ approverType: 'ROLE', targetRole: 'SITE_ADMIN' }],
            },
            { stageId: sEnd, stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 3 },
        ];
        const transitions = [
            {
                transitionId: randomUUID(),
                fromStageId: sStart,
                toStageId: sApprVip,
                trigger: 'EVALUATE',
                conditions: [{ field: 'tier', operator: 'EQUALS', value: 'VIP' }],
            },
            {
                transitionId: randomUUID(),
                fromStageId: sStart,
                toStageId: sApprReg,
                trigger: 'EVALUATE',
                conditions: [{ field: 'tier', operator: 'EQUALS', value: 'REGULAR' }],
            },
            { transitionId: randomUUID(), fromStageId: sApprVip, toStageId: sEnd, trigger: 'APPROVE' },
            { transitionId: randomUUID(), fromStageId: sApprReg, toStageId: sEnd, trigger: 'APPROVE' },
        ];
        const draft = await engine.createDraftVersion(condDef.definitionId, undefined, adminUser);
        await engine.updateDraftVersion(draft.versionId, stages, transitions, adminUser);
        await engine.publishVersion(draft.versionId, adminUser);
        // Instance 1: VIP context
        const instVip = await engine.startInstance({
            definitionId: condDef.definitionId,
            sourceTransactionId: 'CUST-VIP-01',
            sourceDomain: 'CUSTOMER',
            user: adminUser,
        });
        const resVip = await engine.transitionInstance({
            instanceId: instVip.instanceId,
            trigger: 'EVALUATE',
            contextData: { tier: 'VIP' },
            actorUser: adminUser,
            remarks: 'Automated routing based on VIP tier',
        });
        assert.strictEqual(resVip.nextStage.stageCode, 'VIP_APPR');
        assert.strictEqual(resVip.isCompleted, false);
        // Instance 2: Regular context
        const instReg = await engine.startInstance({
            definitionId: condDef.definitionId,
            sourceTransactionId: 'CUST-REG-01',
            sourceDomain: 'CUSTOMER',
            user: adminUser,
        });
        const resReg = await engine.transitionInstance({
            instanceId: instReg.instanceId,
            trigger: 'EVALUATE',
            contextData: { tier: 'REGULAR' },
            actorUser: adminUser,
        });
        assert.strictEqual(resReg.nextStage.stageCode, 'REG_APPR');
        // Complete Instance 1 to END stage
        const resFinal = await engine.transitionInstance({
            instanceId: instVip.instanceId,
            trigger: 'APPROVE',
            actorUser: adminUser,
        });
        assert.strictEqual(resFinal.isCompleted, true);
        assert.strictEqual(resFinal.instance.status, 'COMPLETED');
    });
    it('10. Blocks transition from terminal state (COMPLETED / REJECTED)', async () => {
        const completedInstances = workflowRepo.listInstances('CUSTOMER', 'tenant-wf-test')
            .filter((i) => i.status === 'COMPLETED');
        const compInst = completedInstances[0];
        assert.ok(compInst);
        await assert.rejects(async () => {
            await engine.transitionInstance({
                instanceId: compInst.instanceId,
                trigger: 'APPROVE',
                actorUser: adminUser,
            });
        }, /Cannot transition workflow instance in terminal state 'COMPLETED'/);
    });
    it('11. Initializes all 5 canonical domain templates for new tenant', async () => {
        const newTenant = 'tenant-template-init';
        const initUser = {
            userId: 'admin-init',
            tenantId: newTenant,
            organizationId: 'org-init',
            role: 'SUPER_ADMIN',
        };
        await engine.initializeTenantTemplates(newTenant, initUser);
        for (const tpl of CANONICAL_WORKFLOW_TEMPLATES) {
            const defs = engine.listDefinitions(tpl.domain, newTenant);
            const found = defs.find((d) => d.code === tpl.code);
            assert.ok(found, `Expected template definition '${tpl.code}' for domain '${tpl.domain}' to be initialized`);
            const versions = engine.listVersions(found.definitionId);
            assert.strictEqual(versions.length, 1);
            assert.strictEqual(versions[0].status, 'PUBLISHED');
            assert.strictEqual(versions[0].immutable, true);
        }
    });
    it('12. Conditional transitions take strict precedence over unconditional fallbacks regardless of array order, and support advanced operators & dot-paths', async () => {
        const def = await engine.createDefinition({ domain: 'VISITOR', code: 'WF_PRECEDENCE_TEST', name: 'Precedence Test Workflow' }, adminUser);
        const sStart = randomUUID();
        const sBranch = randomUUID();
        const sVipEnd = randomUUID();
        const sDefaultEnd = randomUUID();
        const stages = [
            { stageId: sStart, stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
            { stageId: sBranch, stageCode: 'DECISION', stageName: 'Decision Stage', stageType: 'DATA_VALIDATION', orderIndex: 1 },
            { stageId: sVipEnd, stageCode: 'VIP_END', stageName: 'VIP End', stageType: 'END', orderIndex: 2 },
            { stageId: sDefaultEnd, stageCode: 'DEFAULT_END', stageName: 'Default End', stageType: 'END', orderIndex: 3 },
        ];
        // NOTE: Unconditional transition is listed FIRST in the array!
        const transitions = [
            { transitionId: randomUUID(), fromStageId: sStart, toStageId: sBranch, trigger: 'INIT' },
            {
                transitionId: randomUUID(),
                fromStageId: sBranch,
                toStageId: sDefaultEnd,
                trigger: 'EVALUATE', // UNCONDITIONAL DEFAULT (listed first)
            },
            {
                transitionId: randomUUID(),
                fromStageId: sBranch,
                toStageId: sVipEnd,
                trigger: 'EVALUATE', // CONDITIONAL MATCH (listed second)
                conditions: [
                    { field: 'visitor.tier', operator: 'IN', value: ['PLATINUM', 'DIAMOND'] },
                    { field: 'cargo.hazmat', operator: 'EQUALS', value: false, logicGroup: 'AND' },
                ],
            },
        ];
        const draft = await engine.createDraftVersion(def.definitionId, undefined, adminUser);
        await engine.updateDraftVersion(draft.versionId, stages, transitions, adminUser);
        await engine.publishVersion(draft.versionId, adminUser);
        // Case A: Matching context data takes the conditional VIP path even though unconditional was listed first
        const instVip = await engine.startInstance({
            definitionId: def.definitionId,
            sourceTransactionId: 'VIS-PREC-VIP',
            sourceDomain: 'VISITOR',
            user: adminUser,
        });
        await engine.transitionInstance({ instanceId: instVip.instanceId, trigger: 'INIT', actorUser: adminUser });
        const resVip = await engine.transitionInstance({
            instanceId: instVip.instanceId,
            trigger: 'EVALUATE',
            contextData: { visitor: { tier: 'PLATINUM' }, cargo: { hazmat: false } },
            actorUser: adminUser,
        });
        assert.strictEqual(resVip.nextStage.stageId, sVipEnd, 'Should route to VIP_END via conditional match');
        // Case B: Non-matching context data falls back to the unconditional default transition
        const instDefault = await engine.startInstance({
            definitionId: def.definitionId,
            sourceTransactionId: 'VIS-PREC-STD',
            sourceDomain: 'VISITOR',
            user: adminUser,
        });
        await engine.transitionInstance({ instanceId: instDefault.instanceId, trigger: 'INIT', actorUser: adminUser });
        const resDefault = await engine.transitionInstance({
            instanceId: instDefault.instanceId,
            trigger: 'EVALUATE',
            contextData: { visitor: { tier: 'STANDARD' }, cargo: { hazmat: false } },
            actorUser: adminUser,
        });
        assert.strictEqual(resDefault.nextStage.stageId, sDefaultEnd, 'Should route to DEFAULT_END via unconditional fallback');
    });
});
