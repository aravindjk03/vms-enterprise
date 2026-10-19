-- ============================================================================
-- VMS Enterprise: Part 8 Migration - Contractor Domain Schema Enhancements
-- ============================================================================

-- 1. ENHANCE CONTRACTOR COMPANIES
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS contractor_classification VARCHAR(64) NOT NULL DEFAULT 'GENERAL_CONTRACTOR';
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS responsible_internal_manager_id UUID REFERENCES users(user_id);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(128);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(64);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(128);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS site_contact_name VARCHAR(128);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS approved_site_ids JSONB;
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(128);
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE contractor_companies ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. ENHANCE CONTRACTOR CONTRACTS
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(64) NOT NULL DEFAULT 'MASTER_SERVICES_AGREEMENT';
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS contract_owner_user_id UUID REFERENCES users(user_id);
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS scope_of_work TEXT;
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS authorized_site_ids JSONB;
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS applicable_departments JSONB;
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS required_insurance VARCHAR(128);
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS required_qualifications JSONB;
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS required_compliance_documents JSONB;
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS authorized_work_categories JSONB;
ALTER TABLE contractor_contracts ADD COLUMN IF NOT EXISTS approval_state VARCHAR(32) NOT NULL DEFAULT 'APPROVED';

-- 3. ENHANCE CONTRACTOR WORK ORDERS
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS work_category VARCHAR(64) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS responsible_internal_manager_id UUID REFERENCES users(user_id);
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS work_location VARCHAR(255);
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS target_zone_id UUID REFERENCES zones(zone_id);
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS required_qualifications JSONB;
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS required_documents JSONB;
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS required_training JSONB;
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS permit_requirements JSONB;
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS transport_activity_id UUID;
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS ghg_activity_id UUID;
ALTER TABLE contractor_work_orders ADD COLUMN IF NOT EXISTS approval_state VARCHAR(32) NOT NULL DEFAULT 'DRAFT';

-- 4. ENHANCE CONTRACTOR WORKERS
ALTER TABLE contractor_workers ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE contractor_workers ADD COLUMN IF NOT EXISTS worker_category VARCHAR(64) NOT NULL DEFAULT 'SKILLED';
ALTER TABLE contractor_workers ADD COLUMN IF NOT EXISTS designation VARCHAR(128);
ALTER TABLE contractor_workers ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
ALTER TABLE contractor_workers ADD COLUMN IF NOT EXISTS email VARCHAR(128);
ALTER TABLE contractor_workers ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. ENHANCE CONTRACTOR ASSIGNMENTS
ALTER TABLE contractor_assignments ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(site_id);
ALTER TABLE contractor_assignments ADD COLUMN IF NOT EXISTS work_location VARCHAR(255);
ALTER TABLE contractor_assignments ADD COLUMN IF NOT EXISTS shift_pattern VARCHAR(32) NOT NULL DEFAULT 'GENERAL_SHIFT';
ALTER TABLE contractor_assignments ADD COLUMN IF NOT EXISTS eligibility_status VARCHAR(32) NOT NULL DEFAULT 'ELIGIBLE';
ALTER TABLE contractor_assignments ADD COLUMN IF NOT EXISTS eligibility_reasons JSONB;
ALTER TABLE contractor_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6. ENHANCE CONTRACTOR ATTENDANCE
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS gate_id UUID REFERENCES gates(gate_id);
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES contractor_assignments(assignment_id);
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS presence_status VARCHAR(32) NOT NULL DEFAULT 'CHECKED_IN';
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS source_device_id VARCHAR(64);
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS operator_user_id VARCHAR(64);
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS transport_activity_id UUID;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS ghg_activity_id UUID;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS is_manual_correction BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS original_event_ref VARCHAR(64);
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS correction_reason TEXT;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7. CREATE CONTRACTOR COMPLIANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS contractor_compliance_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    worker_id UUID REFERENCES contractor_workers(contractor_worker_id) ON DELETE CASCADE,
    company_id UUID REFERENCES contractor_companies(company_id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contractor_contracts(contract_id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES contractor_work_orders(work_order_id) ON DELETE CASCADE,
    requirement_type VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'REQUIRED',
    document_ref VARCHAR(255),
    valid_from DATE,
    valid_to DATE,
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. CREATE CONTRACTOR QUALIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS contractor_qualifications (
    qualification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES contractor_workers(contractor_worker_id) ON DELETE CASCADE,
    qualification_name VARCHAR(255) NOT NULL,
    qualification_code VARCHAR(64),
    issuing_body VARCHAR(255),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VALID',
    certificate_ref VARCHAR(255),
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
