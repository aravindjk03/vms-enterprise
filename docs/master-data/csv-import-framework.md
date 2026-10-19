# Bulk CSV Import Framework & Ingestion Pipeline

## 1. Architectural Purpose

To facilitate enterprise onboarding and batch synchronization from external ERPs (SAP, Oracle, Workday) without custom integrations, VMS Enterprise provides a high-integrity CSV import framework. The import engine enforces strict row-level validation, multi-tenant isolation, format normalization, and atomic transactional ingestion with comprehensive error feedback.

---

## 2. CSV Ingestion Pipeline Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Tenant Administrator
    participant UI as Master Data View UI
    participant Service as MasterDataService
    participant Validator as Zod Schema & Rule Validator
    participant Repo as MasterDataRepository
    participant Audit as Tamper-Evident Audit Ledger

    Admin->>UI: Select Category & Upload CSV File
    UI->>Service: parseCsv(csvText)
    Service-->>UI: Normalized Array of Import Rows
    
    UI->>Service: previewImport(categoryCode, rows, userContext)
    Service->>Validator: Validate Schema, Format & Alphanumeric Codes
    Service->>Repo: Check Duplicate Codes in Tenant Partition
    
    alt Errors Detected
        Service-->>UI: Return Diagnostics (Row Numbers, Field Names, Errors)
        UI-->>Admin: Display Validation Error Table (Import Blocked)
    else All Rows Valid
        Service-->>UI: Return Preview Summary (Valid Rows Count, 0 Errors)
        Admin->>UI: Confirm "Execute Import"
        UI->>Service: executeImport(categoryCode, rows, userContext)
        loop For Each Row
            Service->>Repo: createRecord(recordData, tenantId)
            Service->>Repo: saveVersion(initialSnapshot)
        end
        Service->>Audit: Record MASTER_DATA_IMPORT_CSV Audit Entry
        Service-->>UI: Return MasterDataImportResult
        UI-->>Admin: Display Success Banner & Refresh Record Table
    end
```

---

## 3. CSV Formatting Specifications

### Standard Column Headers
The CSV header row must provide:
```csv
Code,Name,Description,SortOrder,EffectiveFrom,EffectiveUntil,SiteCode,ParentCode
```

### Strict Validation Invariants
1. **Header Normalization**: Headers are parsed case-insensitively and whitespace-trimmed. Columns `Code` and `Name` are strictly mandatory.
2. **Code Canonicalization**: Record codes are converted to uppercase. Only alphanumeric characters, dashes, dots, and underscores (`^[A-Z0-9_\-\.]+$`) are permitted.
3. **In-File Deduplication**: Multiple occurrences of the same code within the single CSV submission are flagged and rejected immediately.
4. **Database Deduplication**: Codes are compared against active and draft records within the tenant's partition. Existing codes trigger an explicit conflict diagnosis.
5. **Atomic Transactional Rollback**: If strict mode is enabled, any individual row failure prevents all rows from committing to the database.
6. **Auditability**: Every import generates a unique `importId` and an immutable tamper-evident audit record documenting the actor, row count, and snapshot.
