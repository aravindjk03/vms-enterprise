-- ============================================================================
-- 011 — Two-step verification and organization sign-in policy
-- ============================================================================
-- user_mfa: one authenticator (TOTP, RFC 6238) per user. The shared secret is stored encrypted by the
-- API (AES-256-GCM); recovery codes are stored as SHA-256 hashes and removed when used. A row whose
-- enabled_at is NULL is a setup that has not been confirmed with a code yet and is not enforced.
-- last_used_step stops a code from being accepted twice.
--
-- tenant_security_settings: per-organization sign-in policy. require_mfa_for_admins makes every user
-- who can administer users or the system set up two-step verification before using the console.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_mfa (
    user_id              UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id            UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    method               VARCHAR(16) NOT NULL DEFAULT 'TOTP',
    secret_encrypted     TEXT NOT NULL,
    enabled_at           TIMESTAMPTZ,
    last_used_step       BIGINT NOT NULL DEFAULT 0,
    recovery_code_hashes TEXT[] NOT NULL DEFAULT '{}',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_mfa_method CHECK (method IN ('TOTP'))
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_tenant ON user_mfa (tenant_id) WHERE enabled_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS tenant_security_settings (
    tenant_id              UUID PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    require_mfa_for_admins BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES users(user_id) ON DELETE SET NULL
);

SELECT apply_tenant_rls('user_mfa'::regclass);
SELECT apply_tenant_rls('tenant_security_settings'::regclass);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vms_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa TO vms_app;
        GRANT SELECT, INSERT, UPDATE ON tenant_security_settings TO vms_app;
        REVOKE DELETE, TRUNCATE ON tenant_security_settings FROM vms_app;
    END IF;
END $$;
