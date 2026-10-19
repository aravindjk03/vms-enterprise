# VMS Enterprise: Relational Entity Catalog

This catalog documents the ~105 tables and 55 core entity groups comprising the VMS Enterprise PostgreSQL 16+ relational schema.

---

## Summary Matrix Across All 20 Domain Groups

| Domain # | Domain Name | Table Count | Key Entities | Immutability / Ledgers |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Core Organizational Hierarchy | 10 | `tenants`, `organizations`, `sites`, `departments`, `buildings`, `gates`, `zones` | Configurable |
| **2** | Users & Access Control | 15 | `users`, `roles`, `permissions`, `access_policies`, `access_credentials`, `access_grants` | Mutable Config |
| **3** | Person & Reusable Identity | 6 | `persons`, `person_contacts`, `person_addresses`, `person_identity_documents`, `biometrics` | Privacy Protected |
| **4** | External Organizations | 4 | `external_organizations`, `organization_types`, `organization_contacts` | Master Reference |
| **5** | Visitor Domain | 7 | `visitor_transactions`, `visitor_participants`, `appointments`, `visitor_profiles` | Operational Lifecycle |
| **6** | Customer Domain | 7 | `customer_accounts`, `customer_visit_transactions`, `customer_visit_participants` | Operational Lifecycle |
| **7** | Contractor Domain | 8 | `contractor_companies`, `contractor_contracts`, `contractor_work_orders`, `workers` | Operational Lifecycle |
| **8** | Service / Maintenance Domain | 7 | `service_providers`, `service_technicians`, `service_work_orders`, `service_permits` | Operational Lifecycle |
| **9** | Material Logistics & Returns | 13 | `materials`, `purchase_orders`, `material_transactions`, `lines`, `material_returns`, `passes`| Operational Lifecycle |
| **10** | Vehicle & Fleet Domain | 7 | `vehicles`, `drivers`, `transporters`, `vehicle_documents`, `driver_documents` | Fleet Management |
| **11** | Normalized Reusable Transport | 6 | `transport_activities`, `transport_modes`, `journey_types`, `measurement_methods` | Reusable Mobility Vector |
| **12** | Centralized Document Vault | 8 | `documents`, `document_versions`, `document_links`, `document_verifications` | Secure Storage Links |
| **13** | Legal, Consent & Verification | 9 | `legal_documents`, `consents`, `consent_records`, `signatures`, `identity_verifications` | Compliance Ledgers |
| **14** | Workflow & Transition Engine | 7 | `workflow_definitions`, `workflow_versions`, `workflow_instances`, `workflow_tasks` | State Machine |
| **15** | Approval Engine | 7 | `approval_workflows`, `approval_instances`, `approval_stage_instances`, `delegations` | Governance Engine |
| **16** | Gate & Physical Access | 6 | `gate_transactions`, `gate_events`, `gate_devices`, `gate_decisions` | **gate_events (IMMUTABLE)** |
| **17** | Safety & Emergency Evacuation | 10 | `permits`, `emergency_events`, `muster_points`, `muster_records`, `missing_persons` | Emergency Ledger |
| **18** | Incident & Exception Handling | 6 | `incidents`, `incident_types`, `exceptions`, `exception_resolutions` | Audited Exceptions |
| **19** | ESG & Carbon Accounting | 10 | `ghg_activities`, `ghg_calculations`, `emission_factors`, `emission_factor_versions` | **ghg_calculations & EF versions (IMMUTABLE)** |
| **20** | Outbox, Notifications & Audit | 7 | `audit_logs`, `domain_events`, `notifications`, `notification_deliveries` | **audit_logs & domain_events (IMMUTABLE)** |

---

## Detailed Catalog by Domain

### 1. Core Organizational Hierarchy
- **`tenants`**: Root multi-tenant isolation unit. PK: `tenant_id` (UUID). Unique: `code`.
- **`organizations`**: Legal operating companies within a tenant. PK: `organization_id`. Tenant-scoped. FK: `tenant_id`. Unique: `(tenant_id, code)`.
- **`sites`**: Physical campuses/facilities. PK: `site_id`. Tenant-scoped. FK: `tenant_id`, `organization_id`. Carries geographic coordinates (`latitude`, `longitude`) and timezone.
- **`departments`**: Organizational departments within sites. PK: `department_id`. Tenant-scoped. FK: `tenant_id`, `site_id`.
- **`buildings`**: Physical structures at a site. PK: `building_id`. Tenant-scoped. FK: `tenant_id`, `site_id`.
- **`gates`**: Physical entry/exit portals (pedestrian, vehicular, turnstile, dock). PK: `gate_id`. Tenant-scoped. FK: `tenant_id`, `site_id`, `building_id`.
- **`zones`**: Security partitions inside buildings (standard, high security, hazardous, restricted). PK: `zone_id`. Tenant-scoped.
- **`site_settings`**, **`gate_settings`**, **`zone_settings`**: Key-value operational configurations.

