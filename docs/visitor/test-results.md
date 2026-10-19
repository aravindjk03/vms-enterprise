# Visitor Domain Automated Test Suite & Invariants

## 1. Executive Summary

The Visitor domain is validated through a production-grade automated test suite implemented in `tests/visitor-domain.test.ts`. All 13 test suites (Tests A through M) execute directly against the domain services and in-memory transactional database, verifying business rules, state invariants, ESG auto-capture, idempotency, and security boundaries.

**Test Run Outcome**: 100% Pass (225 total monorepo tests passing, 0 failures).

---

## 2. Test Suite Matrix (Tests A through M)

| Test ID | Test Title & Functional Invariant | Result | Key Assertion Verified |
|:---:|:---|:---:|:---|
| **A** | New Visitor Complete Lifecycle | **PASS** | Validates `SUBMITTED` $\rightarrow$ `APPROVED` $\rightarrow$ `VERIFIED` $\rightarrow$ `CHECKED_IN` $\rightarrow$ `CHECKED_OUT`. Gate events logged and occupancy decremented. |
| **B** | Returning Visitor Matching & Disambiguation | **PASS** | Evaluates exact phone and fuzzy name matching. Links visit to existing profile ID without creating duplicate profile. |
| **C** | Walk-In Approval Gate Invariant | **PASS** | Blocks check-in for walk-in visitor when `status === 'PENDING'`. Succeeds immediately once host approval is recorded. |
| **D** | Group Delegation Transport Deduplication | **PASS** | 5 delegates onboarded. Emits 1 shared transport record with occupancy=5; prevents 5x multiplication of carbon burn. |
| **E** | Embedded ESG Auto-Capture & GIS Derivation | **PASS** | Derives road distance from transit matrix (348 km), tags provenance `SYSTEM_ESTIMATED`, and creates source-linked `ghg_activities`. |
| **F** | Idempotency Double-Submission Guard | **PASS** | Re-submitting identical payload with identical `idempotencyKey` returns existing record; zero duplicate database writes. |
| **G** | Overstay Detection & Warning Escalation | **PASS** | Identifies active visitor exceeding departure window; raises warning and breach records with elapsed minutes calculation. |
| **H** | Activity Correction & Audit Provenance | **PASS** | Corrects mobility distance from 348 km to 360 km. Records audit log with before/after delta and reason justification. |
| **I** | Multi-Tenant Data Isolation Guard | **PASS** | Prevents cross-tenant access. Attempting to fetch or approve Tenant B visitor from Tenant A context throws security violation. |
| **J** | Emergency Walk-In Rapid Flow | **PASS** | Minimal essential registration with guard supervisor override logs valid emergency visit with auditable rationale. |
| **K** | Reschedule & Cancellation Governance | **PASS** | Updates visit window, increments version, invalidates old pass token, and logs historical audit event. |
| **L** | Operational Analytics BI Aggregation | **PASS** | Aggregates active headcount, expected arrivals, pending approvals, and Scope 3 emissions directly from database records. |
| **M** | State Machine Invariants & Error Guards | **PASS** | Prevents duplicate check-in, duplicate checkout, or cancelling visitors currently inside the facility (`ON_PREMISES`). |

---

## 3. Test Execution Telemetry

```text
▶ Part 6: Complete Visitor Management Domain Verification
  ✔ A. executes complete new visitor lifecycle: register -> submit -> approve -> verify -> checkin -> checkout (20.4ms)
  ✔ B. identifies returning visitor, handles disambiguation, and creates second visit without profile duplication (3.6ms)
  ✔ C. blocks check-in for walk-in visitor until host approval is granted (3.2ms)
  ✔ D. supports group delegation with multiple participants under one shared appointment (2.4ms)
  ✔ E. automatically captures normalized transport, derives distance, and creates traceable GHG activity (1.9ms)
  ✔ F. guarantees idempotency: retrying submission with identical idempotencyKey does not duplicate records (1.7ms)
  ✔ G. detects active visitors exceeding scheduled end time and raises overstay breach (1.8ms)
  ✔ H. preserves historical audit trail when activity data is corrected by authorized user (3.4ms)
  ✔ I. prevents cross-tenant access to visitor transactions (3.7ms)
  ✔ J. supports emergency visitor registration with minimum essentials and auditable trail (1.7ms)
  ✔ K. handles reschedule and cancellation with version increments and audit logging (1.3ms)
  ✔ L. derives accurate operational analytics from real database records (0.9ms)
  ✔ M. enforces state machine invariants: prevents duplicate check-in, checkout, or cancelling active visits (1.1ms)
✔ Part 6: Complete Visitor Management Domain Verification (49.5ms)

ℹ suites 20 | pass 225 | fail 0 | duration 4.75s
```
