# Workflow Approval Integration & SLA Escalation

## 1. Overview

Visitor transactions integrate directly with the enterprise **Workflow Engine** (`@vms/workflow`) established in Part 5. Approvals are not hardcoded inside UI screens or monolithic database triggers; rather, visit submissions instantiate a versioned workflow instance bound to the plant site's published workflow template.

---

## 2. Approval Integration & Escalation Diagram

```mermaid
sequenceDiagram
    autonumber
    participant VS as VisitorService
    participant WE as WorkflowEngine
    actor Host as Plant Host Employee
    actor Delegate as Authorized Delegate
    actor SecurityMgr as Security Manager (Escalation)
    participant TaskCtr as TaskCenterService

    VS->>WE: startWorkflowInstance('VISITOR', transactionId, context)
    WE->>WE: Evaluate Rules: VIP? High-Security Zone? Auto-Approve?
    
    alt Auto-Approval Condition Met (e.g. VIP Board Member)
        WE-->>VS: Transition directly to APPROVED stage
    else Host Approval Required
        WE->>TaskCtr: Create Task for Host (SLA Timer: 120 mins)
        TaskCtr->>Host: Notification Push / Email Alert
        
        alt Host Approves Within SLA
            Host->>TaskCtr: Approve Task(comment='Meeting confirmed in Conf Room 4')
            TaskCtr->>WE: Complete Task -> Approved
            WE-->>VS: Stage -> APPROVED (Issue e-Pass)
        else Host Away / On Leave
            WE->>WE: Check Delegation Registry
            WE->>TaskCtr: Route to Delegate User
            Delegate->>TaskCtr: Approve as Proxy
            WE-->>VS: Stage -> APPROVED (Proxy Recorded)
        else SLA Timeout Breached (>120 mins)
            WE->>WE: Trigger SLA Escalation Rule
            WE->>TaskCtr: Reassign Task to SecurityMgr
            SecurityMgr->>TaskCtr: Review & Sign-Off / Reject
            WE-->>VS: Final Disposition Recorded
        end
    end
```

---

## 3. Configurable Approval Policies

Plant sites configure approval policies based on transaction context:

1. **Standard Visit**: 1-tier approval by the host employee.
2. **Hazardous / Production Floor Access**: 2-tier approval (Tier 1: Host; Tier 2: EHS Safety Officer).
3. **VIP / Executive Delegation**: Accelerated auto-approval with notification broadcast to Plant Head and Corporate Security.
4. **Restricted Zone / Cleanroom**: 3-tier sequential approval (Host → Facility Head → Plant Security Officer).

---

## 4. Delegation & Proxy Governance

To prevent gate deadlocks when hosts are travelling or on leave:
- Employees configure active delegations (`validFrom`, `validTo`, `delegateUserId`).
- When a visitor registers with an absent host, the task automatically routes to the configured delegate.
- The system logs both the primary host and proxy approver in the immutable workflow history for auditing.
