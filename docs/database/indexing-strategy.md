# VMS Enterprise: Relational Indexing Strategy & Performance Tuning

This document details the index architecture, composite B-tree layouts, and query path optimizations designed for sub-10 millisecond database operations in high-throughput industrial environments.

---

## 1. Indexing Philosophy & Cardinality Ordering

To ensure optimal index utilization under multi-tenant Row-Level Security, composite B-tree indexes follow strict leftmost-prefix rules:

1. **Rule 1 — Tenant-Prefixing**:
   Every composite index on a tenant-scoped table places `tenant_id` as the **first (leftmost) column**. This allows the PostgreSQL query planner to immediately prune index tree walks to the specific tenant partition.
2. **Rule 2 — High-to-Low Cardinality Ordering**:
   Within a composite index, columns are ordered from highest selectivity (unique reference IDs, person IDs) to lowest selectivity (status flags, dates).
3. **Rule 3 — Covering Indexes with `INCLUDE`**:
   High-frequency read queries utilize index-only scans via the `INCLUDE` clause to avoid costly table heap fetches during badge swipes and fast lookups.

---

## 2. Critical Query Path Indexes

### 2.1 Fast Physical Gate & Security Lookups (<5ms target)
- **Active Badge Lookup**:
  ```sql
  CREATE INDEX idx_access_credentials_lookup 
  ON access_credentials (tenant_id, identifier_token) 
  INCLUDE (credential_type, valid_to, status);
  ```
  *Query Path:* Edge gate scanner verifies RFID badge or QR token on barrier approach.

- **Vehicle Plate Recognition**:
  ```sql
  CREATE INDEX idx_vehicles_plate_lookup 
  ON vehicles (tenant_id, registration_plate) 
  INCLUDE (vehicle_type_id, status);
  ```
  *Query Path:* ANPR optical camera scans incoming delivery truck.

### 2.2 Operational Search & Filtering
- **Visitor Search by Reference & Site**:
  ```sql
  CREATE INDEX idx_visitor_tx_site_status 
  ON visitor_transactions (tenant_id, site_id, status, scheduled_start);
  ```
  *Query Path:* Reception desk dashboard filtering today's expected visitors.

- **Contractor Worker Active Shift**:
  ```sql
  CREATE INDEX idx_contractor_attendance_active 
  ON contractor_attendance (tenant_id, site_id, clock_out_time) 
  WHERE clock_out_time IS NULL;
  ```
  *Query Path:* Real-time site headcount and evacuation muster rolls.

- **Material Freight Manifest & Inward Inbounds**:
  ```sql
  CREATE INDEX idx_material_tx_site_stage 
  ON material_transactions (tenant_id, site_id, stage, created_at);
  ```
  *Query Path:* Inward weighbridge queue and dispatch dock scheduling.

### 2.3 ESG Activity & GHG Provenance Traversal
- **GHG Activity by Source Transaction**:
  ```sql
  CREATE INDEX idx_ghg_activities_source 
  ON ghg_activities (tenant_id, source_domain, source_transaction_id);
  ```
  *Query Path:* Traceability engine resolving carbon footprints from an operational transaction.

- **Transport Activity by Source**:
  ```sql
  CREATE INDEX idx_transport_activities_source 
  ON transport_activities (tenant_id, source_domain, source_transaction_id);
  ```
  *Query Path:* Loading transport telemetry for a specific visit, freight, or commute.

- **Emission Factor Version Lookup**:
  ```sql
  CREATE INDEX idx_ef_versions_lookup 
  ON emission_factor_versions (factor_id, version_tag, geography, reporting_year);
  ```
  *Query Path:* Asynchronous calculation pipeline resolving exact historical emission factor.

### 2.4 Immutable Ledgers & Audit Queries
- **Entity Audit Log Traversal**:
  ```sql
  CREATE INDEX idx_audit_logs_entity 
  ON audit_logs (tenant_id, entity_type, entity_id, timestamp DESC);
  ```
  *Query Path:* Complete change history inspector in Admin & Auditor UI.

- **Gate Event Hardware Stream**:
  ```sql
  CREATE INDEX idx_gate_events_stream 
  ON gate_events (tenant_id, gate_id, event_timestamp DESC);
  ```
  *Query Path:* Real-time gate telemetry monitor and security alert feeds.

---

## 3. Maintenance, Monitoring & Index Bloat Prevention

1. **Fillfactor Optimization**:
   Append-only tables (`audit_logs`, `gate_events`, `ghg_calculations`) use default `fillfactor = 100` to maximize page density and cache hit rates. Tables with frequent updates (`visitor_transactions`, `contractor_work_orders`) use `fillfactor = 90` to allow HOT (Heap-Only Tuples) updates and eliminate index churn.
2. **Periodic `REINDEX CONCURRENTLY`**:
   Scheduled maintenance scripts execute concurrent reindexing during low-traffic windows to clean up dead index pages on high-turnover tables.
