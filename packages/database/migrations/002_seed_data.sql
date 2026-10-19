-- ============================================================================
-- VMS ENTERPRISE PRODUCTION SEED DATA (PostgreSQL 16+)
-- Migration 002: Master Hierarchy, Reference Data, Person Identities & DEMO Seeds
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MULTI-TENANT TOPOLOGY SEEDS
-- ----------------------------------------------------------------------------
INSERT INTO tenants (tenant_id, code, name, status, created_by, updated_by) VALUES
('00000000-0000-0000-0000-000000000001', 'GLOBAL-MFG', 'Global Manufacturing Conglomerate', 'ACTIVE', 'SYSTEM_BOOTSTRAP', 'SYSTEM_BOOTSTRAP')
ON CONFLICT (code) DO NOTHING;

INSERT INTO organizations (organization_id, tenant_id, code, name, status, created_by, updated_by) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'AUTO-NA', 'North America Automotive Division', 'ACTIVE', 'SYSTEM_BOOTSTRAP', 'SYSTEM_BOOTSTRAP'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'HEAVY-APAC', 'Asia-Pacific Heavy Equipment Division', 'ACTIVE', 'SYSTEM_BOOTSTRAP', 'SYSTEM_BOOTSTRAP')
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO sites (site_id, tenant_id, organization_id, code, name, latitude, longitude, timezone, status, created_by, updated_by) VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'DETROIT-ASSEMBLY', 'Detroit Stamping & Assembly Complex', 42.331427, -83.045754, 'America/Detroit', 'ACTIVE', 'SYSTEM_BOOTSTRAP', 'SYSTEM_BOOTSTRAP'),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'CHENNAI-PLANT', 'Chennai Precision Manufacturing Plant', 12.981500, 80.043200, 'Asia/Kolkata', 'ACTIVE', 'SYSTEM_BOOTSTRAP', 'SYSTEM_BOOTSTRAP')
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO departments (department_id, tenant_id, site_id, code, name, status) VALUES
('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'DET-OPS', 'Plant Operations', 'ACTIVE'),
('00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'DET-EHS', 'Environmental Health & Safety', 'ACTIVE'),
('00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'DET-SEC', 'Physical Plant Security', 'ACTIVE'),
('00000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'CHE-OPS', 'Machining Operations', 'ACTIVE'),
('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'CHE-EHS', 'EHS & Sustainability', 'ACTIVE')
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO buildings (building_id, tenant_id, site_id, code, name, status) VALUES
('00000000-0000-0000-0000-000000000151', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'BLD-A', 'Main Administration Center', 'ACTIVE'),
('00000000-0000-0000-0000-000000000152', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'BLD-B', 'Robotic Assembly Complex', 'ACTIVE'),
('00000000-0000-0000-0000-000000000153', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'BLD-N', 'Precision Engineering Bay', 'ACTIVE')
ON CONFLICT (tenant_id, site_id, code) DO NOTHING;

INSERT INTO gates (gate_id, tenant_id, site_id, building_id, code, name, gate_type, is_active) VALUES
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000151', 'DET-GATE-1', 'Detroit Gate 1 - Main Pedestrian Reception', 'PEDESTRIAN', TRUE),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000152', 'DET-GATE-2', 'Detroit Gate 2 - Commercial Logistics & Dock', 'COMMERCIAL_VEHICLE', TRUE),
('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000153', 'CHE-GATE-1', 'Chennai North Gate - Welcome Center', 'PEDESTRIAN', TRUE),
('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000153', 'CHE-GATE-2', 'Chennai South Gate - Heavy Inward Weighbridge', 'COMMERCIAL_VEHICLE', TRUE)
ON CONFLICT (tenant_id, site_id, code) DO NOTHING;

INSERT INTO zones (zone_id, tenant_id, site_id, building_id, code, name, security_level, max_capacity) VALUES
('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000151', 'ZONE-LOBBY', 'Executive Administration Lobby', 'STANDARD', 250),
('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000152', 'ZONE-STAMP', 'Robotic Stamping Bay Alpha', 'HIGH_SECURITY', 80),
('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000152', 'ZONE-HAZMAT', 'Chemical Solvent Storage (PTW Required)', 'HAZARDOUS', 15),
('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000153', 'ZONE-CNC', 'Precision CNC Machining Floor', 'HIGH_SECURITY', 60)
ON CONFLICT (tenant_id, site_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. MASTER REFERENCE DATA SEEDS
-- ----------------------------------------------------------------------------
INSERT INTO organization_types (type_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000401', 'CUSTOMER', 'Customer / Client', 'Enterprise customer organization'),
('00000000-0000-0000-0000-000000000402', 'SUPPLIER', 'Material Supplier', 'Raw materials and parts supplier'),
('00000000-0000-0000-0000-000000000403', 'CONTRACTOR', 'Contractor Vendor', 'Turnkey maintenance and civil contractor'),
('00000000-0000-0000-0000-000000000404', 'SERVICE_PROVIDER', 'Service Provider', 'OEM equipment calibration and specialized service'),
('00000000-0000-0000-0000-000000000405', 'TRANSPORTER', 'Logistics / Transporter', '3PL and commercial transport fleet operator'),
('00000000-0000-0000-0000-000000000406', 'CONSULTANT', 'Advisory / Consultant', 'Auditors, technical advisers, legal counsel')
ON CONFLICT (code) DO NOTHING;

INSERT INTO visitor_types (type_id, tenant_id, code, name, description, requires_escort) VALUES
('00000000-0000-0000-0000-000000000411', NULL, 'STANDARD', 'General Business Visitor', 'Standard commercial or meeting visitor', TRUE),
('00000000-0000-0000-0000-000000000412', NULL, 'VIP', 'VIP Executive Delegation', 'Senior executive or board visitor', TRUE),
('00000000-0000-0000-0000-000000000413', NULL, 'AUDITOR', 'Statutory / ESG Auditor', 'External accreditation auditor', FALSE),
('00000000-0000-0000-0000-000000000414', NULL, 'INTERVIEWEE', 'Job Candidate', 'Candidate visiting for interview', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO visitor_purposes (purpose_id, tenant_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000421', NULL, 'BUSINESS_MEETING', 'Commercial Meeting', 'Regular commercial or operational meeting'),
('00000000-0000-0000-0000-000000000422', NULL, 'AUDIT_INSPECTION', 'Facility Audit / Inspection', 'Compliance or regulatory audit'),
('00000000-0000-0000-0000-000000000423', NULL, 'TECHNICAL_CONSULTATION', 'Technical Consultation', 'Engineering consultation session'),
('00000000-0000-0000-0000-000000000424', NULL, 'JOB_INTERVIEW', 'Employment Interview', 'Recruitment assessment')
ON CONFLICT DO NOTHING;

INSERT INTO transport_modes (mode_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000431', 'CAR', 'Automobile / Car', 'Passenger car'),
('00000000-0000-0000-0000-000000000432', 'TWO_WHEELER', 'Motorcycle / Scooter', 'Two-wheeler motorized transit'),
('00000000-0000-0000-0000-000000000433', 'BUS', 'Commuter Bus / Shuttle', 'Multi-passenger bus transit'),
('00000000-0000-0000-0000-000000000434', 'TRAIN', 'Railway / Rail Transit', 'Commuter or intercity rail transit'),
('00000000-0000-0000-0000-000000000435', 'FLIGHT', 'Commercial Aviation Flight', 'Commercial airline transit'),
('00000000-0000-0000-0000-000000000436', 'TAXI_CAB', 'Hired Taxi / Ride Hailing', 'Hired motor cab'),
('00000000-0000-0000-0000-000000000437', 'TRUCK', 'Commercial Heavy Goods Vehicle', 'Freight truck'),
('00000000-0000-0000-0000-000000000438', 'WALKING', 'Active Mobility (Walking / Cycling)', 'Zero-emission active commute')
ON CONFLICT (code) DO NOTHING;

INSERT INTO transport_ownership_types (ownership_type_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000441', 'PERSONAL', 'Personal / Private', 'Personally owned by the individual'),
('00000000-0000-0000-0000-000000000442', 'COMPANY', 'Company Owned / Fleet', 'Owned or leased directly by enterprise'),
('00000000-0000-0000-0000-000000000443', 'HIRED', 'Hired / Commercial Rental', 'Rented vehicle or hired service'),
('00000000-0000-0000-0000-000000000444', 'PUBLIC', 'Public Mass Transit', 'Public municipal or national transit system'),
('00000000-0000-0000-0000-000000000445', 'SUPPLIER', 'Supplier Freight Carrier', 'Supplied freight vehicle'),
('00000000-0000-0000-0000-000000000446', 'TRANSPORTER', 'Third-Party Logistics (3PL)', 'Dedicated freight logistics transporter')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vehicle_ownership_types (ownership_type_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000441', 'PERSONAL', 'Personal / Private', 'Personally owned by the individual'),
('00000000-0000-0000-0000-000000000442', 'COMPANY', 'Company Owned / Fleet', 'Owned or leased directly by enterprise'),
('00000000-0000-0000-0000-000000000443', 'HIRED', 'Hired / Commercial Rental', 'Rented vehicle or hired service'),
('00000000-0000-0000-0000-000000000444', 'PUBLIC', 'Public Mass Transit', 'Public municipal or national transit system'),
('00000000-0000-0000-0000-000000000445', 'SUPPLIER', 'Supplier Freight Carrier', 'Supplied freight vehicle'),
('00000000-0000-0000-0000-000000000446', 'TRANSPORTER', 'Third-Party Logistics (3PL)', 'Dedicated freight logistics transporter')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vehicle_types (type_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000451', 'SEDAN', 'Sedan Car', 'Standard 4-door passenger sedan'),
('00000000-0000-0000-0000-000000000452', 'SUV', 'Sports Utility Vehicle', 'Large passenger SUV'),
('00000000-0000-0000-0000-000000000453', 'HATCHBACK', 'Compact Hatchback', 'Small compact passenger car'),
('00000000-0000-0000-0000-000000000454', 'TWO_WHEELER', 'Motorcycle / Scooter', '2-wheeled motor transit'),
('00000000-0000-0000-0000-000000000455', 'COACH_BUS', 'Coach Bus', 'Large multi-passenger coach'),
('00000000-0000-0000-0000-000000000456', 'MEDIUM_DUTY_TRUCK', 'Medium Commercial Vehicle', 'Medium freight truck (3.5 to 7.5 tonnes)'),
('00000000-0000-0000-0000-000000000457', 'HEAVY_DUTY_TRUCK', 'Heavy Commercial Vehicle', 'Heavy articulation freight truck (> 7.5 tonnes)')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vehicle_fuel_types (fuel_type_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000461', 'PETROL', 'Motor Gasoline / Petrol', 'Internal combustion gasoline'),
('00000000-0000-0000-0000-000000000462', 'DIESEL', 'Automotive Diesel Oil', 'Internal combustion diesel'),
('00000000-0000-0000-0000-000000000463', 'CNG', 'Compressed Natural Gas', 'Clean natural gas alternative'),
('00000000-0000-0000-0000-000000000464', 'ELECTRIC', 'Battery Electric Vehicle (BEV)', 'Pure zero-tailpipe electric motor'),
('00000000-0000-0000-0000-000000000465', 'HYBRID_PETROL', 'Petrol-Electric Hybrid', 'Combustion-electric hybrid system')
ON CONFLICT (code) DO NOTHING;

INSERT INTO data_quality_levels (level_id, code, name, score, description) VALUES
('00000000-0000-0000-0000-000000000471', 'MEASURED', 'Directly Measured & Calibrated', 100, 'Weighbridge, calibrated odometer, or hardware sensor telemetry'),
('00000000-0000-0000-0000-000000000472', 'USER_PROVIDED', 'Declared by User / Form', 80, 'Self-reported distance or origin input verified by operator'),
('00000000-0000-0000-0000-000000000473', 'SYSTEM_CALCULATED', 'System Calculated Route', 90, 'GIS routing engine road network distance calculation'),
('00000000-0000-0000-0000-000000000474', 'SYSTEM_ESTIMATED', 'System Lookup Estimate', 70, 'Postal code centroid lookup or postal distance matrix'),
('00000000-0000-0000-0000-000000000475', 'IMPORTED', 'External System Import', 75, 'ERP or logistics provider EDI manifest payload')
ON CONFLICT (code) DO NOTHING;

INSERT INTO document_types (type_id, tenant_id, code, name, is_sensitive, retention_days) VALUES
('00000000-0000-0000-0000-000000000481', NULL, 'GOVT_ID', 'Government Issued Photo ID', TRUE, 180),
('00000000-0000-0000-0000-000000000482', NULL, 'NDA', 'Non-Disclosure Agreement', FALSE, 1825),
('00000000-0000-0000-0000-000000000483', NULL, 'POLLUTION_CERT', 'Pollution Under Control (PUC)', FALSE, 365),
('00000000-0000-0000-0000-000000000484', NULL, 'VEHICLE_INSURANCE', 'Commercial Vehicle Insurance', FALSE, 365),
('00000000-0000-0000-0000-000000000485', NULL, 'SAFETY_CERT', 'Occupational Safety Certificate', FALSE, 365),
('00000000-0000-0000-0000-000000000486', NULL, 'PERMIT_TO_WORK', 'Hazardous Work Permit', FALSE, 730),
('00000000-0000-0000-0000-000000000487', NULL, 'DELIVERY_CHALLAN', 'Material Delivery Challan', FALSE, 2555),
('00000000-0000-0000-0000-000000000488', NULL, 'TAX_INVOICE', 'Commercial Tax Invoice', FALSE, 2555)
ON CONFLICT DO NOTHING;

INSERT INTO material_categories (category_id, tenant_id, code, name, description, is_hazardous) VALUES
('00000000-0000-0000-0000-000000000491', NULL, 'RAW_METALS', 'Raw Sheet Metals & Alloys', 'Steel, aluminum, brass raw stock', FALSE),
('00000000-0000-0000-0000-000000000492', NULL, 'ELECTRONICS', 'Sensors, Actuators & Circuit Boards', 'Electrical sub-assemblies', FALSE),
('00000000-0000-0000-0000-000000000493', NULL, 'CHEMICALS', 'Industrial Solvents & Lubricants', 'Chemical consumables', TRUE),
('00000000-0000-0000-0000-000000000494', NULL, 'PACKAGING', 'Corrugated Boxes & Pallets', 'Packing materials', FALSE)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. FINE-GRAINED ROLES & PERMISSIONS
-- ----------------------------------------------------------------------------
INSERT INTO permissions (permission_id, code, name, description, module) VALUES
('00000000-0000-0000-0000-000000000501', 'visitor.read', 'Read Visitor Records', 'View visitor transactions and appointments', 'VISITOR'),
('00000000-0000-0000-0000-000000000502', 'visitor.create', 'Create Visitor Pass', 'Register visitor invitations and walk-ins', 'VISITOR'),
('00000000-0000-0000-0000-000000000503', 'visitor.approve', 'Approve Visitor Pass', 'Authorize visitor entry requests', 'VISITOR'),
('00000000-0000-0000-0000-000000000504', 'visitor.checkin', 'Check-In Visitor', 'Admit visitor at turnstile or reception desk', 'VISITOR'),
('00000000-0000-0000-0000-000000000505', 'visitor.checkout', 'Check-Out Visitor', 'Log visitor exit from site premises', 'VISITOR'),
('00000000-0000-0000-0000-000000000506', 'contractor.read', 'Read Contractor Data', 'View contracts, work orders and worker rosters', 'CONTRACTOR'),
('00000000-0000-0000-0000-000000000507', 'contractor.approve', 'Approve Contractor Orders', 'Approve contractor work orders and permits', 'CONTRACTOR'),
('00000000-0000-0000-0000-000000000508', 'material.read', 'Read Material Movements', 'Inspect delivery challans, POs, and line items', 'MATERIAL'),
('00000000-0000-0000-0000-000000000509', 'material.approve', 'Approve Material Gate Pass', 'Sign off returnable or outward material gate pass', 'MATERIAL'),
('00000000-0000-0000-0000-000000000510', 'document.verify', 'Verify Compliance Docs', 'Audit and verify submitted identity or safety documents', 'DOCUMENT'),
('00000000-0000-0000-0000-000000000511', 'gate.entry', 'Actuate Inbound Gate', 'Trigger physical gate or boom barrier opening', 'GATE'),
('00000000-0000-0000-0000-000000000512', 'gate.exit', 'Actuate Outbound Gate', 'Trigger physical outbound gate actuation', 'GATE'),
('00000000-0000-0000-0000-000000000513', 'emergency.read', 'View Emergency Status', 'Inspect real-time site occupancy and muster rosters', 'EMERGENCY'),
('00000000-0000-0000-0000-000000000514', 'emergency.manage', 'Declare/Manage Emergency', 'Trigger evacuation alarm, lock gates, take snapshots', 'EMERGENCY'),
('00000000-0000-0000-0000-000000000515', 'esg.activity.read', 'Read ESG Activities', 'Access normalized transport and operational emissions', 'ESG'),
('00000000-0000-0000-0000-000000000516', 'esg.calculation.manage', 'Manage GHG Calculations', 'Trigger carbon accounting calculation and manage factors', 'ESG'),
('00000000-0000-0000-0000-000000000517', 'audit.read', 'Read Audit Logs', 'Query append-only audit trail and governance events', 'AUDIT')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (role_id, tenant_id, code, name, description, is_system) VALUES
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Global Super Administrator', 'Full system privilege', TRUE),
('00000000-0000-0000-0000-000000000552', '00000000-0000-0000-0000-000000000001', 'SITE_ADMIN', 'Site Facility Administrator', 'Site level management', TRUE),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000001', 'SECURITY_GUARD', 'Site Security Officer', 'Physical gate execution', TRUE),
('00000000-0000-0000-0000-000000000554', '00000000-0000-0000-0000-000000000001', 'ESG_MANAGER', 'Sustainability / ESG Officer', 'GHG accounting and emissions audit', TRUE),
('00000000-0000-0000-0000-000000000555', '00000000-0000-0000-0000-000000000001', 'EHS_MANAGER', 'Safety & Environmental Health Manager', 'Safety induction and work permits', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Grant permissions to roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- SUPER_ADMIN gets all permissions (501 to 517)
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000501'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000502'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000503'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000504'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000505'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000506'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000507'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000508'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000509'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000510'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000511'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000512'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000513'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000514'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000515'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000516'),
('00000000-0000-0000-0000-000000000551', '00000000-0000-0000-0000-000000000517'),
-- SECURITY_GUARD permissions
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000501'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000504'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000505'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000506'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000508'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000511'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000512'),
('00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000513'),
-- ESG_MANAGER permissions
('00000000-0000-0000-0000-000000000554', '00000000-0000-0000-0000-000000000515'),
('00000000-0000-0000-0000-000000000554', '00000000-0000-0000-0000-000000000516'),
('00000000-0000-0000-0000-000000000554', '00000000-0000-0000-0000-000000000517')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. SAMPLE USERS
-- ----------------------------------------------------------------------------
INSERT INTO users (user_id, tenant_id, organization_id, username, email, full_name, status, is_active) VALUES
('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'admin.detroit', 'admin.detroit@globalmfg.com', 'Detroit System Administrator', 'ACTIVE', TRUE),
('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'guard.detroit', 'guard.gate1@globalmfg.com', 'John Guard (Detroit Gate 1)', 'ACTIVE', TRUE),
('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'esg.officer', 'esg.manager@globalmfg.com', 'Elena Rostova (ESG Lead)', 'ACTIVE', TRUE),
('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'host.mary', 'mary.host@globalmfg.com', 'Mary Host (VP Engineering)', 'ACTIVE', TRUE)
ON CONFLICT (tenant_id, username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, tenant_id) VALUES
('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000552', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000553', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000554', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO user_site_access (user_id, site_id, tenant_id, is_default) VALUES
('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', TRUE),
('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', TRUE),
('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', TRUE),
('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', FALSE)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. REUSABLE PERSON IDENTITIES (NOT BOUND TO A SINGLE DOMAIN)
-- ----------------------------------------------------------------------------
INSERT INTO persons (person_id, tenant_id, first_name, last_name, display_name, date_of_birth, gender, nationality, status) VALUES
('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000001', 'Alice', 'Green', 'Alice Green', '1985-04-12', 'FEMALE', 'USA', 'ACTIVE'),
('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000001', 'Bob', 'Vance', 'Bob Vance', '1976-11-20', 'MALE', 'USA', 'ACTIVE'),
('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000001', 'Charlie', 'Davis', 'Charlie Davis', '1990-08-15', 'MALE', 'USA', 'ACTIVE'),
('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000001', 'Dave', 'Miller', 'Dave Miller', '1988-02-28', 'MALE', 'USA', 'ACTIVE'),
('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000001', 'Frank', 'Wright', 'Frank Wright', '1982-09-05', 'MALE', 'USA', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO person_contacts (contact_id, tenant_id, person_id, contact_type, contact_value, is_primary, is_verified) VALUES
('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000701', 'EMAIL', 'alice.green@partner.com', TRUE, TRUE),
('00000000-0000-0000-0000-000000000712', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000701', 'PHONE', '+1-555-0199', FALSE, TRUE),
('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000702', 'EMAIL', 'bob.vance@vancerefrigeration.com', TRUE, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO person_addresses (address_id, tenant_id, person_id, address_type, street_line1, city, state_province, postal_code, country) VALUES
('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000701', 'PRIMARY', '100 Michigan Ave', 'Detroit', 'MI', '48226', 'USA'),
('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000702', 'PRIMARY', '450 Fifth Ave', 'New York', 'NY', '10018', 'USA')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. SAMPLE EXTERNAL ORGANIZATIONS
-- ----------------------------------------------------------------------------
INSERT INTO external_organizations (org_id, tenant_id, code, legal_name, trade_name, tax_identifier, status) VALUES
('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000001', 'ACME-CORP', 'Acme Automotive Systems Inc', 'Acme Systems', 'US-EIN-99221144', 'ACTIVE'),
('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000001', 'APEX-FAB', 'Apex Industrial Fabrication LLC', 'Apex Fabrication', 'US-EIN-77441188', 'ACTIVE'),
('00000000-0000-0000-0000-000000000803', '00000000-0000-0000-0000-000000000001', 'STEEL-DYN', 'Steel Dynamics Manufacturing Ltd', 'Steel Dynamics', 'US-EIN-11223344', 'ACTIVE'),
('00000000-0000-0000-0000-000000000804', '00000000-0000-0000-0000-000000000001', 'EXPRESS-FREIGHT', 'Express Freight Logistics Inc', 'Express Freight', 'US-DOT-88331100', 'ACTIVE'),
('00000000-0000-0000-0000-000000000805', '00000000-0000-0000-0000-000000000001', 'KUKA-SERVICE', 'Kuka Robotics OEM Services Inc', 'Kuka Robotics Service', 'US-EIN-55667788', 'ACTIVE')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Map organization classifications (A company can have multiple business roles!)
INSERT INTO external_org_classifications (org_id, type_id) VALUES
('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000401'), -- Acme = Customer
('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000403'), -- Apex = Contractor
('00000000-0000-0000-0000-000000000803', '00000000-0000-0000-0000-000000000402'), -- Steel Dyn = Supplier
('00000000-0000-0000-0000-000000000804', '00000000-0000-0000-0000-000000000405'), -- Express = Transporter
('00000000-0000-0000-0000-000000000805', '00000000-0000-0000-0000-000000000404')  -- Kuka = Service Provider
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. SAMPLE CUSTOMER, CONTRACTOR, SERVICE & MATERIAL ENTITIES
-- ----------------------------------------------------------------------------
INSERT INTO customer_accounts (customer_account_id, tenant_id, external_org_id, account_code, account_name, tier, status) VALUES
('00000000-0000-0000-0000-000000000821', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000801', 'CUST-ACME-01', 'Acme Global Account', 'TIER_1_STRATEGIC', 'ACTIVE')
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO customer_representatives (rep_id, tenant_id, customer_account_id, person_id, job_title, department, is_primary) VALUES
('00000000-0000-0000-0000-000000000831', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000821', '00000000-0000-0000-0000-000000000702', 'VP Commercial Operations', 'Procurement', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO contractor_companies (company_id, tenant_id, external_org_id, vendor_code, safety_rating, status) VALUES
('00000000-0000-0000-0000-000000000841', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000802', 'VEND-APEX-99', 'GRADE_A', 'ACTIVE')
ON CONFLICT (tenant_id, vendor_code) DO NOTHING;

INSERT INTO contractor_contracts (contract_id, tenant_id, company_id, contract_number, title, start_date, end_date, status) VALUES
('00000000-0000-0000-0000-000000000851', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000841', 'CONTR-2026-APEX', 'Annual Facility Mechanical Maintenance', '2026-01-01', '2026-12-31', 'ACTIVE')
ON CONFLICT (tenant_id, contract_number) DO NOTHING;

INSERT INTO contractor_workers (contractor_worker_id, tenant_id, company_id, person_id, badge_number, trade_skill, medical_fitness_valid) VALUES
('00000000-0000-0000-0000-000000000861', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000841', '00000000-0000-0000-0000-000000000703', 'CW-BADGE-102', 'Certified Welder & Millwright', TRUE)
ON CONFLICT (tenant_id, badge_number) DO NOTHING;

INSERT INTO service_providers (service_provider_id, tenant_id, external_org_id, provider_code, service_category, status) VALUES
('00000000-0000-0000-0000-000000000871', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000805', 'SP-KUKA-01', 'Robotic Calibration', 'ACTIVE')
ON CONFLICT (tenant_id, provider_code) DO NOTHING;

INSERT INTO service_technicians (technician_id, tenant_id, service_provider_id, person_id, certification_level, badge_id, status) VALUES
('00000000-0000-0000-0000-000000000881', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000871', '00000000-0000-0000-0000-000000000704', 'Lead Robotics Specialist', 'TECH-KUKA-404', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO materials (material_id, tenant_id, category_id, material_code, name, unit_of_measure, requires_inspection, status) VALUES
('00000000-0000-0000-0000-000000000891', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000491', 'MAT-STEEL-ROD-20', 'High Tensile Steel Rod 20mm Grade B', 'METRIC_TONNES', TRUE, 'ACTIVE'),
('00000000-0000-0000-0000-000000000892', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000492', 'MAT-ACTUATOR-ARM', 'Precision Robotic Actuator Servo Unit', 'PCS', TRUE, 'ACTIVE'),
('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000491', 'MAT-STEEL-COIL', 'Hot Rolled Steel Coils', 'TONNE', TRUE, 'ACTIVE'),
('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000494', 'MAT-SHIPPING-SKID', 'Heavy Returnable Shipping Skids', 'PALLET', FALSE, 'ACTIVE')
ON CONFLICT (tenant_id, material_code) DO NOTHING;

INSERT INTO purchase_orders (po_id, tenant_id, po_number, supplier_org_id, issue_date, total_amount, currency, status) VALUES
('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001', 'PO-2026-00441', '00000000-0000-0000-0000-000000000803', '2026-01-10', 48500.00, 'USD', 'ACTIVE')
ON CONFLICT (tenant_id, po_number) DO NOTHING;

INSERT INTO purchase_order_lines (line_id, po_id, material_id, line_number, ordered_quantity, unit_price, received_quantity, status) VALUES
('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000891', 1, 50.000, 970.00, 25.000, 'PARTIAL')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. SAMPLE VEHICLES & DRIVERS
-- ----------------------------------------------------------------------------
INSERT INTO vehicles (vehicle_id, tenant_id, registration_plate, vehicle_type_id, fuel_type_id, ownership_type_id, owner_org_id, make, model, year, status) VALUES
('00000000-0000-0000-0000-000000000921', '00000000-0000-0000-0000-000000000001', 'MI-COMM-8899', '00000000-0000-0000-0000-000000000457', '00000000-0000-0000-0000-000000000462', '00000000-0000-0000-0000-000000000446', '00000000-0000-0000-0000-000000000804', 'Freightliner', 'Cascadia Heavy', 2023, 'ACTIVE'),
('00000000-0000-0000-0000-000000000922', '00000000-0000-0000-0000-000000000001', 'MI-FLEET-1024', '00000000-0000-0000-0000-000000000451', '00000000-0000-0000-0000-000000000461', '00000000-0000-0000-0000-000000000442', NULL, 'Ford', 'Fusion Corporate Fleet', 2024, 'ACTIVE')
ON CONFLICT (tenant_id, registration_plate) DO NOTHING;

INSERT INTO drivers (driver_id, tenant_id, person_id, license_number, license_type, license_expiry, badge_number, status) VALUES
('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000705', 'MI-CDL-99882211', 'COMMERCIAL_HEAVY', '2028-10-15', 'DRV-EXP-88', 'ACTIVE')
ON CONFLICT (tenant_id, license_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. MASTER EMISSION FACTORS (EXPLICIT DEMO/TEMPORARY BENCHMARK DATA)
-- ----------------------------------------------------------------------------
INSERT INTO emission_factor_sources (source_id, code, name, official_url, is_active) VALUES
('00000000-0000-0000-0000-000000000951', 'DEFRA', 'UK Department for Environment, Food & Rural Affairs (BEIS)', 'https://gov.uk/defra-ghg-conversion-factors', TRUE),
('00000000-0000-0000-0000-000000000952', 'US_EPA', 'United States Environmental Protection Agency (GHG Hub)', 'https://epa.gov/climateleadership/ghg-emission-factors-hub', TRUE),
('00000000-0000-0000-0000-000000000953', 'CEA_INDIA', 'Central Electricity Authority of India (CO2 Baseline)', 'https://cea.nic.in/cdm-co2-baseline-database', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO emission_factors (factor_id, factor_code, source_id, source, default_unit, description) VALUES
('EF-DEFRA-ROAD-PETROL-CAR', 'ROAD-PETROL-CAR', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Passenger petrol automobile emissions per km'),
('EF-DEFRA-ROAD-DIESEL-CAR', 'ROAD-DIESEL-CAR', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Passenger diesel automobile emissions per km'),
('EF-DEFRA-ROAD-DIESEL-HDV', 'ROAD-DIESEL-HEAVY-TRUCK', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Commercial rigid / articulated heavy freight HDV'),
('EF-CEA-ELECTRIC-CAR', 'ROAD-ELECTRIC-CAR', '00000000-0000-0000-0000-000000000953', 'CEA INDIA GRID', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Battery electric vehicle based on grid carbon intensity'),
('EF-DEFRA-ROAD-TWO-WHEELER', 'ROAD-TWO-WHEELER', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Motor scooter / motorcycle commute'),
('EF-DEFRA-COMMUTER-BUS', 'ROAD-COMMUTER-BUS', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Local public / contract bus transport'),
('EF-DEFRA-RAIL-TRAIN', 'RAIL-COMMUTER-TRAIN', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Passenger railway commute transit'),
('EF-DEFRA-AIR-FLIGHT', 'AIR-SHORT-HAUL', '00000000-0000-0000-0000-000000000951', 'UK DEFRA / BEIS', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Domestic / short haul scheduled commercial flight'),
('EF-ACTIVE-WALKING', 'ACTIVE-WALKING-ZERO-EMISSION', NULL, 'IPCC ACTIVE MOBILITY', 'kgCO2e/km', 'DEMO/TEMPORARY BENCHMARK: Active human-powered zero tailpipe commute')
ON CONFLICT (factor_id) DO NOTHING;

-- Historical factor versioning preservation!
INSERT INTO emission_factor_versions (
    version_id, factor_id, version_tag, reporting_year, geography, factor_value, unit, methodology, valid_from, valid_to, status, evidence_url
) VALUES
('00000000-0000-0000-0000-000000000961', 'EF-DEFRA-ROAD-PETROL-CAR', '2025.1', 2025, 'GLOBAL', 0.165200, 'kgCO2e/km', 'GHG_PROTOCOL', '2025-01-01T00:00:00Z', '2025-12-31T23:59:59Z', 'SUPERSEDED', 'https://gov.uk/defra-ghg-2025'),
('00000000-0000-0000-0000-000000000962', 'EF-DEFRA-ROAD-PETROL-CAR', '2026.1', 2026, 'GLOBAL', 0.170800, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000963', 'EF-DEFRA-ROAD-DIESEL-CAR', '2026.1', 2026, 'GLOBAL', 0.171200, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000964', 'EF-DEFRA-ROAD-DIESEL-HDV', '2026.1', 2026, 'GLOBAL', 0.892400, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000965', 'EF-CEA-ELECTRIC-CAR', '2026.1', 2026, 'IN', 0.052100, 'kgCO2e/km', 'CEA_CO2_BASELINE', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://cea.nic.in/baseline-2026'),
('00000000-0000-0000-0000-000000000966', 'EF-DEFRA-ROAD-TWO-WHEELER', '2026.1', 2026, 'GLOBAL', 0.081500, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000967', 'EF-DEFRA-COMMUTER-BUS', '2026.1', 2026, 'GLOBAL', 0.096500, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000968', 'EF-DEFRA-RAIL-TRAIN', '2026.1', 2026, 'GLOBAL', 0.035400, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000969', 'EF-DEFRA-AIR-FLIGHT', '2026.1', 2026, 'GLOBAL', 0.245800, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://gov.uk/defra-ghg-2026'),
('00000000-0000-0000-0000-000000000970', 'EF-ACTIVE-WALKING', '2026.1', 2026, 'GLOBAL', 0.000000, 'kgCO2e/km', 'GHG_PROTOCOL', '2026-01-01T00:00:00Z', NULL, 'ACTIVE', 'https://ipcc.ch/active-mobility')
ON CONFLICT (factor_id, version_tag, geography) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. SCOPE DEFINITIONS & CONFIGURABLE SCOPE MAPPING RULES
-- ----------------------------------------------------------------------------
INSERT INTO ghg_scope_definitions (scope_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000981', 'SCOPE_1', 'Scope 1: Direct Greenhouse Gas Emissions', 'Direct combustion from owned or controlled assets'),
('00000000-0000-0000-0000-000000000982', 'SCOPE_2', 'Scope 2: Indirect Emissions from Purchased Energy', 'Emissions from generation of purchased electricity or heat'),
('00000000-0000-0000-0000-000000000983', 'SCOPE_3', 'Scope 3: Other Indirect Value Chain Emissions', 'Emissions from upstream and downstream mobility and supply chain')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ghg_category_definitions (category_id, scope_id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000991', '00000000-0000-0000-0000-000000000981', 'DIRECT_MOBILE_COMBUSTION', 'Direct Mobile Combustion', 'Fuel combusted by owned vehicles'),
('00000000-0000-0000-0000-000000000992', '00000000-0000-0000-0000-000000000983', 'CAT_1_PURCHASED_SERVICES', 'Cat 1: Purchased Goods and Services', 'OEM technician and service logistics'),
('00000000-0000-0000-0000-000000000993', '00000000-0000-0000-0000-000000000983', 'CAT_4_UPSTREAM_TRANSPORTATION', 'Cat 4: Upstream Freight Transportation', 'Inbound material freight & logistics'),
('00000000-0000-0000-0000-000000000994', '00000000-0000-0000-0000-000000000983', 'CAT_6_BUSINESS_TRAVEL', 'Cat 6: Business Travel', 'Customer delegation & employee commercial flights'),
('00000000-0000-0000-0000-000000000995', '00000000-0000-0000-0000-000000000983', 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING', 'Cat 7: Commuting Transit', 'Visitor and contingent workforce commuting transit'),
('00000000-0000-0000-0000-000000000996', '00000000-0000-0000-0000-000000000983', 'CAT_9_DOWNSTREAM_TRANSPORTATION', 'Cat 9: Downstream Freight Distribution', 'Outbound finished goods logistics')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ghg_mapping_rules (
    rule_id, tenant_id, source_domain, ownership, trip_direction, activity_type,
    scope_id, category_id, scope, category, subcategory, methodology, priority, is_active
) VALUES
('00000000-0000-0000-0000-000000001001', NULL, 'VISITOR', NULL, NULL, NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000995',
 'SCOPE_3', 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING', 'VISITOR_TRANSIT', 'GHG_PROTOCOL_CORPORATE_STANDARD', 10, TRUE),

('00000000-0000-0000-0000-000000001002', NULL, 'CUSTOMER', NULL, NULL, NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000994',
 'SCOPE_3', 'CAT_6_BUSINESS_TRAVEL', 'CUSTOMER_DELEGATION_TRAVEL', 'GHG_PROTOCOL_SCOPE_3_STANDARD', 10, TRUE),

('00000000-0000-0000-0000-000000001003', NULL, 'CONTRACTOR', NULL, NULL, NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000995',
 'SCOPE_3', 'CAT_7_EMPLOYEE_AND_VISITOR_COMMUTING', 'CONTRACTOR_SHIFT_COMMUTE', 'GHG_PROTOCOL_SCOPE_3_STANDARD', 10, TRUE),

('00000000-0000-0000-0000-000000001004', NULL, 'SERVICE', NULL, NULL, NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000992',
 'SCOPE_3', 'CAT_1_PURCHASED_SERVICES', 'OEM_TECHNICIAN_LOGISTICS', 'GHG_PROTOCOL_SCOPE_3_STANDARD', 10, TRUE),

('00000000-0000-0000-0000-000000001005', NULL, 'MATERIAL', NULL, 'INBOUND', NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000993',
 'SCOPE_3', 'CAT_4_UPSTREAM_TRANSPORTATION', 'SUPPLY_CHAIN_INBOUND_FREIGHT', 'GLEC_FRAMEWORK_V3', 20, TRUE),

('00000000-0000-0000-0000-000000001006', NULL, 'MATERIAL', NULL, 'OUTBOUND', NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000996',
 'SCOPE_3', 'CAT_9_DOWNSTREAM_TRANSPORTATION', 'PRODUCT_DISPATCH_FREIGHT', 'GLEC_FRAMEWORK_V3', 20, TRUE),

('00000000-0000-0000-0000-000000001007', NULL, 'VEHICLE', 'COMPANY', NULL, NULL,
 '00000000-0000-0000-0000-000000000981', '00000000-0000-0000-0000-000000000991',
 'SCOPE_1', 'DIRECT_MOBILE_COMBUSTION', 'INTERNAL_COMPANY_FLEET', 'GHG_PROTOCOL_DIRECT_EMISSIONS', 20, TRUE),

('00000000-0000-0000-0000-000000001008', NULL, 'VEHICLE', NULL, NULL, NULL,
 '00000000-0000-0000-0000-000000000983', '00000000-0000-0000-0000-000000000993',
 'SCOPE_3', 'CAT_4_UPSTREAM_TRANSPORTATION', 'THIRD_PARTY_LOGISTICS_VEHICLE', 'GHG_PROTOCOL_SCOPE_3_STANDARD', 10, TRUE)
ON CONFLICT DO NOTHING;
