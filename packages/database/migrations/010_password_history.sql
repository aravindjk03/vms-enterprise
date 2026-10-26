-- ============================================================================
-- 010 — Password history
-- ============================================================================
-- The password policy forbids reusing any of the last five passwords, but nothing recorded them.
-- Each password set (initial, administrator reset, self-service change) appends a row here.
-- Rows are append-only for the runtime role: they are never updated or deleted by the application.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_password_history (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    set_by        UUID REFERENCES users(user_id) ON DELETE SET NULL,
    reason        VARCHAR(32) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_password_history_reason CHECK (reason IN ('INITIAL', 'ADMIN_RESET', 'SELF_CHANGE', 'BOOTSTRAP'))
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON user_password_history (user_id, created_at DESC);

SELECT apply_tenant_rls('user_password_history'::regclass);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vms_app') THEN
        GRANT SELECT, INSERT ON user_password_history TO vms_app;
        REVOKE UPDATE, DELETE, TRUNCATE ON user_password_history FROM vms_app;
    END IF;
END $$;
