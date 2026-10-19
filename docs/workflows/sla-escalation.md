# Service Level Agreement (SLA) & Automated Escalation Engine

## 1. Executive Summary

Operational throughput and facility security require that approvals are not delayed indefinitely. The VMS Enterprise SLA Engine evaluates pending authorization tasks against configured response times, dispatches warning notifications before breach, and automatically escalates delinquent tasks to higher-level authorities or direct managers without duplicate alert flooding.

Crucially, **auto-approval on expiry is strictly prohibited** for safety and security transactions. Expired approvals escalate or fail-safe to human oversight.

---

## 2. SLA Lifecycle & Escalation State Machine

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Task Submitted (slaDueAt, slaWarningAt Calculated)
    
    state "ON_SCHEDULE" as SCHED
    state "WARNING_TRIGGERED" as WARN
    state "BREACHED" as BREACH
    state "ESCALATED" as ESCALATED
    state "RESOLVED" as RESOLVED

    SUBMITTED --> SCHED: Initial Active State
    SCHED --> WARN: Current Time >= slaWarningAt
    WARN --> BREACH: Current Time >= slaDueAt
    
    BREACH --> ESCALATED: Auto-Escalate to Manager / Elevated Role
    
    SCHED --> RESOLVED: Approver Takes Action (Approved / Rejected)
    WARN --> RESOLVED: Approver Takes Action
    ESCALATED --> RESOLVED: Escalation Authority Takes Action
    
    RESOLVED --> [*]: SLA Timer Concluded
```

---

## 3. SLA Evaluation Sequence & Alert Deduplication

```mermaid
sequenceDiagram
    autonumber
    participant Cron as SLA Evaluation Engine
    participant Repo as WorkflowRepository
    participant Outbox as Transactional Outbox
    participant Audit as Audit Ledger

    Cron->>Repo: listTasks({ status: 'PENDING' })
    loop For Each Pending Task
        alt now >= slaDueAt AND NOT task.slaEscalated
            Cron->>Repo: updateTask({ status: 'ESCALATED', slaBreached: true, slaEscalated: true })
            Cron->>Outbox: Record 'vms.workflow.sla_breached.v1'
            Cron->>Outbox: Record 'vms.workflow.escalated.v1'
            Cron->>Audit: Log WORKFLOW_SLA_BREACH_ESCALATED
        else now >= slaWarningAt AND NOT warningDispatched
            Cron->>Outbox: Record 'vms.workflow.sla_warning.v1'
        else now < slaWarningAt
            Note over Cron: Task On Schedule (No Action Needed)
        end
    end
```

---

## 4. Operational Invariants

1. **Security Invariant: No Silent Auto-Approvals**:
   In high-risk manufacturing and physical security domains, an expired timer cannot assume an approval. A breached task is marked `ESCALATED`, triggering alerts to the designated manager.
2. **Alert Flood Prevention**:
   The engine flags `slaEscalated = true` and `slaBreached = true` on the task record upon initial breach. Subsequent cron evaluations verify this flag, preventing repeated duplicate notifications for already-escalated tasks.
3. **Escalation Count Tracking**:
   The engine increments `escalationCount` with each hierarchy tier escalation, supporting multi-level escalation policies (e.g. Host -> Department Head -> Site Director).
