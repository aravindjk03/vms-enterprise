# Customer Visit Lifecycle & Stage State Machine

## 1. Overview & Transaction Envelope Invariants

In VMS Enterprise, all customer visits follow a strict dual-axis status architecture:
1. **Transaction Stage (`stage`):** High-level operational checkpoint along the factory entry lifecycle (`DRAFT` $\to$ `APPROVAL` $\to$ `SCHEDULED` $\to$ `CHECK_IN` / `IN_PROGRESS` $\to$ `CHECK_OUT` $\to$ `CLOSED`).
2. **Operational Status (`status`):** Real-time presence and authorization state (`PENDING`, `APPROVED`, `CONFIRMED`, `ON_PREMISES`, `CHECKED_OUT`, `COMPLETED`, `CANCELLED`, `REJECTED`).

---

## 2. Diagram 5: Customer Visit Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Draft Visit
    DRAFT --> APPROVAL : Submit for Host / SQA Approval
    APPROVAL --> SCHEDULED : All Approvals Granted & NDA Verified
    APPROVAL --> REJECTED : Approver Rejection
    APPROVAL --> DRAFT : Changes Requested by Approver
    SCHEDULED --> IN_PROGRESS : Gate Check-In (All Requirements Met)
    SCHEDULED --> CANCELLED : Visit Cancelled by Host
    SCHEDULED --> SCHEDULED : Rescheduled (Version Incremented)
    IN_PROGRESS --> CHECK_OUT : All Participants Departed Gate
    CHECK_OUT --> CLOSED : Formal Closure Summary & Signoff
    REJECTED --> [*]
    CANCELLED --> [*]
    CLOSED --> [*]
```

---

## 3. Reschedule & Version Control Engine

Customer audits and executive benchmarking visits frequently experience flight delays, itinerary shifts, or technical re-sequencing. When `rescheduleCustomerVisit` is invoked:
- Prior schedule timestamps are archived into the immutable audit ledger.
- The transaction `version` field increments monotonically ($1 \to 2 \to 3$).
- The new start and end timestamps must maintain validity (`newEnd > newStart`).
- All linked QR passes automatically recompute expiration boundaries ($+4\text{ hours}$ grace period after new end).

---

## 4. Formal Closure Requirements & Diagram 10

A customer visit cannot transition to `CLOSED` until a formal closure input is submitted:
- Lead host or auditor user ID (`closedByUserId`).
- Formal debrief notes (`notes`).
- Audit finding / inspection follow-up flag (`followUpRequired: boolean`).
- Evidence document references (`evidenceDocumentRefs: string[]`, e.g. PPAP approval sheet, VDA score card).

```mermaid
flowchart TD
    AllCheckedOut[All Customer Delegates Checked Out at Gate] --> TriggerClose[Lead Host Opens Visit Closure Console]
    
    TriggerClose --> EnterDebrief[Enter Formal Debrief Notes & Meeting Minutes]
    EnterDebrief --> ActionItems{Follow-Up Actions / Corrective Actions Required?}
    
    ActionItems -- Yes --> FlagFollowUp[Set followUpRequired = true]
    ActionItems -- No --> FlagClean[Set followUpRequired = false]
    
    FlagFollowUp --> AttachEvidence[Attach PPAP Sheet / VDA Finding Docs]
    FlagClean --> AttachEvidence
    
    AttachEvidence --> ExecClose[Execute closeCustomerVisit API]
    ExecClose --> DBCommit[(Persist Stage='CLOSED', Status='COMPLETED')]
    DBCommit --> AuditLog[(Log AUDIT_CLOSE Record to audit_logs)]
    AuditLog --> FinalizeESG[Trigger Final Carbon Footprint Reconciliation]
    FinalizeESG --> ReportGen([Generate Downloadable Customer Visit Report])
```
