-- ============================================================================
-- VMS ENTERPRISE PRODUCTION RELATIONAL SCHEMA (PostgreSQL 16+)
-- Migration 003: Enterprise Master Data, Workflow Builder, Approval Engine & Rules Framework (Part 5)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Master Data Management Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS master_data_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(64) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval_for_activation BOOLEAN NOT NULL DEFAULT FALSE,
    field_schema JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMPTZ,
    metadata JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    pending_approval BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_master_data_tenant_category_code UNIQUE (tenant_id, category, code)
);

CREATE TABLE IF NOT EXISTS master_data_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES master_data_records(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changed_by VARCHAR(64) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    CONSTRAINT uq_master_data_version UNIQUE (record_id, version_number)
);

-- ----------------------------------------------------------------------------
-- 2. Declarative Workflow Engine Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflow_definitions (
    definition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE SET NULL,
    domain VARCHAR(64) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
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
    stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    transitions JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_by VARCHAR(64),
    published_at TIMESTAMPTZ,
    immutable BOOLEAN NOT NULL DEFAULT FALSE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_workflow_ver_def_num UNIQUE (definition_id, version_number)
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
    source_domain VARCHAR(64) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    current_stage_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    stage_id VARCHAR(64) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE SET NULL,
    source_domain VARCHAR(64) NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    assigned_to_user_id VARCHAR(64),
    assigned_to_role VARCHAR(64),
    assigned_group VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    sla_due_at TIMESTAMPTZ,
    sla_warning_at TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    sla_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    escalation_count INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(task_id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,
    stage_id VARCHAR(64) NOT NULL,
    actor_user_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    remarks TEXT,
    delegation_id UUID,
    correlation_id VARCHAR(64),
    changes_required_details TEXT,
    action_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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

-- ----------------------------------------------------------------------------
-- 3. Approval Engine & Delegation Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approval_delegations (
    delegation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    delegator_user_id VARCHAR(64) NOT NULL,
    delegate_user_id VARCHAR(64) NOT NULL,
    domain_scope VARCHAR(64),
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
    task_id UUID NOT NULL,
    instance_id UUID NOT NULL,
    stage_id VARCHAR(64) NOT NULL,
    actor_user_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    remarks TEXT,
    delegation_id UUID REFERENCES approval_delegations(delegation_id) ON DELETE SET NULL,
    decision_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correlation_id VARCHAR(64),
    changes_required_details TEXT
);

-- ----------------------------------------------------------------------------
-- 4. Rules & Policy Engine Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS policy_definitions (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(site_id) ON DELETE SET NULL,
    domain VARCHAR(64) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
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
    policy_id UUID NOT NULL REFERENCES policy_definitions(policy_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    rule_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    action VARCHAR(32) NOT NULL DEFAULT 'ALLOW',
    action_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_policy_rule_code UNIQUE (policy_id, rule_code)
);

CREATE TABLE IF NOT EXISTS policy_evaluation_records (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    domain VARCHAR(64) NOT NULL,
    transaction_id VARCHAR(64) NOT NULL,
    allowed BOOLEAN NOT NULL,
    action_result VARCHAR(32) NOT NULL,
    explanation TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query isolation
CREATE INDEX IF NOT EXISTS idx_master_data_tenant_category ON master_data_records(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_tenant ON workflow_instances(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON workflow_outbox_events(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_delegation_active ON approval_delegations(tenant_id, delegate_user_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_instance ON approval_actions(instance_id, decision_timestamp);
