import { describe, it } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { RelationalDatabase, WorkflowRepository, ApprovalRepository, AuditRepository, } from '@vms/database';
import { WorkflowEngine } from '../services/workflow/src/engine/workflow-engine.js';
import { DelegationManager } from '../services/workflow/src/approval/delegation-manager.js';
import { ApprovalEngine } from '../services/workflow/src/approval/approval-engine.js';
describe('Part 5: DelegationManager & Proxy Approvals (Section 21)', () => {
    const db = new RelationalDatabase();
    const workflowRepo = new WorkflowRepository(db);
    const approvalRepo = new ApprovalRepository(db);
    const auditRepo = new AuditRepository(db);
    const delegationManager = new DelegationManager(approvalRepo, auditRepo);
    const workflowEngine = new WorkflowEngine(workflowRepo, auditRepo);
    const approvalEngine = new ApprovalEngine(workflowRepo, approvalRepo, auditRepo, delegationManager, workflowEngine);
    const delegatorUser = {
        userId: 'delegator-mgr-01',
        tenantId: 'tenant-delegation-test',
        organizationId: 'org-01',
        role: 'SECURITY_MANAGER',
    };
    const qualifiedDelegate = {
        userId: 'delegate-proxy-01',
        tenantId: 'tenant-delegation-test',
        organizationId: 'org-01',
        role: 'SITE_ADMIN', // Has VISITOR_APPROVE / requisite permissions
    };
    const unqualifiedDelegate = {
        userId: 'unqualified-guard-01',
        tenantId: 'tenant-delegation-test',
        organizationId: 'org-01',
        role: 'SECURITY_GUARD', // Does NOT have visitor approve permissions
    };
    const adminUser = {
        userId: 'admin-01',
        tenantId: 'tenant-delegation-test',
        organizationId: 'org-01',
        role: 'SUPER_ADMIN',
    };
    it('1. Rejects delegation with invalid time window (validFrom >= validTo)', async () => {
        const now = new Date();
        await assert.rejects(async () => {
            await delegationManager.createDelegation({
                delegatorUserId: delegatorUser.userId,
                delegateUserId: qualifiedDelegate.userId,
                validFrom: new Date(now.getTime() + 100000),
                validTo: now, // Before validFrom
            }, delegatorUser, qualifiedDelegate);
        }, /Invalid delegation window: validFrom must be strictly before validTo/);
    });
    it('2. Rejects delegation when expiry date is in the past', async () => {
        const past = new Date(Date.now() - 500000);
        const pastEnd = new Date(Date.now() - 100000);
        await assert.rejects(async () => {
            await delegationManager.createDelegation({
                delegatorUserId: delegatorUser.userId,
                delegateUserId: qualifiedDelegate.userId,
                validFrom: past,
                validTo: pastEnd,
            }, delegatorUser, qualifiedDelegate);
        }, /Invalid delegation: Expiry date cannot be in the past/);
    });
    it('3. Rejects delegation if delegate lacks requisite underlying approval permissions', async () => {
        const now = new Date();
        const future = new Date(Date.now() + 7 * 24 * 3600 * 1000);
        await assert.rejects(async () => {
            await delegationManager.createDelegation({
                delegatorUserId: delegatorUser.userId,
                delegateUserId: unqualifiedDelegate.userId,
                validFrom: now,
                validTo: future,
                reason: 'Annual leave proxy',
            }, delegatorUser, unqualifiedDelegate);
        }, /Delegation rejected: Delegate 'unqualified-guard-01' \(SECURITY_GUARD\) does not possess the requisite underlying approval permissions/);
    });
    it('4. Successfully creates delegation for qualified delegate with audit logging', async () => {
        const now = new Date();
        const future = new Date(Date.now() + 7 * 24 * 3600 * 1000);
        const delegation = await delegationManager.createDelegation({
            delegatorUserId: delegatorUser.userId,
            delegateUserId: qualifiedDelegate.userId,
            domainScope: 'VISITOR',
            validFrom: now,
            validTo: future,
            reason: 'Out of office for industrial summit',
        }, delegatorUser, qualifiedDelegate);
        assert.ok(delegation.delegationId);
        assert.strictEqual(delegation.status, 'ACTIVE');
        assert.strictEqual(delegation.delegatorUserId, delegatorUser.userId);
        assert.strictEqual(delegation.delegateUserId, qualifiedDelegate.userId);
        assert.strictEqual(delegation.domainScope, 'VISITOR');
        const auditLogs = auditRepo.getAuditHistory('APPROVAL_DELEGATION', delegation.delegationId, 'tenant-delegation-test');
        assert.strictEqual(auditLogs.length, 1);
        assert.strictEqual(auditLogs[0].action, 'APPROVAL_DELEGATION_CREATE');
    });
    it('5. Retrieves active delegation matching time window and domain', () => {
        const active = delegationManager.getActiveDelegationForDelegate(qualifiedDelegate.userId, delegatorUser.userId, 'VISITOR', 'tenant-delegation-test');
        assert.ok(active);
        assert.strictEqual(active.status, 'ACTIVE');
        // Mismatched domain returns null
        const mismatchDomain = delegationManager.getActiveDelegationForDelegate(qualifiedDelegate.userId, delegatorUser.userId, 'MATERIAL', 'tenant-delegation-test');
        assert.strictEqual(mismatchDomain, null);
    });
    it('6. Proxy delegate successfully approves task assigned to delegator', async () => {
        // Setup a workflow with a task assigned directly to delegatorUser
        const def = await workflowEngine.createDefinition({ domain: 'VISITOR', code: 'WF_DELEGATION_RUN', name: 'Delegation Run WF' }, adminUser);
        const sStart = randomUUID();
        const sAppr = randomUUID();
        const sEnd = randomUUID();
        const stages = [
            { stageId: sStart, stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
            {
                stageId: sAppr,
                stageCode: 'APPROVAL',
                stageName: 'Security Check',
                stageType: 'APPROVAL',
                orderIndex: 1,
                approvalPolicy: 'SINGLE',
                assignmentRules: [
                    { approverType: 'NAMED_USER', targetUserId: delegatorUser.userId, delegationAllowed: true },
                ],
            },
            { stageId: sEnd, stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 2 },
        ];
        const transitions = [
            { transitionId: randomUUID(), fromStageId: sStart, toStageId: sAppr, trigger: 'START' },
            { transitionId: randomUUID(), fromStageId: sAppr, toStageId: sEnd, trigger: 'APPROVE' },
        ];
        const draft = await workflowEngine.createDraftVersion(def.definitionId, undefined, adminUser);
        await workflowEngine.updateDraftVersion(draft.versionId, stages, transitions, adminUser);
        await workflowEngine.publishVersion(draft.versionId, adminUser);
        const instance = await workflowEngine.startInstance({
            definitionId: def.definitionId,
            sourceTransactionId: 'VIS-DEL-001',
            sourceDomain: 'VISITOR',
            user: adminUser,
        });
        await workflowEngine.transitionInstance({
            instanceId: instance.instanceId,
            trigger: 'START',
            actorUser: adminUser,
        });
        const tasks = await approvalEngine.createTasksForStage({
            instance,
            stage: stages[1],
            user: adminUser,
        });
        assert.strictEqual(tasks[0].assignedToUserId, delegatorUser.userId);
        // Qualified delegate approves on behalf of delegator
        const result = await approvalEngine.submitDecision({
            taskId: tasks[0].taskId,
            decision: 'APPROVED',
            remarks: 'Approved as authorized proxy for Security Manager',
        }, qualifiedDelegate);
        assert.strictEqual(result.task.status, 'APPROVED');
        assert.ok(result.decisionRecord.delegationId, 'Decision record must capture delegationId');
        assert.strictEqual(result.isStageSatisfied, true);
    });
    it('7. Revoking delegation immediately prevents proxy approvals', async () => {
        // List delegations and revoke the active one
        const delegations = approvalRepo.listDelegations({ delegator_user_id: delegatorUser.userId, delegate_user_id: qualifiedDelegate.userId }, 'tenant-delegation-test');
        assert.ok(delegations.length > 0);
        const delId = delegations[0].delegation_id || delegations[0].delegationId;
        await delegationManager.revokeDelegation(delId, 'Security Manager returned early', delegatorUser);
        // Lookup active now returns null
        const active = delegationManager.getActiveDelegationForDelegate(qualifiedDelegate.userId, delegatorUser.userId, 'VISITOR', 'tenant-delegation-test');
        assert.strictEqual(active, null);
    });
    it('8. Rejects self-delegation attempts', async () => {
        const now = new Date();
        await assert.rejects(async () => {
            await delegationManager.createDelegation({
                delegatorUserId: delegatorUser.userId,
                delegateUserId: delegatorUser.userId,
                validFrom: now,
                validTo: new Date(now.getTime() + 1000000),
            }, delegatorUser, delegatorUser);
        }, /Self-delegation is prohibited: User cannot delegate approval authority to themselves/);
    });
    it('9. Detects and rejects circular delegation cycles (direct and transitive)', async () => {
        const now = new Date();
        const future = new Date(Date.now() + 7 * 24 * 3600 * 1000);
        const userAlice = {
            userId: 'user-alice-01',
            tenantId: 'tenant-delegation-test',
            organizationId: 'org-01',
            role: 'SECURITY_MANAGER',
        };
        const userBob = {
            userId: 'user-bob-01',
            tenantId: 'tenant-delegation-test',
            organizationId: 'org-01',
            role: 'SITE_ADMIN',
        };
        const userCharlie = {
            userId: 'user-charlie-01',
            tenantId: 'tenant-delegation-test',
            organizationId: 'org-01',
            role: 'SUPER_ADMIN',
        };
        // Step 1: Alice delegates to Bob
        await delegationManager.createDelegation({
            delegatorUserId: userAlice.userId,
            delegateUserId: userBob.userId,
            validFrom: now,
            validTo: future,
            reason: 'Alice out of office',
        }, userAlice, userBob);
        // Step 2: Bob attempting to delegate back to Alice should be REJECTED (direct circular loop)
        await assert.rejects(async () => {
            await delegationManager.createDelegation({
                delegatorUserId: userBob.userId,
                delegateUserId: userAlice.userId,
                validFrom: now,
                validTo: future,
            }, userBob, userAlice);
        }, /Circular delegation detected/);
        // Step 3: Bob delegates to Charlie
        await delegationManager.createDelegation({
            delegatorUserId: userBob.userId,
            delegateUserId: userCharlie.userId,
            validFrom: now,
            validTo: future,
        }, userBob, userCharlie);
        // Step 4: Charlie attempting to delegate back to Alice should be REJECTED (transitive circular loop: Alice -> Bob -> Charlie -> Alice)
        await assert.rejects(async () => {
            await delegationManager.createDelegation({
                delegatorUserId: userCharlie.userId,
                delegateUserId: userAlice.userId,
                validFrom: now,
                validTo: future,
            }, userCharlie, userAlice);
        }, /Circular delegation detected/);
    });
    it('10. Resolves transitive multi-hop proxy chains (Alice -> Bob -> Charlie)', () => {
        const activeForAlice = delegationManager.getActiveDelegationForDelegate('user-charlie-01', 'user-alice-01', undefined, 'tenant-delegation-test');
        assert.ok(activeForAlice, 'Charlie should be recognized as active transitive proxy for Alice');
    });
});
