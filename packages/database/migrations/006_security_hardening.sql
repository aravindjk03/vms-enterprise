-- ============================================================================
-- VMS ENTERPRISE PRODUCTION RELATIONAL SCHEMA (PostgreSQL 16+)
-- Migration 006: Security Hardening
--   1. Row-Level Security on EVERY tenant-scoped table (previously 10 of ~120,
--      6 of which had RLS enabled but no policy)
--   2. Append-only enforcement for audit / gate / domain-event / calculation ledgers
--   3. Authentication storage (password credentials, refresh sessions)
--   4. Least-privilege runtime role `vms_app` (NOBYPASSRLS, no DDL)
--
-- Runtime model: migrations run as the schema owner (or a superuser), which
-- bypasses RLS. The API connects as a LOGIN role that is a member of `vms_app`
-- and sets `app.current_tenant_id` per transaction; it can only see its tenant.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Authentication storage
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,                 -- pbkdf2:iterations:salt:hash (never plaintext)
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash CHAR(64) NOT NULL UNIQUE, -- SHA-256 of the opaque refresh token
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_ip VARCHAR(64),
    user_agent VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (tenant_id, user_id) WHERE revoked_at IS NULL;

-- Pre-authentication lookup. Login happens before a tenant context exists, so RLS
-- would hide the user row; this narrowly-scoped SECURITY DEFINER function returns
-- only what credential verification needs, for one (tenant code, username) pair.
CREATE OR REPLACE FUNCTION auth_lookup_login(p_tenant_code TEXT, p_username TEXT)
RETURNS TABLE (
    user_id UUID,
    tenant_id UUID,
    username TEXT,
    full_name TEXT,
    user_status TEXT,
    is_active BOOLEAN,
    password_hash TEXT,
    failed_attempts INTEGER,
    locked_until TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT u.user_id, u.tenant_id, u.username::TEXT, u.full_name::TEXT, u.status::TEXT, u.is_active,
           c.password_hash, c.failed_attempts, c.locked_until
    FROM tenants t
    JOIN users u ON u.tenant_id = t.tenant_id
    LEFT JOIN user_credentials c ON c.user_id = u.user_id
    WHERE t.code = p_tenant_code
      AND t.status = 'ACTIVE'
      AND u.username = p_username::citext
    LIMIT 1;
$$;

-- Records the outcome of a login attempt (lockout bookkeeping) without granting
-- the runtime role pre-auth write access to the credentials table.
CREATE OR REPLACE FUNCTION auth_record_login_attempt(p_user_id UUID, p_success BOOLEAN, p_max_attempts INTEGER, p_lock_minutes INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_success THEN
        UPDATE user_credentials
           SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = p_user_id;
    ELSE
        UPDATE user_credentials
           SET failed_attempts = failed_attempts + 1,
               locked_until = CASE WHEN failed_attempts + 1 >= p_max_attempts
                                   THEN CURRENT_TIMESTAMP + make_interval(mins => p_lock_minutes)
                                   ELSE locked_until END,
               updated_at = CURRENT_TIMESTAMP
         WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- Refresh-token rotation also happens without a tenant context (the access token
-- has expired), so it resolves the session by token hash only.
CREATE OR REPLACE FUNCTION auth_lookup_session(p_refresh_token_hash TEXT)
RETURNS TABLE (session_id UUID, tenant_id UUID, user_id UUID, expires_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT s.session_id, s.tenant_id, s.user_id, s.expires_at, s.revoked_at
    FROM user_sessions s
    WHERE s.refresh_token_hash = p_refresh_token_hash
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION auth_lookup_login(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_record_login_attempt(UUID, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_lookup_session(TEXT) FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- 2. Row-Level Security on every table that carries tenant_id
-- ----------------------------------------------------------------------------
-- Reads: own tenant's rows, plus global reference rows (tenant_id IS NULL).
-- Writes: own tenant's rows only. Unset context => NULL => no rows.

DO $$
DECLARE
    t RECORD;
BEGIN
    -- Replace the ad-hoc per-table policies from migration 001 with the uniform pair below
    DROP POLICY IF EXISTS tenant_isolation_visitor ON visitor_transactions;
    DROP POLICY IF EXISTS tenant_isolation_transport ON transport_activities;
    DROP POLICY IF EXISTS tenant_isolation_ghg ON ghg_activities;
    DROP POLICY IF EXISTS tenant_isolation_documents ON documents;

    FOR t IN
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables tb
          ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND c.column_name = 'tenant_id'
          AND tb.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.table_name);
        EXECUTE format('DROP POLICY IF EXISTS tenant_read ON %I', t.table_name);
        EXECUTE format('DROP POLICY IF EXISTS tenant_write ON %I', t.table_name);
        EXECUTE format(
            'CREATE POLICY tenant_read ON %I FOR SELECT USING (tenant_id IS NULL OR tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::UUID)',
            t.table_name);
        EXECUTE format(
            'CREATE POLICY tenant_write ON %I FOR ALL USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::UUID) WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::UUID)',
            t.table_name);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Append-only ledgers (immutable for every role, including the owner)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table % is append-only: % is not permitted', TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'insufficient_privilege';
END;
$$;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['audit_logs', 'domain_events', 'gate_events', 'ghg_calculations', 'emission_factor_versions'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_append_only ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE TRIGGER trg_%s_append_only BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation()',
            tbl, tbl);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Least-privilege runtime role
-- ----------------------------------------------------------------------------
-- `vms_app` is a NOLOGIN group role. Deployments create a LOGIN user and
-- `GRANT vms_app TO <user>` (see packages/database/scripts/migrate.ts --create-app-user).

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vms_app') THEN
        CREATE ROLE vms_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping vms_app role creation: migrator lacks CREATEROLE. Create it manually.';
END $$;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vms_app') THEN
        RETURN;
    END IF;

    GRANT USAGE ON SCHEMA public TO vms_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vms_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vms_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vms_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO vms_app;

    -- Ledgers: insert + read only
    FOREACH tbl IN ARRAY ARRAY['audit_logs', 'domain_events', 'gate_events', 'ghg_calculations', 'emission_factor_versions'] LOOP
        EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON %I FROM vms_app', tbl);
    END LOOP;

    -- Credentials are only touched through the SECURITY DEFINER functions above
    -- and the password-set path (UPDATE within the tenant's own context).
    REVOKE DELETE, TRUNCATE ON user_credentials FROM vms_app;

    -- Global reference/catalogue tables (no tenant_id) are read-only at runtime.
    -- Tenant-owned child tables without tenant_id remain writable for the domain services.
    FOREACH tbl IN ARRAY ARRAY[
        'data_quality_levels', 'emission_factor_sources', 'emission_factors', 'gate_event_types', 'gate_types',
        'ghg_category_definitions', 'ghg_scope_definitions', 'identity_verification_methods', 'journey_types',
        'master_data_categories', 'notification_channels', 'organization_types', 'permissions',
        'transport_data_sources', 'transport_measurement_methods', 'transport_modes', 'transport_ownership_types',
        'vehicle_fuel_types', 'vehicle_ownership_types', 'vehicle_types'
    ] LOOP
        EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON %I FROM vms_app', tbl);
    END LOOP;

    -- The migration ledger is read-only for the runtime role (readiness checks only).
    IF to_regclass('public.schema_migrations') IS NOT NULL THEN
        REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON schema_migrations FROM vms_app;
    END IF;

    GRANT EXECUTE ON FUNCTION auth_lookup_login(TEXT, TEXT) TO vms_app;
    GRANT EXECUTE ON FUNCTION auth_record_login_attempt(UUID, BOOLEAN, INTEGER, INTEGER) TO vms_app;
    GRANT EXECUTE ON FUNCTION auth_lookup_session(TEXT) TO vms_app;
END $$;
