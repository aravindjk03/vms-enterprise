# Security, Multi-Tenant Isolation & Compliance

## 1. Overview & Threat Model

The Customer Management Domain operates in high-security, multi-tenant industrial environments where customer relationships, plant visit agendas, audit findings, and executive travel itineraries represent sensitive competitive intelligence. A security compromise could expose confidential OEM supplier pricing, trade secrets, or physical plant vulnerabilities.

The security architecture of `@vms/customer` is designed around zero-trust and defense-in-depth principles.

---

## 2. Multi-Tenant Data Isolation & Row-Level Security (RLS)

Every database table associated with the Customer Domain (`customer_accounts`, `customer_representatives`, `customer_visit_transactions`, `customer_requirements`, `transport_activities`, `ghg_activities`, `gate_events`) enforces strict multi-tenant isolation:

```mermaid
flowchart TD
    Request([API Request in Tenant Context]) --> RLS{Relational Engine RLS Gate}
    
    RLS --> CheckTenant{record.tenant_id == current_tenant_id?}
    CheckTenant -- Match --> Allow[ALLOW: Record Processed]
    CheckTenant -- Mismatch --> SilentExclude[SILENT EXCLUDE: Row Invisible (findMany)]
    CheckTenant -- Mutation Attempt --> SecurityViolation[SECURITY VIOLATION: Cross-tenant write prohibited]
```

1. **Query Isolation (`findById` / `findMany`):** Records belonging to other tenants are silently excluded and return `null` or empty arrays. Cross-tenant leakage is mathematically impossible at the database driver layer.
2. **Mutation Guard (`update` / `delete` / `insert`):** Attempting to modify or delete a customer record belonging to another tenant immediately raises a fatal security exception (`Cross-tenant modification prohibited`).
3. **Cross-Tenant Account Verification Test:** Verified under automated test suite `tests/customer-domain.test.ts` (Test 10: strictly prevents cross-tenant access to customer accounts and visit transactions).

---

## 3. Role-Based Access Control (RBAC) & Normalized Permissions

The platform enforces fine-grained permission tokens normalized across the enterprise:

| Permission Code | Description | Authorized Roles |
| :--- | :--- | :--- |
| **`CUSTOMER_VIEW`** | Read-only access to customer master accounts and visit registries. | `SUPER_ADMIN`, `PLANT_MANAGER`, `RECEPTIONIST`, `COMMERCIAL_HOST`, `SECURITY_GUARD` |
| **`CUSTOMER_EDIT`** | Create and modify customer accounts, representatives, and visit bookings. | `SUPER_ADMIN`, `COMMERCIAL_HOST`, `SALES_DIRECTOR` |
| **`CUSTOMER_APPROVE`** | Formally authorize scheduled or walk-in customer visits prior to entry. | `SUPER_ADMIN`, `PLANT_MANAGER`, `COMMERCIAL_HOST` |
| **`CUSTOMER_GATE_CHECKIN`** | Perform gate check-in, turnstile badging, and departure operations. | `SUPER_ADMIN`, `SECURITY_GUARD`, `RECEPTIONIST` |
| **`CUSTOMER_LEGAL_VERIFY`** | Execute and verify bilateral NDAs in the legal vault. | `SUPER_ADMIN`, `LEGAL_COUNSEL`, `PLANT_MANAGER` |
| **`CUSTOMER_AUDIT_SIGNOFF`** | Perform formal closure signoffs on quality and process audits. | `SUPER_ADMIN`, `QA_MANAGER`, `PLANT_MANAGER` |

---

## 4. Tamper-Evident Audit Trails & Immutable Ledgers

In compliance with SOC 2 Type II, ISO 27001, and IATF 16949 requirements:
- **`audit_logs`:** Every customer account creation, representative update, visit approval, reschedule offset, cancellation, and overstay breach generates an append-only entry in `audit_logs` with before/after state snapshots.
- **`gate_events`:** Physical entry and exit timestamps, turnstile IDs, and operator IDs are marked `isImmutable: true` in the database engine and cannot be edited or purged.
- **`ghg_calculations`:** Carbon calculation records include cryptographic SHA-256 hashes binding activity quantities to specific emission factor versions for third-party sustainability audits.
