# Enterprise Approval Engine Architecture & Policy Resolution

## 1. Executive Overview

The VMS Enterprise Approval Engine enforces authorization governance across all transaction stages requiring human sign-off. It supports diverse approval models: Single Approver, Multi-Tier Sequential Approvers, Parallel Unanimous (All-Required), Parallel Any-One, and Parallel Quorum.

In addition, it strictly enforces Segregation of Duties (preventing self-approval), requires documented remarks on rejection, and coordinates with the SLA engine for automated escalations.

---

## 2. Multi-Approver Policy Resolution Flow

```mermaid
flowchart TD
    Start[Approval Task Action Submitted] --> SelfCheck{Is Actor == Requester?}
    SelfCheck -->|Yes & allowSelfApproval=false| SOD_Fail[Segregation of Duties Violation: REJECT]
    SelfCheck -->|No or allowSelfApproval=true| AuthCheck{Is Actor Authorized directly<br/>or via Active Delegation?}
    
    AuthCheck -->|No| Auth_Fail[Unauthorized Approver Exception]
    AuthCheck -->|Yes| RecordAction[Record Immutable ApprovalActionRecord]
    
    RecordAction --> DecisionType{Decision?}
    
    DecisionType -->|REJECTED| RejCheck{Remarks Provided?}
    RejCheck -->|No| Rej_Fail[Mandatory Rejection Reason Required]
    RejCheck -->|Yes| RejTransition[Advance Workflow to REJECT Transition]
    
    DecisionType -->|CHANGES_REQUESTED| ChangesTransition[Advance Workflow to Resubmission / Changes Stage]
    
    DecisionType -->|APPROVED| PolicyCheck{Evaluate Stage Policy}
    
    PolicyCheck -->|SINGLE| Satisfied[Stage Satisfied: Advance to Next Stage]
    PolicyCheck -->|PARALLEL_ANY_ONE| Satisfied
    
    PolicyCheck -->|PARALLEL_ALL_REQUIRED| AllCheck{Are ALL tasks in Stage APPROVED?}
    AllCheck -->|Yes| Satisfied
    AllCheck -->|No| WaitMore[Stage Pending: Waiting for Remaining Approvers]
    
    PolicyCheck -->|SEQUENTIAL| SeqCheck{All Sequential Tasks Approved?}
    SeqCheck -->|Yes| Satisfied
    SeqCheck -->|No| UnlockNext[Activate Next Approver Task in Sequence]
    
    PolicyCheck -->|PARALLEL_QUORUM| QuorumCheck{Approved Count >= Quorum?}
    QuorumCheck -->|Yes| Satisfied
    QuorumCheck -->|No| WaitMore
```

---

## 3. Supported Approval Policies

### 3.1 Single Approver (`SINGLE`)
- A single named user, host sponsor, or role holder must grant approval.
- An affirmative decision satisfies the stage immediately.

### 3.2 Sequential Multi-Tier (`SEQUENTIAL`)
- Tasks are created with sequential step indices (`stepIndex: 0, 1, 2...`).
- Step 0 is presented to the initial approver (e.g. Corporate Host). Upon approval, Step 1 is activated (e.g. Department Head), followed by Step 2 (e.g. Security Manager).
- All sequential tiers must approve before the stage is satisfied.

### 3.3 Parallel All-Required (`PARALLEL_ALL_REQUIRED`)
- Tasks are dispatched simultaneously to multiple stakeholders (e.g. Plant Director AND EHS Manager AND Security Manager).
- The stage remains pending until 100% of the assigned tasks are affirmatively approved.
- Any rejection immediately rejects the stage.

### 3.4 Parallel Any-One (`PARALLEL_ANY_ONE`)
- Tasks are dispatched to an approval pool (e.g. Any Security Manager on duty).
- The first affirmative decision satisfies the stage and cancels remaining duplicate requests.

### 3.5 Parallel Quorum (`PARALLEL_QUORUM`)
- Requires a configured integer threshold (`quorumRequired: N`) of affirmative votes among an authorized board or committee.
- Once N approvals are logged, the stage is satisfied immediately.

---

## 4. Segregation of Duties (SoD) Invariant
By default, `allowSelfApproval = false`. If an employee creates a visitor pass or contractor work order, they cannot authorize their own request, even if they possess the role assigned to approve that stage. An attempt throws:
```
Segregation of Duties Violation: User 'usr-01' submitted this request and is prohibited from self-approving it.
```
