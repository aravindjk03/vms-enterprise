-- ============================================================================
-- VMS ENTERPRISE PRODUCTION RELATIONAL SCHEMA (PostgreSQL 16+)
-- Migration 001: Initial Relational Foundation & Multi-Tenant Topology
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE ORGANIZATIONAL HIERARCHY
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_org_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS sites (
    site_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_site_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_dept_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS buildings (
    building_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_building_tenant_code UNIQUE (tenant_id, site_id, code)
);

CREATE TABLE IF NOT EXISTS gates (
    gate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(building_id) ON DELETE SET NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    gate_type VARCHAR(32) NOT NULL, -- PEDESTRIAN, COMMERCIAL_VEHICLE, EXECUTIVE, SERVICE
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_gate_tenant_code UNIQUE (tenant_id, site_id, code)
);

CREATE TABLE IF NOT EXISTS zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(building_id) ON DELETE SET NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    security_level VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- STANDARD, HIGH_SECURITY, HAZARDOUS
    max_capacity INTEGER,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_zone_tenant_code UNIQUE (tenant_id, site_id, code)
);

CREATE TABLE IF NOT EXISTS site_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    settings_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_site_settings UNIQUE (tenant_id, site_id)
);

CREATE TABLE IF NOT EXISTS gate_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    gate_id UUID NOT NULL REFERENCES gates(gate_id) ON DELETE CASCADE,
    settings_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_gate_settings UNIQUE (tenant_id, gate_id)
);

CREATE TABLE IF NOT EXISTS zone_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    settings_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_zone_settings UNIQUE (tenant_id, zone_id)
);

-- ============================================================================
-- 2. USER, ROLE & ACCESS CONTROL (RBAC & ABAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    username CITEXT NOT NULL,
    email CITEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    CONSTRAINT uq_user_tenant_username UNIQUE (tenant_id, username),
    CONSTRAINT uq_user_tenant_email UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    module VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_site_access (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMPTZ,
    PRIMARY KEY (user_id, site_id)
);

CREATE TABLE IF NOT EXISTS user_gate_access (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    gate_id UUID NOT NULL REFERENCES gates(gate_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, gate_id)
);

CREATE TABLE IF NOT EXISTS user_zone_access (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, zone_id)
);

