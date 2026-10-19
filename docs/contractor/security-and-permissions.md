# Contractor Domain Security, Multi-Tenant Isolation & RBAC

## 1. Multi-Tenant Row-Level Security (RLS)

The Contractor Domain operates under strict Row-Level Security (RLS) enforced across the underlying database engine (`RelationalDatabase`).

Every contractor table contains a non-nullable `tenant_id` foreign key:
- Cross-tenant reads return `null` or empty sets.
- Cross-tenant updates or deletions throw immediate security access violations.
- A user authenticated under Tenant A cannot view or manipulate contractor companies, contracts, work orders, worker profiles, or attendance records belonging to Tenant B.

---

## 2. Role-Based Access Control (RBAC) Matrix

Permissions across the Contractor Domain are partitioned by enterprise role according to the principle of least privilege:

| Operation / Feature | SUPER_ADMIN | PROCUREMENT_LEAD | PLANT_ENGINEER | EHS_OFFICER | SECURITY_GUARD | CONTRACTOR_COORD | ESG_MANAGER |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Register Contractor Company** | Yes | Yes | No | No | No | No | No |
| **Manage Commercial Contracts** | Yes | Yes | View Only | View Only | No | View Only | No |
| **Create / Authorize Work Order** | Yes | No | Yes | Review (PTW) | No | View Only | No |
| **Register / Edit Workers** | Yes | No | No | No | No | Yes | No |
| **Verify EHS & Medical Compliance** | Yes | No | View Only | Yes | View Only | View Only | No |
| **Issue / Revoke PTW Permits** | Yes | No | No | Yes | No | No | No |
| **Operate Turnstile Check-In/Out** | Yes | No | No | No | Yes | No | No |
| **Execute Manual Time Correction**| Yes | No | Approval Req | Yes | No | No | No |
| **View Worker Medical Diagnostics**| No (EHS Only) | No | No | Yes (Masked) | No | No | **MASKED** |
| **View Scope 3 Carbon Calculations**| Yes | Yes | View Only | View Only | No | No | Yes |

---

## 3. Privacy & PII Masking Invariants

To comply with data privacy regulations (GDPR, India DPDP Act):
1. **Government Identifiers:** Sensitive identification numbers (Aadhaar, Social Security, National Identity) are never stored in plaintext. They are cryptographically hashed using salted HMAC-SHA256 for duplicate matching.
2. **ESG Manager Role Isolation:** When the `ESG_MANAGER` accesses contractor records:
   - Worker names and phone numbers are redacted / anonymized (`R**** Y****`).
   - Medical diagnostic records are completely omitted.
   - Commuting mode, distance, vehicle class, and calculated emissions are exposed with full transparency.
3. **Audit Trail Logging:** All administrative modifications, state transitions, manual time corrections, and compliance verifications create immutable rows in `system_audit_logs` recording operator ID, IP address, timestamp, and delta changes.
