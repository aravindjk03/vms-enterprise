# Customer Management Domain Verification & Test Results

## 1. Test Verification Overview

The Customer Management Domain (`@vms/customer`) was rigorously validated through an automated test suite comprising 20 comprehensive unit and integration tests (`tests/customer-domain.test.ts`), plus the full repository test suite comprising 257 tests across 21 test suites.

---

## 2. Test Execution Summary

- **Total Test Suites Run:** 21
- **Total Tests Run:** 257
- **Passing Tests:** 257 (100%)
- **Failing Tests:** 0 (0%)
- **TypeScript Static Verification:** 0 errors (`tsc --noEmit` clean exit)
- **Production Web Bundle Build:** 100% successful (`vite build` completed in ~500ms)

---

## 3. Customer Domain Detailed Test Cases Breakdown (`tests/customer-domain.test.ts`)

| # | Test Scenario | Verified System Behavior | Status |
| :- | :--- | :--- | :-: |
| **1** | Customer Account Creation & Duplicate Detection | Creates customer account, links canonical organization, and strictly rejects duplicates by account code, name, and registration number. | **PASS** |
| **2** | Representative Registration & Contact Deduplication | Registers representatives, deduplicates canonical person by phone and email, and applies least-privilege PII masking. | **PASS** |
| **3** | Precedence-Based Security Hierarchy Enforcement | Strictly enforces: Site Security Rules > Global Defaults > Customer Account Rules > Visit Type Requirements. | **PASS** |
| **4** | Customer Audit & Inspection Lifecycles | Executes `CUSTOMER_AUDIT` and `CUSTOMER_INSPECTION` with lead auditors, PPAP tracker links, and formal closure summaries. | **PASS** |
| **5** | Delegation Management & Staggered Presence | Supports multi-delegate groups, tracking individual arrivals and departures at gate turnstiles. | **PASS** |
| **6** | Group Transport Deduplication & Embedded GHG Capture | Persists 1 vehicle movement with shared occupancy, captures Scope 3 Cat 6 activity, and verifies positive emissions. | **PASS** |
| **7** | Bilateral NDA Verification & Gate Check-in Blocking | Strictly blocks turnstile check-in when bilateral NDA requirement is unfulfilled; unlocks upon legal verification. | **PASS** |
| **8** | Overstay Detection & SLA Security Breach | Detects active customer visits past scheduled end and surfaces overstay alerts for security intervention. | **PASS** |
| **9** | Visit Reschedule & Cancellation Audit Trail | Reschedules appointments with monotonic version increment; cancels visits with immutable audit trail. | **PASS** |
| **10**| Multi-Tenant & Cross-Site Data Isolation | Prohibits cross-tenant access to accounts or visits; returns null or throws access violation across boundaries. | **PASS** |
| **11**| Real Persisted Operational & ESG Analytics | Derives real metrics (counts, modes, emissions) directly from database records without fabrication. | **PASS** |
| **12**| Multi-Vehicle Delegations (`additionalTransports`) | Processes delegations arriving in multiple separate convoy vehicles, aggregating all transport and GHG activities. | **PASS** |
| **13**| Tenant-Scoped Idempotency Collision Safety | Guarantees that identical idempotency keys used across different tenants do not collide or overwrite records. | **PASS** |
| **14**| Real Workflow & Approval Instance Persistence | Persists genuine database records for workflow and approval instances and synchronizes transitions on approve/reject. | **PASS** |
| **15**| Cross-Site Gate Check-In Rejection | Prohibits an operator at an unauthorized plant site gate from checking in a visit scheduled for another site. | **PASS** |
| **16**| Expired Appointment Check-In Rejection | Rejects gate check-in attempts when appointment window has expired by more than 4 hours. | **PASS** |
| **17**| Precedence Policy Conflict Detection | Throws a controlled policy conflict error when customer exceptions conflict with mandatory site security rules. | **PASS** |
| **18**| Customer Accounts Approved Site Filtering | Accurately filters customer accounts matching `query.siteId` against the `approved_site_ids` whitelist. | **PASS** |
| **19**| Controlled Export Authorization & Audit Logging | Enforces RBAC on data exports (`SUPER_ADMIN`, `SITE_ADMIN`, `MANAGEMENT` only) and logs tamper-evident audit records. | **PASS** |
| **20**| CustomerApiRouter End-to-End Handling & RBAC | Dispatches REST endpoints (`/api/v1/customers...`, `/api/v1/customer-visits...`), enforcing 401 unauthenticated and 403 forbidden. | **PASS** |

---

## 4. Key Bugs Identified & Remediated During Skeptical Review

1. **Weakened Test 6 Assertion:** Prior attempt tested `db.findById('ghg_calculations', visit.ghgActivityId)`. Because `calculationId` is the primary key rather than `ghgActivityId`, this lookup always returned `null`, silently bypassing the assertion. The underlying calculation had actually crashed due to a missing emission factor fallback. Remediated by adding geographic fallback in `GHGCalculationEngine.resolveFactor`, registering `GLOBAL` for `ROAD-ELECTRIC-CAR`, and asserting `db.findMany('ghg_calculations', { ghg_activity_id: visit.ghgActivityId })`.
2. **Multi-Vehicle Unique Constraint Violation:** `packages/database/src/in-memory-db.ts` defined a unique constraint on `(tenant_id, source_domain, source_transaction_id, activity_type)` for `ghg_activities`, conflicting with the SQL schema where this is an index. This caused convoy delegations to crash on the second vehicle. Remediated by removing the artificial constraint.
3. **Cross-Tenant Idempotency Key Collisions:** `idempotencyStore` was global without tenant scoping. Fixed by scoping keys to `${tenantId}:${idempotencyKey}`.
4. **Mocked Workflow Instances:** Replaced synthetic strings with genuine relational records in `workflow_instances` and `approval_instances`, synchronized on approve/reject/change requests.
5. **Cross-Site & Expired Gate Check-In Gaps:** Enforced strict site ID matching and 4-hour appointment expiration gating.
6. **Documentation Filename Alignment:** Replaced generic numerical filenames (`01_overview.md`, etc.) with the exact 17 required Section 41 filenames containing all 10 required Mermaid diagrams.