### 2. Users, Authentication & Permissions
- **`users`**: System operator profiles and credentials. PK: `user_id`. Tenant-scoped. Unique: `(tenant_id, username)`, `(tenant_id, email)`.
- **`roles`**: Enterprise RBAC roles (Security Guard, EHS Manager, Facility Admin, ESG Auditor). PK: `role_id`. Tenant-scoped.
- **`permissions`**: Fine-grained atomic system permissions. PK: `permission_id`. Global. Unique: `code`.
- **`user_roles`**: Role assignments to users. PK: `(user_id, role_id)`. Tenant-scoped.
- **`role_permissions`**: Mapping of permissions to roles. PK: `(role_id, permission_id)`.
- **`user_site_access`**, **`user_gate_access`**, **`user_zone_access`**: Location scoping for users.
- **`access_policies`**, **`access_policy_rules`**: ABAC rule engines evaluating environmental/contextual conditions.
- **`access_credentials`**: Issued credentials (RFID, QR token, biometric template, PIN). PK: `credential_id`.
- **`access_grants`**: Time-bounded permission to access specific site/zones.
- **`access_events`**: Raw credential swipe ledger.

### 3. Person & Reusable Identity Model
- **`persons`**: Centralized human identity decoupled from operational roles. PK: `person_id`. Tenant-scoped. Reused across Visitors, Contractor Workers, Technicians, Customer Reps, Drivers, and Employees.
- **`person_contacts`**: Normalized communications (Email, Mobile, Desk Phone, Radio).
- **`person_addresses`**: Physical residence or company addresses.
- **`person_identity_documents`**: Government ID verifications (Passport, Driver License, National ID).
- **`person_consents`**: Privacy and biometric data processing consent records.
- **`biometric_references`**: One-way encrypted biometric hashes/embeddings (facial, fingerprint, iris).

### 4. External Organizations
- **`external_organizations`**: Directory of 3rd-party corporate entities. PK: `org_id`. Unique: `(tenant_id, code)`.
- **`organization_types`**: Master classification (Customer, Supplier, Contractor, Service Provider, Transporter).
- **`external_org_classifications`**: Poly-morphic assignment of types to organizations.
- **`organization_contacts`**: Mapping persons to corporate roles within external organizations.

### 5. Visitor Management Domain
- **`visitor_types`**: Visitor classifications (Standard, VIP, Statutory Auditor, Interviewee).
- **`visitor_purposes`**: Purpose codes (Business Meeting, Audit, Technical Consultation).
- **`visitor_profiles`**: Long-term visitor history, VIP flags, watchlist status.
- **`appointments`**: Scheduled meeting calendar objects.
- **`visitor_transactions`**: Canonical visitor visit lifecycle. PK: `transaction_id`. Human Reference: `VIS-YYYY-NNNNNN`.
- **`visitor_participants`**: Multi-visitor group registration.
- **`visitor_hosts`**: Employee hosts assigned to chaperone visitors.

### 6. Customer Management Domain
- **`customer_accounts`**: Enterprise customer entity. PK: `customer_account_id`.
- **`customer_representatives`**: Designated customer contact persons.
- **`customer_visit_transactions`**: Commercial visit lifecycles. PK: `transaction_id`. Human Reference: `CUST-YYYY-NNNNNN`.
- **`customer_visit_participants`**: Multi-party customer delegations.
- **`customer_requirements`**: Non-disclosure, NDA, and security clearance requirements.

### 7. Contractor Management Domain
- **`contractor_companies`**: Vetted contractor vendor organizations.
- **`contractor_contracts`**: Master service contracts and agreements.
- **`contractor_work_orders`**: Operational work orders with authorized worker counts and safety permit flags. Human Reference: `CONT-YYYY-NNNNNN`.
- **`contractor_workers`**: Individual contingent labor badges with trade skills and medical fitness certificates.
- **`contractor_assignments`**: Assignment of workers to specific work orders.
- **`contractor_training_records`**: Site safety induction and trade certifications.
- **`contractor_permits`**: Permit-to-work linkages.
- **`contractor_attendance`**: On-premise shift clock-in/out records.

