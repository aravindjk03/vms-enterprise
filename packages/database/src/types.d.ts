/**
-- VMS Enterprise: Relational Database & Domain Model Types
-- Production Relational Schema TypeScript Interface Contracts
*/
export type SourceDomain = 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'SERVICE' | 'MATERIAL' | 'VEHICLE';
export type TransactionStage = 'DRAFT' | 'APPROVAL' | 'SCHEDULED' | 'CHECK_IN' | 'ACTIVE' | 'CHECK_OUT' | 'CLOSED';
export type TransactionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'ON_PREMISES' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW' | 'BLOCKED';
export interface TenantContext {
    tenantId: string;
    userId?: string;
    userRole?: string;
    siteId?: string;
}
export interface TenantRecord {
    tenant_id: string;
    code: string;
    name: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
}
export interface OrganizationRecord {
    organization_id: string;
    tenant_id: string;
    code: string;
    name: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
}
export interface SiteRecord {
    site_id: string;
    tenant_id: string;
    organization_id: string;
    code: string;
    name: string;
    latitude?: number;
    longitude?: number;
    timezone: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
}
export interface DepartmentRecord {
    department_id: string;
    tenant_id: string;
    site_id?: string;
    code: string;
    name: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface BuildingRecord {
    building_id: string;
    tenant_id: string;
    site_id: string;
    code: string;
    name: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface GateRecord {
    gate_id: string;
    tenant_id: string;
    site_id: string;
    building_id?: string;
    code: string;
    name: string;
    gate_type: string;
    is_active: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface ZoneRecord {
    zone_id: string;
    tenant_id: string;
    site_id: string;
    building_id?: string;
    code: string;
    name: string;
    security_level: string;
    max_capacity?: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface SiteSettingsRecord {
    setting_id: string;
    tenant_id: string;
    site_id: string;
    settings_config: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export interface GateSettingsRecord {
    setting_id: string;
    tenant_id: string;
    gate_id: string;
    settings_config: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export interface ZoneSettingsRecord {
    setting_id: string;
    tenant_id: string;
    zone_id: string;
    settings_config: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export interface UserRecord {
    user_id: string;
    tenant_id: string;
    organization_id: string;
    username: string;
    email: string;
    full_name: string;
    status: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface RoleRecord {
    role_id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    is_system: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface PermissionRecord {
    permission_id: string;
    code: string;
    name: string;
    description?: string;
    module: string;
    created_at: Date;
}
export interface AccessPolicyRecord {
    policy_id: string;
    tenant_id: string;
    site_id?: string;
    code: string;
    name: string;
    policy_type: string;
    is_active: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface AccessCredentialRecord {
    credential_id: string;
    tenant_id: string;
    person_id?: string;
    credential_type: string;
    identifier_token: string;
    pin_hash?: string;
    valid_from: Date;
    valid_to: Date;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface AccessGrantRecord {
    grant_id: string;
    tenant_id: string;
    site_id: string;
    person_id?: string;
    source_domain: string;
    source_transaction_id: string;
    credential_id?: string;
    valid_from: Date;
    valid_to: Date;
    escort_required: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface AccessEventRecord {
    event_id: string;
    tenant_id: string;
    site_id: string;
    gate_id?: string;
    zone_id?: string;
    person_id?: string;
    grant_id?: string;
    credential_id?: string;
    access_result: string;
    denial_reason?: string;
    event_timestamp: Date;
}
export interface PersonRecord {
    person_id: string;
    tenant_id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
}
export interface PersonContactRecord {
    contact_id: string;
    tenant_id: string;
    person_id: string;
    contact_type: string;
    contact_value: string;
    is_primary: boolean;
    is_verified: boolean;
    verified_at?: Date;
    created_at: Date;
}
export interface PersonAddressRecord {
    address_id: string;
    tenant_id: string;
    person_id: string;
    address_type: string;
    street_line1?: string;
    street_line2?: string;
    city: string;
    state_province: string;
    postal_code?: string;
    country: string;
    is_primary: boolean;
    created_at: Date;
}
export interface PersonIdentityDocRecord {
    doc_id: string;
    tenant_id: string;
    person_id: string;
    document_type: string;
    document_number: string;
    issuing_country: string;
    issue_date?: string;
    expiry_date?: string;
    verification_status: string;
    created_at: Date;
    updated_at: Date;
}
export interface PersonConsentRecord {
    consent_id: string;
    tenant_id: string;
    person_id: string;
    consent_type: string;
    consent_version: string;
    granted: boolean;
    granted_at: Date;
    revoked_at?: Date;
    capture_method: string;
    created_at: Date;
}
export interface BiometricReferenceRecord {
    biometric_id: string;
    tenant_id: string;
    person_id: string;
    provider: string;
    biometric_type: string;
    template_reference_id: string;
    template_version: string;
    enrollment_status: string;
    consent_reference_id?: string;
    retention_status: string;
    verification_metadata?: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export interface ExternalOrgRecord {
    org_id: string;
    tenant_id: string;
    code: string;
    legal_name: string;
    trade_name?: string;
    tax_identifier?: string;
    registration_number?: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface VisitorTypeRecord {
    type_id: string;
    tenant_id?: string;
    code: string;
    name: string;
    description?: string;
    requires_escort: boolean;
    is_active: boolean;
}
export interface VisitorPurposeRecord {
    purpose_id: string;
    tenant_id?: string;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
}
export interface VisitorProfileRecord {
    profile_id: string;
    tenant_id: string;
    person_id: string;
    external_org_id?: string;
    vip_status: boolean;
    watchlist_status: string;
    total_visits: number;
    last_visit_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface AppointmentRecord {
    appointment_id: string;
    tenant_id: string;
    site_id: string;
    reference_number: string;
    host_user_id: string;
    title: string;
    description?: string;
    scheduled_start: Date;
    scheduled_end: Date;
    meeting_room_zone_id?: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface VisitorTransactionRecord {
    transaction_id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    person_id: string;
    visitor_type_id?: string;
    purpose_id?: string;
    appointment_id?: string;
    host_user_id: string;
    booking_mode: string;
    scheduled_start: Date;
    scheduled_end: Date;
    actual_arrival?: Date;
    actual_entry?: Date;
    actual_exit?: Date;
    stage: TransactionStage;
    status: TransactionStatus;
    access_policy_id?: string;
    version: number;
    metadata?: Record<string, unknown>;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface VisitorParticipantRecord {
    participant_id: string;
    visitor_transaction_id: string;
    person_id: string;
    participant_role: string;
    status: string;
    created_at: Date;
}
export interface VisitorHostRecord {
    host_id: string;
    visitor_transaction_id: string;
    host_user_id: string;
    is_primary: boolean;
    notified_at?: Date;
    acknowledged_at?: Date;
    created_at: Date;
}
export interface CustomerAccountRecord {
    customer_account_id: string;
    tenant_id: string;
    external_org_id: string;
    account_code: string;
    account_name: string;
    tier: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CustomerRepRecord {
    rep_id: string;
    tenant_id: string;
    customer_account_id: string;
    person_id: string;
    job_title?: string;
    department?: string;
    is_primary: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CustomerVisitTransactionRecord {
    transaction_id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    customer_account_id: string;
    visit_type_id?: string;
    executive_host_id: string;
    title: string;
    scheduled_start: Date;
    scheduled_end: Date;
    actual_arrival?: Date;
    actual_entry?: Date;
    actual_exit?: Date;
    nda_signed: boolean;
    stage: TransactionStage;
    status: TransactionStatus;
    version: number;
    metadata?: Record<string, unknown>;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface CustomerVisitParticipantRecord {
    participant_id: string;
    customer_visit_id: string;
    person_id: string;
    customer_rep_id?: string;
    is_lead: boolean;
    created_at: Date;
}
export interface ContractorCompanyRecord {
    company_id: string;
    tenant_id: string;
    external_org_id: string;
    vendor_code: string;
    safety_rating: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface ContractorContractRecord {
    contract_id: string;
    tenant_id: string;
    company_id: string;
    contract_number: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface ContractorWorkOrderRecord {
    work_order_id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    contract_id: string;
    company_id: string;
    work_order_number: string;
    scope_of_work: string;
    authorized_worker_count: number;
    safety_permit_required: boolean;
    start_date: string;
    end_date: string;
    stage: TransactionStage;
    status: TransactionStatus;
    version: number;
    metadata?: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export interface ContractorWorkerRecord {
    contractor_worker_id: string;
    tenant_id: string;
    company_id: string;
    person_id: string;
    badge_number: string;
    trade_skill: string;
    medical_fitness_valid: boolean;
    medical_fitness_expiry?: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface ServiceProviderRecord {
    service_provider_id: string;
    tenant_id: string;
    external_org_id: string;
    provider_code: string;
    service_category: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface ServiceTechnicianRecord {
    technician_id: string;
    tenant_id: string;
    service_provider_id: string;
    person_id: string;
    certification_level: string;
    badge_id: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface ServiceWorkOrderRecord {
    work_order_id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    request_id?: string;
    service_provider_id: string;
    equipment_tag: string;
    maintenance_lead_id: string;
    scheduled_start: Date;
    scheduled_end: Date;
    inward_tools_declared: boolean;
    service_completed: boolean;
    stage: TransactionStage;
    status: TransactionStatus;
    version: number;
    metadata?: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export interface MaterialRecord {
    material_id: string;
    tenant_id: string;
    category_id?: string;
    material_code: string;
    name: string;
    unit_of_measure: string;
    requires_inspection: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface PurchaseOrderRecord {
    po_id: string;
    tenant_id: string;
    po_number: string;
    supplier_org_id: string;
    issue_date: string;
    total_amount?: number;
    currency: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface MaterialTransactionRecord {
    transaction_id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    movement_type: string;
    classification: string;
    delivery_challan_number?: string;
    po_id?: string;
    supplier_org_id?: string;
    transporter_org_id?: string;
    vehicle_id?: string;
    driver_person_id?: string;
    gross_weight_kg?: number;
    tare_weight_kg?: number;
    net_weight_kg?: number;
    stage: TransactionStage;
    status: TransactionStatus;
    version: number;
    metadata?: Record<string, unknown>;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface MaterialTransactionLineRecord {
    line_id: string;
    material_transaction_id: string;
    material_id: string;
    line_number: number;
    description: string;
    quantity: number;
    unit: string;
    is_returnable: boolean;
    returned_quantity: number;
    serial_number?: string;
    batch_number?: string;
    remarks?: string;
    created_at: Date;
}
export interface MaterialReturnRecord {
    return_id: string;
    tenant_id: string;
    material_transaction_line_id: string;
    return_transaction_id?: string;
    quantity_returned: number;
    return_date: Date;
    condition_status: string;
    created_at: Date;
}
export interface MaterialGatePassRecord {
    pass_id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    material_transaction_id: string;
    pass_type: string;
    valid_from: Date;
    valid_to: Date;
    security_officer_id?: string;
    qr_code_token: string;
    status: string;
    created_at: Date;
}
export interface VehicleRecord {
    vehicle_id: string;
    tenant_id: string;
    registration_plate: string;
    vehicle_type_id?: string;
    fuel_type_id?: string;
    ownership_type_id?: string;
    owner_org_id?: string;
    make?: string;
    model?: string;
    year?: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface DriverRecord {
    driver_id: string;
    tenant_id: string;
    person_id: string;
    license_number: string;
    license_type: string;
    license_expiry: string;
    badge_number?: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface TransportActivityRecord {
    id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    source_domain: SourceDomain;
    source_transaction_id: string;
    person_id?: string;
    organization_id?: string;
    vehicle_id?: string;
    transport_mode_id?: string;
    ownership_type_id?: string;
    vehicle_type_id?: string;
    fuel_type_id?: string;
    usage_type: string;
    occupancy: number;
    origin_location_name: string;
    origin_city?: string;
    origin_state?: string;
    origin_country?: string;
    origin_postal_code?: string;
    origin_latitude?: number;
    origin_longitude?: number;
    destination_location_name: string;
    destination_city?: string;
    destination_state?: string;
    destination_country?: string;
    destination_postal_code?: string;
    destination_latitude?: number;
    destination_longitude?: number;
    distance: number;
    distance_unit: string;
    journey_type: string;
    direction: string;
    fuel_consumed_litres?: number;
    payload_weight_tonnes?: number;
    measurement_method: string;
    data_source: string;
    estimated_flag: boolean;
    activity_date: string;
    created_at: Date;
    updated_at: Date;
}
export interface DocumentRecord {
    id: string;
    reference_number: string;
    tenant_id: string;
    document_type_id: string;
    title: string;
    file_storage_key: string;
    original_file_name: string;
    file_mime_type: string;
    file_size_bytes: number;
    checksum_sha256?: string;
    is_encrypted: boolean;
    status: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface DocumentLinkRecord {
    id: string;
    tenant_id: string;
    document_id: string;
    entity_type: string;
    entity_id: string;
    relationship_type: string;
    linked_at: Date;
    linked_by?: string;
}
export interface WorkflowDefinitionRecord {
    definition_id: string;
    tenant_id: string;
    code: string;
    name: string;
    target_domain: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface WorkflowVersionRecord {
    version_id: string;
    definition_id: string;
    version_number: number;
    effective_from: Date;
    effective_to?: Date;
    is_current: boolean;
    schema_definition: Record<string, unknown>;
    created_at: Date;
}
export interface WorkflowInstanceRecord {
    instance_id: string;
    tenant_id: string;
    definition_id: string;
    version_id: string;
    source_domain: string;
    source_transaction_id: string;
    current_stage_id?: string;
    status: string;
    started_at: Date;
    completed_at?: Date;
    created_at: Date;
}
export interface ApprovalWorkflowRecord {
    workflow_id: string;
    tenant_id: string;
    code: string;
    name: string;
    target_domain: string;
    is_active: boolean;
    created_at: Date;
}
export interface ApprovalInstanceRecord {
    instance_id: string;
    tenant_id: string;
    workflow_id: string;
    version_id: string;
    source_domain: string;
    source_transaction_id: string;
    status: string;
    requested_at: Date;
    resolved_at?: Date;
    created_at: Date;
}
export interface GateTransactionRecord {
    gate_tx_id: string;
    tenant_id: string;
    site_id: string;
    gate_id: string;
    source_domain: string;
    source_transaction_id: string;
    direction: string;
    status: string;
    initiated_at: Date;
    completed_at?: Date;
}
export interface GateEventRecord {
    event_id: string;
    tenant_id: string;
    site_id: string;
    gate_id: string;
    zone_id?: string;
    device_id?: string;
    source_domain: string;
    source_transaction_id: string;
    event_type: string;
    result: string;
    reason?: string;
    actor_id?: string;
    event_timestamp: Date;
}
export interface EmissionFactorSourceRecord {
    source_id: string;
    code: string;
    name: string;
    official_url?: string;
    is_active: boolean;
}
export interface EmissionFactorRecord {
    factor_id: string;
    factor_code: string;
    source_id?: string;
    source: string;
    default_unit: string;
    description?: string;
    created_at: Date;
}
export interface EmissionFactorVersionRecord {
    version_id: string;
    factor_id: string;
    version_tag: string;
    reporting_year: number;
    geography: string;
    factor_value: number;
    unit: string;
    methodology: string;
    gas_coverage: string;
    valid_from: Date;
    valid_to?: Date;
    status: string;
    evidence_id?: string;
    evidence_url?: string;
    created_at: Date;
}
export interface GHGMappingRuleRecord {
    rule_id: string;
    tenant_id?: string;
    source_domain: string;
    ownership?: string;
    trip_direction?: string;
    activity_type?: string;
    scope_id?: string;
    category_id?: string;
    scope: string;
    category: string;
    subcategory: string;
    methodology: string;
    priority: number;
    is_active: boolean;
    created_at: Date;
}
export interface GHGActivityRecord {
    id: string;
    reference_number: string;
    tenant_id: string;
    site_id: string;
    source_domain: SourceDomain;
    source_transaction_id: string;
    source_activity_id?: string;
    activity_type: string;
    activity_date: string;
    quantity: number;
    quantity_unit: string;
    transport_mode_id?: string;
    vehicle_type_id?: string;
    fuel_type_id?: string;
    occupancy?: number;
    origin?: string;
    destination?: string;
    distance?: number;
    distance_unit?: string;
    emission_factor_id?: string;
    emission_factor_version?: string;
    methodology_id?: string;
    scope?: string;
    category?: string;
    subcategory?: string;
    co2?: number;
    ch4?: number;
    n2o?: number;
    co2e?: number;
    data_quality: string;
    calculation_status: string;
    verification_status: string;
    evidence_id?: string;
    created_at: Date;
    updated_at: Date;
}
export interface GHGCalculationRecord {
    id: string;
    ghg_activity_id: string;
    emission_factor_id: string;
    emission_factor_version: string;
    methodology_id: string;
    input_snapshot: Record<string, unknown>;
    calculation_timestamp: Date;
    co2?: number;
    ch4?: number;
    n2o?: number;
    co2e: number;
    calculation_status: string;
    calculation_version: number;
    created_by?: string;
}
export interface AuditLogRecord {
    audit_id: string;
    tenant_id: string;
    actor_id: string;
    actor_role?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    timestamp: Date;
    request_id?: string;
    correlation_id?: string;
    source: string;
    before_snapshot?: Record<string, unknown>;
    after_snapshot?: Record<string, unknown>;
    reason?: string;
}
export interface DomainEventRecord {
    event_id: string;
    tenant_id: string;
    event_type: string;
    source_domain: string;
    source_entity_id: string;
    occurred_at: Date;
    actor_id?: string;
    correlation_id?: string;
    causation_id?: string;
    payload: Record<string, unknown>;
    version: string;
}
