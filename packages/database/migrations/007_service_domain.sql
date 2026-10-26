-- ============================================================================
-- VMS ENTERPRISE PRODUCTION RELATIONAL SCHEMA (PostgreSQL 16+)
-- Migration 007: Service / Work Management domain (Part 9)
--
-- Evolves the Part 3 service tables in place (no data is dropped) and adds:
--   provider categories/sites, request & work-order lifecycle columns,
--   deliverables, assignments, recurring schedules & occurrences,
--   append-only progress events & status history, completion records,
--   exceptions, and journey links (one physical journey -> many work orders).
-- Shared platform additions used by this and later parts:
--   apply_tenant_rls(), transport/GHG nullability for unknown facts, journey
--   fingerprint de-duplication, durable outbox claiming, API idempotency keys.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Shared helpers
-- ----------------------------------------------------------------------------

-- Same policy pair as migration 006, reusable for every new tenant table.
CREATE OR REPLACE FUNCTION apply_tenant_rls(p_table regclass)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', p_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_read ON %s', p_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_write ON %s', p_table);
    EXECUTE format(
        'CREATE POLICY tenant_read ON %s FOR SELECT USING (tenant_id IS NULL OR tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::UUID)',
        p_table);
    EXECUTE format(
        'CREATE POLICY tenant_write ON %s FOR ALL USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::UUID) WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::UUID)',
        p_table);
END;
$$;

-- Generic append-only guard (re-uses the ledger trigger function from 006).
CREATE OR REPLACE FUNCTION make_append_only(p_table regclass)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_name TEXT := replace(p_table::TEXT, '.', '_');
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_append_only ON %s', v_name, p_table);
    EXECUTE format(
        'CREATE TRIGGER trg_%s_append_only BEFORE UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation()',
        v_name, p_table);
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. Service providers (canonical external organization + relationship terms)
-- ----------------------------------------------------------------------------

ALTER TABLE service_providers
    ADD COLUMN IF NOT EXISTS internal_owner_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS agreement_reference VARCHAR(128),
    ADD COLUMN IF NOT EXISTS effective_from DATE,
    ADD COLUMN IF NOT EXISTS effective_to DATE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(64);

DO $$ BEGIN
    ALTER TABLE service_providers ADD CONSTRAINT ck_service_provider_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE service_providers ADD CONSTRAINT ck_service_provider_dates
        CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    -- One relationship per organization per tenant: a company that is also a contractor keeps one identity.
    ALTER TABLE service_providers ADD CONSTRAINT uq_service_provider_org UNIQUE (tenant_id, external_org_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS service_provider_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES service_providers(service_provider_id) ON DELETE CASCADE,
    category_code VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_provider_category UNIQUE (service_provider_id, category_code)
);

CREATE TABLE IF NOT EXISTS service_provider_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES service_providers(service_provider_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_provider_site UNIQUE (service_provider_id, site_id)
);

-- Backfill the legacy single category into the category table.
INSERT INTO service_provider_categories (tenant_id, service_provider_id, category_code)
SELECT tenant_id, service_provider_id, upper(regexp_replace(service_category, '[^A-Za-z0-9]+', '_', 'g'))
  FROM service_providers
 WHERE service_category IS NOT NULL
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Technician relationships (person <-> provider; the person stays canonical)
-- ----------------------------------------------------------------------------

ALTER TABLE service_technicians ALTER COLUMN certification_level DROP NOT NULL;
ALTER TABLE service_technicians ALTER COLUMN badge_id DROP NOT NULL;
ALTER TABLE service_technicians
    ADD COLUMN IF NOT EXISTS effective_from DATE,
    ADD COLUMN IF NOT EXISTS effective_to DATE,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64);

