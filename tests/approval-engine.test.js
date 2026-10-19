import { describe, it } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { RelationalDatabase, WorkflowRepository, ApprovalRepository, AuditRepository, } from '@vms/database';
import { WorkflowEngine } from '../services/workflow/src/engine/workflow-engine.js';
import { DelegationManager } from '../services/workflow/src/approval/delegation-manager.js';
import { ApprovalEngine } from '../services/workflow/src/approval/approval-engine.js';
describe('Part 5: ApprovalEngine & Multi-Approver Matrix (Sections 15-20)', () => {
    const db = new RelationalDatabase();
    const workflowRepo = new WorkflowRepository(db);
    const approvalRepo = new ApprovalRepository(db);
    const auditRepo = new AuditRepository(db);
    const delegationManager = new DelegationManager(approvalRepo, auditRepo);
    const workflowEngine = new WorkflowEngine(workflowRepo, auditRepo);
    const approvalEngine = new ApprovalEngine(workflowRepo, approvalRepo, auditRepo, delegationManager, workflowEngine);
    const superAdmin = {
        userId: 'admin-01',
        tenantId: 'tenant-appr-test',
        organizationId: 'org-01',
        role: 'SUPER_ADMIN',
    };
    const securityManager = {
        userId: 'sec-mgr-01',
        tenantId: 'tenant-appr-test',
        organizationId: 'org-01',
        role: 'SECURITY_MANAGER',
    };
    const siteAdmin = {
        userId: 'site-adm-01',
        tenantId: 'tenant-appr-test',
        organizationId: 'org-01',
        role: 'SITE_ADMIN',
    };
    const requesterUser = {
        userId: 'requester-01',
        tenantId: 'tenant-appr-test',
        organizationId: 'org-01',
        role: 'HOST',
    };
    // Helper to setup a live workflow definition & instance
    async function setupWorkflow(policy, rules, quorumRequired) {
        const def = await workflowEngine.createDefinition({ domain: 'VISITOR', code: `WF_APPR_${policy}_${Date.now()}`, name: `Workflow ${policy}` }, superAdmin);
        const sStart = randomUUID();
        const sAppr = randomUUID();
        const sEnd = randomUUID();
        const sReject = randomUUID();
        const stages = [
            { stageId: sStart, stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
            {
                stageId: sAppr,
                stageCode: 'APPROVAL',
                stageName: 'Approval Stage',
                stageType: 'APPROVAL',
                orderIndex: 1,
                approvalPolicy: policy,
                assignmentRules: rules,
                quorumRequired,
                slaConfig: { slaMinutes: 60, warningMinutes: 45 },
            },
            { stageId: sEnd, stageCode: 'END', stageName: 'Approved End', stageType: 'END', orderIndex: 2 },
            { stageId: sReject, stageCode: 'REJECTED_END', stageName: 'Rejected End', stageType: 'END', orderIndex: 3 },
        ];
        const transitions = [
            { transitionId: randomUUID(), fromStageId: sStart, toStageId: sAppr, trigger: 'INITIATE' },
            { transitionId: randomUUID(), fromStageId: sAppr, toStageId: sEnd, trigger: 'APPROVE' },
            { transitionId: randomUUID(), fromStageId: sAppr, toStageId: sReject, trigger: 'REJECT' },
        ];
        const draft = await workflowEngine.createDraftVersion(def.definitionId, undefined, superAdmin);
        await workflowEngine.updateDraftVersion(draft.versionId, stages, transitions, superAdmin);
        await workflowEngine.publishVersion(draft.versionId, superAdmin);
        const instance = await workflowEngine.startInstance({
            definitionId: def.definitionId,
            sourceTransactionId: `TXN-${randomUUID().substring(0, 8)}`,
            sourceDomain: 'VISITOR',
            user: requesterUser,
        });
        // Advance from START to APPROVAL
        await workflowEngine.transitionInstance({
            instanceId: instance.instanceId,
            trigger: 'INITIATE',
            actorUser: requesterUser,
        });
        const apprStage = stages[1];
        return { def, instance, apprStage };
    }
    it('1. Initializes tasks for APPROVAL stage with correct approver assignments', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'ROLE', targetRole: 'SECURITY_MANAGER', allowSelfApproval: false },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            requesterUserId: requesterUser.userId,
            user: superAdmin,
        });
        assert.strictEqual(tasks.length, 1);
        assert.strictEqual(tasks[0].status, 'PENDING');
        assert.strictEqual(tasks[0].assignedToRole, 'SECURITY_MANAGER');
        assert.ok(tasks[0].slaDueAt);
        assert.ok(tasks[0].slaWarningAt);
        // Verify outbox event emitted
        const pending = workflowRepo.listPendingOutboxEvents('tenant-appr-test');
        assert.ok(pending.some((e) => (e.event_type || e.eventType) === 'vms.workflow.approval_required.v1'));
    });
    it('2. Flags CONFIGURATION_EXCEPTION when approver target cannot be resolved', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'HOST_SPONSOR' }, // No hostUserId passed!
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            hostUserId: undefined, // Unresolvable
            user: superAdmin,
        });
        assert.strictEqual(tasks.length, 1);
        assert.strictEqual(tasks[0].status, 'CONFIGURATION_EXCEPTION');
        const pending = workflowRepo.listPendingOutboxEvents('tenant-appr-test');
        assert.ok(pending.some((e) => (e.event_type || e.eventType) === 'vms.workflow.exception.v1'));
    });
    it('3. Enforces Segregation of Duties: blocks requester from self-approving when allowSelfApproval is false', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'NAMED_USER', targetUserId: requesterUser.userId, allowSelfApproval: false },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            requesterUserId: requesterUser.userId,
            user: superAdmin,
        });
        await assert.rejects(async () => {
            await approvalEngine.submitDecision({
                taskId: tasks[0].taskId,
                decision: 'APPROVED',
                remarks: 'Approving my own request',
                requesterUserId: requesterUser.userId,
            }, requesterUser // Requester attempting to approve!
            );
        }, /Segregation of Duties Violation: User 'requester-01' submitted this request and is prohibited from self-approving it/);
    });
    it('4. Allows self-approval when explicitly permitted in stage assignment rules', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'NAMED_USER', targetUserId: requesterUser.userId, allowSelfApproval: true },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            requesterUserId: requesterUser.userId,
            user: superAdmin,
        });
        const result = await approvalEngine.submitDecision({
            taskId: tasks[0].taskId,
            decision: 'APPROVED',
            remarks: 'Authorized self-approval',
            requesterUserId: requesterUser.userId,
        }, requesterUser);
        assert.strictEqual(result.task.status, 'APPROVED');
        assert.strictEqual(result.isStageSatisfied, true);
    });
    it('5. Mandatory rejection reason requirement: throws error if REJECT lacks remarks', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'ROLE', targetRole: 'SECURITY_MANAGER' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        await assert.rejects(async () => {
            await approvalEngine.submitDecision({
                taskId: tasks[0].taskId,
                decision: 'REJECTED',
                remarks: '   ', // Empty!
            }, securityManager);
        }, /Mandatory rejection requirement: A documented rejection reason is required/);
        // With remarks, rejection advances workflow to REJECTED terminal state
        const result = await approvalEngine.submitDecision({
            taskId: tasks[0].taskId,
            decision: 'REJECTED',
            remarks: 'Blacklisted company visitor without security clearance',
        }, securityManager);
        assert.strictEqual(result.task.status, 'REJECTED');
        const updatedInst = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(updatedInst?.status, 'REJECTED');
    });
    it('6. Policy: SINGLE approver completes and satisfies stage on single APPROVE', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'ROLE', targetRole: 'SECURITY_MANAGER' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        const result = await approvalEngine.submitDecision({
            taskId: tasks[0].taskId,
            decision: 'APPROVED',
            remarks: 'Identity verified',
        }, securityManager);
        assert.strictEqual(result.isStageSatisfied, true);
        const updatedInst = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(updatedInst?.status, 'COMPLETED');
    });
    it('7. Policy: PARALLEL_ALL_REQUIRED requires all approvers before stage is satisfied', async () => {
        const { instance, apprStage } = await setupWorkflow('PARALLEL_ALL_REQUIRED', [
            { approverType: 'NAMED_USER', targetUserId: 'sec-mgr-01' },
            { approverType: 'NAMED_USER', targetUserId: 'site-adm-01' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        assert.strictEqual(tasks.length, 2);
        // Approver 1 approves
        const res1 = await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED', remarks: 'First pass approved' }, securityManager);
        assert.strictEqual(res1.isStageSatisfied, false); // Stage NOT satisfied yet!
        let instAfter1 = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(instAfter1?.status, 'IN_PROGRESS');
        // Approver 2 approves
        const res2 = await approvalEngine.submitDecision({ taskId: tasks[1].taskId, decision: 'APPROVED', remarks: 'Second pass approved' }, siteAdmin);
        assert.strictEqual(res2.isStageSatisfied, true); // Now satisfied!
        let instAfter2 = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(instAfter2?.status, 'COMPLETED');
    });
    it('8. Policy: PARALLEL_ANY_ONE satisfies stage when first approver approves', async () => {
        const { instance, apprStage } = await setupWorkflow('PARALLEL_ANY_ONE', [
            { approverType: 'NAMED_USER', targetUserId: 'sec-mgr-01' },
            { approverType: 'NAMED_USER', targetUserId: 'site-adm-01' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        const res = await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED', remarks: 'Fast-track approved' }, securityManager);
        assert.strictEqual(res.isStageSatisfied, true);
        const updated = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(updated?.status, 'COMPLETED');
    });
    it('9. Policy: PARALLEL_QUORUM satisfies stage when quorum count threshold is met', async () => {
        // 3 approvers, quorum = 2
        const { instance, apprStage } = await setupWorkflow('PARALLEL_QUORUM', [
            { approverType: 'NAMED_USER', targetUserId: 'sec-mgr-01' },
            { approverType: 'NAMED_USER', targetUserId: 'site-adm-01' },
            { approverType: 'NAMED_USER', targetUserId: 'admin-01' },
        ], 2 // Quorum required = 2
        );
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        assert.strictEqual(tasks.length, 3);
        // Vote 1
        const res1 = await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED' }, securityManager);
        assert.strictEqual(res1.isStageSatisfied, false); // 1 of 2
        // Vote 2 meets quorum!
        const res2 = await approvalEngine.submitDecision({ taskId: tasks[1].taskId, decision: 'APPROVED' }, siteAdmin);
        assert.strictEqual(res2.isStageSatisfied, true); // 2 of 2 -> Quorum reached!
        const updated = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(updated?.status, 'COMPLETED');
    });
    it('10. Idempotency: re-submitting identical decision returns state safely; conflicting decision throws', async () => {
        const { instance, apprStage } = await setupWorkflow('SINGLE', [
            { approverType: 'ROLE', targetRole: 'SECURITY_MANAGER' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        // Initial approval
        await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED', remarks: 'Initial sign' }, securityManager);
        // Idempotent re-submission (same decision)
        const idem = await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED', remarks: 'Duplicate request' }, securityManager);
        assert.strictEqual(idem.task.status, 'APPROVED');
        // Conflicting submission throws Conflict error
        await assert.rejects(async () => {
            await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'REJECTED', remarks: 'Changed mind' }, securityManager);
        }, /Conflict: Task '.*' has already been resolved with status 'APPROVED'/);
    });
    it('11. Policy: SEQUENTIAL enforces step order and rejects out-of-turn decisions', async () => {
        const { instance, apprStage } = await setupWorkflow('SEQUENTIAL', [
            { approverType: 'NAMED_USER', targetUserId: 'sec-mgr-01' }, // Step 0
            { approverType: 'NAMED_USER', targetUserId: 'site-adm-01' }, // Step 1
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        assert.strictEqual(tasks.length, 2);
        // Attempting Step 1 before Step 0 is approved must FAIL!
        await assert.rejects(async () => {
            await approvalEngine.submitDecision({ taskId: tasks[1].taskId, decision: 'APPROVED', remarks: 'Trying to approve step 1 early' }, siteAdmin);
        }, /Sequential approval violation: Step 1 cannot be acted upon before preceding approval steps are completed/);
        // Step 0 approves successfully
        const res0 = await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED', remarks: 'Step 0 approved' }, securityManager);
        assert.strictEqual(res0.isStageSatisfied, false);
        // Now Step 1 can approve and satisfies the stage
        const res1 = await approvalEngine.submitDecision({ taskId: tasks[1].taskId, decision: 'APPROVED', remarks: 'Step 1 approved' }, siteAdmin);
        assert.strictEqual(res1.isStageSatisfied, true);
        const updated = workflowRepo.getInstance(instance.instanceId, 'tenant-appr-test');
        assert.strictEqual(updated?.status, 'COMPLETED');
    });
    it('12. Policy: PARALLEL_ANY_ONE supersedes sibling pending tasks upon first approval', async () => {
        const { instance, apprStage } = await setupWorkflow('PARALLEL_ANY_ONE', [
            { approverType: 'NAMED_USER', targetUserId: 'sec-mgr-01' },
            { approverType: 'NAMED_USER', targetUserId: 'site-adm-01' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        assert.strictEqual(tasks.length, 2);
        // First approver approves
        await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'APPROVED', remarks: 'Fast approval' }, securityManager);
        // Verify sibling task is marked SUPERSEDED
        const siblingTask = workflowRepo.getTask(tasks[1].taskId);
        assert.strictEqual(siblingTask?.status, 'SUPERSEDED');
    });
    it('13. Rejection immediately supersedes sibling pending tasks for the stage', async () => {
        const { instance, apprStage } = await setupWorkflow('PARALLEL_ALL_REQUIRED', [
            { approverType: 'NAMED_USER', targetUserId: 'sec-mgr-01' },
            { approverType: 'NAMED_USER', targetUserId: 'site-adm-01' },
        ]);
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: apprStage,
            user: superAdmin,
        });
        // Approver 0 rejects
        await approvalEngine.submitDecision({ taskId: tasks[0].taskId, decision: 'REJECTED', remarks: 'Security grounds' }, securityManager);
        // Verify sibling task is marked SUPERSEDED
        const siblingTask = workflowRepo.getTask(tasks[1].taskId);
        assert.strictEqual(siblingTask?.status, 'SUPERSEDED');
    });
});
