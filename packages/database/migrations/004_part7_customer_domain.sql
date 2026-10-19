-- ============================================================================
-- VMS Enterprise: Part 7 Migration - Customer Domain Schema & Seed Data
-- ============================================================================

-- 1. ENHANCE CUSTOMER ACCOUNTS
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS classification VARCHAR(64) NOT NULL DEFAULT 'EXISTING_CUSTOMER';
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS registration_number VARCHAR(64);
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS primary_contact_person_id UUID REFERENCES persons(person_id);
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS commercial_owner_user_id UUID REFERENCES users(user_id);
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS approved_site_ids JSONB;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS default_visit_requirements JSONB;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS default_nda_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS default_photography_policy VARCHAR(32) NOT NULL DEFAULT 'RESTRICTED';
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS default_escort_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS default_access_requirements JSONB;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. ENHANCE CUSTOMER REPRESENTATIVES
ALTER TABLE customer_representatives ADD COLUMN IF NOT EXISTS identity_verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED';
ALTER TABLE customer_representatives ADD COLUMN IF NOT EXISTS profile_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE customer_representatives ADD COLUMN IF NOT EXISTS preferred_contact_channel VARCHAR(32) DEFAULT 'EMAIL';
ALTER TABLE customer_representatives ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. ENHANCE CUSTOMER VISIT TRANSACTIONS
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(32) NOT NULL DEFAULT 'RESERVED';
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS visit_type_code VARCHAR(64) NOT NULL DEFAULT 'CUSTOMER_MEETING';
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS purpose VARCHAR(255);
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS department VARCHAR(128);
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS relationship_owner_user_id UUID REFERENCES users(user_id);
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS workflow_instance_id VARCHAR(64);
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS approval_state VARCHAR(32) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS nda_document_ref VARCHAR(255);
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS photography_policy VARCHAR(32) NOT NULL DEFAULT 'RESTRICTED';
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS escort_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS access_requirement TEXT;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS transport_activity_id UUID;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS ghg_activity_id UUID;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS audit_details JSONB;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS inspection_details JSONB;
ALTER TABLE customer_visit_transactions ADD COLUMN IF NOT EXISTS closure_summary JSONB;

-- 4. ENHANCE CUSTOMER VISIT PARTICIPANTS
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS designation VARCHAR(128);
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS identity_status VARCHAR(32) NOT NULL DEFAULT 'PENDING';
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS presence_status VARCHAR(32) NOT NULL DEFAULT 'EXPECTED';
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS actual_arrival TIMESTAMPTZ;
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS actual_entry TIMESTAMPTZ;
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS actual_exit TIMESTAMPTZ;
ALTER TABLE customer_visit_participants ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(64);

-- 5. SEED CANONICAL CUSTOMER VISIT TYPES
INSERT INTO customer_visit_types (visit_type_id, tenant_id, code, name, description, is_active) VALUES
('00000000-0000-0000-0000-000000000711', NULL, 'CUSTOMER_MEETING', 'Customer Meeting', 'Standard commercial or operational customer alignment meeting', TRUE),
('00000000-0000-0000-0000-000000000712', NULL, 'CUSTOMER_AUDIT', 'Customer Audit', 'Formal customer compliance, QMS, or ESG facility audit', TRUE),
('00000000-0000-0000-0000-000000000713', NULL, 'CUSTOMER_INSPECTION', 'Customer Inspection', 'Pre-dispatch inspection, product quality witness, or tooling inspection', TRUE),
('00000000-0000-0000-0000-000000000714', NULL, 'QUALITY_VISIT', 'Quality Visit', 'Engineering quality review, defect analysis, and 8D validation', TRUE),
('00000000-0000-0000-0000-000000000715', NULL, 'TECHNICAL_VISIT', 'Technical Visit', 'Technical specifications review, CAD/drawings alignment, engineering trial', TRUE),
('00000000-0000-0000-0000-000000000716', NULL, 'PLANT_VISIT', 'Plant Visit', 'Executive plant tour, manufacturing capability assessment', TRUE),
('00000000-0000-0000-0000-000000000717', NULL, 'MANAGEMENT_VISIT', 'Management Visit', 'C-suite / executive leadership strategic bilateral engagement', TRUE),
('00000000-0000-0000-0000-000000000718', NULL, 'DELEGATION_VISIT', 'Delegation Visit', 'Multi-member trade or procurement customer delegation', TRUE),
('00000000-0000-0000-0000-000000000719', NULL, 'PRODUCT_REVIEW', 'Product Review', 'Customer prototype review, first article inspection (FAI)', TRUE),
('00000000-0000-0000-0000-000000000720', NULL, 'PROCESS_REVIEW', 'Process Review', 'Line qualification, PPAP run validation, process capability study', TRUE),
('00000000-0000-0000-0000-000000000721', NULL, 'OTHER', 'Other', 'Other customer site engagement requiring registration and host escort', TRUE)
ON CONFLICT (visit_type_id) DO NOTHING;
