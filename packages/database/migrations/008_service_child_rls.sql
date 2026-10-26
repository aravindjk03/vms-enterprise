-- ============================================================================
-- 008 — Row-level security for the legacy service_work_locations child table
-- ============================================================================
-- service_work_locations (from 001) has no tenant_id, so 006/007 could not attach the
-- tenant_read/tenant_write policy pair and the runtime role could read or write rows of
-- every tenant. Part 9 keeps the work location on service_work_orders, but the table
-- stays (no data is dropped). Its rows are now scoped through the parent work order:
-- the EXISTS subquery runs under service_work_orders' own tenant policy, so only the
-- current tenant's work orders are visible to it.
-- ============================================================================

ALTER TABLE service_work_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_parent ON service_work_locations;
CREATE POLICY tenant_parent ON service_work_locations FOR ALL
    USING (EXISTS (SELECT 1 FROM service_work_orders w WHERE w.work_order_id = service_work_locations.work_order_id))
    WITH CHECK (EXISTS (SELECT 1 FROM service_work_orders w WHERE w.work_order_id = service_work_locations.work_order_id));
