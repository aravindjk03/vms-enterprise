import { SchemaValidator } from '../packages/database/src/schema-validator.js';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';

const validator = new SchemaValidator();
const schema = validator.validateFromFile('./packages/database/migrations/001_initial_schema.sql');
const db = new RelationalDatabase();
const dbTables = new Set(db.getTableNames());

const expected = [
  // ORGANIZATION
  'tenants', 'organizations', 'sites', 'departments', 'gates', 'zones', 'buildings',
  // IDENTITY
  'persons', 'person_contacts', 'person_identity_documents', 'person_consents', 'biometric_references',
  // ACCESS
  'users', 'roles', 'permissions', 'user_roles', 'access_policies', 'access_grants', 'access_events',
  // VISITOR
  'visitor_profiles', 'visitor_types', 'visitor_purposes', 'appointments', 'visitor_transactions', 'appointment_participants',
  // CUSTOMER
  'customer_accounts', 'customer_representatives', 'customer_visit_transactions', 'customer_visit_participants', 'customer_requirements',
  // CONTRACTOR
  'contractor_companies', 'contractor_contracts', 'contractor_work_orders', 'contractor_workers', 'contractor_assignments', 'contractor_training_records', 'contractor_permits', 'contractor_attendance',
  // SERVICE
  'service_requests', 'service_providers', 'service_technicians', 'service_work_orders', 'service_work_locations', 'service_permits', 'service_activities',
  // MATERIAL
  'materials', 'material_categories', 'material_transactions', 'material_transaction_lines', 'purchase_orders', 'purchase_order_lines', 'material_inspections', 'material_returns', 'material_gate_passes',
  // VEHICLE
  'vehicles', 'vehicle_types', 'vehicle_ownership_types', 'vehicle_fuel_types', 'vehicle_documents', 'drivers', 'driver_documents', 'transporters',
  // TRANSPORT
  'transport_activities', 'transport_modes', 'transport_ownership_types', 'transport_measurement_methods', 'journey_types',
  // DOCUMENT
  'documents', 'document_types', 'document_versions', 'document_links', 'document_verifications', 'document_retention_policies',
  // WORKFLOW
  'workflow_definitions', 'workflow_versions', 'workflow_stages', 'workflow_transitions', 'workflow_conditions', 'workflow_instances', 'workflow_tasks', 'workflow_actions',
  // APPROVAL
  'approval_workflows', 'approval_workflow_versions', 'approval_stages', 'approval_instances', 'approval_stage_instances', 'approval_actions', 'approval_delegations',
  // GATE
  'gate_transactions', 'gate_events', 'gate_devices', 'gate_decisions', 'gate_event_types',
  // SAFETY
  'safety_inductions', 'training_types', 'training_records', 'permits', 'permit_types', 'safety_declarations',
  // EMERGENCY
  'emergency_events', 'occupancy_snapshots', 'muster_points', 'muster_records', 'missing_person_records',
  // INCIDENT
  'incidents', 'incident_types', 'exceptions', 'exception_types', 'exception_actions', 'exception_resolutions',
  // ESG/GHG
  'ghg_activities', 'emission_factors', 'emission_factor_versions', 'emission_factor_sources', 'ghg_calculations', 'ghg_scope_definitions', 'ghg_category_definitions', 'ghg_mapping_rules', 'evidence_records', 'data_quality_levels',
  // EVENT/AUDIT
  'domain_events', 'audit_logs',
  // NOTIFICATIONS
  'notification_templates', 'notification_rules', 'notifications', 'notification_deliveries'
];

const missingInSchema = expected.filter(t => !schema.tables.has(t));
const missingInDb = expected.filter(t => !dbTables.has(t));

console.log('Missing in 001_initial_schema.sql:', JSON.stringify(missingInSchema));
console.log('Missing in in-memory-db:', JSON.stringify(missingInDb));
