# Customer Management Domain Overview

## 1. Executive Summary

The **Customer Management Domain** (`@vms/customer`) in VMS Enterprise is an enterprise-grade subsystem engineered specifically for governing business interactions with OEM customers, strategic clients, commercial partners, quality auditors, and executive delegations across high-security manufacturing plants, industrial complexes, and corporate campuses.

In mission-critical industrial manufacturing (such as automotive OEMs, aerospace, defense, and heavy machinery), customer engagements are fundamentally different from generic transient visits. They involve:
- Formal institutional relationships governed by master accounts, legal trade names, commercial ownership, and vendor ratings.
- High-stakes technical audits (e.g., IATF 16949, VDA 6.3 process audits, ISO 9001 quality audits).
- Structured product and tooling inspections prior to production part approval (PPAP) and dispatch.
- Multi-participant executive delegations arriving via shared chartered transport.
- Strict intellectual property protections including bilateral Non-Disclosure Agreements (NDAs), photography prohibitions, and technical escort mandates.
- Embedded ESG Scope 3 Category 6 (Business Travel) activity data capture to track customer travel carbon footprints without disrupting factory operations.

---

## 2. Core Enterprise Architectural Invariants

### 2.1 Strict Domain Independence
Customer transactions are completely decoupled from transient visitor transactions.
- **Strict Rule:** `visitor_type = 'CUSTOMER'` is strictly forbidden in VMS Enterprise.
- Customers have independent database schemas (`customer_accounts`, `customer_representatives`, `customer_visit_transactions`, `customer_visit_participants`, `customer_requirements`), dedicated approval workflows, dedicated lifecycle state machines, and specialized auditing features.
- Cross-domain interactions occur strictly through normalized shared platform infrastructure (Identity, Transport, GHG Engine, Gate Devices, Workflow Engine, and Audit Ledger).

### 2.2 Multi-Tenant Data Isolation & Site Scoping
All customer master data, visit transactions, and gate passes are strictly scoped to the tenant organization (`tenant_id`) and physical plant site (`site_id`). Cross-tenant visibility is strictly prohibited at both the database relational engine (RLS) and API service layers.

### 2.3 Group Journey Deduplication
When multi-participant customer delegations arrive together (e.g., 5 auditors sharing an executive van), the platform records **exactly 1 physical vehicle movement** with total occupancy set to 5. This prevents duplicated Scope 3 emissions calculations while accurately tracking individual participant badges at the turnstile.

### 2.4 Precedence-Based Security & Compliance Engine
Visit requirements are dynamically evaluated through an authoritative 5-tier precedence hierarchy:
$$\text{Mandatory Site Rules} > \text{Global Defaults} > \text{Customer Account Rules} > \text{Visit Type Requirements} > \text{Visit-Specific Exceptions}$$
If a manufacturing plant mandates a photography prohibition due to intellectual property protection, no customer preference or host exception can override this site security mandate.

### 2.5 Embedded ESG Activity Capture with Zero-Blocker Invariant
Operational activity facts (mode, vehicle class, fuel type, passenger count, distance, provenance) are captured directly inside customer visit forms. Carbon emissions calculations execute asynchronously. Any delay, failure, or offline calculation engine state **never blocks** customer plant check-in or gate operations.

---

## 3. Key Capabilities & Scope Matrix

| Capability Area | Core Features | Relevant Entities |
| :--- | :--- | :--- |
| **Customer Accounts** | Master data registry, OEM tiers, commercial ownership, approved site boundaries, duplicate detection | `customer_accounts`, `external_organizations` |
| **Representatives** | Canonical person linking, phone/email deduplication, least-privilege PII masking, identity status | `customer_representatives`, `persons`, `person_contacts` |
| **Visit Orchestration** | 8 standard visit types, 4 booking modes, recurring schedules, multi-stage approval workflows | `customer_visit_transactions`, `workflow_instances` |
| **Audits & Inspections** | Audit types (VDA 6.3, IATF 16949), lead auditor tracking, inspection categories, closure signoffs | `CustomerAuditDetails`, `CustomerInspectionDetails` |
| **Delegations** | Multi-delegate groups, lead designation, staggered check-in/checkout, real-time presence board | `customer_visit_participants`, `CustomerDelegationView` |
| **Bilateral NDA Vault** | Agreement reference tracking, gate-level NDA enforcement, bypass prevention | `customer_requirements`, `legal_documents` |
| **Embedded Transport & ESG**| Normalized transport vectors, group journey deduplication, Scope 3 Cat 6 GHG traceability | `transport_activities`, `ghg_activities`, `ghg_calculations` |
| **Gate Operations & Overstay** | Check-in/out gating, turnstiles, ANPR plate matching, overstay SLA detection, immutable audit trail | `gate_events`, `audit_logs` |
