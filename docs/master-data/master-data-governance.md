# Master Data Governance & Record Versioning Architecture

## 1. Governance Objectives

Enterprise compliance standards (ISO 27001, SOC 2 Type II, GHG Protocol, and statutory EHS audits) require that historical transactions reflect the exact configuration under which they were authorized. Changing a category attribute (e.g. changing the name or risk tier of a zone or contractor qualification) must never alter or invalidate past transactions executed under earlier definitions.

To meet this standard, VMS Enterprise implements a non-destructive versioning architecture for all master data records.

---

## 2. Record Versioning & Immutability Chain

```mermaid
graph TD
    subgraph Master Record Header
        MR[master_data_records<br/>id: md-101<br/>code: VIP_TIER_1<br/>current_version: 3<br/>status: ACTIVE]
    end

    subgraph Immutable Version Ledger
        V1[master_data_versions<br/>version_id: ver-001<br/>version_number: 1<br/>snapshot: { name: 'VIP Guest', escort: false }<br/>changed_by: usr-01<br/>reason: 'Initial creation']
        V2[master_data_versions<br/>version_id: ver-002<br/>version_number: 2<br/>snapshot: { name: 'VIP Executive', escort: true }<br/>changed_by: usr-02<br/>reason: 'Security policy update']
        V3[master_data_versions<br/>version_id: ver-003<br/>version_number: 3<br/>snapshot: { name: 'VIP Executive Dignitary', escort: true }<br/>changed_by: usr-03<br/>reason: 'Protocol refinement']
    end

    MR -->|History Chain| V1
    MR -->|History Chain| V2
    MR -->|History Chain| V3

    subgraph Historical Operational Transactions
        T1[Visitor Tx 2026-01-10<br/>Bound to Version 1] --> V1
        T2[Visitor Tx 2026-03-15<br/>Bound to Version 2] --> V2
        T3[Visitor Tx 2026-10-09<br/>Bound to Version 3] --> V3
    end
```

---

## 3. Versioning Specifications & Audit Storage

### Version Record Schema
```sql
CREATE TABLE IF NOT EXISTS master_data_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES master_data_records(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changed_by VARCHAR(64) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    CONSTRAINT uq_master_data_version UNIQUE (record_id, version_number)
);
```

### Governance Rules
1. **Initial Creation**: Record created at `version = 1`. An immutable snapshot of version 1 is committed simultaneously to `master_data_versions`.
2. **Attribute Updates**: Any modification to `name`, `description`, `parentRecordId`, `sortOrder`, `effectiveFrom`, `effectiveUntil`, or `metadata` increments `version` by +1 and records the full snapshot with the mandatory change justification (`reason`).
3. **No Physical Deletions**: Deleting active master data records is prevented by database foreign key constraints (`ON DELETE RESTRICT`) and application policy. Retiring a record sets its status to `ARCHIVED`.
4. **Audit Trail**: Every creation, update, activation, deactivation, and archive event is logged to the tamper-evident audit ledger with correlation IDs.
