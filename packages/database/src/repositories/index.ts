/**
 * VMS Enterprise: Strongly Typed Relational Repositories
 * Enforces Tenant Isolation, Foreign Key Integrity, and Transaction Scoping
 */

import { randomUUID } from 'node:crypto';
import type { RelationalDatabase } from '../in-memory-db.js';
import type {
  TenantRecord,
  SiteRecord,
  GateRecord,
  ZoneRecord,
  PersonRecord,
  PersonContactRecord,
  PersonAddressRecord,
  PersonIdentityDocRecord,
  VisitorTransactionRecord,
  CustomerAccountRecord,
  CustomerVisitTransactionRecord,
  CustomerVisitParticipantRecord,
  ContractorCompanyRecord,
  ContractorContractRecord,
  ContractorWorkOrderRecord,
  ContractorWorkerRecord,
  ServiceProviderRecord,
  ServiceWorkOrderRecord,
  MaterialRecord,
  PurchaseOrderRecord,
  MaterialTransactionRecord,
  MaterialTransactionLineRecord,
  MaterialReturnRecord,
  TransportActivityRecord,
  GHGActivityRecord,
  GHGCalculationRecord,
  EmissionFactorVersionRecord,
  DocumentRecord,
  DocumentLinkRecord,
  GateEventRecord,
  AuditLogRecord,
  DomainEventRecord,
} from '../types.js';

export class BaseRepository {
  constructor(protected db: RelationalDatabase) {}

  protected enforceTenant(tenantId?: string): string {
    const activeTenant = tenantId || this.db.getTenantContext();
    if (!activeTenant) {
      throw new Error('Tenant context required: multi-tenant operation attempted without valid tenant_id');
    }
    return activeTenant;
  }
}

// ----------------------------------------------------------------------------
// 1. Tenant & Organization Hierarchy Repository
// ----------------------------------------------------------------------------
export class TenantRepository extends BaseRepository {
  public getTenant(tenantId: string): TenantRecord | null {
    return this.db.findById<TenantRecord>('tenants', tenantId);
  }

  public getSite(siteId: string, tenantId?: string): SiteRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<SiteRecord>('sites', siteId, tid);
  }

  public listSites(tenantId?: string): SiteRecord[] {
    const tid = this.enforceTenant(tenantId);
    return this.db.findMany<SiteRecord>('sites', { tenant_id: tid }, tid);
  }

  public getGate(gateId: string, tenantId?: string): GateRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<GateRecord>('gates', gateId, tid);
  }

  public getZone(zoneId: string, tenantId?: string): ZoneRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<ZoneRecord>('zones', zoneId, tid);
  }
}

