-- ============================================================================
-- 009 — Complete role catalog for every tenant
-- ============================================================================
-- The permission engine (@vms/permissions) defines 19 enterprise roles, but the seed only
-- created six of them per tenant, so roles such as HOST, RECEPTIONIST, SECURITY_MANAGER or
-- AUDITOR could not be assigned to anyone. This adds the missing catalog entries to every
-- existing tenant and seeds the catalog automatically for tenants created later.
-- Existing roles (and their names) are left as they are.
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_tenant_roles(p_tenant_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
    INSERT INTO roles (tenant_id, code, name, description, is_system)
    SELECT p_tenant_id, c.code, c.name, c.description, TRUE
      FROM (VALUES
        ('SUPER_ADMIN',           'Super Administrator',            'Full administration of the tenant'),
        ('ORGANIZATION_ADMIN',    'Organization Administrator',     'Tenant-wide administration across all sites'),
        ('IT_ADMIN',              'IT Administrator',               'Integrations, devices and technical configuration'),
        ('SITE_ADMIN',            'Site Administrator',             'Administration of assigned sites'),
        ('SECURITY_MANAGER',      'Security Manager',               'Security operations, approvals and gate oversight'),
        ('SERVICE_MANAGER',       'Service / Maintenance Manager',  'Plans, approves and accepts service and maintenance work'),
        ('EHS_MANAGER',           'EHS Manager',                    'Safety inductions, permits and prerequisite checks'),
        ('ESG_METHODOLOGY_ADMIN', 'ESG Methodology Administrator',  'Emission factors and calculation methodology'),
        ('ESG_MANAGER',           'ESG Manager',                    'GHG activity data and sustainability reporting'),
        ('HR_MANAGER',            'HR Manager',                     'Workforce records and approvals'),
        ('HR',                    'HR Officer',                     'Workforce records'),
        ('LEGAL',                 'Legal Counsel',                  'Legal documents, agreements and holds'),
        ('LEGAL_USER',            'Legal User',                     'Read access to legal documents'),
        ('AUDITOR',               'Auditor',                        'Read-only access to records and audit trail'),
        ('MANAGEMENT',            'Management',                     'Read-only dashboards and reports'),
        ('GATE_OPERATOR',         'Gate Operator',                  'Gate check-in and check-out'),
        ('SECURITY_GUARD',        'Security Guard',                 'Gate operations and arrival recording'),
        ('RECEPTIONIST',          'Receptionist',                   'Visitor reception and arrival recording'),
        ('HOST',                  'Host / Employee',                'Invites visitors and raises service requests')
      ) AS c(code, name, description)
    ON CONFLICT (tenant_id, code) DO NOTHING;
$$;

SELECT seed_tenant_roles(tenant_id) FROM tenants;

CREATE OR REPLACE FUNCTION trg_seed_tenant_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM seed_tenant_roles(NEW.tenant_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_seed_roles ON tenants;
CREATE TRIGGER trg_tenants_seed_roles
    AFTER INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION trg_seed_tenant_roles();
