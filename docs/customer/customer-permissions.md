# Customer Management Domain Permissions & RBAC Matrix

## 1. Permission Keys

Customer management defines distinct granular permission actions within `@vms/permissions`:

| Permission Key | Legacy Action | Description |
| :--- | :--- | :--- |
| `customer.read` | `CUSTOMER_READ` | Read access to customer accounts, reps, visits, and delegation summaries. |
| `customer.create` | `CUSTOMER_WRITE` | Create and register customer accounts, reps, and visit appointments. |
| `customer.update` | `CUSTOMER_WRITE` | Update existing customer accounts, contact details, and requirements. |
| `customer.approve` | `CUSTOMER_APPROVE` | Approve, reject, or request changes on customer visits. |
| `customer.export` | `CUSTOMER_READ` | Export customer datasets with PII sanitization and forensic audit trail. |
| `customer_accounts.export`| `CUSTOMER_READ` | Granular permission to export customer accounts ledger. |
| `customer_visits.export` | `CUSTOMER_READ` | Granular permission to export customer visit transaction ledger. |

---

## 2. Enterprise Role Mapping Matrix

| Role | `customer.read` | `customer.create` | `customer.update` | `customer.approve` | Export Permissions |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SUPER_ADMIN` | Yes | Yes | Yes | Yes | Yes |
| `ORGANIZATION_ADMIN`| Yes | Yes | Yes | Yes | No |
| `SITE_ADMIN` | Yes | Yes | Yes | Yes | Yes |
| `MANAGEMENT` | Yes | No | No | Yes | Yes |
| `HOST` | Yes | Yes | Yes | Yes (Own visits) | No |
| `SECURITY_GUARD` | Yes (Visits only) | No | No | No | No |
| `RECEPTIONIST` | Yes | Yes (Reps only) | No | No | No |
| `AUDITOR` | Yes (Read only) | No | No | No | No |
| `ESG_MANAGER` | Yes (Masked PII) | No | No | No | No |

---

## 3. Segregation of Duties (SoD)

To prevent commercial fraud and security policy circumvention:
1. **Self-Approval Prohibition:** A host user who creates a visit cannot self-approve the visit if higher-tier audit or hazardous zone approvals are mandated.
2. **Security vs Commercial Separation:** Frontline security guards (`SECURITY_GUARD`) can actuate gate check-ins and verify physical presence, but cannot modify customer account commercial tiers or classifications.
3. **Audit Ledger Immutability:** Audit logs recording account modifications and visit cancellations cannot be updated or deleted by any user, including `SUPER_ADMIN`.