### 8. Service / Work Domain
- **`service_providers`**: Specialized equipment calibration and maintenance providers.
- **`service_technicians`**: Certified service technicians.
- **`service_work_orders`**: Service execution with equipment tags, inward tool declarations, and completion sign-off. Human Reference: `SRV-YYYY-NNNNNN`.

### 9. Material & Gate Pass Domain
- **`materials`**: Master items catalog (Raw materials, Components, Finished goods, Hazardous solvents).
- **`purchase_orders`**: Procurement reference orders.
- **`material_transactions`**: Freight transport movement records with gross, tare, and net weights. Human Reference: `MAT-YYYY-NNNNNN`.
- **`material_transaction_lines`**: Multi-line item Manifest with returnable tracking.
- **`material_returns`**: Return transactions tracking reusable containers, skids, and rejected materials.
- **`material_gate_passes`**: Digitally signed security exit passes with QR tokens.

### 10. Vehicle & Driver Domain
- **`vehicles`**: Commercial and passenger vehicles with registration plates, fuel types, and makes/models.
- **`drivers`**: Commercial drivers with verified CDL licenses and expiration dates.
- **`transporters`**: Third-party logistics (3PL) carriers.

### 11. Reusable Normalized Transport Model
- **`transport_activities`**: Centralized mobility activity record shared across all 6 business domains. Captures origin, destination, distance, transport mode, vehicle class, fuel type, ownership, occupancy, payload weight, measurement method, and data provenance. Human Reference: `TRN-YYYY-NNNNNN`.

### 12. Centralized Document Domain
- **`documents`**: Document storage vault holding metadata, S3 keys, checksums, MIME types, and encryption flags. Human Reference: `DOC-YYYY-NNNNNN`.
- **`document_links`**: Poly-morphic relationship junction connecting documents to any domain entity (`VISITOR`, `MATERIAL`, `CONTRACTOR`, `VEHICLE`, `EVIDENCE`).

### 13. Safety & Emergency Domain
- **`permits`**: Permit to Work (Hot Work, Confined Space, Working at Height, Electrical Isolation).
- **`emergency_events`**: Active emergency declarations (Fire, Gas Leak, Mass Casualty).
- **`muster_points`**: Designated physical evacuation collection zones.
- **`muster_records`**: Real-time evacuation attendance roll-calls.
- **`missing_person_records`**: Discrepancy accounting for unaccounted personnel during active emergencies.

### 14. Gate & Physical Access Execution (Immutable Ledgers)
- **`gate_transactions`**: Physical movement through entrance/exit barrier.
- **`gate_events`**: **APPEND-ONLY IMMUTABLE LEDGER**. Captures every badge swipe, ANPR read, barrier actuation, and denial. Updates/deletions are strictly prohibited.
- **`gate_decisions`**: Algorithmic decisions rendered by edge access engines.

### 15. ESG & Carbon Accounting Engine (Immutable Calculations & Factors)
- **`ghg_activities`**: Activity records derived from transport and operational events. Scope 1/2/3 classification, data quality level, and calculation status. Human Reference: `GHG-YYYY-NNNNNN`.
- **`emission_factors`**: Benchmark carbon emission factor definitions.
- **`emission_factor_versions`**: **APPEND-ONLY IMMUTABLE LEDGER**. Version-tagged factors (e.g. DEFRA 2025.1, DEFRA 2026.1). Prohibits overwrites to guarantee historical audit reproducibility.
- **`ghg_calculations`**: **APPEND-ONLY IMMUTABLE LEDGER**. Calculated carbon outputs with full input snapshots (`co2e`, `co2`, `ch4`, `n2o`). Updates and deletions are strictly prohibited.

### 16. Outbox, Domain Events & Audit Ledgers
- **`audit_logs`**: **APPEND-ONLY IMMUTABLE LEDGER**. Captures every create, update, delete, role assignment, and administrative change with before and after snapshots.
- **`domain_events`**: **APPEND-ONLY IMMUTABLE LEDGER**. CloudEvents-compliant event stream for asynchronous outbox dispatching and system-wide decoupled event propagation.
