import { randomUUID } from 'node:crypto';
import type {
  ApprovalTask,
  ApprovalActionRecord,
  ApprovalDecision,
  ApprovalPolicyType,
  WorkflowStage,
  WorkflowInstance,
  EnterpriseRole,
  UserContext,
} from '@vms/types';
import { WorkflowRepository, ApprovalRepository, AuditRepository } from '@vms/database';
import { DelegationManager } from './delegation-manager.js';
import { WorkflowEngine } from '../engine/workflow-engine.js';

export interface SubmitDecisionInput {
  taskId: string;
  decision: ApprovalDecision;
  remarks?: string;
  changesRequiredDetails?: string;
  delegationId?: string;
  requesterUserId?: string; // For self-approval validation
}

export class ApprovalEngine {
  constructor(
    private workflowRepo: WorkflowRepository,
    private approvalRepo: ApprovalRepository,
    private auditRepo: AuditRepository,
    private delegationManager: DelegationManager,
    private workflowEngine: WorkflowEngine
  ) {}

  /**
   * Initializes approval tasks for a newly entered APPROVAL stage (Section 15, 16, 18).
   */
  public async createTasksForStage(params: {
    instance: WorkflowInstance;
    stage: WorkflowStage;
    siteId?: string;
    requesterUserId?: string;
    hostUserId?: string;
    responsibleManagerUserId?: string;
    user: UserContext;
  }): Promise<ApprovalTask[]> {
    if (params.stage.stageType !== 'APPROVAL') {
      return [];
    }

    const tasks: ApprovalTask[] = [];
    const policy: ApprovalPolicyType = params.stage.approvalPolicy || 'SINGLE';
    const rules = params.stage.assignmentRules || [];

    const slaDueAt = params.stage.slaConfig?.slaMinutes
      ? new Date(Date.now() + params.stage.slaConfig.slaMinutes * 60 * 1000)
      : undefined;

    const slaWarningAt = params.stage.slaConfig?.warningMinutes
      ? new Date(Date.now() + params.stage.slaConfig.warningMinutes * 60 * 1000)
      : undefined;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      let assignedUserId: string | undefined = undefined;
      let assignedRole: EnterpriseRole | undefined = rule.targetRole;
      let status: ApprovalTask['status'] = 'PENDING';

      if (rule.approverType === 'NAMED_USER') {
        assignedUserId = rule.targetUserId;
      } else if (rule.approverType === 'HOST_SPONSOR') {
        assignedUserId = params.hostUserId;
      } else if (rule.approverType === 'RESPONSIBLE_MANAGER') {
        assignedUserId = params.responsibleManagerUserId;
      } else if (rule.approverType === 'ROLE') {
        assignedRole = rule.targetRole;
      }

      // Check if approver cannot be resolved -> Section 16 Configuration Exception
      if (!assignedUserId && !assignedRole) {
        status = 'CONFIGURATION_EXCEPTION';
      }

      const taskId = randomUUID();
      const task: ApprovalTask = {
        taskId,
        instanceId: params.instance.instanceId,
        stageId: params.stage.stageId,
        tenantId: params.user.tenantId,
        siteId: params.siteId || params.user.siteId,
        sourceDomain: params.instance.sourceDomain,
        sourceTransactionId: params.instance.sourceTransactionId,
        assignedToUserId: assignedUserId,
        assignedToRole: assignedRole,
        status,
        slaDueAt,
        slaWarningAt,
        slaBreached: false,
        slaEscalated: false,
        submittedAt: new Date(),
        metadata: {
          policy,
          stepIndex: i,
          totalSteps: rules.length,
          quorumRequired: params.stage.quorumRequired || 1,
          allowSelfApproval: rule.allowSelfApproval ?? false,
          delegationAllowed: rule.delegationAllowed ?? true,
          requesterUserId: params.requesterUserId,
        },
      };

      this.workflowRepo.createTask(task);
      tasks.push(task);

      // Emit Outbox event
      this.workflowRepo.recordOutboxEvent({
        outbox_id: randomUUID(),
        tenant_id: params.user.tenantId,
        event_type: status === 'CONFIGURATION_EXCEPTION'
          ? 'vms.workflow.exception.v1'
          : 'vms.workflow.approval_required.v1',
        payload: {
          taskId,
          instanceId: params.instance.instanceId,
          stageId: params.stage.stageId,
          assignedRole,
          assignedUserId,
          status,
        },
        status: 'PENDING',
        retry_count: 0,
      }, params.user.tenantId);
    }