// ----------------------------------------------------------------------------
// 2. Person & Identity Repository (Reusable across all domains)
// ----------------------------------------------------------------------------
export class PersonRepository extends BaseRepository {
  public createPerson(person: Omit<PersonRecord, 'created_at' | 'updated_at'>, tenantId?: string): PersonRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<PersonRecord>('persons', {
      ...person,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getPerson(personId: string, tenantId?: string): PersonRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<PersonRecord>('persons', personId, tid);
  }

  public addContact(contact: Omit<PersonContactRecord, 'created_at'>, tenantId?: string): PersonContactRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<PersonContactRecord>('person_contacts', {
      ...contact,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }

  public addAddress(address: Omit<PersonAddressRecord, 'created_at'>, tenantId?: string): PersonAddressRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<PersonAddressRecord>('person_addresses', {
      ...address,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }

  public addIdentityDoc(doc: Omit<PersonIdentityDocRecord, 'created_at' | 'updated_at'>, tenantId?: string): PersonIdentityDocRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<PersonIdentityDocRecord>('person_identity_documents', {
      ...doc,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }
}

// ----------------------------------------------------------------------------
// 3. Visitor Repository
// ----------------------------------------------------------------------------
export class VisitorRepository extends BaseRepository {
  public createTransaction(tx: Omit<VisitorTransactionRecord, 'created_at' | 'updated_at'>, tenantId?: string): VisitorTransactionRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<VisitorTransactionRecord>('visitor_transactions', {
      ...tx,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getTransaction(txId: string, tenantId?: string): VisitorTransactionRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<VisitorTransactionRecord>('visitor_transactions', txId, tid);
  }

  public getByReference(referenceNumber: string, tenantId?: string): VisitorTransactionRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<VisitorTransactionRecord>('visitor_transactions', { reference_number: referenceNumber }, tid);
    return results[0] || null;
  }
}

// ----------------------------------------------------------------------------
// 4. Customer Repository (Independent domain with multiple participants)
// ----------------------------------------------------------------------------
export class CustomerRepository extends BaseRepository {
  public createAccount(account: Omit<CustomerAccountRecord, 'created_at' | 'updated_at'>, tenantId?: string): CustomerAccountRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<CustomerAccountRecord>('customer_accounts', {
      ...account,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public createVisitTransaction(tx: Omit<CustomerVisitTransactionRecord, 'created_at' | 'updated_at'>, tenantId?: string): CustomerVisitTransactionRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<CustomerVisitTransactionRecord>('customer_visit_transactions', {
      ...tx,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public addParticipant(participant: Omit<CustomerVisitParticipantRecord, 'created_at'>, tenantId?: string): CustomerVisitParticipantRecord {
    this.enforceTenant(tenantId);
    return this.db.insert<CustomerVisitParticipantRecord>('customer_visit_participants', {
      ...participant,
      created_at: new Date(),
    });
  }

  public getParticipants(visitId: string, tenantId?: string): CustomerVisitParticipantRecord[] {
    this.enforceTenant(tenantId);
    return this.db.findMany<CustomerVisitParticipantRecord>('customer_visit_participants', { customer_visit_id: visitId });
  }

  public getVisit(txId: string, tenantId?: string): CustomerVisitTransactionRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<CustomerVisitTransactionRecord>('customer_visit_transactions', txId, tid);
  }

  public getVisitByReference(ref: string, tenantId?: string): CustomerVisitTransactionRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<CustomerVisitTransactionRecord>('customer_visit_transactions', { reference_number: ref }, tid);
    return results[0] || null;
  }
}

// ----------------------------------------------------------------------------
// 5. Contractor Repository (Company -> Contract -> Work Order -> Worker hierarchy)
// ----------------------------------------------------------------------------
export class ContractorRepository extends BaseRepository {
  public createCompany(company: Omit<ContractorCompanyRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorCompanyRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<ContractorCompanyRecord>('contractor_companies', {
      ...company,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public createContract(contract: Omit<ContractorContractRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorContractRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<ContractorContractRecord>('contractor_contracts', {
      ...contract,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public createWorkOrder(wo: Omit<ContractorWorkOrderRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorWorkOrderRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<ContractorWorkOrderRecord>('contractor_work_orders', {
      ...wo,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public addWorker(worker: Omit<ContractorWorkerRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorWorkerRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<ContractorWorkerRecord>('contractor_workers', {
      ...worker,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getWorkOrder(woId: string, tenantId?: string): ContractorWorkOrderRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<ContractorWorkOrderRecord>('contractor_work_orders', woId, tid);
  }

  public getWorkOrderByReference(ref: string, tenantId?: string): ContractorWorkOrderRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<ContractorWorkOrderRecord>('contractor_work_orders', { reference_number: ref }, tid);
    return results[0] || null;
  }
}

// ----------------------------------------------------------------------------
// 6. Service / Work Repository
// ----------------------------------------------------------------------------
export class ServiceRepository extends BaseRepository {
  public createProvider(provider: Omit<ServiceProviderRecord, 'created_at' | 'updated_at'>, tenantId?: string): ServiceProviderRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<ServiceProviderRecord>('service_providers', {
      ...provider,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public createWorkOrder(wo: Omit<ServiceWorkOrderRecord, 'created_at' | 'updated_at'>, tenantId?: string): ServiceWorkOrderRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<ServiceWorkOrderRecord>('service_work_orders', {
      ...wo,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getWorkOrder(woId: string, tenantId?: string): ServiceWorkOrderRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<ServiceWorkOrderRecord>('service_work_orders', woId, tid);
  }

  public getWorkOrderByReference(ref: string, tenantId?: string): ServiceWorkOrderRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<ServiceWorkOrderRecord>('service_work_orders', { reference_number: ref }, tid);
    return results[0] || null;
  }
}

// ----------------------------------------------------------------------------
// 7. Material Repository (Multi-Line Items & Return Tracking)
// ----------------------------------------------------------------------------
export class MaterialRepository extends BaseRepository {
  public createMaterial(mat: Omit<MaterialRecord, 'created_at' | 'updated_at'>, tenantId?: string): MaterialRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<MaterialRecord>('materials', {
      ...mat,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public createPurchaseOrder(po: Omit<PurchaseOrderRecord, 'created_at' | 'updated_at'>, tenantId?: string): PurchaseOrderRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<PurchaseOrderRecord>('purchase_orders', {
      ...po,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public createTransaction(
    tx: Omit<MaterialTransactionRecord, 'created_at' | 'updated_at'>,
    lines: Array<Omit<MaterialTransactionLineRecord, 'line_id' | 'material_transaction_id' | 'created_at'>>,
    tenantId?: string
  ): { transaction: MaterialTransactionRecord; lines: MaterialTransactionLineRecord[] } {
    const tid = this.enforceTenant(tenantId);

    const createdTx = this.db.insert<MaterialTransactionRecord>('material_transactions', {
      ...tx,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);

    const createdLines: MaterialTransactionLineRecord[] = [];
    for (const line of lines) {
      const insertedLine = this.db.insert<MaterialTransactionLineRecord>('material_transaction_lines', {
        ...line,
        line_id: line.serial_number || randomUUID(),
        material_transaction_id: createdTx.transaction_id,
        created_at: new Date(),
      });
      createdLines.push(insertedLine);
    }

    return { transaction: createdTx, lines: createdLines };
  }

  public getTransaction(txId: string, tenantId?: string): MaterialTransactionRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<MaterialTransactionRecord>('material_transactions', txId, tid);
  }

  public getTransactionByReference(ref: string, tenantId?: string): MaterialTransactionRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<MaterialTransactionRecord>('material_transactions', { reference_number: ref }, tid);
    return results[0] || null;
  }

  public getLines(txId: string): MaterialTransactionLineRecord[] {
    return this.db.findMany<MaterialTransactionLineRecord>('material_transaction_lines', { material_transaction_id: txId });
  }

  public recordReturn(ret: Omit<MaterialReturnRecord, 'created_at'>, tenantId?: string): MaterialReturnRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<MaterialReturnRecord>('material_returns', {
      ...ret,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }
}

// ----------------------------------------------------------------------------
// 8. Reusable Transport Activity Repository
// ----------------------------------------------------------------------------
export class TransportRepository extends BaseRepository {
  public createActivity(activity: Omit<TransportActivityRecord, 'created_at' | 'updated_at'>, tenantId?: string): TransportActivityRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<TransportActivityRecord>('transport_activities', {
      ...activity,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getActivity(id: string, tenantId?: string): TransportActivityRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<TransportActivityRecord>('transport_activities', id, tid);
  }

  public getBySource(domain: string, transactionId: string, tenantId?: string): TransportActivityRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<TransportActivityRecord>('transport_activities', {
      source_domain: domain,
      source_transaction_id: transactionId,
    }, tid);
    return results[0] || null;
  }
}

// ----------------------------------------------------------------------------
// 9. Centralized Document Repository & Link Service
// ----------------------------------------------------------------------------
export class DocumentRepository extends BaseRepository {
  public createDocument(doc: Omit<DocumentRecord, 'created_at' | 'updated_at'>, tenantId?: string): DocumentRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<DocumentRecord>('documents', {
      ...doc,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public linkDocument(
    documentId: string,
    entityType: string,
    entityId: string,
    relationshipType: string,
    tenantId?: string
  ): DocumentLinkRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<DocumentLinkRecord>('document_links', {
      id: randomUUID(),
      document_id: documentId,
      entity_type: entityType,
      entity_id: entityId,
      relationship_type: relationshipType,
      tenant_id: tid,
      linked_at: new Date(),
    }, tid);
  }

  public getDocument(docId: string, tenantId?: string): DocumentRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<DocumentRecord>('documents', docId, tid);
  }

  public getLinksForEntity(entityType: string, entityId: string, tenantId?: string): DocumentLinkRecord[] {
    const tid = this.enforceTenant(tenantId);
    return this.db.findMany<DocumentLinkRecord>('document_links', {
      entity_type: entityType,
      entity_id: entityId,
    }, tid);
  }
}

// ----------------------------------------------------------------------------
// 10. ESG / GHG Repository (Normalized Activities, Versioned Factors, Calculations)
// ----------------------------------------------------------------------------
export class GHGRepository extends BaseRepository {
  public createActivity(activity: Omit<GHGActivityRecord, 'created_at' | 'updated_at'>, tenantId?: string): GHGActivityRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<GHGActivityRecord>('ghg_activities', {
      ...activity,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getActivity(id: string, tenantId?: string): GHGActivityRecord | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById<GHGActivityRecord>('ghg_activities', id, tid);
  }

  public getBySource(domain: string, transactionId: string, tenantId?: string): GHGActivityRecord | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany<GHGActivityRecord>('ghg_activities', {
      source_domain: domain,
      source_transaction_id: transactionId,
    }, tid);
    return results[0] || null;
  }

  public recordCalculation(calc: GHGCalculationRecord): GHGCalculationRecord {
    // ghg_calculations is an append-only immutable ledger!
    return this.db.insert<GHGCalculationRecord>('ghg_calculations', calc);
  }

  public getCalculations(ghgActivityId: string): GHGCalculationRecord[] {
    return this.db.findMany<GHGCalculationRecord>('ghg_calculations', { ghg_activity_id: ghgActivityId });
  }

  public registerFactorVersion(version: EmissionFactorVersionRecord): EmissionFactorVersionRecord {
    // emission_factor_versions is immutable!
    return this.db.insert<EmissionFactorVersionRecord>('emission_factor_versions', version);
  }

  public getFactorVersion(factorId: string, versionTag: string, geography: string): EmissionFactorVersionRecord | null {
    const results = this.db.findMany<EmissionFactorVersionRecord>('emission_factor_versions', {
      factor_id: factorId,
      version_tag: versionTag,
      geography: geography,
    });
    return results[0] || null;
  }
}

// ----------------------------------------------------------------------------
// 11. Gate & Physical Event Repository (Immutable gate events)
// ----------------------------------------------------------------------------
export class GateRepository extends BaseRepository {
  public recordGateEvent(event: GateEventRecord, tenantId?: string): GateEventRecord {
    const tid = this.enforceTenant(tenantId);
    // gate_events is an immutable append-only ledger!
    return this.db.insert<GateEventRecord>('gate_events', {
      ...event,
      tenant_id: tid,
    }, tid);
  }

  public listGateEvents(gateId: string, tenantId?: string): GateEventRecord[] {
    const tid = this.enforceTenant(tenantId);
    return this.db.findMany<GateEventRecord>('gate_events', { gate_id: gateId }, tid);
  }
}

// ----------------------------------------------------------------------------
// 12. Append-Only Audit & Domain Event Repository
// ----------------------------------------------------------------------------
export class AuditRepository extends BaseRepository {
  public logAudit(log: AuditLogRecord, tenantId?: string): AuditLogRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<AuditLogRecord>('audit_logs', {
      ...log,
      tenant_id: tid,
    }, tid);
  }

  public getAuditHistory(entityType: string, entityId: string, tenantId?: string): AuditLogRecord[] {
    const tid = this.enforceTenant(tenantId);
    return this.db.findMany<AuditLogRecord>('audit_logs', {
      entity_type: entityType,
      entity_id: entityId,
    }, tid);
  }

  public emitDomainEvent(event: DomainEventRecord, tenantId?: string): DomainEventRecord {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert<DomainEventRecord>('domain_events', {
      ...event,
      tenant_id: tid,
    }, tid);
  }
}

// ----------------------------------------------------------------------------
// 13. Master Data Repository (Centralized & Versioned)
// ----------------------------------------------------------------------------
export class MasterDataRepository extends BaseRepository {
  public createRecord(record: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert('master_data_records', {
      ...record,
      tenant_id: tid,
      created_at: record.created_at || new Date(),
      updated_at: record.updated_at || new Date(),
    }, tid);
  }

  public updateRecord(id: string, updates: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.update('master_data_records', id, {
      ...updates,
      updated_at: new Date(),
    }, tid);
  }

  public getRecord(id: string, tenantId?: string): any | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById('master_data_records', id, tid);
  }

  public getRecordByCode(category: string, code: string, tenantId?: string): any | null {
    const tid = this.enforceTenant(tenantId);
    const results = this.db.findMany('master_data_records', { category, code }, tid);
    return results[0] || null;
  }

  public listRecords(category?: string, filter?: Record<string, any>, tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    const criteria: Record<string, any> = { ...(filter || {}) };
    if (category) criteria.category = category;
    return this.db.findMany('master_data_records', criteria, tid);
  }

  public saveVersion(version: Record<string, any>): any {
    return this.db.insert('master_data_versions', {
      ...version,
      changed_at: version.changed_at || new Date(),
    });
  }

  public getVersionHistory(recordId: string): any[] {
    return this.db.findMany('master_data_versions', { record_id: recordId });
  }

  public createCategory(cat: Record<string, any>): any {
    return this.db.insert('master_data_categories', {
      ...cat,
      created_at: new Date(),
    });
  }

  public listCategories(): any[] {
    return this.db.findMany('master_data_categories', {});
  }
}

// ----------------------------------------------------------------------------
// 14. Workflow Engine Repository
// ----------------------------------------------------------------------------
export class WorkflowRepository extends BaseRepository {
  public createDefinition(def: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    const defId = def.definition_id || def.definitionId || randomUUID();
    return this.db.insert('workflow_definitions', {
      ...def,
      definition_id: defId,
      definitionId: defId,
      target_domain: def.domain || def.target_domain,
      domain: def.domain || def.target_domain,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getDefinition(id: string, tenantId?: string): any | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById('workflow_definitions', id, tid);
  }

  public listDefinitions(domain?: string, tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    const all = this.db.findMany('workflow_definitions', {}, tid);
    if (!domain) return all;
    return all.filter((d: any) => d.domain === domain || d.target_domain === domain);
  }

  public createVersion(version: Record<string, any>): any {
    const verId = version.version_id || version.versionId || randomUUID();
    const defId = version.definition_id || version.definitionId;
    const verNum = version.version_number ?? version.versionNumber;
    return this.db.insert('workflow_versions', {
      ...version,
      version_id: verId,
      versionId: verId,
      definition_id: defId,
      definitionId: defId,
      version_number: verNum,
      versionNumber: verNum,
      created_at: new Date(),
    });
  }

  public getVersion(versionId: string): any | null {
    return this.db.findById('workflow_versions', versionId);
  }

  public listVersions(definitionId: string): any[] {
    const all = this.db.findMany('workflow_versions', {});
    return all.filter((v: any) => v.definition_id === definitionId || v.definitionId === definitionId);
  }

  public createInstance(inst: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    const instId = inst.instance_id || inst.instanceId || randomUUID();
    return this.db.insert('workflow_instances', {
      ...inst,
      instance_id: instId,
      instanceId: instId,
      source_domain: inst.source_domain || inst.sourceDomain,
      sourceDomain: inst.sourceDomain || inst.source_domain,
      tenant_id: tid,
      started_at: new Date(),
      created_at: new Date(),
    }, tid);
  }

  public getInstance(instanceId: string, tenantId?: string): any | null {
    const tid = this.enforceTenant(tenantId);
    const row = this.db.findById('workflow_instances', instanceId, tid);
    if (!row) return null;
    return {
      ...row,
      currentStageId: row.current_stage_id || row.currentStageId,
      current_stage_id: row.current_stage_id || row.currentStageId,
      versionId: row.version_id || row.versionId,
      version_id: row.version_id || row.versionId,
      sourceDomain: row.source_domain || row.sourceDomain,
      source_domain: row.source_domain || row.sourceDomain,
      sourceTransactionId: row.source_transaction_id || row.sourceTransactionId,
      source_transaction_id: row.source_transaction_id || row.sourceTransactionId,
    };
  }

  public listInstances(domain?: string, tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    const all = this.db.findMany('workflow_instances', {}, tid);
    if (!domain) return all;
    return all.filter((i: any) => i.domain === domain || i.source_domain === domain || i.sourceDomain === domain);
  }

  public updateInstance(instanceId: string, updates: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    const mapped = {
      ...updates,
      current_stage_id: updates.current_stage_id || updates.currentStageId,
      currentStageId: updates.currentStageId || updates.current_stage_id,
      completed_at: updates.completed_at || updates.completedAt,
      completedAt: updates.completedAt || updates.completed_at,
    };
    return this.db.update('workflow_instances', instanceId, mapped, tid);
  }

  public createTask(task: Record<string, any>): any {
    const taskId = task.task_id || task.taskId || randomUUID();
    return this.db.insert('workflow_tasks', {
      ...task,
      task_id: taskId,
      taskId: taskId,
      instance_id: task.instance_id || task.instanceId,
      instanceId: task.instanceId || task.instance_id,
      stage_id: task.stage_id || task.stageId,
      stageId: task.stageId || task.stage_id,
      tenant_id: task.tenant_id || task.tenantId,
      created_at: new Date(),
    });
  }

  public updateTask(taskId: string, updates: Record<string, any>): any {
    return this.db.update('workflow_tasks', taskId, updates);
  }

  public getTask(taskId: string): any | null {
    return this.db.findById('workflow_tasks', taskId);
  }

  public listTasks(filter: Record<string, any>): any[] {
    const all = this.db.findMany('workflow_tasks', {});
    if (!filter || Object.keys(filter).length === 0) return all;
    return all.filter((t: any) => {
      return Object.entries(filter).every(([k, v]) => {
        if (v === undefined) return true;
        if (k === 'instance_id' || k === 'instanceId') {
          return (t.instance_id === v || t.instanceId === v);
        }
        if (k === 'stage_id' || k === 'stageId') {
          return (t.stage_id === v || t.stageId === v);
        }
        if (k === 'status') {
          return t.status === v;
        }
        return t[k] === v;
      });
    });
  }

  public recordAction(action: Record<string, any>): any {
    const actionId = action.action_id || action.actionId || randomUUID();
    return this.db.insert('workflow_actions', {
      ...action,
      action_id: actionId,
      actionId: actionId,
      action_timestamp: new Date(),
    });
  }

  public recordOutboxEvent(event: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    const outboxId = event.outbox_id || event.outboxId || randomUUID();
    return this.db.insert('workflow_outbox_events', {
      ...event,
      outbox_id: outboxId,
      outboxId: outboxId,
      event_type: event.event_type || event.eventType,
      eventType: event.eventType || event.event_type,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }

  public listPendingOutboxEvents(tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    return this.db.findMany('workflow_outbox_events', { status: 'PENDING' }, tid);
  }
}

// ----------------------------------------------------------------------------
// 15. Approval Engine Repository
// ----------------------------------------------------------------------------
export class ApprovalRepository extends BaseRepository {
  public createWorkflow(wf: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert('approval_workflows', {
      ...wf,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }

  public createInstance(inst: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert('approval_instances', {
      ...inst,
      tenant_id: tid,
      requested_at: new Date(),
      created_at: new Date(),
    }, tid);
  }

  public getInstance(instanceId: string, tenantId?: string): any | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById('approval_instances', instanceId, tid);
  }

  public recordAction(action: Record<string, any>): any {
    const actionId = action.action_id || action.actionId || randomUUID();
    return this.db.insert('approval_actions', {
      ...action,
      action_id: actionId,
      actionId: actionId,
      decision_timestamp: new Date(),
    });
  }

  public createDelegation(del: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    const delId = del.delegation_id || del.delegationId || randomUUID();
    return this.db.insert('approval_delegations', {
      ...del,
      delegation_id: delId,
      delegationId: delId,
      delegator_user_id: del.delegator_user_id || del.delegatorUserId,
      delegatorUserId: del.delegatorUserId || del.delegator_user_id,
      delegate_user_id: del.delegate_user_id || del.delegateUserId,
      delegateUserId: del.delegateUserId || del.delegate_user_id,
      domain_scope: del.domain_scope || del.domainScope,
      domainScope: del.domainScope || del.domain_scope,
      valid_from: del.valid_from || del.validFrom,
      validFrom: del.validFrom || del.valid_from,
      valid_to: del.valid_to || del.validTo,
      validTo: del.validTo || del.valid_to,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }

  public listDelegations(filter: Record<string, any>, tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    const all = this.db.findMany('approval_delegations', {}, tid);
    if (!filter || Object.keys(filter).length === 0) return all;
    return all.filter((d: any) => {
      return Object.entries(filter).every(([k, v]) => {
        if (v === undefined) return true;
        if (k === 'delegator_user_id' || k === 'delegatorUserId') {
          return (d.delegator_user_id === v || d.delegatorUserId === v);
        }
        if (k === 'delegate_user_id' || k === 'delegateUserId') {
          return (d.delegate_user_id === v || d.delegateUserId === v);
        }
        if (k === 'delegation_id' || k === 'delegationId') {
          return (d.delegation_id === v || d.delegationId === v);
        }
        if (k === 'status') {
          return d.status === v;
        }
        return d[k] === v;
      });
    });
  }
}

// ----------------------------------------------------------------------------
// 16. Policy & Rules Repository
// ----------------------------------------------------------------------------
export class PolicyRepository extends BaseRepository {
  public createPolicy(policy: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert('policy_definitions', {
      ...policy,
      tenant_id: tid,
      created_at: new Date(),
      updated_at: new Date(),
    }, tid);
  }

  public getPolicy(policyId: string, tenantId?: string): any | null {
    const tid = this.enforceTenant(tenantId);
    return this.db.findById('policy_definitions', policyId, tid);
  }

  public listPolicies(domain?: string, tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    const criteria: Record<string, any> = {};
    if (domain) criteria.domain = domain;
    return this.db.findMany('policy_definitions', criteria, tid);
  }

  public createRule(rule: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert('policy_rules', {
      ...rule,
      tenant_id: tid,
      created_at: new Date(),
    }, tid);
  }

  public listRules(policyId: string, tenantId?: string): any[] {
    const tid = this.enforceTenant(tenantId);
    return this.db.findMany('policy_rules', { policy_id: policyId }, tid);
  }

  public recordEvaluation(evaluation: Record<string, any>, tenantId?: string): any {
    const tid = this.enforceTenant(tenantId);
    return this.db.insert('policy_evaluation_records', {
      ...evaluation,
      tenant_id: tid,
      evaluated_at: new Date(),
    }, tid);
  }
}

