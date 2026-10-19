# VMS Enterprise: Export Security & Data Exfiltration Prevention

## 1. Export Security Principles

Data export features (e.g. CSV, Excel, PDF generation) represent a primary vector for intentional or accidental enterprise data exfiltration. VMS Enterprise strictly governs all export operations through the `ExportSecurityService`:

1. **Explicit Export Entitlements**: Generic read permissions (such as `visitor.read` or `audit.read`) do not automatically authorize mass data export. Dedicated permissions (e.g. `visitor.export`, `audit.export`, `esg.activity.export`) are strictly required.
2. **Mandatory Tenant & Site Boundary Filtering**: Export queries evaluate tenant ownership on every exported row. Cross-tenant records cannot be bundled into an export archive.
3. **Automated Data Minimization**: Export transformers apply the same privacy-by-design field masking as online interactive views. An ESG Manager exporting transport records receives distance and fuel consumption metrics, but personal KYC phone numbers and government IDs are stripped.
4. **Mandatory Forensic Export Audit**: Every export operation records an indelible audit log containing the requesting actor, dataset identifier, row count, filter criteria, and timestamp.

---

## 2. Export Security Flow Diagram (Section 64 - Diagram 9)

```mermaid
sequenceDiagram
    autonumber
    actor User as Corporate User / Auditor
    participant Gateway as SecurityGateway
    participant ExportSec as ExportSecurityService
    participant ABAC as RBAC / ABAC Engine
    participant DB as Relational Database
    participant Audit as Tamper-Evident Audit Ledger

    User->>Gateway: POST /api/v1/export (dataset: "VISITOR", filters: {...})
    Gateway->>ABAC: evaluateAccess(user, "visitor.export", resource)
    alt Lacks Export Permission
        ABAC-->>Gateway: Denied (Role lacks capability visitor.export)
        Gateway-->>User: 403 Forbidden (AUTHORIZATION_DENIED)
    end

    ABAC-->>Gateway: Allowed
    Gateway->>DB: Query Records with Tenant & Site Filters
    DB-->>ExportSec: Raw Dataset Rows
    ExportSec->>ExportSec: Validate Tenant Isolation on Every Single Row
    alt Cross-Tenant Row Injected
        ExportSec-->>Gateway: Fatal Security Violation
        Gateway-->>User: 403 Forbidden (Cross-tenant export violation)
    end

    ExportSec->>ExportSec: Apply Privacy Masking (Redact PII / Biometrics)
    ExportSec->>Audit: Log Export Event (actor, dataset, rowCount, filters)
    ExportSec-->>Gateway: Sanitized Export Artifact (CSV / Excel stream)
    Gateway-->>User: 200 OK (Stream Download with Content-Disposition)
```

---

## 3. Forensic Export Audit Schema

```typescript
export interface ExportResult {
  exportId: string;
  datasetName: string;
  recordCount: number;
  exportedAt: Date;
  data: Array<Record<string, unknown>>;
  auditEvent: {
    exportId: string;
    actorUserId: string;
    datasetName: string;
    recordCount: number;
    filters: Record<string, unknown>;
    timestamp: Date;
  };
}
```
