# VMS Enterprise: Data Integrity, Constraints & ACID Guarantees

This document outlines the relational data integrity mechanisms, constraints, check conditions, optimistic locking, and ACID transaction boundaries implemented across VMS Enterprise.

---

## 1. Relational Constraint Architecture

VMS Enterprise relies on strict database-level constraint enforcement rather than depending solely on application-layer validation:

### 1.1 Check Constraints
1. **Weight Non-Negativity & Consistency**:
   ```sql
   ALTER TABLE material_transactions 
   ADD CONSTRAINT chk_material_tx_weights 
   CHECK (
       gross_weight_kg >= 0 AND 
       tare_weight_kg >= 0 AND 
       net_weight_kg >= 0 AND
       gross_weight_kg >= tare_weight_kg
   );
   ```
2. **Transport Distance & Occupancy**:
   ```sql
   ALTER TABLE transport_activities 
   ADD CONSTRAINT chk_transport_distance_positive 
   CHECK (distance >= 0);

   ALTER TABLE transport_activities 
   ADD CONSTRAINT chk_transport_occupancy_positive 
   CHECK (occupancy >= 1);
   ```
3. **Temporal Sanity (Scheduled Start vs End)**:
   ```sql
   ALTER TABLE visitor_transactions 
   ADD CONSTRAINT chk_visitor_schedule_order 
   CHECK (scheduled_end >= scheduled_start);
   ```

### 1.2 Multi-Column Unique Constraints
- `(tenant_id, code)` on organizational entities (`sites`, `departments`, `roles`, `visitor_types`, `materials`).
- `(tenant_id, reference_number)` on all operational transactions.
- `(factor_id, version_tag, geography)` on `emission_factor_versions`.

---

## 2. Optimistic Concurrency & Versioning

All stateful domain entities (`visitor_transactions`, `contractor_work_orders`, `service_work_orders`, `material_transactions`, `customer_visit_transactions`) feature an integer `version` column:

```sql
UPDATE visitor_transactions
SET stage = 'CHECK_IN',
    status = 'ON_PREMISES',
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE transaction_id = '...' 
  AND version = 1;
```
If another operator updated the record concurrently, the `WHERE version = 1` match fails (affected rows = 0), throwing an optimistic concurrency conflict and preventing lost updates.

---

## 3. ACID Transaction Boundaries & Scope Isolation

In the 5-step operational activity capture pipeline:
1. **Steps 1 through 4** execute within a single atomic ACID transaction:
   - Step 1: Create or update domain transaction.
   - Step 2: Create normalized transport activity.
   - Step 3: Create GHG activity record with status `PENDING`.
   - Step 4: Emit domain event to outbox.
   - **Transaction Commit**: If any step 1-4 fails, the entire transaction is rolled back. No partial or corrupted operational state is stored.
2. **Step 5 (GHG Calculation)** is executed asynchronously:
   - Operates in its own transactional scope.
   - If factor lookup fails or requires calculation retries, only the GHG Activity calculation status is updated (`PENDING` or `FAILED`).
   - The operational record remains **100% committed and valid**.

---

## 4. Append-Only Immutability Guards

Immutability on audit logs, gate events, domain events, GHG calculations, and emission factor versions is guaranteed via:

1. **PostgreSQL Event Trigger / Rule**:
   ```sql
   CREATE OR REPLACE RULE prevent_audit_update AS
   ON UPDATE TO audit_logs DO INSTEAD NOTHING;

   CREATE OR REPLACE RULE prevent_audit_delete AS
   ON DELETE TO audit_logs DO INSTEAD NOTHING;
   ```
2. **Application Engine Exception Invariant**:
   Any invocation of `db.update(...)` or `db.delete(...)` targeting immutable tables throws an immediate fatal error:
   `Fatal Immutability Violation: updates are strictly prohibited on append-only table '...'`