-- Access Policy Engine
CREATE TABLE IF NOT EXISTS access_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    policy_type VARCHAR(32) NOT NULL, -- VISITOR, CONTRACTOR, VEHICLE, EMPLOYEE
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_policy_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS access_policy_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES access_policies(policy_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    target_zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    target_gate_id UUID REFERENCES gates(gate_id) ON DELETE SET NULL,
    conditions JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_credentials (
    credential_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID, -- Forward ref resolved below
    credential_type VARCHAR(32) NOT NULL, -- QR_TOKEN, RFID_BADGE, BIOMETRIC, PIN
    identifier_token VARCHAR(255) NOT NULL UNIQUE,
    pin_hash VARCHAR(255),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_grants (
    grant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    person_id UUID,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    credential_id UUID REFERENCES access_credentials(credential_id) ON DELETE SET NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    escort_required BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    gate_id UUID REFERENCES gates(gate_id) ON DELETE SET NULL,
    zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    person_id UUID,
    grant_id UUID REFERENCES access_grants(grant_id) ON DELETE SET NULL,
    credential_id UUID REFERENCES access_credentials(credential_id) ON DELETE SET NULL,
    access_result VARCHAR(32) NOT NULL, -- GRANTED, DENIED, EXPIRED, ANTI_PASSBACK_VIOLATION
    denial_reason VARCHAR(255),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zone_permissions (
    zone_perm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    can_access BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_zone UNIQUE (role_id, zone_id)
);

CREATE TABLE IF NOT EXISTS gate_permissions (
    gate_perm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    gate_id UUID NOT NULL REFERENCES gates(gate_id) ON DELETE CASCADE,
    can_actuate BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_gate UNIQUE (role_id, gate_id)
);

-- ============================================================================
-- 3. PERSON & REUSABLE IDENTITY MODEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS persons (
    person_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(32),
    nationality VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64)
);

-- Resolve Access Model FK references to Person
ALTER TABLE access_credentials ADD CONSTRAINT fk_access_credentials_person FOREIGN KEY (person_id) REFERENCES persons(person_id);
ALTER TABLE access_grants ADD CONSTRAINT fk_access_grants_person FOREIGN KEY (person_id) REFERENCES persons(person_id);
ALTER TABLE access_events ADD CONSTRAINT fk_access_events_person FOREIGN KEY (person_id) REFERENCES persons(person_id);

CREATE TABLE IF NOT EXISTS person_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    contact_type VARCHAR(32) NOT NULL, -- EMAIL, PHONE, EMERGENCY_PHONE
    contact_value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_addresses (
    address_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    address_type VARCHAR(32) NOT NULL DEFAULT 'PRIMARY',
    street_line1 VARCHAR(255),
    street_line2 VARCHAR(255),
    city VARCHAR(128) NOT NULL,
    state_province VARCHAR(128) NOT NULL,
    postal_code VARCHAR(32),
    country VARCHAR(64) NOT NULL DEFAULT 'USA',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_identity_documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL, -- PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, AADHAAR
    document_number VARCHAR(128) NOT NULL,
    issuing_country VARCHAR(64) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_person_doc UNIQUE (tenant_id, document_type, document_number)
);

CREATE TABLE IF NOT EXISTS person_consents (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    consent_type VARCHAR(64) NOT NULL, -- PRIVACY_POLICY, BIOMETRIC_CAPTURE, NDA, SAFETY_DECLARATION
    consent_version VARCHAR(32) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    capture_method VARCHAR(64) NOT NULL DEFAULT 'DIGITAL_SIGNATURE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS biometric_references (
    biometric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL, -- RECOGNITION_VENDOR_NEUTRAL
    biometric_type VARCHAR(32) NOT NULL DEFAULT 'FACE_VECTOR',
    template_reference_id VARCHAR(255) NOT NULL,
    template_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    enrollment_status VARCHAR(32) NOT NULL DEFAULT 'ENROLLED',
    consent_reference_id UUID REFERENCES person_consents(consent_id) ON DELETE SET NULL,
    retention_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    verification_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. EXTERNAL ORGANIZATIONS & COMPANIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_organizations (
    org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    tax_identifier VARCHAR(64),
    registration_number VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ext_org_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS organization_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS external_org_classifications (
    org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES organization_types(type_id) ON DELETE CASCADE,
    PRIMARY KEY (org_id, type_id)
);

CREATE TABLE IF NOT EXISTS organization_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    contact_role VARCHAR(64) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. VISITOR DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS visitor_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    requires_escort BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS visitor_purposes (
    purpose_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS visitor_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    external_org_id UUID REFERENCES external_organizations(org_id) ON DELETE SET NULL,
    vip_status BOOLEAN NOT NULL DEFAULT FALSE,
    watchlist_status VARCHAR(32) NOT NULL DEFAULT 'CLEAR',
    total_visits INTEGER NOT NULL DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_visitor_profile_person UNIQUE (tenant_id, person_id)
);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    reference_number VARCHAR(64) NOT NULL UNIQUE,
    host_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    meeting_room_zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_participants (
    appointment_id UUID NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'GUEST',
    status VARCHAR(32) NOT NULL DEFAULT 'INVITED',
    PRIMARY KEY (appointment_id, person_id)
);

CREATE TABLE IF NOT EXISTS visitor_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- VIS-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE RESTRICT,
    visitor_type_id UUID REFERENCES visitor_types(type_id) ON DELETE SET NULL,
    purpose_id UUID REFERENCES visitor_purposes(purpose_id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    host_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    
    booking_mode VARCHAR(32) NOT NULL DEFAULT 'RESERVED', -- RESERVED, WALK_IN, RECURRING, GROUP, EMERGENCY
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_arrival TIMESTAMPTZ,
    actual_entry TIMESTAMPTZ,
    actual_exit TIMESTAMPTZ,
    
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    access_policy_id UUID REFERENCES access_policies(policy_id) ON DELETE SET NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_participants (
    participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_transaction_id UUID NOT NULL REFERENCES visitor_transactions(transaction_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE RESTRICT,
    participant_role VARCHAR(32) NOT NULL DEFAULT 'GROUP_MEMBER',
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_hosts (
    host_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_transaction_id UUID NOT NULL REFERENCES visitor_transactions(transaction_id) ON DELETE CASCADE,
    host_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    notified_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. CUSTOMER DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_accounts (
    customer_account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    external_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    account_code VARCHAR(64) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cust_account_code UNIQUE (tenant_id, account_code)
);

CREATE TABLE IF NOT EXISTS customer_representatives (
    rep_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    customer_account_id UUID NOT NULL REFERENCES customer_accounts(customer_account_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    job_title VARCHAR(128),
    department VARCHAR(128),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_visit_types (
    visit_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS customer_visit_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- CUS-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    customer_account_id UUID NOT NULL REFERENCES customer_accounts(customer_account_id) ON DELETE RESTRICT,
    visit_type_id UUID REFERENCES customer_visit_types(visit_type_id) ON DELETE SET NULL,
    executive_host_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_arrival TIMESTAMPTZ,
    actual_entry TIMESTAMPTZ,
    actual_exit TIMESTAMPTZ,
    nda_signed BOOLEAN NOT NULL DEFAULT FALSE,
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_visit_participants (
    participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_visit_id UUID NOT NULL REFERENCES customer_visit_transactions(transaction_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE RESTRICT,
    customer_rep_id UUID REFERENCES customer_representatives(rep_id) ON DELETE SET NULL,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_requirements (
    requirement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    customer_visit_id UUID NOT NULL REFERENCES customer_visit_transactions(transaction_id) ON DELETE CASCADE,
    requirement_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_access_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    customer_account_id UUID NOT NULL REFERENCES customer_accounts(customer_account_id) ON DELETE CASCADE,
    access_policy_id UUID NOT NULL REFERENCES access_policies(policy_id) ON DELETE CASCADE,
    special_provisions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. CONTRACTOR DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    external_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    vendor_code VARCHAR(64) NOT NULL,
    safety_rating VARCHAR(32) NOT NULL DEFAULT 'GRADE_A',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_contractor_code UNIQUE (tenant_id, vendor_code)
);

CREATE TABLE IF NOT EXISTS contractor_contracts (
    contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES contractor_companies(company_id) ON DELETE RESTRICT,
    contract_number VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_contract_number UNIQUE (tenant_id, contract_number)
);

CREATE TABLE IF NOT EXISTS contractor_work_orders (
    work_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- CTR-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contractor_contracts(contract_id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES contractor_companies(company_id) ON DELETE RESTRICT,
    work_order_number VARCHAR(64) NOT NULL,
    scope_of_work TEXT NOT NULL,
    authorized_worker_count INTEGER NOT NULL CHECK (authorized_worker_count >= 1),
    safety_permit_required BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractor_workers (
    contractor_worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES contractor_companies(company_id) ON DELETE RESTRICT,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE RESTRICT,
    badge_number VARCHAR(64) NOT NULL,
    trade_skill VARCHAR(64) NOT NULL,
    medical_fitness_valid BOOLEAN NOT NULL DEFAULT TRUE,
    medical_fitness_expiry DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_contractor_worker_badge UNIQUE (tenant_id, badge_number)
);

CREATE TABLE IF NOT EXISTS contractor_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES contractor_work_orders(work_order_id) ON DELETE CASCADE,
    contractor_worker_id UUID NOT NULL REFERENCES contractor_workers(contractor_worker_id) ON DELETE CASCADE,
    assigned_from DATE NOT NULL,
    assigned_to DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractor_training_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    contractor_worker_id UUID NOT NULL REFERENCES contractor_workers(contractor_worker_id) ON DELETE CASCADE,
    training_type VARCHAR(64) NOT NULL,
    completed_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    certificate_number VARCHAR(64),
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractor_permits (
    permit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES contractor_work_orders(work_order_id) ON DELETE CASCADE,
    permit_type VARCHAR(64) NOT NULL,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE RESTRICT,
    issued_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractor_attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES contractor_work_orders(work_order_id) ON DELETE CASCADE,
    contractor_worker_id UUID NOT NULL REFERENCES contractor_workers(contractor_worker_id) ON DELETE RESTRICT,
    shift_date DATE NOT NULL,
    entry_time TIMESTAMPTZ,
    exit_time TIMESTAMPTZ,
    hours_worked NUMERIC(6, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. SERVICE / WORK DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_providers (
    service_provider_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    external_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    provider_code VARCHAR(64) NOT NULL,
    service_category VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_serv_provider_code UNIQUE (tenant_id, provider_code)
);

CREATE TABLE IF NOT EXISTS service_technicians (
    technician_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES service_providers(service_provider_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE RESTRICT,
    certification_level VARCHAR(64) NOT NULL,
    badge_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- SRV-REQ-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES service_providers(service_provider_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    equipment_tag VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_work_orders (
    work_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- SRV-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    request_id UUID REFERENCES service_requests(request_id) ON DELETE SET NULL,
    service_provider_id UUID NOT NULL REFERENCES service_providers(service_provider_id) ON DELETE RESTRICT,
    equipment_tag VARCHAR(64) NOT NULL,
    maintenance_lead_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    inward_tools_declared BOOLEAN NOT NULL DEFAULT FALSE,
    service_completed BOOLEAN NOT NULL DEFAULT FALSE,
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_work_locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(building_id) ON DELETE SET NULL,
    specific_location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_permits (
    permit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE CASCADE,
    permit_type VARCHAR(64) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_activities (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES service_work_orders(work_order_id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES service_technicians(technician_id) ON DELETE RESTRICT,
    activity_description TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. MATERIAL DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    category_id UUID REFERENCES material_categories(category_id) ON DELETE SET NULL,
    material_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit_of_measure VARCHAR(32) NOT NULL DEFAULT 'PCS',
    requires_inspection BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_material_code UNIQUE (tenant_id, material_code)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    po_number VARCHAR(64) NOT NULL,
    supplier_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    total_amount NUMERIC(14, 2),
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_po_number UNIQUE (tenant_id, po_number)
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE RESTRICT,
    line_number INTEGER NOT NULL,
    ordered_quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- MAT-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    
    movement_type VARCHAR(32) NOT NULL CHECK (movement_type IN ('INWARD', 'OUTWARD')),
    classification VARCHAR(32) NOT NULL CHECK (classification IN ('RETURNABLE', 'NON_RETURNABLE', 'SCRAP', 'SAMPLE', 'TOOL', 'EQUIPMENT', 'SPARE', 'EMERGENCY', 'RAW_MATERIAL')),
    delivery_challan_number VARCHAR(64),
    po_id UUID REFERENCES purchase_orders(po_id) ON DELETE SET NULL,
    supplier_org_id UUID REFERENCES external_organizations(org_id) ON DELETE SET NULL,
    transporter_org_id UUID REFERENCES external_organizations(org_id) ON DELETE SET NULL,
    vehicle_registration VARCHAR(32),
    driver_person_id UUID REFERENCES persons(person_id) ON DELETE SET NULL,
    
    gross_weight_kg NUMERIC(10, 2),
    tare_weight_kg NUMERIC(10, 2),
    net_weight_kg NUMERIC(10, 2),
    
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_transaction_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_transaction_id UUID NOT NULL REFERENCES material_transactions(transaction_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE RESTRICT,
    line_number INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(32) NOT NULL,
    is_returnable BOOLEAN NOT NULL DEFAULT FALSE,
    returned_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
    serial_number VARCHAR(128),
    batch_number VARCHAR(128),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    external_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    supplier_code VARCHAR(64) NOT NULL,
    rating NUMERIC(3, 2),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mat_supplier_code UNIQUE (tenant_id, supplier_code)
);

CREATE TABLE IF NOT EXISTS material_inspections (
    inspection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    material_transaction_id UUID NOT NULL REFERENCES material_transactions(transaction_id) ON DELETE CASCADE,
    inspected_by UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    passed BOOLEAN NOT NULL,
    inspection_notes TEXT,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_ownership (
    ownership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    owner_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    ownership_type VARCHAR(32) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_serial_numbers (
    serial_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    serial_number VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_STOCK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_material_serial UNIQUE (tenant_id, material_id, serial_number)
);

CREATE TABLE IF NOT EXISTS material_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    batch_number VARCHAR(128) NOT NULL,
    manufactured_date DATE,
    expiry_date DATE,
    quantity NUMERIC(12, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_returns (
    return_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    material_transaction_line_id UUID NOT NULL REFERENCES material_transaction_lines(line_id) ON DELETE RESTRICT,
    return_transaction_id UUID REFERENCES material_transactions(transaction_id) ON DELETE SET NULL,
    quantity_returned NUMERIC(12, 3) NOT NULL CHECK (quantity_returned > 0),
    return_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    condition_status VARCHAR(32) NOT NULL DEFAULT 'GOOD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_gate_passes (
    pass_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- MGP-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    material_transaction_id UUID NOT NULL REFERENCES material_transactions(transaction_id) ON DELETE CASCADE,
    pass_type VARCHAR(32) NOT NULL, -- RETURNABLE_OUTWARD, NON_RETURNABLE_OUTWARD, INWARD_VERIFIED
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    security_officer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    qr_code_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. VEHICLE & DRIVER DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vehicle_ownership_types (
    ownership_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vehicle_fuel_types (
    fuel_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transporters (
    transporter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    external_org_id UUID NOT NULL REFERENCES external_organizations(org_id) ON DELETE RESTRICT,
    fleet_size INTEGER NOT NULL DEFAULT 1,
    license_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    registration_plate VARCHAR(32) NOT NULL,
    vehicle_type_id UUID REFERENCES vehicle_types(type_id) ON DELETE SET NULL,
    fuel_type_id UUID REFERENCES vehicle_fuel_types(fuel_type_id) ON DELETE SET NULL,
    ownership_type_id UUID REFERENCES vehicle_ownership_types(ownership_type_id) ON DELETE SET NULL,
    owner_org_id UUID REFERENCES external_organizations(org_id) ON DELETE SET NULL,
    make VARCHAR(64),
    model VARCHAR(64),
    year INTEGER,
    engine_capacity_cc INTEGER,
    tare_weight_kg NUMERIC(10, 2),
    gross_vehicle_weight_kg NUMERIC(10, 2),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vehicle_reg UNIQUE (tenant_id, registration_plate)
);

CREATE TABLE IF NOT EXISTS drivers (
    driver_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE RESTRICT,
    license_number VARCHAR(64) NOT NULL,
    license_type VARCHAR(32) NOT NULL DEFAULT 'COMMERCIAL',
    license_expiry DATE NOT NULL,
    badge_number VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_driver_license UNIQUE (tenant_id, license_number)
);

CREATE TABLE IF NOT EXISTS vehicle_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    remarks TEXT
);

-- ============================================================================
-- 11. REUSABLE NORMALIZED TRANSPORT DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS transport_modes (
    mode_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transport_ownership_types (
    ownership_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS journey_types (
    journey_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transport_measurement_methods (
    method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transport_data_sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transport_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- TRA-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    source_domain VARCHAR(32) NOT NULL, -- VISITOR, CUSTOMER, CONTRACTOR, SERVICE, MATERIAL, VEHICLE
    source_transaction_id VARCHAR(64) NOT NULL,
    
    person_id UUID REFERENCES persons(person_id) ON DELETE SET NULL,
    organization_id UUID REFERENCES external_organizations(org_id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    
    transport_mode_id UUID REFERENCES transport_modes(mode_id) ON DELETE RESTRICT,
    ownership_type_id UUID REFERENCES transport_ownership_types(ownership_type_id) ON DELETE RESTRICT,
    vehicle_type_id UUID REFERENCES vehicle_types(type_id) ON DELETE SET NULL,
    fuel_type_id UUID REFERENCES vehicle_fuel_types(fuel_type_id) ON DELETE SET NULL,
    
    usage_type VARCHAR(32) NOT NULL DEFAULT 'INDIVIDUAL',
    occupancy INTEGER NOT NULL DEFAULT 1 CHECK (occupancy >= 1),
    
    -- Structured, privacy-preserving origin and destination
    origin_location_name VARCHAR(255) NOT NULL,
    origin_city VARCHAR(128),
    origin_state VARCHAR(128),
    origin_country VARCHAR(64),
    origin_postal_code VARCHAR(32),
    origin_latitude NUMERIC(10, 7),
    origin_longitude NUMERIC(10, 7),
    
    destination_location_name VARCHAR(255) NOT NULL,
    destination_city VARCHAR(128),
    destination_state VARCHAR(128),
    destination_country VARCHAR(64),
    destination_postal_code VARCHAR(32),
    destination_latitude NUMERIC(10, 7),
    destination_longitude NUMERIC(10, 7),
    
    distance NUMERIC(10, 2) NOT NULL CHECK (distance >= 0),
    distance_unit VARCHAR(16) NOT NULL DEFAULT 'KM',
    journey_type VARCHAR(32) NOT NULL DEFAULT 'ONE_WAY', -- ONE_WAY, ROUND_TRIP, MULTI_STOP, LOCAL_CAMPUS
    direction VARCHAR(32) NOT NULL DEFAULT 'INBOUND', -- INBOUND, OUTBOUND, INTERNAL_TRANSFER
    
    fuel_consumed_litres NUMERIC(10, 2),
    payload_weight_tonnes NUMERIC(10, 3),
    
    -- Distance & Data Provenance
    measurement_method VARCHAR(32) NOT NULL DEFAULT 'GIS_ROUTING', -- ODOMETER, TELEMATICS_GPS, GIS_ROUTING, WEIGHBRIDGE_SCALE, DECLARED_MANIFEST, ESTIMATED_TABLE
    data_source VARCHAR(64) NOT NULL DEFAULT 'WEB_FORM',
    estimated_flag BOOLEAN NOT NULL DEFAULT FALSE,
    activity_date DATE NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_transport_source UNIQUE (tenant_id, source_domain, source_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_transp_tenant_source ON transport_activities (tenant_id, source_domain, source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transp_site_date ON transport_activities (site_id, activity_date);

-- ============================================================================
-- 12. CENTRALIZED COMPLIANCE DOCUMENT DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    retention_days INTEGER NOT NULL DEFAULT 365,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- DOC-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(type_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    file_storage_key VARCHAR(512) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_mime_type VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64),
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_storage_key VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doc_version UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS document_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity_type VARCHAR(64) NOT NULL, -- PERSON, VISITOR_TRANSACTION, CONTRACTOR_WORKER, VEHICLE, MATERIAL_TRANSACTION, CUSTOMER_VISIT
    entity_id UUID NOT NULL,
    relationship_type VARCHAR(64) NOT NULL, -- GOVERNMENT_ID, VISIT_AUTHORIZATION, INSURANCE, SAFETY_CERTIFICATE, INVOICE, CHALLAN
    linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    linked_by VARCHAR(64),
    CONSTRAINT uq_doc_link UNIQUE (tenant_id, document_id, entity_type, entity_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS document_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    verification_method VARCHAR(64) NOT NULL, -- MANUAL, OCR, AUTOMATED_SERVICE
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED, EXPIRED
    verified_by VARCHAR(64),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_retention_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(type_id) ON DELETE CASCADE,
    retention_period_years INTEGER NOT NULL DEFAULT 5,
    legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
    disposal_action VARCHAR(32) NOT NULL DEFAULT 'ARCHIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. LEGAL, CONSENT & IDENTITY VERIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS legal_documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_legal_doc_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS legal_document_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_doc_id UUID NOT NULL REFERENCES legal_documents(doc_id) ON DELETE CASCADE,
    version_tag VARCHAR(32) NOT NULL,
    content_text TEXT NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_legal_version UNIQUE (legal_doc_id, version_tag)
);

CREATE TABLE IF NOT EXISTS consents (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    legal_doc_version_id UUID NOT NULL REFERENCES legal_document_versions(version_id) ON DELETE RESTRICT,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    capture_channel VARCHAR(32) NOT NULL DEFAULT 'WEB_KIOSK',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    consent_id UUID NOT NULL REFERENCES consents(consent_id) ON DELETE CASCADE,
    transaction_domain VARCHAR(32) NOT NULL,
    transaction_id VARCHAR(64) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS acceptances (
    acceptance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    legal_doc_version_id UUID NOT NULL REFERENCES legal_document_versions(version_id) ON DELETE RESTRICT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature_reference VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signatures (
    sig_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    acceptance_id UUID NOT NULL REFERENCES acceptances(acceptance_id) ON DELETE CASCADE,
    signature_data_uri TEXT NOT NULL,
    signature_format VARCHAR(32) NOT NULL DEFAULT 'PNG_BASE64',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity_verification_methods (
    method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS identity_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    method_id UUID NOT NULL REFERENCES identity_verification_methods(method_id) ON DELETE RESTRICT,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    verification_result JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity_verification_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES identity_verifications(verification_id) ON DELETE CASCADE,
    check_item VARCHAR(64) NOT NULL,
    check_status VARCHAR(32) NOT NULL,
    score NUMERIC(5, 4),
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 14. WORKFLOW MODEL (REUSABLE & VERSIONED)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
    definition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_domain VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wfl_def_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS workflow_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    definition_id UUID NOT NULL REFERENCES workflow_definitions(definition_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    schema_definition JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wfl_version UNIQUE (definition_id, version_number)
);

CREATE TABLE IF NOT EXISTS workflow_stages (
    stage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES workflow_versions(version_id) ON DELETE CASCADE,
    stage_code VARCHAR(32) NOT NULL,
    stage_name VARCHAR(64) NOT NULL,
    order_index INTEGER NOT NULL,
    sla_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_transitions (
    transition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES workflow_versions(version_id) ON DELETE CASCADE,
    from_stage_id UUID NOT NULL REFERENCES workflow_stages(stage_id) ON DELETE CASCADE,
    to_stage_id UUID NOT NULL REFERENCES workflow_stages(stage_id) ON DELETE CASCADE,
    trigger_action VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_conditions (
    condition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transition_id UUID NOT NULL REFERENCES workflow_transitions(transition_id) ON DELETE CASCADE,
    condition_expression TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_instances (
    instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES workflow_definitions(definition_id) ON DELETE RESTRICT,
    version_id UUID NOT NULL REFERENCES workflow_versions(version_id) ON DELETE RESTRICT,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    current_stage_id UUID REFERENCES workflow_stages(stage_id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES workflow_stages(stage_id) ON DELETE CASCADE,
    assigned_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
    assigned_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(task_id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    action_name VARCHAR(64) NOT NULL,
    comment TEXT,
    action_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 15. APPROVAL MODEL (REUSABLE INFRASTRUCTURE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_workflows (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_domain VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_appr_wf_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS approval_workflow_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(workflow_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_appr_wf_version UNIQUE (workflow_id, version_number)
);

CREATE TABLE IF NOT EXISTS approval_stages (
    stage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES approval_workflow_versions(version_id) ON DELETE CASCADE,
    stage_order INTEGER NOT NULL,
    stage_name VARCHAR(64) NOT NULL,
    required_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_instances (
    instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(workflow_id) ON DELETE RESTRICT,
    version_id UUID NOT NULL REFERENCES approval_workflow_versions(version_id) ON DELETE RESTRICT,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_stage_instances (
    stage_inst_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES approval_instances(instance_id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES approval_stages(stage_id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_inst_id UUID NOT NULL REFERENCES approval_stage_instances(stage_inst_id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    decision VARCHAR(32) NOT NULL, -- APPROVED, REJECTED, RETURNED_FOR_EDIT
    remarks TEXT,
    decision_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_delegations (
    delegation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    delegator_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    delegate_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 16. GATE DOMAIN & PHYSICAL ACCESS EXECUTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS gate_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS gate_event_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS gate_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    gate_id UUID NOT NULL REFERENCES gates(gate_id) ON DELETE CASCADE,
    device_code VARCHAR(64) NOT NULL,
    device_type VARCHAR(32) NOT NULL, -- QR_SCANNER, ANPR_CAMERA, BOOM_BARRIER, WEIGHBRIDGE, BIOMETRIC_TERMINAL
    ip_address VARCHAR(45),
    mac_address VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_device_code UNIQUE (tenant_id, device_code)
);

CREATE TABLE IF NOT EXISTS gate_transactions (
    gate_tx_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    gate_id UUID NOT NULL REFERENCES gates(gate_id) ON DELETE CASCADE,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    direction VARCHAR(32) NOT NULL DEFAULT 'INBOUND', -- INBOUND, OUTBOUND
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED',
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Immutable gate events ledger!
CREATE TABLE IF NOT EXISTS gate_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    gate_id UUID NOT NULL REFERENCES gates(gate_id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    device_id UUID REFERENCES gate_devices(device_id) ON DELETE SET NULL,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- ENTRY_REQUESTED, ENTRY_APPROVED, ENTRY_DENIED, CHECKED_IN, CHECKED_OUT, VEHICLE_ENTERED, VEHICLE_EXITED, MATERIAL_ENTERED, MATERIAL_EXITED
    result VARCHAR(32) NOT NULL, -- SUCCESS, DENIED, ERROR
    reason TEXT,
    actor_id VARCHAR(64),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gate_events_tenant_time ON gate_events (tenant_id, site_id, event_timestamp DESC);

CREATE TABLE IF NOT EXISTS gate_decisions (
    decision_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    gate_tx_id UUID NOT NULL REFERENCES gate_transactions(gate_tx_id) ON DELETE CASCADE,
    allowed BOOLEAN NOT NULL,
    evaluated_rules JSONB NOT NULL DEFAULT '{}'::JSONB,
    decision_reason VARCHAR(255),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 17. SAFETY & EMERGENCY DATA MODEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    validity_months INTEGER NOT NULL DEFAULT 12,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS permit_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS safety_inductions (
    induction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    training_type_id UUID REFERENCES training_types(type_id) ON DELETE SET NULL,
    inducted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ NOT NULL,
    instructor_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    test_score INTEGER,
    status VARCHAR(32) NOT NULL DEFAULT 'VALID',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    training_type_id UUID REFERENCES training_types(type_id) ON DELETE SET NULL,
    completed_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    certificate_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permits (
    permit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- PTW-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    permit_type_id UUID REFERENCES permit_types(type_id) ON DELETE SET NULL,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE RESTRICT,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    approver_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safety_declarations (
    declaration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    declared_hazards JSONB NOT NULL DEFAULT '[]'::JSONB,
    acknowledged BOOLEAN NOT NULL DEFAULT TRUE,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- EMG-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL, -- FIRE_ALARM, HAZMAT_LEAK, STRUCTURAL_EVACUATION, DRILL
    severity VARCHAR(32) NOT NULL DEFAULT 'CRITICAL',
    declared_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    declared_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    terminated_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    description TEXT
);

CREATE TABLE IF NOT EXISTS emergency_event_sites (
    event_id UUID NOT NULL REFERENCES emergency_events(event_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, site_id)
);

CREATE TABLE IF NOT EXISTS occupancy_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    emergency_event_id UUID REFERENCES emergency_events(event_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    total_people_count INTEGER NOT NULL DEFAULT 0,
    snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS muster_points (
    muster_point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    location_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_muster_code UNIQUE (tenant_id, site_id, code)
);

CREATE TABLE IF NOT EXISTS muster_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_event_id UUID NOT NULL REFERENCES emergency_events(event_id) ON DELETE CASCADE,
    muster_point_id UUID NOT NULL REFERENCES muster_points(muster_point_id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS muster_participants (
    participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    muster_record_id UUID NOT NULL REFERENCES muster_records(record_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_in_by UUID REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS missing_person_records (
    missing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_event_id UUID NOT NULL REFERENCES emergency_events(event_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    last_known_zone_id UUID REFERENCES zones(zone_id) ON DELETE SET NULL,
    last_seen_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'UNACCOUNTED_FOR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 18. INCIDENT & EXCEPTION DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS incident_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS incidents (
    incident_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- INC-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    incident_type_id UUID REFERENCES incident_types(type_id) ON DELETE SET NULL,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    reported_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS exception_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exceptions (
    exception_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- EXC-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    exception_type_id UUID REFERENCES exception_types(type_id) ON DELETE SET NULL,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exception_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exception_id UUID NOT NULL REFERENCES exceptions(exception_id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL,
    taken_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS exception_resolutions (
    resolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exception_id UUID NOT NULL REFERENCES exceptions(exception_id) ON DELETE CASCADE,
    resolved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolution_summary TEXT NOT NULL
);

-- ============================================================================
-- 19. ESG / GHG DOMAIN & CRITICAL PROVENANCE ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_quality_levels (
    level_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE, -- MEASURED, USER_PROVIDED, SYSTEM_ESTIMATED, SYSTEM_CALCULATED, IMPORTED, DEFAULT
    name VARCHAR(64) NOT NULL,
    score INTEGER NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS evidence_records (
    evidence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL, -- DOCUMENT, PHOTOGRAPH, UPLOADED_FILE, DEVICE_EVENT, ROUTE_ENGINE_LOG
    reference_uri TEXT NOT NULL,
    file_checksum VARCHAR(64),
    verified_by VARCHAR(64),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emission_factor_sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL UNIQUE, -- DEFRA, US_EPA, CEA_INDIA, IEA, IPCC
    name VARCHAR(128) NOT NULL,
    official_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS emission_factors (
    factor_id VARCHAR(64) PRIMARY KEY,
    factor_code VARCHAR(64) NOT NULL,
    source_id UUID REFERENCES emission_factor_sources(source_id) ON DELETE SET NULL,
    source VARCHAR(64) NOT NULL,
    default_unit VARCHAR(32) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Immutable versioned emission factor records
CREATE TABLE IF NOT EXISTS emission_factor_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factor_id VARCHAR(64) NOT NULL REFERENCES emission_factors(factor_id) ON DELETE RESTRICT,
    version_tag VARCHAR(32) NOT NULL, -- e.g. 2026.1
    reporting_year INTEGER NOT NULL,
    geography VARCHAR(16) NOT NULL, -- ISO code or GLOBAL
    factor_value NUMERIC(14, 6) NOT NULL,
    unit VARCHAR(32) NOT NULL, -- kgCO2e/km, kgCO2e/litre, kgCO2e/tonne-km
    methodology VARCHAR(64) NOT NULL DEFAULT 'GHG_PROTOCOL',
    gas_coverage VARCHAR(32) NOT NULL DEFAULT 'CO2e',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUPERSEDED, DRAFT, REVOKED
    evidence_id UUID REFERENCES evidence_records(evidence_id) ON DELETE SET NULL,
    evidence_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emission_factor_ver UNIQUE (factor_id, version_tag, geography)
);

CREATE TABLE IF NOT EXISTS ghg_scope_definitions (
    scope_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(16) NOT NULL UNIQUE, -- SCOPE_1, SCOPE_2, SCOPE_3
    name VARCHAR(64) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS ghg_category_definitions (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope_id UUID NOT NULL REFERENCES ghg_scope_definitions(scope_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS ghg_mapping_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    source_domain VARCHAR(32) NOT NULL,
    ownership VARCHAR(32),
    trip_direction VARCHAR(32),
    activity_type VARCHAR(64),
    scope_id UUID REFERENCES ghg_scope_definitions(scope_id) ON DELETE SET NULL,
    category_id UUID REFERENCES ghg_category_definitions(category_id) ON DELETE SET NULL,
    scope VARCHAR(16) NOT NULL,
    category VARCHAR(64) NOT NULL,
    subcategory VARCHAR(64) NOT NULL,
    methodology VARCHAR(64) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ghg_mapping_rules ON ghg_mapping_rules (source_domain, priority DESC);

-- Canonical Normalized GHG Activity Record
CREATE TABLE IF NOT EXISTS ghg_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(64) NOT NULL UNIQUE, -- GHA-2026-000001
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    source_activity_id UUID REFERENCES transport_activities(id) ON DELETE SET NULL,
    
    activity_type VARCHAR(64) NOT NULL, -- COMMUTER_TRAVEL, BUSINESS_TRAVEL, UPSTREAM_LOGISTICS, DOWNSTREAM_LOGISTICS, FLEET_FUEL
    activity_date DATE NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL CHECK (quantity >= 0),
    quantity_unit VARCHAR(32) NOT NULL, -- KM, LITRES, TONNE_KM, KWH
    
    transport_mode_id UUID REFERENCES transport_modes(mode_id) ON DELETE SET NULL,
    vehicle_type_id UUID REFERENCES vehicle_types(type_id) ON DELETE SET NULL,
    fuel_type_id UUID REFERENCES vehicle_fuel_types(fuel_type_id) ON DELETE SET NULL,
    occupancy INTEGER DEFAULT 1,
    origin VARCHAR(255),
    destination VARCHAR(255),
    distance NUMERIC(10, 2),
    distance_unit VARCHAR(16) DEFAULT 'KM',
    
    emission_factor_id VARCHAR(64) REFERENCES emission_factors(factor_id) ON DELETE SET NULL,
    emission_factor_version VARCHAR(32),
    methodology_id VARCHAR(64),
    scope VARCHAR(16),
    category VARCHAR(64),
    subcategory VARCHAR(64),
    
    co2 NUMERIC(14, 4),
    ch4 NUMERIC(14, 4),
    n2o NUMERIC(14, 4),
    co2e NUMERIC(14, 4),
    
    data_quality VARCHAR(32) NOT NULL DEFAULT 'MEASURED', -- Data quality classification
    calculation_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, CALCULATED, FAILED, SUPERSEDED
    verification_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED', -- UNVERIFIED, VERIFIED, AUDITED
    evidence_id UUID REFERENCES evidence_records(evidence_id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_ghg_source UNIQUE (tenant_id, source_domain, source_transaction_id, activity_type)
);

CREATE INDEX IF NOT EXISTS idx_ghg_act_source ON ghg_activities (tenant_id, source_domain, source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ghg_act_status ON ghg_activities (calculation_status, created_at);

-- Immutable Calculation Execution Record
CREATE TABLE IF NOT EXISTS ghg_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ghg_activity_id UUID NOT NULL REFERENCES ghg_activities(id) ON DELETE CASCADE,
    emission_factor_id VARCHAR(64) NOT NULL REFERENCES emission_factors(factor_id),
    emission_factor_version VARCHAR(32) NOT NULL,
    methodology_id VARCHAR(64) NOT NULL,
    input_snapshot JSONB NOT NULL, -- JSONB snapshot of all calculation inputs
    calculation_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    co2 NUMERIC(14, 4),
    ch4 NUMERIC(14, 4),
    n2o NUMERIC(14, 4),
    co2e NUMERIC(14, 4) NOT NULL,
    calculation_status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    calculation_version INTEGER NOT NULL DEFAULT 1,
    created_by VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_ghg_calc_activity ON ghg_calculations (ghg_activity_id, calculation_timestamp DESC);

-- ============================================================================
-- 20. NOTIFICATION DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_channels (
    channel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE, -- IN_APP, EMAIL, SMS, WHATSAPP, WEBHOOK
    name VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notification_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    channel_id UUID NOT NULL REFERENCES notification_channels(channel_id) ON DELETE RESTRICT,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notif_template UNIQUE (tenant_id, code, channel_id)
);

CREATE TABLE IF NOT EXISTS notification_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    template_id UUID NOT NULL REFERENCES notification_templates(template_id) ON DELETE CASCADE,
    recipient_type VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    recipient_contact VARCHAR(255) NOT NULL,
    channel_id UUID NOT NULL REFERENCES notification_channels(channel_id) ON DELETE RESTRICT,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(notification_id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL,
    provider_response TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 21. APPEND-ONLY AUDIT & DOMAIN EVENT LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(64),
    correlation_id VARCHAR(64),
    source VARCHAR(64) NOT NULL DEFAULT 'API',
    before_snapshot JSONB,
    after_snapshot JSONB,
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_logs (tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS domain_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    source_domain VARCHAR(32) NOT NULL,
    source_entity_id VARCHAR(64) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(64),
    correlation_id VARCHAR(64),
    causation_id VARCHAR(64),
    payload JSONB NOT NULL,
    version VARCHAR(16) NOT NULL DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_domain_events_source ON domain_events (tenant_id, source_domain, source_entity_id);

-- ============================================================================
-- PERFORMANCE & OPERATIONAL INDEXES (Section 46 / Indexing Strategy)
-- ============================================================================

-- Fast Physical Gate & Security Lookups (<5ms target)
CREATE INDEX IF NOT EXISTS idx_access_credentials_lookup ON access_credentials (tenant_id, identifier_token) INCLUDE (credential_type, valid_to, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_lookup ON vehicles (tenant_id, registration_plate) INCLUDE (vehicle_type_id, status);

-- Operational Search & Filtering
CREATE INDEX IF NOT EXISTS idx_visitor_tx_site_status ON visitor_transactions (tenant_id, site_id, status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_customer_visit_account ON customer_visit_transactions (tenant_id, account_id, status);
CREATE INDEX IF NOT EXISTS idx_contractor_wo_company ON contractor_work_orders (tenant_id, contracting_company_id, status);
CREATE INDEX IF NOT EXISTS idx_contractor_attendance_active ON contractor_attendance (tenant_id, site_id, clock_out_time) WHERE clock_out_time IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_tx_site_stage ON material_transactions (tenant_id, site_id, stage, created_at);

-- ESG Activity & GHG Provenance Traversal
CREATE INDEX IF NOT EXISTS idx_ghg_activities_source ON ghg_activities (tenant_id, source_domain, source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transport_activities_source ON transport_activities (tenant_id, source_domain, source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ef_versions_lookup ON emission_factor_versions (factor_id, version_tag, geography, reporting_year);

-- Approval Instances & Delegations
CREATE INDEX IF NOT EXISTS idx_approval_instances_source ON approval_instances (tenant_id, source_domain, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_instance ON approval_actions (tenant_id, instance_id, step_order);

-- Gate Event Telemetry Stream
CREATE INDEX IF NOT EXISTS idx_gate_events_stream ON gate_events (tenant_id, gate_id, event_timestamp DESC);

-- Document Links & Polymorphic Relations
CREATE INDEX IF NOT EXISTS idx_document_links_target ON document_links (tenant_id, target_entity_type, target_entity_id);

-- ============================================================================
-- 22. COMPATIBILITY VIEWS & ALIASES (Part 1 & 2 Ecosystem Support)
-- ============================================================================

CREATE OR REPLACE VIEW esg_activity_records AS
    SELECT 
        id AS esg_activity_id,
        tenant_id,
        site_id,
        source_domain,
        source_transaction_id,
        source_activity_id AS transport_id,
        activity_type,
        quantity AS activity_quantity,
        quantity_unit AS activity_unit,
        data_quality AS data_provenance,
        created_at
    FROM ghg_activities;

CREATE OR REPLACE VIEW ghg_calculation_results AS
    SELECT 
        c.id AS calculation_id,
        a.tenant_id,
        c.ghg_activity_id AS esg_activity_id,
        c.emission_factor_id AS factor_id,
        a.scope AS ghg_scope,
        a.category AS ghg_category,
        a.subcategory,
        c.methodology_id AS methodology,
        0.000000::NUMERIC AS factor_value_used,
        a.quantity AS activity_quantity,
        c.co2e AS calculated_emissions_kg_co2e,
        c.id::VARCHAR(64) AS calculation_hash,
        c.calculation_timestamp AS calculated_at,
        c.calculation_status AS status
    FROM ghg_calculations c
    JOIN ghg_activities a ON c.ghg_activity_id = a.id;

CREATE OR REPLACE VIEW scope_mapping_rules AS
    SELECT 
        rule_id,
        tenant_id,
        source_domain,
        ownership,
        trip_direction,
        activity_type,
        scope,
        category,
        subcategory,
        methodology,
        priority,
        is_active,
        created_at
    FROM ghg_mapping_rules;

CREATE OR REPLACE VIEW audit_events AS
    SELECT 
        audit_id,
        tenant_id,
        actor_id,
        actor_role,
        action,
        entity_type AS entity_name,
        entity_id,
        before_snapshot AS previous_state,
        after_snapshot AS new_state,
        NULL::VARCHAR(45) AS client_ip,
        NULL::TEXT AS user_agent,
        timestamp AS created_at
    FROM audit_logs;

CREATE OR REPLACE VIEW outbox_events AS
    SELECT 
        event_id,
        tenant_id,
        event_type,
        payload,
        TRUE AS published,
        occurred_at AS published_at,
        occurred_at AS created_at
    FROM domain_events;

-- ============================================================================
-- 23. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE visitor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_visit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghg_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_visitor') THEN
        CREATE POLICY tenant_isolation_visitor ON visitor_transactions
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_transport') THEN
        CREATE POLICY tenant_isolation_transport ON transport_activities
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_ghg') THEN
        CREATE POLICY tenant_isolation_ghg ON ghg_activities
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_documents') THEN
        CREATE POLICY tenant_isolation_documents ON documents
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
END $$;

-- ============================================================================
-- 22. ENTERPRISE MASTER DATA & POLICY FRAMEWORK (PART 5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_data_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    domain VARCHAR(32) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval_for_activation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_data_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(site_id) ON DELETE SET NULL,
    category VARCHAR(64) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_record_id UUID REFERENCES master_data_records(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    sort_order INTEGER NOT NULL DEFAULT 0,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    pending_approval BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_master_tenant_cat_code UNIQUE (tenant_id, category, code)
);

CREATE TABLE IF NOT EXISTS master_data_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES master_data_records(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changed_by VARCHAR(64) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    CONSTRAINT uq_master_version UNIQUE (record_id, version_number)
);

CREATE TABLE IF NOT EXISTS policy_definitions (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE CASCADE,
    domain VARCHAR(32) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_policy_def_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS policy_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policy_definitions(policy_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    rules JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_policy_ver UNIQUE (policy_id, version_number)
);

CREATE TABLE IF NOT EXISTS policy_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policy_definitions(policy_id) ON DELETE CASCADE,
    rule_code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
    action VARCHAR(32) NOT NULL,
    action_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policy_evaluation_records (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policy_definitions(policy_id) ON DELETE SET NULL,
    domain VARCHAR(32) NOT NULL,
    transaction_id VARCHAR(64) NOT NULL,
    allowed BOOLEAN NOT NULL,
    action_result VARCHAR(32) NOT NULL,
    explanation TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_outbox_events (
    outbox_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMPTZ,
    error_details TEXT
);

-- ============================================================================
-- 23. WORKFLOW ENGINE, APPROVAL MATRIX & DELEGATION (PART 5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
    definition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE CASCADE,
    domain VARCHAR(32) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_workflow_def_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS workflow_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    definition_id UUID NOT NULL REFERENCES workflow_definitions(definition_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMPTZ,
    stages JSONB NOT NULL DEFAULT '[]'::JSONB,
    transitions JSONB NOT NULL DEFAULT '[]'::JSONB,
    published_by VARCHAR(64),
    published_at TIMESTAMPTZ,
    immutable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_workflow_ver UNIQUE (definition_id, version_number)
);

CREATE TABLE IF NOT EXISTS workflow_instances (
    instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES workflow_definitions(definition_id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES workflow_versions(version_id) ON DELETE RESTRICT,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    current_stage_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    history JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    stage_id VARCHAR(64) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE SET NULL,
    source_domain VARCHAR(32) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    assigned_to_user_id VARCHAR(64),
    assigned_to_role VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    sla_due_at TIMESTAMPTZ,
    sla_warning_at TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    sla_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    escalation_count INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS workflow_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    stage_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    remarks TEXT,
    action_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_delegations (
    delegation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    delegator_user_id VARCHAR(64) NOT NULL,
    delegate_user_id VARCHAR(64) NOT NULL,
    domain_scope VARCHAR(32),
    site_scope_id UUID REFERENCES sites(site_id) ON DELETE SET NULL,
    stage_scope_id VARCHAR(64),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(task_id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    stage_id VARCHAR(64) NOT NULL,
    actor_user_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    remarks TEXT,
    delegation_id UUID REFERENCES approval_delegations(delegation_id) ON DELETE SET NULL,
    decision_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changes_required_details TEXT
);
