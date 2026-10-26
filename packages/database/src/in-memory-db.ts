/**
 * VMS Enterprise: In-Memory Relational PostgreSQL Simulation Engine
 * Enforces: Multi-Tenant RLS, Foreign Keys, Uniqueness, Immutability & ACID Transactions
 */

import { randomUUID } from 'node:crypto';

export interface DatabaseConstraint {
  name: string;
  type: 'PRIMARY_KEY' | 'UNIQUE' | 'FOREIGN_KEY' | 'CHECK';
  columns: string[];
  refTable?: string;
  refColumns?: string[];
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL';
  checkFn?: (row: any) => boolean;
}

export interface TableDefinition {
  name: string;
  primaryKey: string | string[];
  tenantScoped: boolean;
  tenantColumn?: string;
  isImmutable?: boolean;
  uniqueKeys?: string[][];
  foreignKeys?: Array<{
    columns: string[];
    refTable: string;
    refColumns: string[];
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL';
  }>;
}

export class RelationalDatabase {
  private tables: Map<string, TableDefinition> = new Map();
  private data: Map<string, Map<string, Record<string, any>>> = new Map();
  private transactionSnapshots: Array<Map<string, Map<string, Record<string, any>>>> = [];
  private currentTenantId: string | null = null;
  private systemScopeDepth = 0;

  constructor() {
    this.registerSchema();
  }

  public getPkCols(table: TableDefinition): string[] {
    if (Array.isArray(table.primaryKey)) {
      return table.primaryKey;
    }
    return table.primaryKey.split(',').map(c => c.trim().toLowerCase());
  }

  public getRowPkValue(table: TableDefinition, row: Record<string, any>): string {
    const pkCols = this.getPkCols(table);
    return pkCols.map(c => String(row[c] ?? '')).join('::');
  }

  public setTenantContext(tenantId: string | null) {
    this.currentTenantId = tenantId;
  }

  public getTenantContext(): string | null {
    return this.currentTenantId;
  }

  /**
   * Runs trusted platform work (migrations/seeding, outbox dispatch, scheduled sweeps)
   * that legitimately spans tenants. Outside this scope, tenant-scoped tables fail closed
   * when no tenant context is active.
   */
  public runAsSystem<R>(fn: () => R): R {
    this.systemScopeDepth++;
    try {
      return fn();
    } finally {
      this.systemScopeDepth--;
    }
  }

  /**
   * Resolves the tenant a tenant-scoped operation is bound to.
   * - An explicit override must be a non-empty id and may not contradict the active context.
   * - With neither override nor context, access is denied unless running in system scope
   *   (returns null, meaning "all tenants").
   */
  private resolveEffectiveTenant(table: TableDefinition, tenantIdOverride: string | undefined, operation: string): string | null {
    if (!table.tenantScoped || !table.tenantColumn) {
      return null;
    }
    if (tenantIdOverride !== undefined) {
      if (typeof tenantIdOverride !== 'string' || tenantIdOverride.trim() === '') {
        throw new Error(`Tenant isolation violation: empty tenant override for ${operation} on '${table.name}'`);
      }
      if (this.currentTenantId && this.currentTenantId !== tenantIdOverride) {
        throw new Error(`Tenant isolation violation: override ${tenantIdOverride} conflicts with active tenant context ${this.currentTenantId}`);
      }
      return tenantIdOverride;
    }
    if (this.currentTenantId) {
      return this.currentTenantId;
    }
    if (this.systemScopeDepth > 0) {
      return null;
    }
    throw new Error(`Tenant isolation violation: ${operation} on tenant-scoped table '${table.name}' requires a tenant context`);
  }

  public registerTable(def: TableDefinition) {
    this.tables.set(def.name.toLowerCase(), def);
    if (!this.data.has(def.name.toLowerCase())) {
      this.data.set(def.name.toLowerCase(), new Map());
    }
  }

  public getTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  public hasTable(name: string): boolean {
    return this.tables.has(name.toLowerCase());
  }

