# Declarative Workflow Engine Architecture & Lifecycle Design

## 1. Executive Summary

The VMS Enterprise Workflow Engine provides declarative orchestration for all multi-step business transactions. Workflows are composed of discrete stages (validation, approval, document verification, safety induction, and access decisions) joined by conditional transitions.

Crucially, **domain pipelines remain architecturally distinct** — Visitor, Customer, Contractor, Service, Material, and Gate workflows each follow domain-specific paths rather than being forced into a monolithic universal workflow.

---

## 2. Workflow Version Lifecycle & Immutability State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create New Draft (v1 or cloned from vN)
    
    state "DRAFT" as DRAFT
    state "VALIDATED" as VALIDATED
    state "PUBLISHED" as PUBLISHED
    state "RETIRED" as RETIRED

    DRAFT --> DRAFT: Edit Stages & Transitions
    DRAFT --> VALIDATED: WorkflowValidator.validate() == Valid
    VALIDATED --> DRAFT: Modify Definition
    
    VALIDATED --> PUBLISHED: Publish Version (Mark Immutable)
    
    note right of PUBLISHED
      IMMUTABLE INVARIANT:
      Modifications are strictly rejected.
      Running instances bind to this version
      and complete under it.
    end note
    
    PUBLISHED --> RETIRED: Superseded by Publication of Newer Version (vN+1)
    RETIRED --> [*]: Retained for Historical Audit
```

---

## 3. Workflow Runtime Execution State Machine

```mermaid
stateDiagram-v2
    [*] --> START_STAGE: Start Instance (sourceTransactionId)
    
    state "DATA_VALIDATION" as VAL
    state "APPROVAL_STAGE" as APPR
    state "SAFETY_OR_DOC_CHECK" as SEC
    state "TERMINAL_END" as END_SUCCESS
    state "REJECTED_END" as REJ

    START_STAGE --> VAL: Transition TRIGGER: SUBMIT
    VAL --> APPR: Validation Passed (Conditions Verified)
    VAL --> REJ: Blacklist Detected / Validation Failed
    
    APPR --> SEC: Multi-Approver Quorum Approved
    APPR --> REJ: Rejected (Mandatory Reason Required)
    APPR --> VAL: Changes Requested (Resubmission Flow)
    
    SEC --> END_SUCCESS: All Permits & Inductions Verified
    SEC --> REJ: Failed Safety Inspection
    
    END_SUCCESS --> [*]: Handover to Gate & Access Engine
    REJ --> [*]: Closed as Rejected
```

---

## 4. Key Architectural Invariants

### 4.1 Immutability of Published Workflows
Once a workflow version is marked `PUBLISHED`:
1. `version.immutable` is set to `true`.
2. Any subsequent invocation of `updateDraftVersion` on that version ID throws an `Immutable workflow violation` error immediately.
3. To alter a workflow, administrators must clone the published version into a new `DRAFT` version (`versionNumber + 1`).

### 4.2 Instance Version Retention
When a transactional instance is initiated:
1. It permanently records `versionId` of the current published version.
2. If an administrator publishes version 2 while an instance is currently undergoing approval on version 1, that instance **continues and concludes execution strictly according to version 1 rules**. This prevents runtime state corruption and orphan stages.

### 4.3 Static Validation Invariants
The engine performs strict static analysis before permitting any workflow to be published:
- **Single START**: Exactly 1 stage of type `START` must exist.
- **Terminal END**: At least 1 stage of type `END` must exist and be reachable from START.
- **Graph Completeness**: All transition source and destination IDs must correspond to valid stages.
- **Dead-End Detection**: All non-END stages must possess at least one outgoing transition.
- **Cycle Safety**: All loops must contain bounded exit conditions to prevent infinite execution traps.
