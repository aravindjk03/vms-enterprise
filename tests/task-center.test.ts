import { describe, it } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  RelationalDatabase,
  WorkflowRepository,
  ApprovalRepository,
  AuditRepository,
} from '@vms/database';
import type { UserContext, ApprovalTask } from '@vms/types';
import { DelegationManager } from '../services/workflow/src/approval/delegation-manager.js';
import { TaskCenterService } from '../services/workflow/src/task/task-center.service.js';

describe('Part 5: TaskCenterService & Persona Views (Section 23)', () => {
  const db = new RelationalDatabase();
  const workflowRepo = new WorkflowRepository(db);
  const approvalRepo = new ApprovalRepository(db);
  const auditRepo = new AuditRepository(db);
  const delegationManager = new DelegationManager(approvalRepo, auditRepo);
  const service = new TaskCenterService(workflowRepo, approvalRepo, delegationManager);

  const tenantId = 'tenant-task-center';

  const userAlice: UserContext = {
    userId: 'user-alice',
    tenantId,
    organizationId: 'org-01',
    role: 'SECURITY_MANAGER',
  };

  const userBob: UserContext = {
    userId: 'user-bob',
    tenantId,
    organizationId: 'org-01',
    role: 'SITE_ADMIN',
  };

  const now = new Date();

  // Create test tasks
  const task1: ApprovalTask = {
    taskId: 'tsk-direct-alice',
    instanceId: 'inst-01',
    stageId: 'stg-01',
    tenantId,
    siteId: 'site-chennai',
    sourceDomain: 'VISITOR',
    sourceTransactionId: 'VIS-101',
    assignedToUserId: 'user-alice',
    status: 'PENDING',
    slaDueAt: new Date(now.getTime() + 3600000), // in 1h
    slaBreached: false,
    slaEscalated: false,
    submittedAt: now,
  };

  const task2: ApprovalTask = {
    taskId: 'tsk-role-siteadmin',
    instanceId: 'inst-02',
    stageId: 'stg-01',
    tenantId,
    siteId: 'site-chennai',
    sourceDomain: 'CONTRACTOR',
    sourceTransactionId: 'CONT-201',
    assignedToRole: 'SITE_ADMIN',
    status: 'PENDING',
    slaDueAt: new Date(now.getTime() + 7200000), // in 2h
    slaBreached: false,
    slaEscalated: false,
    submittedAt: now,
  };

  const task3: ApprovalTask = {
    taskId: 'tsk-overdue',
    instanceId: 'inst-03',
    stageId: 'stg-01',
    tenantId,
    siteId: 'site-pune',
    sourceDomain: 'MATERIAL',
    sourceTransactionId: 'MAT-301',
    assignedToUserId: 'user-alice',
    status: 'ESCALATED',
    slaDueAt: new Date(now.getTime() - 1800000), // 30m ago!
    slaBreached: true,
    slaEscalated: true,
    submittedAt: new Date(now.getTime() - 7200000),
  };

  const task4: ApprovalTask = {
    taskId: 'tsk-completed',
    instanceId: 'inst-04',
    stageId: 'stg-01',
    tenantId,
    siteId: 'site-chennai',
    sourceDomain: 'SERVICE',
    sourceTransactionId: 'SRV-401',
    assignedToUserId: 'user-alice',
    status: 'APPROVED',
    slaDueAt: new Date(now.getTime() + 3600000),
    slaBreached: false,
    slaEscalated: false,
    submittedAt: now,
  };

  workflowRepo.createTask(task1);
  workflowRepo.createTask(task2);
  workflowRepo.createTask(task3);
  workflowRepo.createTask(task4);

  it('1. ASSIGNED_TO_ME queries direct assignments and matching role assignments', () => {
    // Alice sees direct task1 and escalated task3
    const aliceTasks = service.getTasks({ view: 'ASSIGNED_TO_ME' }, userAlice);
    assert.strictEqual(aliceTasks.length, 2);
    assert.ok(aliceTasks.some((t) => t.taskId === 'tsk-direct-alice'));
    assert.ok(aliceTasks.some((t) => t.taskId === 'tsk-overdue'));

    // Bob sees role-assigned task2 (SITE_ADMIN)
    const bobTasks = service.getTasks({ view: 'ASSIGNED_TO_ME' }, userBob);
    assert.strictEqual(bobTasks.length, 1);
    assert.strictEqual(bobTasks[0].taskId, 'tsk-role-siteadmin');
  });

  it('2. OVERDUE and ESCALATED views return breached tasks', () => {
    const overdueTasks = service.getTasks({ view: 'OVERDUE' }, userAlice);
    assert.strictEqual(overdueTasks.length, 1);
    assert.strictEqual(overdueTasks[0].taskId, 'tsk-overdue');
    assert.strictEqual(overdueTasks[0].slaStatus, 'OVERDUE');

    const escalatedTasks = service.getTasks({ view: 'ESCALATED' }, userAlice);
    assert.strictEqual(escalatedTasks.length, 1);
    assert.strictEqual(escalatedTasks[0].taskId, 'tsk-overdue');
  });

  it('3. COMPLETED view returns resolved history', () => {
    const completedTasks = service.getTasks({ view: 'COMPLETED' }, userAlice);
    assert.strictEqual(completedTasks.length, 1);
    assert.strictEqual(completedTasks[0].taskId, 'tsk-completed');
    assert.strictEqual(completedTasks[0].status, 'APPROVED');
  });

  it('4. Filters by Domain and Site ID correctly', () => {
    // Filter by VISITOR domain
    const visitorTasks = service.getTasks({ view: 'MY_PENDING', domain: 'VISITOR' }, userAlice);
    assert.strictEqual(visitorTasks.length, 1);
    assert.strictEqual(visitorTasks[0].taskId, 'tsk-direct-alice');

    // Filter by site-chennai
    const chennaiTasks = service.getTasks({ view: 'MY_PENDING', siteId: 'site-chennai' }, userAlice);
    assert.strictEqual(chennaiTasks.length, 1);
    assert.strictEqual(chennaiTasks[0].taskId, 'tsk-direct-alice');

    // Filter by site-pune
    const puneTasks = service.getTasks({ view: 'MY_PENDING', siteId: 'site-pune' }, userAlice);
    assert.strictEqual(puneTasks.length, 1);
    assert.strictEqual(puneTasks[0].taskId, 'tsk-overdue');
  });

  it('5. DELEGATED view retrieves tasks where active delegation is held', async () => {
    // Create task assigned to userCharlie
    const taskCharlie: ApprovalTask = {
      taskId: 'tsk-charlie',
      instanceId: 'inst-05',
      stageId: 'stg-01',
      tenantId,
      siteId: 'site-chennai',
      sourceDomain: 'VISITOR',
      sourceTransactionId: 'VIS-501',
      assignedToUserId: 'user-charlie',
      status: 'PENDING',
      slaDueAt: new Date(now.getTime() + 3600000),
      slaBreached: false,
      slaEscalated: false,
      submittedAt: now,
    };
    workflowRepo.createTask(taskCharlie);

    // Charlie delegates to Bob
    await delegationManager.createDelegation(
      {
        delegatorUserId: 'user-charlie',
        delegateUserId: userBob.userId,
        validFrom: new Date(now.getTime() - 1000),
        validTo: new Date(now.getTime() + 86400000),
        domainScope: 'VISITOR',
      },
      { ...userAlice, userId: 'user-charlie' },
      userBob
    );

    // Bob queries DELEGATED view
    const delegatedToBob = service.getTasks({ view: 'DELEGATED' }, userBob);
    assert.strictEqual(delegatedToBob.length, 1);
    assert.strictEqual(delegatedToBob[0].taskId, 'tsk-charlie');
  });

  it('6. DELEGATED view retrieves escalated delegated tasks requiring urgent proxy action', () => {
    // Escalate taskCharlie to ESCALATED
    workflowRepo.updateTask('tsk-charlie', {
      status: 'ESCALATED',
      sla_breached: true,
      sla_escalated: true,
    });

    const delegatedToBob = service.getTasks({ view: 'DELEGATED' }, userBob);
    assert.strictEqual(delegatedToBob.length, 1);
    assert.strictEqual(delegatedToBob[0].taskId, 'tsk-charlie');
    assert.strictEqual(delegatedToBob[0].status, 'ESCALATED');
  });
});
