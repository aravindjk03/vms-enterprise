import { randomUUID } from 'node:crypto';
import type { ApprovalTask, SlaStatus, SlaEvaluationResult } from '@vms/types';
import { WorkflowRepository, AuditRepository } from '@vms/database';

export class SlaEngine {
  constructor(
    private workflowRepo: WorkflowRepository,
    private auditRepo: AuditRepository
  ) {}

  /**
   * Evaluates all pending tasks against their SLA thresholds (Section 22).
   * Emits warnings, breaches, and auto-escalations without duplicate alert flooding.
   */
  public async evaluatePendingTasks(tenantId: string, asOfDate?: Date): Promise<SlaEvaluationResult[]> {
    const now = asOfDate || new Date();
    const pendingTasks: ApprovalTask[] = this.workflowRepo.listTasks({})
      .filter((t: any) => (t.tenant_id === tenantId || t.tenantId === tenantId) && (t.status === 'PENDING' || t.status === 'ESCALATED'));

    const results: SlaEvaluationResult[] = [];

    for (const task of pendingTasks) {
      const dueAt = task.slaDueAt ? new Date(task.slaDueAt) : undefined;
      const warnAt = task.slaWarningAt ? new Date(task.slaWarningAt) : undefined;

      if (!dueAt) continue;

      let slaStatus: SlaStatus = 'ON_SCHEDULE';
      let actionTaken = 'NONE';

      // 1. Check SLA Breach
      if (now >= dueAt) {
        const isAlreadyEscalated = task.slaEscalated || (task as any).sla_escalated;
        if (!isAlreadyEscalated) {
          slaStatus = 'BREACHED';
          actionTaken = 'ESCALATED';

          // Mark task as breached & escalated
          const nextCount = (task.escalationCount || (task as any).escalation_count || 0) + 1;
          this.workflowRepo.updateTask(task.taskId, {
            status: 'ESCALATED',
            sla_breached: true,
            slaBreached: true,
            sla_escalated: true,
            slaEscalated: true,
            escalation_count: nextCount,
            escalationCount: nextCount,
          });

          // Emit outbox events
          this.workflowRepo.recordOutboxEvent({
            outbox_id: randomUUID(),
            tenant_id: tenantId,
            event_type: 'vms.workflow.sla_breached.v1',
            payload: {
              taskId: task.taskId,
              instanceId: task.instanceId,
              dueAt: dueAt.toISOString(),
              breachedAt: now.toISOString(),
            },
            status: 'PENDING',
            retry_count: 0,
          }, tenantId);

          this.workflowRepo.recordOutboxEvent({
            outbox_id: randomUUID(),
            tenant_id: tenantId,
            event_type: 'vms.workflow.escalated.v1',
            payload: {
              taskId: task.taskId,
              instanceId: task.instanceId,
              escalationCount: nextCount,
              reason: 'Stage approval SLA deadline expired without authorization decision',
            },
            status: 'PENDING',
            retry_count: 0,
          }, tenantId);

          this.auditRepo.logAudit({
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor_id: 'SYSTEM_SLA_ENGINE',
            actor_role: 'SUPER_ADMIN',
            action: 'WORKFLOW_SLA_BREACH_ESCALATED',
            entity_type: 'APPROVAL_TASK',
            entity_id: task.taskId,
            timestamp: now,
            request_id: randomUUID(),
            correlation_id: `sla-breach-${task.taskId}`,
            source: 'SlaEngine',
            after_snapshot: { dueAt: dueAt.toISOString(), escalationCount: nextCount },
          }, tenantId);
        } else {
          slaStatus = 'ESCALATED';
          actionTaken = 'ALREADY_ESCALATED';
        }
      }
      // 2. Check SLA Warning
      else if (warnAt && now >= warnAt) {
        slaStatus = 'WARNING_TRIGGERED';
        const isAlreadyWarned =
          task.metadata?.slaWarningDispatched === true ||
          (task as any).sla_warning_emitted === true ||
          (task as any).slaWarningEmitted === true;

        if (!isAlreadyWarned) {
          actionTaken = 'WARNING_DISPATCHED';

          const updatedMetadata = { ...task.metadata, slaWarningDispatched: true };
          task.metadata = updatedMetadata;
          this.workflowRepo.updateTask(task.taskId, {
            metadata: updatedMetadata,
            sla_warning_emitted: true,
          });

          this.workflowRepo.recordOutboxEvent({
            outbox_id: randomUUID(),
            tenant_id: tenantId,
            event_type: 'vms.workflow.sla_warning.v1',
            payload: {
              taskId: task.taskId,
              instanceId: task.instanceId,
              warnAt: warnAt.toISOString(),
              dueAt: dueAt.toISOString(),
            },
            status: 'PENDING',
            retry_count: 0,
          }, tenantId);
        } else {
          actionTaken = 'ALREADY_WARNED';
        }
      }

      results.push({
        taskId: task.taskId,
        slaStatus,
        actionTaken,
      } as any);
    }

    return results;
  }
}
