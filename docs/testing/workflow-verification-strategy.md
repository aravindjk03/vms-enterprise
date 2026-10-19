# Workflow, Master Data & Approval Engine Automated Verification Strategy

## 1. Overview & Verification Philosophy

Testing within VMS Enterprise Part 5 adheres to the principle of **deep automated verification**. Every state machine, approval policy, declarative condition operator, SLA threshold, and tenant isolation boundary must be exercised against real in-memory PostgreSQL and repository test doubles.

Shallow, happy-path manual testing is insufficient; edge cases, boundary conditions, malicious permission escalations, and cycle anomalies are systematically validated.

---

## 2. Test Suite Architecture

```
tests/
├── master-data.test.ts       # Master Data CRUD, schema validation, CSV import & version immutability
├── workflow-engine.test.ts   # Workflow definitions, draft lifecycle, instance runtime & condition transitions
├── workflow-validator.test.ts# Static analysis: single START, reachable END, dead ends, broken transitions & cycles
├── approval-engine.test.ts   # Single, Sequential, Parallel (All, Any-One, Quorum), SoD self-approval, rejection remarks
├── delegation.test.ts        # Time-bounded delegation, permission transfer validation & proxy audit tracking
├── sla-engine.test.ts        # SLA countdown, warning trigger, breach auto-escalation & alert deduplication
├── rules-engine.test.ts      # Declarative operators (EQUALS, GREATER, IN, CONTAINS, DATES), AND/OR, priority resolution
├── outbox-events.test.ts     # Transactional outbox ledger, at-least-once dispatch, and failure retry backoff
└── task-center.test.ts       # Persona-based task queries (Pending, Assigned, Delegated, Overdue, Escalated)
```

---

## 3. Targeted Test Matrices & Boundary Test Cases

### 3.1 Master Data Management (`master-data.test.ts`)
- **Category Governance**: Ensures all canonical categories (4.1 to 4.10) are registered and retrievable.
- **Sensitive Activation Approval**: Verifies non-Super-Admin cannot directly activate sensitive category records without approval.
- **RLS Boundary**: Guarantees tenant A cannot read, modify, or list master data records belonging to tenant B.
- **CSV Import Validation**:
  - Validates full import batch.
  - Rejects empty CSV or missing required headers (`Code`, `Name`).
  - Rejects duplicate codes within the CSV file.
  - Rejects codes already present in the database.
  - Rejects malformed codes violating uppercase alphanumeric formatting.
- **Immutability & Audit**: Verifies every update saves a historical snapshot with reason and increments the version counter.

### 3.2 Workflow Engine & Static Validator (`workflow-engine.test.ts`, `workflow-validator.test.ts`)
- **START Stage Validation**: Fails if 0 START stages or > 1 START stages exist.
- **END Stage Validation**: Fails if 0 END stages or if END stage has outgoing transitions.
- **Reachability & Dead Ends**: Fails if any stage cannot be reached from START, or if a non-END stage has 0 outgoing transitions.
- **Cycle Safety**: Detects infinite loops that lack conditional exit paths.
- **Published Immutability**: Modifying a PUBLISHED workflow version throws an `Immutable workflow violation` error.
- **Instance Version Retention**: In-flight workflow instance retains its initial version when a new version is published.
- **Conditional Transitions**: Evaluates context fields against EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS.

### 3.3 Approval Engine & Delegation (`approval-engine.test.ts`, `delegation.test.ts`)
- **Segregation of Duties**: Requester attempting to approve their own task throws a Segregation of Duties violation.
- **Single Approver**: 1 affirmative vote satisfies stage.
- **Sequential Multi-Tier**: Step 0 approved -> Step 1 activated -> Step 2 activated -> All approved satisfies stage.
- **Parallel All-Required**: Stage remains pending until 100% of approvers approve.
- **Parallel Any-One**: Single approval satisfies stage.
- **Parallel Quorum**: Requires N affirmative votes to satisfy stage.
- **Rejection Mandatory Reason**: Rejecting without remarks throws a mandatory rejection reason error.
- **Changes Requested Flow**: Returns workflow to editing/resubmission stage.
- **Delegation Security**:
  - Rejects delegation if delegate lacks underlying approval role permissions.
  - Rejects delegation if `validFrom >= validTo` or if expiry date is in the past.
  - Proxy approval permanently binds both `actorUserId = delegate` and `delegationId`.

### 3.4 SLA & Escalation Engine (`sla-engine.test.ts`)
- **Warning Threshold**: Current time >= `slaWarningAt` emits `vms.workflow.sla_warning.v1`.
- **Breach Escalation**: Current time >= `slaDueAt` marks task as `ESCALATED`, emits `sla_breached.v1` and `escalated.v1`.
- **Alert Deduplication**: Subsequent evaluation runs on already-escalated tasks do NOT re-dispatch duplicate breach alerts.

### 3.5 Rules & Policy Engine (`rules-engine.test.ts`)
- **Declarative Operators**: Verifies EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, IN, NOT_IN, CONTAINS, EXISTS, IS_VALID, IS_EXPIRED.
- **Boolean Logic**: Verifies AND / OR compound condition chains.
- **Precedence Hierarchy**: Verifies DENY action overrides ALLOW; verifies site-specific policy overrides global tenant policy.

---

## 4. Test Execution Command
Automated tests are executed via Node.js native test runner via `tsx`:
```bash
npm test
```
Typechecking and build verification:
```bash
npm run typecheck
npm run build:web
```