    return tasks;
  }

  /**
   * Submits an approval authorization decision (Section 17, 18, 19, 20).
   * Validates permissions, enforces self-approval restrictions, records audit trail, and advances workflow.
   */
  public async submitDecision(
    input: SubmitDecisionInput,
    actorUser: UserContext
  ): Promise<{ task: ApprovalTask; decisionRecord: ApprovalActionRecord; isStageSatisfied: boolean }> {
    const task: ApprovalTask | null = this.workflowRepo.getTask(input.taskId);
    // Tasks from another tenant are indistinguishable from missing ones.
    if (!task || task.tenantId !== actorUser.tenantId) {
      throw new Error(`Approval task '${input.taskId}' not found.`);
    }

    // Idempotency: Duplicate submissions return idempotent state if identical
    if (task.status === 'APPROVED' || task.status === 'REJECTED' || task.status === 'CHANGES_REQUESTED') {
      if (task.status === input.decision) {
        // Return existing without duplicating
        const existingActions: any[] = (this.approvalRepo as any).db.findMany('approval_actions', { task_id: input.taskId });
        return {
          task,
          decisionRecord: existingActions[0] || ({} as any),
          isStageSatisfied: task.status === 'APPROVED',
        };
      }
      throw new Error(`Conflict: Task '${input.taskId}' has already been resolved with status '${task.status}'.`);
    }

    // 1. Self-Approval Restriction Check (Section 19)
    const allowSelfApproval = task.metadata?.allowSelfApproval === true;
    // The requester recorded on the task is authoritative; a caller-supplied value can only add
    // a further identity to check, never replace the stored one.
    const requesterIds = [task.metadata?.requesterUserId as string | undefined, input.requesterUserId].filter(
      (id): id is string => typeof id === 'string' && id.length > 0
    );
    if (!allowSelfApproval && requesterIds.includes(actorUser.userId)) {
      throw new Error(
        `Segregation of Duties Violation: User '${actorUser.userId}' submitted this request and is prohibited from self-approving it.`
      );
    }

    // 2. Authorization / Eligibility Check
    let isDelegated = false;
    let delegationId = input.delegationId;

    const isDirectUser = task.assignedToUserId === actorUser.userId;
    const isDirectRole = task.assignedToRole && (actorUser.role === task.assignedToRole || (actorUser.roles || []).includes(task.assignedToRole));
    const isSuperAdmin = actorUser.role === 'SUPER_ADMIN';

    if (!isDirectUser && !isDirectRole && !isSuperAdmin) {
      // Check delegation
      if (task.assignedToUserId && task.metadata?.delegationAllowed !== false) {
        const activeDelegation = this.delegationManager.getActiveDelegationForDelegate(
          actorUser.userId,
          task.assignedToUserId,
          task.sourceDomain,
          actorUser.tenantId
        );
        if (activeDelegation) {
          isDelegated = true;
          delegationId = activeDelegation.delegationId;
        } else {
          throw new Error(`Unauthorized: User '${actorUser.userId}' is not an authorized approver for task '${input.taskId}'.`);
        }
      } else {
        throw new Error(`Unauthorized: User '${actorUser.userId}' does not have the required approval assignment.`);
      }
    }

    // 3. Sequential Approval Step Order Enforcement (Section 18)
    const policy: ApprovalPolicyType = (task.metadata?.policy as ApprovalPolicyType) || 'SINGLE';
    if (policy === 'SEQUENTIAL') {
      const currentStep = Number(task.metadata?.stepIndex ?? 0);
      if (currentStep > 0) {
        const allStageTasks = this.workflowRepo.listTasks({
          instance_id: task.instanceId,
          stage_id: task.stageId,
        });
        const unapprovedPreceding = allStageTasks.some((t: any) => {
          const sIdx = Number(t.metadata?.stepIndex ?? 0);
          return sIdx < currentStep && t.status !== 'APPROVED';
        });
        if (unapprovedPreceding) {
          throw new Error(
            `Sequential approval violation: Step ${currentStep} cannot be acted upon before preceding approval steps are completed.`
          );
        }
      }
    }

    // 4. Rejection Reason Check (Section 17)
    if (input.decision === 'REJECTED') {
      if (!input.remarks || input.remarks.trim().length === 0) {
        throw new Error('Mandatory rejection requirement: A documented rejection reason is required.');
      }
    }

    // 5. Record Action
    const actionId = randomUUID();
    const now = new Date();

    const decisionRecord: ApprovalActionRecord = {
      actionId,
      taskId: task.taskId,
      instanceId: task.instanceId,
      stageId: task.stageId,
      actorUserId: actorUser.userId,
      actorRole: actorUser.role,
      decision: input.decision,
      remarks: input.remarks,
      delegationId,
      timestamp: now,
      correlationId: `appr-act-${actionId}`,
      changesRequiredDetails: input.changesRequiredDetails,
    };

    this.approvalRepo.recordAction(decisionRecord);

    // Update Task
    task.status = input.decision;
    task.resolvedAt = now;
    this.workflowRepo.updateTask(task.taskId, {
      status: task.status,
      resolved_at: task.resolvedAt,
    });

    // 6. Evaluate Multi-Approver / Parallel Policy (Section 18)
    const allStageTasks = this.workflowRepo.listTasks({
      instance_id: task.instanceId,
      stage_id: task.stageId,
    });

    let isStageSatisfied = false;

    if (input.decision === 'APPROVED') {
      if (policy === 'SINGLE' || policy === 'PARALLEL_ANY_ONE') {
        isStageSatisfied = true;
      } else if (policy === 'PARALLEL_ALL_REQUIRED' || policy === 'SEQUENTIAL') {
        const allApproved = allStageTasks.every((t: any) => t.status === 'APPROVED');
        isStageSatisfied = allApproved;
      } else if (policy === 'PARALLEL_QUORUM') {
        const quorum = Number(task.metadata?.quorumRequired) || 1;
        const approvedCount = allStageTasks.filter((t: any) => t.status === 'APPROVED').length;
        isStageSatisfied = approvedCount >= quorum;
      }
    } else if (input.decision === 'REJECTED') {
      isStageSatisfied = false;
      // Advance workflow to REJECT transition
      await this.workflowEngine.transitionInstance({
        instanceId: task.instanceId,
        trigger: 'REJECT',
        actorUser,
        remarks: input.remarks,
      });
    } else if (input.decision === 'CHANGES_REQUESTED') {
      isStageSatisfied = false;
      // Advance workflow to CHANGES_REQUIRED / RETURN transition (Section 20)
      await this.workflowEngine.transitionInstance({
        instanceId: task.instanceId,
        trigger: 'CHANGES_REQUIRED',
        actorUser,
        remarks: input.changesRequiredDetails || input.remarks,
      });
    }

    // Supersede sibling pending tasks on stage completion or rejection
    if (isStageSatisfied || input.decision === 'REJECTED') {
      const pendingSiblings = allStageTasks.filter((t: any) =>
        t.taskId !== task.taskId && (t.status === 'PENDING' || t.status === 'ESCALATED')
      );
      for (const sibling of pendingSiblings) {
        sibling.status = 'SUPERSEDED' as any;
        sibling.resolvedAt = now;
        this.workflowRepo.updateTask(sibling.taskId, {
          status: 'SUPERSEDED' as any,
          resolved_at: now,
        });
      }
    }

    // If stage satisfied affirmatively, advance workflow to next stage!
    if (isStageSatisfied) {
      await this.workflowEngine.transitionInstance({
        instanceId: task.instanceId,
        trigger: 'APPROVE',
        actorUser,
        remarks: input.remarks,
      });
    }

    // Audit logging
    this.auditRepo.logAudit({
      audit_id: randomUUID(),
      tenant_id: actorUser.tenantId,
      actor_id: actorUser.userId,
      actor_role: actorUser.role,
      action: `APPROVAL_DECISION_${input.decision}`,
      entity_type: 'APPROVAL_TASK',
      entity_id: task.taskId,
      timestamp: now,
      request_id: randomUUID(),
      correlation_id: `decision-${actionId}`,
      source: 'ApprovalEngine',
      after_snapshot: {
        decision: input.decision,
        remarks: input.remarks,
        isDelegated,
        delegationId,
        isStageSatisfied,
      },
    }, actorUser.tenantId);

    return {
      task,
      decisionRecord,
      isStageSatisfied,
    };
  }

  public getTask(taskId: string): ApprovalTask | null {
    return this.workflowRepo.getTask(taskId);
  }

  public listTasks(filter: Record<string, any>): ApprovalTask[] {
    return this.workflowRepo.listTasks(filter);
  }
}
