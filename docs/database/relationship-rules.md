# VMS Enterprise: Relational Relationship Rules & Referential Integrity

This document defines the cardinalities, foreign key dependency chains, cascade behaviors, and architectural decoupling principles governing the VMS Enterprise relational database schema.

---

## 1. Cardinality & Relationship Taxonomy

| Parent Entity | Child Entity | Cardinality | FK Column | On Delete Action | Business Rule & Rationale |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `tenants` | `organizations` | 1:N | `tenant_id` | `CASCADE` | Organizations exist strictly within a single tenant boundary. |
| `tenants` | `sites` | 1:N | `tenant_id` | `CASCADE` | Sites are deleted if the tenant account is terminated. |
| `organizations`| `sites` | 1:N | `organization_id`| `CASCADE` | Facilities belong to an operating legal entity. |
| `sites` | `gates` | 1:N | `site_id` | `CASCADE` | Physical portals are bound to their physical facility. |
| `sites` | `zones` | 1:N | `site_id` | `CASCADE` | Security zones partition a physical site. |
| `persons` | `person_contacts` | 1:N | `person_id` | `CASCADE` | Contact details are personal attributes of the human identity. |
| `persons` | `person_addresses`| 1:N | `person_id` | `CASCADE` | Physical addresses belong to the person. |
| `persons` | `visitor_transactions`| 1:N | `person_id`| `RESTRICT` | **CRITICAL RESTRICT:** Cannot delete person identity if audit transactions exist. |
| `persons` | `contractor_workers`| 1:N | `person_id`| `RESTRICT` | **CRITICAL RESTRICT:** Cannot delete worker identity if labor history exists. |
| `visitor_transactions`| `visitor_participants`| 1:N| `visitor_transaction_id`| `CASCADE`| Sub-participants belong to the visit session. |
| `customer_accounts` | `customer_visit_transactions` | 1:N | `customer_account_id` | `RESTRICT` | Cannot delete customer account with historical visit transactions. |
| `contractor_companies` | `contractor_contracts` | 1:N | `company_id` | `RESTRICT` | Contracts require active vendor reference. |
| `contractor_contracts` | `contractor_work_orders` | 1:N | `contract_id` | `RESTRICT` | Work orders cannot be orphaned from their parent contract. |
| `material_transactions` | `material_transaction_lines` | 1:N | `material_transaction_id` | `CASCADE` | Manifest lines belong directly to the freight shipment header. |
| `material_transaction_lines` | `material_returns` | 1:N | `material_transaction_line_id` | `RESTRICT` | Returns point back to the line item dispatched. |
| `transport_activities` | `ghg_activities` | 1:1 / 1:N | `source_activity_id` | `RESTRICT` | Carbon activity records must never orphan their physical transit origin. |
| `ghg_activities` | `ghg_calculations` | 1:N | `ghg_activity_id` | `RESTRICT` | Immutable calculations point to the activity; calculations cannot be orphaned. |
| `documents` | `document_links` | 1:N | `document_id` | `CASCADE` | Poly-morphic link pointers are cleaned up if the master document is purged. |

---

## 2. Architectural Decoupling Principles

### 2.1 Decoupling of Reusable Person Identity from Domain Roles
Traditional legacy systems conflate a "visitor" with a "person", creating duplicated records when a contractor technician subsequently visits a client site as a commercial guest.
- **VMS Relational Pattern:**
  - `persons` stores immutable identity attributes (Name, DOB, Nationality, Biometric embeddings).
  - Domain records (`visitor_transactions`, `contractor_workers`, `service_technicians`, `customer_representatives`, `drivers`) reference `persons(person_id)` as a foreign key.
  - A single physical human carries exactly one `person_id` within a tenant, but participates across multiple operational workflows.

### 2.2 Reusable Transport Model Decoupling
Emissions accounting requires capturing transport details without coupling the vehicle or commute details exclusively to one business workflow.
- **VMS Relational Pattern:**
  - `transport_activities` is centralized.
  - It maintains weak polymorphic references via `source_domain` (`VISITOR`, `CUSTOMER`, `CONTRACTOR`, `SERVICE`, `MATERIAL`, `VEHICLE`) and `source_transaction_id`.
  - The transport model normalizes distances, modes, fuel types, occupancy counts, freight tonnages, and measurement methods uniformly across all pipelines.

### 2.3 Centralized Document Vault with Dynamic Link Junctions
Legal permits, gate passes, safety certs, bills of lading, and delivery challans must be stored and indexed centrally.
- **VMS Relational Pattern:**
  - `documents` stores file binaries, storage keys, cryptographic checksums (SHA-256), and encryption status.
  - `document_links` uses `(tenant_id, document_id, entity_type, entity_id, relationship_type)` to associate any document with any entity in the system without adding foreign key columns across 50 tables.

### 2.4 Separation of Operational Capture and GHG Calculation
Operational access and material gate passes must operate in industrial real-time with sub-second latencies and offline resilience.
- **VMS Relational Pattern:**
  - When an operational transaction occurs, Steps 1 to 4 execute transactionally (operational record, transport normalization, pending GHG activity, and domain event).
  - GHG emission calculation (Step 5) is executed asynchronously against the factor version registry.
  - If factor lookup is delayed, missing, or requires retroactive recalculation, the operational transaction is **100% unaffected and remains committed**.

---

## 3. Referential Integrity Enforcements

1. **Circular Dependency Prevention:**
   The schema strictly forbids circular foreign key dependencies. Hierarchies flow strictly downward:
   `tenants -> organizations -> sites -> buildings -> gates/zones`.
2. **Compound Unique Keys for Multi-Tenancy:**
   All human-readable business codes (`reference_number`, `vendor_code`, `account_code`, `code`) enforce uniqueness scoped by `tenant_id` (e.g., `UNIQUE (tenant_id, code)`).
3. **Restrict on Audited Entities:**
   Any master entity that participated in an audit log, gate event, or GHG calculation cannot be deleted (`ON DELETE RESTRICT`). Soft-deletion via `status = 'INACTIVE'` or `status = 'ARCHIVED'` is mandatory.
