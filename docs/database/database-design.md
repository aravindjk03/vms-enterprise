# VMS Enterprise: Relational Database Architecture & Design Standards

This document describes the architectural conventions, design standards, and PostgreSQL 16+ engine configurations established for VMS Enterprise.

---

## 1. Engine & Extension Standards

VMS Enterprise is optimized for **PostgreSQL 16+** with the following required database extensions enabled in migration `001_initial_schema.sql`:

1. **`uuid-ossp` / `pgcrypto`**:
   - Generates cryptographically secure Version 4 UUIDs (`uuid_generate_v4()`, `gen_random_uuid()`).
   - Standard primary key type across all relational entities to guarantee zero-collision distributed record creation.
2. **`citext`**:
   - Case-insensitive text types for natural keys (e.g. usernames, email addresses, business codes) preventing duplication caused by casing discrepancies.
3. **`btree_gist`**:
   - Temporal range exclusions preventing overlapping visitor schedules or double-booked gate reservations.

---

## 2. Naming Conventions & Schema Standards

1. **Identifier Casing**:
   - Strictly lowercase `snake_case` for all table names, column names, constraint names, and index names.
   - Plural table names (`tenants`, `persons`, `visitor_transactions`, `gate_events`).
2. **Primary Keys**:
   - Every table features an explicit primary key column named `<entity>_id` or `id` of type `UUID`.
3. **Human-Readable Reference Numbers**:
   - Operational entities carry a mandatory alphanumeric reference code for human display, paper gate passes, QR codes, and radio communication:
     - Visitors: `VIS-YYYY-NNNNNN` (e.g., `VIS-2026-000123`)
     - Customers: `CUST-YYYY-NNNNNN` (e.g., `CUST-2026-000456`)
     - Contractors: `CONT-YYYY-NNNNNN` (e.g., `CONT-2026-000789`)
     - Services: `SRV-YYYY-NNNNNN` (e.g., `SRV-2026-000234`)
     - Materials: `MAT-YYYY-NNNNNN` (e.g., `MAT-2026-000567`)
     - Transport: `TRN-YYYY-NNNNNN` (e.g., `TRN-2026-000890`)
     - GHG Activity: `GHG-YYYY-NNNNNN` (e.g., `GHG-2026-000345`)
4. **Temporal Standards**:
   - All timestamp columns use `TIMESTAMPTZ` (timestamp with time zone) and default to `CURRENT_TIMESTAMP`.
   - UTC is the mandatory database storage timezone. Local representation is resolved using the site's `timezone` column (e.g. `America/Detroit`, `Asia/Kolkata`).
5. **Precise Numerics**:
   - Financial amounts, carbon figures (`co2e`, `co2`, `ch4`, `n2o`), weights, and emission factors use exact `NUMERIC(18,6)` or `NUMERIC(14,4)` to eliminate floating-point rounding errors.

---

## 3. Multi-Tenant Row-Level Security (RLS) Architecture

VMS Enterprise enforces a zero-trust multi-tenant isolation model at the database engine level via PostgreSQL Row-Level Security:

1. **Mandatory Tenant Scoping Column**:
   - Every tenant-owned table includes a `tenant_id UUID NOT NULL REFERENCES tenants(tenant_id)` column.
2. **Row-Level Security Policies**:
   ```sql
   ALTER TABLE visitor_transactions ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY tenant_isolation_policy ON visitor_transactions
       FOR ALL
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
       WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
   ```
3. **Application Session Injection**:
   - Connection pools (e.g. PgBouncer) or application data mappers inject the tenant context upon connection acquisition:
     ```sql
     SET LOCAL app.current_tenant_id = '00000000-0000-0000-0000-000000000001';
     ```
   - Queries executed without a tenant context return 0 rows by default, making accidental cross-tenant data leaks impossible.

---

## 4. Append-Only Immutability Guardrails

Five critical ledgers in the architecture are designated **Append-Only Immutable Ledgers**:
1. `audit_logs`
2. `gate_events`
3. `domain_events`
4. `ghg_calculations`
5. `emission_factor_versions`

To guarantee compliance with Sarbanes-Oxley, ISO 27001, and GHG Protocol standards:
- Row updates (`UPDATE`) and deletions (`DELETE`) are strictly blocked via PostgreSQL database triggers and application ORM invariants.
- Attempts to alter calculation results or historical factor versions raise immediate fatal database exceptions.
- Any correction must be modeled as a new append record superseding the previous version with an explicit reason code.