DO $$ BEGIN
    ALTER TABLE service_technicians ADD CONSTRAINT uq_service_technician_person UNIQUE (service_provider_id, person_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE service_technicians ADD CONSTRAINT ck_service_technician_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 3. Service requests (the request for work)
-- ----------------------------------------------------------------------------

ALTER TABLE service_requests ALTER COLUMN service_provider_id DROP NOT NULL; -- now "suggested provider"
ALTER TABLE service_requests ALTER COLUMN equipment_tag DROP NOT NULL;
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS requested_by_user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(32),
    ADD COLUMN IF NOT EXISTS service_category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS requested_date DATE,
    ADD COLUMN IF NOT EXISTS preferred_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS preferred_end TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS work_location VARCHAR(255),
    ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS deliverables TEXT,
    ADD COLUMN IF NOT EXISTS prerequisites TEXT,
    ADD COLUMN IF NOT EXISTS safety_permit_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS stage VARCHAR(32) NOT NULL DEFAULT 'APPROVAL',
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS decided_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS decision_remarks TEXT,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(64);

-- Legacy 'OPEN' requests are awaiting a decision.
UPDATE service_requests SET status = 'SUBMITTED' WHERE status = 'OPEN';
ALTER TABLE service_requests ALTER COLUMN status SET DEFAULT 'SUBMITTED';

DO $$ BEGIN
    ALTER TABLE service_requests ADD CONSTRAINT ck_service_request_status
        CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'WORK_ORDERED', 'FULFILLED', 'CANCELLED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE service_requests ADD CONSTRAINT ck_service_request_priority
        CHECK (priority IN ('LOW', 'STANDARD', 'HIGH', 'CRITICAL'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE service_requests ADD CONSTRAINT ck_service_request_window
        CHECK (preferred_end IS NULL OR preferred_start IS NULL OR preferred_end > preferred_start);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_service_requests_tenant_status ON service_requests (tenant_id, site_id, status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Service work orders (the authorized service activity)
-- ----------------------------------------------------------------------------

ALTER TABLE service_work_orders ALTER COLUMN equipment_tag DROP NOT NULL;
ALTER TABLE service_work_orders
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(32),
    ADD COLUMN IF NOT EXISTS service_category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS priority VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    ADD COLUMN IF NOT EXISTS work_location VARCHAR(255),
    ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
    ADD COLUMN IF NOT EXISTS safety_permit_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS prerequisites TEXT,
    ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

UPDATE service_work_orders SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING';
ALTER TABLE service_work_orders ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL';

DO $$ BEGIN
    ALTER TABLE service_work_orders ADD CONSTRAINT ck_service_wo_status CHECK (status IN (
        'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD',
        'COMPLETION_SUBMITTED', 'COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE service_work_orders ADD CONSTRAINT ck_service_wo_window CHECK (scheduled_end > scheduled_start);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_service_wo_tenant_status ON service_work_orders (tenant_id, site_id, status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_service_wo_request ON service_work_orders (request_id);

-- Required deliverables / evidence per work order
CREATE TABLE IF NOT EXISTS service_work_order_deliverables (
    deliverable_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    evidence_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    satisfied_at TIMESTAMPTZ,
    satisfied_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    evidence_note TEXT,
    evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_deliverables_wo ON service_work_order_deliverables (work_order_id);

-- ----------------------------------------------------------------------------
-- 5. Recurring schedules and occurrences
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES service_providers(service_provider_id) ON DELETE RESTRICT,
    request_id UUID REFERENCES service_requests(request_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    scope_of_work TEXT NOT NULL,
    service_type VARCHAR(32) NOT NULL DEFAULT 'PREVENTIVE_MAINTENANCE',
    service_category VARCHAR(64) NOT NULL,
    work_location VARCHAR(255),
    maintenance_lead_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    frequency VARCHAR(16) NOT NULL,           -- DAILY | WEEKLY | MONTHLY
    interval_count INTEGER NOT NULL DEFAULT 1,
    by_weekdays SMALLINT[],                    -- ISO weekday 1..7 for WEEKLY
    day_of_month SMALLINT,                     -- 1..28 for MONTHLY (avoids short months)
    start_date DATE NOT NULL,
    end_date DATE,
    window_start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    deliverables TEXT[] NOT NULL DEFAULT '{}',
    safety_permit_required BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    approved_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_schedule_ref UNIQUE (tenant_id, reference_number),
    CONSTRAINT ck_service_schedule_frequency CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    CONSTRAINT ck_service_schedule_interval CHECK (interval_count BETWEEN 1 AND 52),
    CONSTRAINT ck_service_schedule_dom CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 28),
    CONSTRAINT ck_service_schedule_duration CHECK (duration_minutes BETWEEN 15 AND 1440),
    CONSTRAINT ck_service_schedule_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT ck_service_schedule_status CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'))
);

CREATE TABLE IF NOT EXISTS service_occurrences (
    occurrence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES service_schedules(schedule_id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    planned_start TIMESTAMPTZ NOT NULL,
    planned_end TIMESTAMPTZ NOT NULL,
    work_order_id UUID REFERENCES service_work_orders(work_order_id) ON DELETE SET NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'GENERATED',
    missed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Idempotent generation: one occurrence per schedule per date, however often generation runs.
    CONSTRAINT uq_service_occurrence UNIQUE (schedule_id, occurrence_date),
    CONSTRAINT ck_service_occurrence_status CHECK (status IN ('GENERATED', 'MISSED', 'COMPLETED', 'CANCELLED'))
);

ALTER TABLE service_work_orders
    ADD COLUMN IF NOT EXISTS occurrence_id UUID REFERENCES service_occurrences(occurrence_id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_wo_occurrence ON service_work_orders (occurrence_id) WHERE occurrence_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. Technician assignments
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES service_technicians(technician_id) ON DELETE RESTRICT,
    assignment_role VARCHAR(32) NOT NULL DEFAULT 'TECHNICIAN',
    planned_start TIMESTAMPTZ NOT NULL,
    planned_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ASSIGNED',
    conflict_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT uq_service_assignment UNIQUE (work_order_id, technician_id),
    CONSTRAINT ck_service_assignment_window CHECK (planned_end > planned_start),
    CONSTRAINT ck_service_assignment_status CHECK (status IN ('ASSIGNED', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_service_assignments_tech_time ON service_assignments (technician_id, planned_start, planned_end) WHERE status = 'ASSIGNED';

-- ----------------------------------------------------------------------------
-- 7. Progress events, status history, completion, exceptions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_progress_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE RESTRICT,
    technician_id UUID REFERENCES service_technicians(technician_id) ON DELETE RESTRICT,
    event_type VARCHAR(32) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    status_before VARCHAR(32),
    status_after VARCHAR(32),
    outcome VARCHAR(32),
    comment TEXT,
    evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    corrects_event_id UUID REFERENCES service_progress_events(event_id) ON DELETE RESTRICT,
    source VARCHAR(16) NOT NULL DEFAULT 'MANUAL',
    CONSTRAINT ck_service_progress_type CHECK (event_type IN (
        'TECHNICIAN_ASSIGNED', 'ARRIVED', 'PREREQUISITES_CHECKED', 'WORK_STARTED', 'WORK_PAUSED', 'WORK_RESUMED',
        'EVIDENCE_ATTACHED', 'COMPLETION_SUBMITTED', 'COMPLETION_ACCEPTED', 'COMPLETION_RETURNED',
        'CLOSED', 'DEPARTED', 'CANCELLED', 'CORRECTION'))
);
CREATE INDEX IF NOT EXISTS idx_service_progress_wo ON service_progress_events (work_order_id, occurred_at);

CREATE TABLE IF NOT EXISTS service_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    entity_type VARCHAR(32) NOT NULL,          -- SERVICE_REQUEST | SERVICE_WORK_ORDER | SERVICE_SCHEDULE | SERVICE_OCCURRENCE
    entity_id UUID NOT NULL,
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    actor_user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_status_history_entity ON service_status_history (entity_type, entity_id, changed_at);

CREATE TABLE IF NOT EXISTS service_completion_records (
    completion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE RESTRICT,
    submitted_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    work_summary TEXT NOT NULL,
    decision VARCHAR(16),                      -- ACCEPTED | RETURNED (NULL while pending)
    decided_by_user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    decided_at TIMESTAMPTZ,
    decision_remarks TEXT,
    CONSTRAINT ck_service_completion_decision CHECK (decision IS NULL OR decision IN ('ACCEPTED', 'RETURNED')),
    CONSTRAINT ck_service_completion_sod CHECK (decided_by_user_id IS NULL OR decided_by_user_id <> submitted_by_user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_completion_pending ON service_completion_records (work_order_id) WHERE decision IS NULL;

CREATE TABLE IF NOT EXISTS service_exceptions (
    exception_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES service_work_orders(work_order_id) ON DELETE RESTRICT,
    request_id UUID REFERENCES service_requests(request_id) ON DELETE RESTRICT,
    occurrence_id UUID REFERENCES service_occurrences(occurrence_id) ON DELETE RESTRICT,
    exception_type VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    raised_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    raised_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution TEXT,
    CONSTRAINT uq_service_exception_ref UNIQUE (tenant_id, reference_number),
    CONSTRAINT ck_service_exception_type CHECK (exception_type IN (
        'MISSED_OCCURRENCE', 'OVERDUE', 'PROVIDER_NO_SHOW', 'SCOPE_CHANGE', 'SAFETY_CONCERN',
        'QUALITY_ISSUE', 'ACCESS_ISSUE', 'OTHER')),
    CONSTRAINT ck_service_exception_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_service_exception_status CHECK (status IN ('OPEN', 'RESOLVED')),
    CONSTRAINT ck_service_exception_subject CHECK (work_order_id IS NOT NULL OR request_id IS NOT NULL OR occurrence_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_exception_missed ON service_exceptions (occurrence_id)
    WHERE exception_type = 'MISSED_OCCURRENCE';

-- ----------------------------------------------------------------------------
-- 8. Transport & activity capture (shared model, nullable unknowns, de-duplication)
-- ----------------------------------------------------------------------------

-- Unknown facts must be storable as unknown rather than invented.
ALTER TABLE transport_activities ALTER COLUMN distance DROP NOT NULL;
ALTER TABLE transport_activities ALTER COLUMN origin_location_name DROP NOT NULL;
ALTER TABLE transport_activities ALTER COLUMN destination_location_name DROP NOT NULL;
-- Migration 001 filled missing facts with invented defaults (e.g. measurement_method 'GIS_ROUTING',
-- occupancy 1, direction 'INBOUND'). Unknown must stay unknown, so these become nullable without defaults.
ALTER TABLE transport_activities ALTER COLUMN usage_type DROP NOT NULL;
ALTER TABLE transport_activities ALTER COLUMN usage_type DROP DEFAULT;
ALTER TABLE transport_activities ALTER COLUMN occupancy DROP NOT NULL;
ALTER TABLE transport_activities ALTER COLUMN occupancy DROP DEFAULT;
ALTER TABLE transport_activities ALTER COLUMN direction DROP NOT NULL;
ALTER TABLE transport_activities ALTER COLUMN direction DROP DEFAULT;
ALTER TABLE transport_activities ALTER COLUMN measurement_method DROP DEFAULT;
ALTER TABLE transport_activities ALTER COLUMN distance_unit DROP NOT NULL;
ALTER TABLE transport_activities ALTER COLUMN distance_unit DROP DEFAULT;
ALTER TABLE transport_activities ALTER COLUMN data_source DROP DEFAULT;
ALTER TABLE transport_activities ALTER COLUMN journey_type DROP DEFAULT;
ALTER TABLE transport_activities
    ADD COLUMN IF NOT EXISTS journey_fingerprint CHAR(64),
    ADD COLUMN IF NOT EXISTS data_completeness VARCHAR(16),
    ADD COLUMN IF NOT EXISTS missing_facts TEXT[],
    ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES transport_activities(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS supersedes UUID REFERENCES transport_activities(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS correction_reason TEXT,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64);

-- 001 allowed a single transport activity per source transaction, which cannot represent two technicians
-- (or two days) travelling for one work order. Physical-journey identity is enforced by the fingerprint below.
ALTER TABLE transport_activities DROP CONSTRAINT IF EXISTS uq_transport_source;
CREATE INDEX IF NOT EXISTS idx_transport_activities_source_tx ON transport_activities (tenant_id, source_domain, source_transaction_id);

-- One current record per physical journey (same traveller, day, route, mode, direction).
CREATE UNIQUE INDEX IF NOT EXISTS uq_transport_activity_journey ON transport_activities (tenant_id, journey_fingerprint)
    WHERE journey_fingerprint IS NOT NULL AND superseded_by IS NULL;

ALTER TABLE ghg_activities ALTER COLUMN quantity DROP NOT NULL;
ALTER TABLE ghg_activities ALTER COLUMN quantity_unit DROP NOT NULL;
-- Data quality must be derived from provenance, never assumed ('MEASURED' was the 001 default).
ALTER TABLE ghg_activities ALTER COLUMN data_quality DROP NOT NULL;
ALTER TABLE ghg_activities ALTER COLUMN data_quality DROP DEFAULT;
ALTER TABLE ghg_activities
    ADD COLUMN IF NOT EXISTS transport_activity_id UUID REFERENCES transport_activities(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS source_entity_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS missing_facts TEXT[],
    ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES ghg_activities(id) ON DELETE RESTRICT;

-- 001 allowed one GHG activity per (source transaction, activity type); a work order with two
-- technicians' journeys, or a corrected journey, legitimately has several. Idempotency is per
-- transport activity instead (lookup index idx_ghg_act_source remains).
ALTER TABLE ghg_activities DROP CONSTRAINT IF EXISTS uq_ghg_source;

-- Idempotent capture: at most one GHG activity per transport activity.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ghg_activity_transport ON ghg_activities (transport_activity_id)
    WHERE transport_activity_id IS NOT NULL;

-- Canonical FK association: one physical journey may serve several work orders.
CREATE TABLE IF NOT EXISTS service_work_order_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE RESTRICT,
    transport_activity_id UUID NOT NULL REFERENCES transport_activities(id) ON DELETE RESTRICT,
    technician_id UUID REFERENCES service_technicians(technician_id) ON DELETE RESTRICT,
    association_role VARCHAR(16) NOT NULL DEFAULT 'PRIMARY', -- PRIMARY (originating) | SHARED (same physical trip)
    linked_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_wo_journey UNIQUE (work_order_id, transport_activity_id),
    CONSTRAINT ck_service_wo_journey_role CHECK (association_role IN ('PRIMARY', 'SHARED'))
);
CREATE INDEX IF NOT EXISTS idx_service_wo_journeys_activity ON service_work_order_journeys (transport_activity_id);

-- ----------------------------------------------------------------------------
-- 9. Durable outbox processing (claimed across tenants by the platform worker)
-- ----------------------------------------------------------------------------

ALTER TABLE workflow_outbox_events
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_idempotency ON workflow_outbox_events (tenant_id, event_type, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outbox_claim ON workflow_outbox_events (status, next_attempt_at) WHERE status IN ('PENDING', 'PROCESSING');

-- The worker has no tenant context when it looks for work, so claiming is a narrow
-- SECURITY DEFINER function: it returns only ids/tenants/types and marks rows PROCESSING.
-- Each claimed event is then handled inside its own tenant-scoped transaction.
CREATE OR REPLACE FUNCTION outbox_claim(p_event_types TEXT[], p_limit INTEGER, p_stale_after_seconds INTEGER DEFAULT 300)
RETURNS TABLE (outbox_id UUID, tenant_id UUID, event_type VARCHAR, retry_count INTEGER)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    UPDATE workflow_outbox_events o
       SET status = 'PROCESSING', locked_at = CURRENT_TIMESTAMP
     WHERE o.outbox_id IN (
            SELECT e.outbox_id FROM workflow_outbox_events e
             WHERE e.event_type = ANY(p_event_types)
               AND ((e.status = 'PENDING' AND e.next_attempt_at <= CURRENT_TIMESTAMP)
                 OR (e.status = 'PROCESSING' AND e.locked_at < CURRENT_TIMESTAMP - make_interval(secs => p_stale_after_seconds)))
             ORDER BY e.next_attempt_at
             LIMIT LEAST(p_limit, 100)
             FOR UPDATE SKIP LOCKED)
    RETURNING o.outbox_id, o.tenant_id, o.event_type, o.retry_count;
$$;
REVOKE ALL ON FUNCTION outbox_claim(TEXT[], INTEGER, INTEGER) FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- 10. API idempotency keys (safe client retries of POST requests)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) NOT NULL,
    request_method VARCHAR(8) NOT NULL,
    request_path VARCHAR(512) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    response_status INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_api_idempotency UNIQUE (tenant_id, user_id, idempotency_key)
);

-- ----------------------------------------------------------------------------
-- 11. Row-level security, append-only, grants, roles
-- ----------------------------------------------------------------------------

SELECT apply_tenant_rls(t::regclass) FROM unnest(ARRAY[
    'service_provider_categories', 'service_provider_sites', 'service_work_order_deliverables',
    'service_schedules', 'service_occurrences', 'service_assignments', 'service_progress_events',
    'service_status_history', 'service_completion_records', 'service_exceptions',
    'service_work_order_journeys', 'api_idempotency_keys'
]) AS t;

SELECT make_append_only(t::regclass) FROM unnest(ARRAY['service_progress_events', 'service_status_history']) AS t;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vms_app') THEN
        -- Grant only on this migration's tables (a schema-wide grant would undo 006's ledger revocations).
        GRANT SELECT, INSERT, UPDATE, DELETE ON
            service_provider_categories, service_provider_sites, service_work_order_deliverables, service_schedules,
            service_occurrences, service_assignments, service_exceptions TO vms_app;
        GRANT SELECT, INSERT, UPDATE ON service_completion_records, service_work_order_journeys TO vms_app;
        GRANT SELECT, INSERT ON service_progress_events, service_status_history, api_idempotency_keys TO vms_app;
        REVOKE UPDATE, DELETE, TRUNCATE ON service_progress_events, service_status_history, api_idempotency_keys FROM vms_app;
        REVOKE DELETE, TRUNCATE ON service_completion_records, service_work_order_journeys FROM vms_app;
        -- Activity records are corrected by supersession, never deleted by the application.
        REVOKE DELETE, TRUNCATE ON transport_activities, ghg_activities FROM vms_app;
        GRANT EXECUTE ON FUNCTION outbox_claim(TEXT[], INTEGER, INTEGER) TO vms_app;
    END IF;
END $$;

-- Maintenance / facility managers own the Service domain.
INSERT INTO roles (tenant_id, code, name, description, is_system)
SELECT t.tenant_id, 'SERVICE_MANAGER', 'Service / Maintenance Manager',
       'Plans, approves and accepts service and maintenance work', TRUE
  FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;