  public reset() {
    for (const [name] of this.data) {
      this.data.set(name, new Map());
    }
    this.transactionSnapshots = [];
    this.currentTenantId = null;
    this.systemScopeDepth = 0;
  }

  // --------------------------------------------------------------------------
  // Transaction Support
  // --------------------------------------------------------------------------
  public beginTransaction() {
    const snapshot = new Map<string, Map<string, Record<string, any>>>();
    for (const [tableName, rows] of this.data.entries()) {
      const rowCopy = new Map<string, Record<string, any>>();
      for (const [pk, row] of rows.entries()) {
        rowCopy.set(pk, { ...row });
      }
      snapshot.set(tableName, rowCopy);
    }
    this.transactionSnapshots.push(snapshot);
  }

  public commit() {
    if (this.transactionSnapshots.length === 0) {
      throw new Error('No active transaction to commit');
    }
    this.transactionSnapshots.pop();
  }

  public rollback() {
    if (this.transactionSnapshots.length === 0) {
      throw new Error('No active transaction to rollback');
    }
    const previous = this.transactionSnapshots.pop()!;
    this.data = previous;
  }

  // --------------------------------------------------------------------------
  // Core Relational Operations with RLS & Immutability
  // --------------------------------------------------------------------------
  public insert<T extends Record<string, any>>(tableName: string, row: T, tenantIdOverride?: string): T {
    const table = this.resolveTable(tableName);
    const tableRows = this.data.get(table.name.toLowerCase())!;

    const clonedRow: Record<string, any> = { ...row };

    // Tenant enforcement
    if (table.tenantScoped && table.tenantColumn) {
      // Without a context, an insert is still bound to the tenant explicitly named on the row.
      const tenantId = tenantIdOverride === undefined && !this.currentTenantId && clonedRow[table.tenantColumn]
        ? null
        : this.resolveEffectiveTenant(table, tenantIdOverride, 'insert');
      if (tenantId && !clonedRow[table.tenantColumn]) {
        clonedRow[table.tenantColumn] = tenantId;
      }
      if (tenantId && clonedRow[table.tenantColumn] !== tenantId) {
        throw new Error(`Cross-tenant insertion prohibited: attempted ${clonedRow[table.tenantColumn]} in tenant context ${tenantId}`);
      }
      if (!clonedRow[table.tenantColumn]) {
        throw new Error(`Tenant isolation violation: row for '${table.name}' has no ${table.tenantColumn}`);
      }
    }

    // Auto-generate PK if single column and missing
    const pkCols = this.getPkCols(table);
    if (pkCols.length === 1 && !clonedRow[pkCols[0]]) {
      clonedRow[pkCols[0]] = randomUUID();
    }
    const pkVal = this.getRowPkValue(table, clonedRow);

    // Check PK Uniqueness
    if (tableRows.has(pkVal)) {
      throw new Error(`Primary key violation: duplicate key value in table '${table.name}' (${pkCols.join(', ')}=${pkVal})`);
    }

    // Check Unique Constraints
    if (table.uniqueKeys) {
      for (const uqCols of table.uniqueKeys) {
        for (const existingRow of tableRows.values()) {
          const allMatch = uqCols.every(col => {
            const v1 = clonedRow[col];
            const v2 = existingRow[col];
            return v1 !== undefined && v1 !== null && v1 === v2;
          });
          if (allMatch) {
            throw new Error(`Unique constraint violation: duplicate values for (${uqCols.join(', ')}) in table '${table.name}'`);
          }
        }
      }
    }

    // Check Foreign Keys
    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        const refRows = this.data.get(fk.refTable.toLowerCase());
        if (!refRows) continue;

        const val = clonedRow[fk.columns[0]];
        if (val !== undefined && val !== null) {
          const exists = Array.from(refRows.values()).some(r => r[fk.refColumns[0]] === val);
          if (!exists) {
            throw new Error(`Foreign key violation: '${fk.columns[0]}'='${val}' does not exist in referenced table '${fk.refTable}'`);
          }
        }
      }
    }

    // Insert record
    tableRows.set(pkVal, clonedRow);
    return clonedRow as T;
  }

  public findById<T = Record<string, any>>(tableName: string, id: string, tenantIdOverride?: string): T | null {
    const table = this.resolveTable(tableName);
    const tableRows = this.data.get(table.name.toLowerCase())!;
    const row = tableRows.get(String(id));
    if (!row) return null;

    // Row-Level Security Check
    const effectiveTenant = this.resolveEffectiveTenant(table, tenantIdOverride, 'read');
    if (table.tenantScoped && table.tenantColumn && effectiveTenant) {
      if (row[table.tenantColumn] !== effectiveTenant) {
        // Invisible to other tenants!
        return null;
      }
    }

    return { ...row } as T;
  }

  public findMany<T = Record<string, any>>(tableName: string, filter?: Record<string, any>, tenantIdOverride?: string): T[] {
    const table = this.resolveTable(tableName);
    const tableRows = this.data.get(table.name.toLowerCase())!;
    const results: T[] = [];

    const effectiveTenant = this.resolveEffectiveTenant(table, tenantIdOverride, 'read');

    for (const row of tableRows.values()) {
      // Row-Level Security filter
      if (table.tenantScoped && table.tenantColumn && effectiveTenant) {
        if (row[table.tenantColumn] !== effectiveTenant) {
          continue; // RLS silently excludes rows of other tenants
        }
      }

      // User filter
      if (filter) {
        const match = Object.entries(filter).every(([k, v]) => {
          if (v === undefined) return true;
          return row[k] === v;
        });
        if (!match) continue;
      }

      results.push({ ...row } as T);
    }

    return results;
  }

  public update<T = Record<string, any>>(tableName: string, id: string, updates: Partial<T>, tenantIdOverride?: string): T {
    const table = this.resolveTable(tableName);
    if (table.isImmutable) {
      throw new Error(`Fatal Immutability Violation: updates are strictly prohibited on append-only table '${table.name}'`);
    }

    const tableRows = this.data.get(table.name.toLowerCase())!;
    const existing = tableRows.get(String(id));
    if (!existing) {
      throw new Error(`Record not found in table '${table.name}' with id '${id}'`);
    }

    // RLS Guard
    const effectiveTenant = this.resolveEffectiveTenant(table, tenantIdOverride, 'update');
    if (table.tenantScoped && table.tenantColumn && effectiveTenant) {
      if (existing[table.tenantColumn] !== effectiveTenant) {
        throw new Error(`Cross-tenant modification prohibited: record belongs to different tenant`);
      }
    }
    if (table.tenantScoped && table.tenantColumn) {
      const requestedTenant = (updates as Record<string, any>)[table.tenantColumn];
      if (requestedTenant !== undefined && requestedTenant !== existing[table.tenantColumn]) {
        throw new Error(`Tenant isolation violation: ${table.tenantColumn} of '${table.name}' records is immutable`);
      }
    }

    const updatedRow = { ...existing, ...updates, updated_at: new Date() };
    tableRows.set(String(id), updatedRow);
    return updatedRow as T;
  }

  public delete(tableName: string, id: string, tenantIdOverride?: string): boolean {
    const table = this.resolveTable(tableName);
    if (table.isImmutable) {
      throw new Error(`Fatal Immutability Violation: deletions are strictly prohibited on append-only table '${table.name}'`);
    }

    const tableRows = this.data.get(table.name.toLowerCase())!;
    const existing = tableRows.get(String(id));
    if (!existing) return false;

    // RLS Guard
    const effectiveTenant = this.resolveEffectiveTenant(table, tenantIdOverride, 'delete');
    if (table.tenantScoped && table.tenantColumn && effectiveTenant) {
      if (existing[table.tenantColumn] !== effectiveTenant) {
        throw new Error(`Cross-tenant deletion prohibited: record belongs to different tenant`);
      }
    }

    // Cascade or restrict
    this.handleCascades(table, id);

    tableRows.delete(String(id));
    return true;
  }

  public count(tableName: string, filter?: Record<string, any>, tenantIdOverride?: string): number {
    return this.findMany(tableName, filter, tenantIdOverride).length;
  }

  private handleCascades(parentTable: TableDefinition, parentId: string) {
    for (const childTable of this.tables.values()) {
      if (!childTable.foreignKeys) continue;
      for (const fk of childTable.foreignKeys) {
        if (fk.refTable.toLowerCase() === parentTable.name.toLowerCase()) {
          const childRows = this.data.get(childTable.name.toLowerCase())!;
          const matchingChildren = Array.from(childRows.values()).filter(
            r => r[fk.columns[0]] === parentId
          );

          if (matchingChildren.length > 0) {
            if (fk.onDelete === 'RESTRICT') {
              throw new Error(`Foreign key restriction: cannot delete from '${parentTable.name}' while referenced by '${childTable.name}'`);
            } else if (fk.onDelete === 'CASCADE') {
              for (const child of matchingChildren) {
                const childPk = this.getRowPkValue(childTable, child);
                this.delete(childTable.name, childPk);
              }
            } else if (fk.onDelete === 'SET_NULL') {
              for (const child of matchingChildren) {
                child[fk.columns[0]] = null;
              }
            }
          }
        }
      }
    }
  }

  private resolveTable(name: string): TableDefinition {
    const table = this.tables.get(name.toLowerCase());
    if (!table) {
      throw new Error(`Table '${name}' is not registered in relational schema`);
    }
    return table;
  }

  // --------------------------------------------------------------------------
  // Schema Registration for all 55+ Enterprise Relational Tables
  // --------------------------------------------------------------------------
  private registerSchema() {
    // 1. Organizational Hierarchy
    this.registerTable({ name: 'tenants', primaryKey: 'tenant_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'organizations', primaryKey: 'organization_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']], foreignKeys: [{ columns: ['tenant_id'], refTable: 'tenants', refColumns: ['tenant_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'sites', primaryKey: 'site_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']], foreignKeys: [{ columns: ['tenant_id'], refTable: 'tenants', refColumns: ['tenant_id'], onDelete: 'CASCADE' }, { columns: ['organization_id'], refTable: 'organizations', refColumns: ['organization_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'departments', primaryKey: 'department_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'buildings', primaryKey: 'building_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'site_id', 'code']] });
    this.registerTable({ name: 'gates', primaryKey: 'gate_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'site_id', 'code']] });
    this.registerTable({ name: 'zones', primaryKey: 'zone_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'site_id', 'code']] });
    this.registerTable({ name: 'site_settings', primaryKey: 'setting_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'site_id']] });
    this.registerTable({ name: 'gate_settings', primaryKey: 'setting_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'gate_id']] });
    this.registerTable({ name: 'zone_settings', primaryKey: 'setting_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'zone_id']] });
    this.registerTable({ name: 'site_security_rules', primaryKey: 'rule_id', tenantScoped: false, uniqueKeys: [['rule_id']] });

    // 2. Users & Access Control
    this.registerTable({ name: 'users', primaryKey: 'user_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'username'], ['tenant_id', 'email']] });
    this.registerTable({ name: 'roles', primaryKey: 'role_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'permissions', primaryKey: 'permission_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'user_roles', primaryKey: ['user_id', 'role_id'], tenantScoped: true, tenantColumn: 'tenant_id', foreignKeys: [{ columns: ['user_id'], refTable: 'users', refColumns: ['user_id'], onDelete: 'CASCADE' }, { columns: ['role_id'], refTable: 'roles', refColumns: ['role_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'role_permissions', primaryKey: ['role_id', 'permission_id'], tenantScoped: false, foreignKeys: [{ columns: ['role_id'], refTable: 'roles', refColumns: ['role_id'], onDelete: 'CASCADE' }, { columns: ['permission_id'], refTable: 'permissions', refColumns: ['permission_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'user_site_access', primaryKey: ['user_id', 'site_id'], tenantScoped: true, tenantColumn: 'tenant_id', foreignKeys: [{ columns: ['user_id'], refTable: 'users', refColumns: ['user_id'], onDelete: 'CASCADE' }, { columns: ['site_id'], refTable: 'sites', refColumns: ['site_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'user_gate_access', primaryKey: ['user_id', 'gate_id'], tenantScoped: true, tenantColumn: 'tenant_id', foreignKeys: [{ columns: ['user_id'], refTable: 'users', refColumns: ['user_id'], onDelete: 'CASCADE' }, { columns: ['gate_id'], refTable: 'gates', refColumns: ['gate_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'user_zone_access', primaryKey: ['user_id', 'zone_id'], tenantScoped: true, tenantColumn: 'tenant_id', foreignKeys: [{ columns: ['user_id'], refTable: 'users', refColumns: ['user_id'], onDelete: 'CASCADE' }, { columns: ['zone_id'], refTable: 'zones', refColumns: ['zone_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'access_policies', primaryKey: 'policy_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'access_policy_rules', primaryKey: 'rule_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'access_credentials', primaryKey: 'credential_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['identifier_token']] });
    this.registerTable({ name: 'access_grants', primaryKey: 'grant_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'access_events', primaryKey: 'event_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'zone_permissions', primaryKey: 'zone_perm_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['role_id', 'zone_id']] });
    this.registerTable({ name: 'gate_permissions', primaryKey: 'gate_perm_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['role_id', 'gate_id']] });

    // 3. Person & Identity Model
    this.registerTable({ name: 'persons', primaryKey: 'person_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'person_contacts', primaryKey: 'contact_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'person_addresses', primaryKey: 'address_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'person_identity_documents', primaryKey: 'doc_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'document_type', 'document_number']] });
    this.registerTable({ name: 'person_consents', primaryKey: 'consent_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'biometric_references', primaryKey: 'biometric_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 4. External Organizations
    this.registerTable({ name: 'external_organizations', primaryKey: 'org_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'organization_types', primaryKey: 'type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'external_org_classifications', primaryKey: ['org_id', 'type_id'], tenantScoped: false, foreignKeys: [{ columns: ['org_id'], refTable: 'external_organizations', refColumns: ['org_id'], onDelete: 'CASCADE' }, { columns: ['type_id'], refTable: 'organization_types', refColumns: ['type_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'organization_contacts', primaryKey: 'contact_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 5. Visitor Domain
    this.registerTable({ name: 'visitor_types', primaryKey: 'type_id', tenantScoped: false });
    this.registerTable({ name: 'visitor_purposes', primaryKey: 'purpose_id', tenantScoped: false });
    this.registerTable({ name: 'visitor_profiles', primaryKey: 'profile_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'person_id']] });
    this.registerTable({ name: 'appointments', primaryKey: 'appointment_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'appointment_participants', primaryKey: 'participant_id', tenantScoped: false, foreignKeys: [{ columns: ['appointment_id'], refTable: 'appointments', refColumns: ['appointment_id'], onDelete: 'CASCADE' }, { columns: ['person_id'], refTable: 'persons', refColumns: ['person_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'visitor_transactions', primaryKey: 'transaction_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']], foreignKeys: [{ columns: ['tenant_id'], refTable: 'tenants', refColumns: ['tenant_id'], onDelete: 'CASCADE' }, { columns: ['site_id'], refTable: 'sites', refColumns: ['site_id'], onDelete: 'CASCADE' }, { columns: ['person_id'], refTable: 'persons', refColumns: ['person_id'], onDelete: 'RESTRICT' }] });
    this.registerTable({ name: 'visitor_participants', primaryKey: 'participant_id', tenantScoped: false });
    this.registerTable({ name: 'visitor_hosts', primaryKey: 'host_id', tenantScoped: false });

    // 6. Customer Domain
    this.registerTable({ name: 'customer_accounts', primaryKey: 'customer_account_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'account_code']] });
    this.registerTable({ name: 'customer_representatives', primaryKey: 'rep_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'customer_visit_types', primaryKey: 'visit_type_id', tenantScoped: false });
    this.registerTable({ name: 'customer_visit_transactions', primaryKey: 'transaction_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'customer_visit_participants', primaryKey: 'participant_id', tenantScoped: false });
    this.registerTable({ name: 'customer_requirements', primaryKey: 'requirement_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'customer_access_policies', primaryKey: 'policy_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 7. Contractor Domain
    this.registerTable({ name: 'contractor_companies', primaryKey: 'company_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'vendor_code']] });
    this.registerTable({ name: 'contractor_contracts', primaryKey: 'contract_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'contract_number']] });
    this.registerTable({ name: 'contractor_work_orders', primaryKey: 'work_order_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'contractor_workers', primaryKey: 'contractor_worker_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'badge_number']] });
    this.registerTable({ name: 'contractor_assignments', primaryKey: 'assignment_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'contractor_training_records', primaryKey: 'record_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'contractor_permits', primaryKey: 'permit_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'contractor_attendance', primaryKey: 'attendance_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'contractor_compliance_records', primaryKey: 'record_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'contractor_qualifications', primaryKey: 'qualification_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 8. Service / Work Domain
    this.registerTable({ name: 'service_providers', primaryKey: 'service_provider_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'provider_code']] });
    this.registerTable({ name: 'service_technicians', primaryKey: 'technician_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'service_requests', primaryKey: 'request_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'service_work_orders', primaryKey: 'work_order_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'service_work_locations', primaryKey: 'location_id', tenantScoped: false });
    this.registerTable({ name: 'service_permits', primaryKey: 'permit_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'service_activities', primaryKey: 'activity_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 9. Material Domain
    this.registerTable({ name: 'material_categories', primaryKey: 'category_id', tenantScoped: false });
    this.registerTable({ name: 'materials', primaryKey: 'material_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'material_code']] });
    this.registerTable({ name: 'purchase_orders', primaryKey: 'po_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'po_number']] });
    this.registerTable({ name: 'purchase_order_lines', primaryKey: 'line_id', tenantScoped: false });
    this.registerTable({ name: 'material_transactions', primaryKey: 'transaction_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'material_transaction_lines', primaryKey: 'line_id', tenantScoped: false, foreignKeys: [{ columns: ['material_transaction_id'], refTable: 'material_transactions', refColumns: ['transaction_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'material_suppliers', primaryKey: 'supplier_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'supplier_code']] });
    this.registerTable({ name: 'material_inspections', primaryKey: 'inspection_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'material_ownership', primaryKey: 'ownership_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'material_serial_numbers', primaryKey: 'serial_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'material_id', 'serial_number']] });
    this.registerTable({ name: 'material_batches', primaryKey: 'batch_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'material_returns', primaryKey: 'return_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'material_gate_passes', primaryKey: 'pass_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });

    // 10. Vehicle Domain
    this.registerTable({ name: 'vehicle_types', primaryKey: 'type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'vehicle_ownership_types', primaryKey: 'ownership_type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'vehicle_fuel_types', primaryKey: 'fuel_type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'transporters', primaryKey: 'transporter_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'vehicles', primaryKey: 'vehicle_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'registration_plate']] });
    this.registerTable({ name: 'drivers', primaryKey: 'driver_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'license_number']] });
    this.registerTable({ name: 'vehicle_status_history', primaryKey: 'history_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 11. Reusable Normalized Transport Domain
    this.registerTable({ name: 'transport_modes', primaryKey: 'mode_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'transport_ownership_types', primaryKey: 'ownership_type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'journey_types', primaryKey: 'journey_type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'transport_measurement_methods', primaryKey: 'method_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'transport_data_sources', primaryKey: 'source_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'transport_activities', primaryKey: 'id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });

    // 12. Centralized Document Domain
    this.registerTable({ name: 'document_types', primaryKey: 'type_id', tenantScoped: false });
    this.registerTable({ name: 'documents', primaryKey: 'id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'document_versions', primaryKey: 'version_id', tenantScoped: false, uniqueKeys: [['document_id', 'version_number']] });
    this.registerTable({ name: 'document_links', primaryKey: 'id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'document_id', 'entity_type', 'entity_id', 'relationship_type']] });
    this.registerTable({ name: 'document_verifications', primaryKey: 'verification_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'document_retention_policies', primaryKey: 'policy_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'vehicle_documents', primaryKey: 'doc_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'driver_documents', primaryKey: 'doc_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 13. Legal, Consent & Verification
    this.registerTable({ name: 'legal_documents', primaryKey: 'doc_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'legal_document_versions', primaryKey: 'version_id', tenantScoped: false, uniqueKeys: [['legal_doc_id', 'version_tag']] });
    this.registerTable({ name: 'consents', primaryKey: 'consent_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'consent_records', primaryKey: 'record_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'acceptances', primaryKey: 'acceptance_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'signatures', primaryKey: 'sig_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'identity_verification_methods', primaryKey: 'method_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'identity_verifications', primaryKey: 'verification_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'identity_verification_results', primaryKey: 'result_id', tenantScoped: false });

    // 14. Workflow Model
    this.registerTable({ name: 'workflow_definitions', primaryKey: 'definition_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'workflow_versions', primaryKey: 'version_id', tenantScoped: false, uniqueKeys: [['definition_id', 'version_number']] });
    this.registerTable({ name: 'workflow_stages', primaryKey: 'stage_id', tenantScoped: false });
    this.registerTable({ name: 'workflow_transitions', primaryKey: 'transition_id', tenantScoped: false });
    this.registerTable({ name: 'workflow_conditions', primaryKey: 'condition_id', tenantScoped: false });
    this.registerTable({ name: 'workflow_instances', primaryKey: 'instance_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'workflow_tasks', primaryKey: 'task_id', tenantScoped: false });
    this.registerTable({ name: 'workflow_actions', primaryKey: 'action_id', tenantScoped: false });

    // 15. Approval Model
    this.registerTable({ name: 'approval_workflows', primaryKey: 'workflow_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'approval_workflow_versions', primaryKey: 'version_id', tenantScoped: false, uniqueKeys: [['workflow_id', 'version_number']] });
    this.registerTable({ name: 'approval_stages', primaryKey: 'stage_id', tenantScoped: false });
    this.registerTable({ name: 'approval_instances', primaryKey: 'instance_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'approval_stage_instances', primaryKey: 'stage_inst_id', tenantScoped: false });
    this.registerTable({ name: 'approval_actions', primaryKey: 'action_id', tenantScoped: false });
    this.registerTable({ name: 'approval_delegations', primaryKey: 'delegation_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 16. Gate Domain & Devices (Gate Events are IMMUTABLE!)
    this.registerTable({ name: 'gate_types', primaryKey: 'type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'gate_event_types', primaryKey: 'type_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'gate_devices', primaryKey: 'device_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'device_code']] });
    this.registerTable({ name: 'gate_transactions', primaryKey: 'gate_tx_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'gate_events', primaryKey: 'event_id', tenantScoped: true, tenantColumn: 'tenant_id', isImmutable: true });
    this.registerTable({ name: 'gate_decisions', primaryKey: 'decision_id', tenantScoped: true, tenantColumn: 'tenant_id' });

    // 17. Safety & Emergency
    this.registerTable({ name: 'training_types', primaryKey: 'type_id', tenantScoped: false });
    this.registerTable({ name: 'permit_types', primaryKey: 'type_id', tenantScoped: false });
    this.registerTable({ name: 'safety_inductions', primaryKey: 'induction_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'training_records', primaryKey: 'record_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'permits', primaryKey: 'permit_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'safety_declarations', primaryKey: 'declaration_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'emergency_events', primaryKey: 'event_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'emergency_event_sites', primaryKey: ['event_id', 'site_id'], tenantScoped: false, foreignKeys: [{ columns: ['event_id'], refTable: 'emergency_events', refColumns: ['event_id'], onDelete: 'CASCADE' }, { columns: ['site_id'], refTable: 'sites', refColumns: ['site_id'], onDelete: 'CASCADE' }] });
    this.registerTable({ name: 'occupancy_snapshots', primaryKey: 'snapshot_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'muster_points', primaryKey: 'muster_point_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'site_id', 'code']] });
    this.registerTable({ name: 'muster_records', primaryKey: 'record_id', tenantScoped: false });
    this.registerTable({ name: 'muster_participants', primaryKey: 'participant_id', tenantScoped: false });
    this.registerTable({ name: 'missing_person_records', primaryKey: 'missing_id', tenantScoped: false });

    // 18. Incidents & Exceptions
    this.registerTable({ name: 'incident_types', primaryKey: 'type_id', tenantScoped: false });
    this.registerTable({ name: 'incidents', primaryKey: 'incident_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'exception_types', primaryKey: 'type_id', tenantScoped: false });
    this.registerTable({ name: 'exceptions', primaryKey: 'exception_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'exception_actions', primaryKey: 'action_id', tenantScoped: false });
    this.registerTable({ name: 'exception_resolutions', primaryKey: 'resolution_id', tenantScoped: false });

    // 19. ESG / GHG Domain (Calculations and factor versions are IMMUTABLE!)
    this.registerTable({ name: 'data_quality_levels', primaryKey: 'level_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'evidence_records', primaryKey: 'evidence_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'emission_factor_sources', primaryKey: 'source_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'emission_factors', primaryKey: 'factor_id', tenantScoped: false });
    this.registerTable({ name: 'emission_factor_versions', primaryKey: 'version_id', tenantScoped: false, isImmutable: true, uniqueKeys: [['factor_id', 'version_tag', 'geography']] });
    this.registerTable({ name: 'ghg_scope_definitions', primaryKey: 'scope_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'ghg_category_definitions', primaryKey: 'category_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'ghg_mapping_rules', primaryKey: 'rule_id', tenantScoped: false });
    this.registerTable({ name: 'ghg_activities', primaryKey: 'id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['reference_number']] });
    this.registerTable({ name: 'ghg_calculations', primaryKey: 'id', tenantScoped: false, isImmutable: true });

    // 20. Notifications
    this.registerTable({ name: 'notification_channels', primaryKey: 'channel_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'notification_templates', primaryKey: 'template_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code', 'channel_id']] });
    this.registerTable({ name: 'notification_rules', primaryKey: 'rule_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'notifications', primaryKey: 'notification_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'notification_deliveries', primaryKey: 'delivery_id', tenantScoped: false });

    // 21. Audit Logs & Domain Events (IMMUTABLE LEDGERS!)
    this.registerTable({ name: 'audit_logs', primaryKey: 'audit_id', tenantScoped: true, tenantColumn: 'tenant_id', isImmutable: true });
    this.registerTable({ name: 'domain_events', primaryKey: 'event_id', tenantScoped: true, tenantColumn: 'tenant_id', isImmutable: true });

    // 22. Master Data Management & Policy Framework (Part 5)
    this.registerTable({ name: 'master_data_categories', primaryKey: 'category_id', tenantScoped: false, uniqueKeys: [['code']] });
    this.registerTable({ name: 'master_data_records', primaryKey: 'id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'category', 'code']] });
    this.registerTable({ name: 'master_data_versions', primaryKey: 'version_id', tenantScoped: false, uniqueKeys: [['record_id', 'version_number']] });
    this.registerTable({ name: 'policy_definitions', primaryKey: 'policy_id', tenantScoped: true, tenantColumn: 'tenant_id', uniqueKeys: [['tenant_id', 'code']] });
    this.registerTable({ name: 'policy_versions', primaryKey: 'version_id', tenantScoped: false, uniqueKeys: [['policy_id', 'version_number']] });
    this.registerTable({ name: 'policy_rules', primaryKey: 'rule_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'policy_evaluation_records', primaryKey: 'evaluation_id', tenantScoped: true, tenantColumn: 'tenant_id' });
    this.registerTable({ name: 'workflow_outbox_events', primaryKey: 'outbox_id', tenantScoped: true, tenantColumn: 'tenant_id' });
  }
}

