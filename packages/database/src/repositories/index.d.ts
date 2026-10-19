/**
 * VMS Enterprise: Strongly Typed Relational Repositories
 * Enforces Tenant Isolation, Foreign Key Integrity, and Transaction Scoping
 */
import type { RelationalDatabase } from '../in-memory-db.js';
import type { TenantRecord, SiteRecord, GateRecord, ZoneRecord, PersonRecord, PersonContactRecord, PersonAddressRecord, PersonIdentityDocRecord, VisitorTransactionRecord, CustomerAccountRecord, CustomerVisitTransactionRecord, CustomerVisitParticipantRecord, ContractorCompanyRecord, ContractorContractRecord, ContractorWorkOrderRecord, ContractorWorkerRecord, ServiceProviderRecord, ServiceWorkOrderRecord, MaterialRecord, PurchaseOrderRecord, MaterialTransactionRecord, MaterialTransactionLineRecord, MaterialReturnRecord, TransportActivityRecord, GHGActivityRecord, GHGCalculationRecord, EmissionFactorVersionRecord, DocumentRecord, DocumentLinkRecord, GateEventRecord, AuditLogRecord, DomainEventRecord } from '../types.js';
export declare class BaseRepository {
    protected db: RelationalDatabase;
    constructor(db: RelationalDatabase);
    protected enforceTenant(tenantId?: string): string;
}
export declare class TenantRepository extends BaseRepository {
    getTenant(tenantId: string): TenantRecord | null;
    getSite(siteId: string, tenantId?: string): SiteRecord | null;
    listSites(tenantId?: string): SiteRecord[];
    getGate(gateId: string, tenantId?: string): GateRecord | null;
    getZone(zoneId: string, tenantId?: string): ZoneRecord | null;
}
export declare class PersonRepository extends BaseRepository {
    createPerson(person: Omit<PersonRecord, 'created_at' | 'updated_at'>, tenantId?: string): PersonRecord;
    getPerson(personId: string, tenantId?: string): PersonRecord | null;
    addContact(contact: Omit<PersonContactRecord, 'created_at'>, tenantId?: string): PersonContactRecord;
    addAddress(address: Omit<PersonAddressRecord, 'created_at'>, tenantId?: string): PersonAddressRecord;
    addIdentityDoc(doc: Omit<PersonIdentityDocRecord, 'created_at' | 'updated_at'>, tenantId?: string): PersonIdentityDocRecord;
}
export declare class VisitorRepository extends BaseRepository {
    createTransaction(tx: Omit<VisitorTransactionRecord, 'created_at' | 'updated_at'>, tenantId?: string): VisitorTransactionRecord;
    getTransaction(txId: string, tenantId?: string): VisitorTransactionRecord | null;
    getByReference(referenceNumber: string, tenantId?: string): VisitorTransactionRecord | null;
}
export declare class CustomerRepository extends BaseRepository {
    createAccount(account: Omit<CustomerAccountRecord, 'created_at' | 'updated_at'>, tenantId?: string): CustomerAccountRecord;
    createVisitTransaction(tx: Omit<CustomerVisitTransactionRecord, 'created_at' | 'updated_at'>, tenantId?: string): CustomerVisitTransactionRecord;
    addParticipant(participant: Omit<CustomerVisitParticipantRecord, 'created_at'>, tenantId?: string): CustomerVisitParticipantRecord;
    getParticipants(visitId: string, tenantId?: string): CustomerVisitParticipantRecord[];
    getVisit(txId: string, tenantId?: string): CustomerVisitTransactionRecord | null;
    getVisitByReference(ref: string, tenantId?: string): CustomerVisitTransactionRecord | null;
}
export declare class ContractorRepository extends BaseRepository {
    createCompany(company: Omit<ContractorCompanyRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorCompanyRecord;
    createContract(contract: Omit<ContractorContractRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorContractRecord;
    createWorkOrder(wo: Omit<ContractorWorkOrderRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorWorkOrderRecord;
    addWorker(worker: Omit<ContractorWorkerRecord, 'created_at' | 'updated_at'>, tenantId?: string): ContractorWorkerRecord;
    getWorkOrder(woId: string, tenantId?: string): ContractorWorkOrderRecord | null;
    getWorkOrderByReference(ref: string, tenantId?: string): ContractorWorkOrderRecord | null;
}
export declare class ServiceRepository extends BaseRepository {
    createProvider(provider: Omit<ServiceProviderRecord, 'created_at' | 'updated_at'>, tenantId?: string): ServiceProviderRecord;
    createWorkOrder(wo: Omit<ServiceWorkOrderRecord, 'created_at' | 'updated_at'>, tenantId?: string): ServiceWorkOrderRecord;
    getWorkOrder(woId: string, tenantId?: string): ServiceWorkOrderRecord | null;
    getWorkOrderByReference(ref: string, tenantId?: string): ServiceWorkOrderRecord | null;
}
export declare class MaterialRepository extends BaseRepository {
    createMaterial(mat: Omit<MaterialRecord, 'created_at' | 'updated_at'>, tenantId?: string): MaterialRecord;
    createPurchaseOrder(po: Omit<PurchaseOrderRecord, 'created_at' | 'updated_at'>, tenantId?: string): PurchaseOrderRecord;
    createTransaction(tx: Omit<MaterialTransactionRecord, 'created_at' | 'updated_at'>, lines: Array<Omit<MaterialTransactionLineRecord, 'line_id' | 'material_transaction_id' | 'created_at'>>, tenantId?: string): {
        transaction: MaterialTransactionRecord;
        lines: MaterialTransactionLineRecord[];
    };
    getTransaction(txId: string, tenantId?: string): MaterialTransactionRecord | null;
    getTransactionByReference(ref: string, tenantId?: string): MaterialTransactionRecord | null;
    getLines(txId: string): MaterialTransactionLineRecord[];
    recordReturn(ret: Omit<MaterialReturnRecord, 'created_at'>, tenantId?: string): MaterialReturnRecord;
}
export declare class TransportRepository extends BaseRepository {
    createActivity(activity: Omit<TransportActivityRecord, 'created_at' | 'updated_at'>, tenantId?: string): TransportActivityRecord;
    getActivity(id: string, tenantId?: string): TransportActivityRecord | null;
    getBySource(domain: string, transactionId: string, tenantId?: string): TransportActivityRecord | null;
}
export declare class DocumentRepository extends BaseRepository {
    createDocument(doc: Omit<DocumentRecord, 'created_at' | 'updated_at'>, tenantId?: string): DocumentRecord;
    linkDocument(documentId: string, entityType: string, entityId: string, relationshipType: string, tenantId?: string): DocumentLinkRecord;
    getDocument(docId: string, tenantId?: string): DocumentRecord | null;
    getLinksForEntity(entityType: string, entityId: string, tenantId?: string): DocumentLinkRecord[];
}
export declare class GHGRepository extends BaseRepository {
    createActivity(activity: Omit<GHGActivityRecord, 'created_at' | 'updated_at'>, tenantId?: string): GHGActivityRecord;
    getActivity(id: string, tenantId?: string): GHGActivityRecord | null;
    getBySource(domain: string, transactionId: string, tenantId?: string): GHGActivityRecord | null;
    recordCalculation(calc: GHGCalculationRecord): GHGCalculationRecord;
    getCalculations(ghgActivityId: string): GHGCalculationRecord[];
    registerFactorVersion(version: EmissionFactorVersionRecord): EmissionFactorVersionRecord;
    getFactorVersion(factorId: string, versionTag: string, geography: string): EmissionFactorVersionRecord | null;
}
export declare class GateRepository extends BaseRepository {
    recordGateEvent(event: GateEventRecord, tenantId?: string): GateEventRecord;
    listGateEvents(gateId: string, tenantId?: string): GateEventRecord[];
}
export declare class AuditRepository extends BaseRepository {
    logAudit(log: AuditLogRecord, tenantId?: string): AuditLogRecord;
    getAuditHistory(entityType: string, entityId: string, tenantId?: string): AuditLogRecord[];
    emitDomainEvent(event: DomainEventRecord, tenantId?: string): DomainEventRecord;
}
export declare class MasterDataRepository extends BaseRepository {
    createRecord(record: Record<string, any>, tenantId?: string): any;
    updateRecord(id: string, updates: Record<string, any>, tenantId?: string): any;
    getRecord(id: string, tenantId?: string): any | null;
    getRecordByCode(category: string, code: string, tenantId?: string): any | null;
    listRecords(category?: string, filter?: Record<string, any>, tenantId?: string): any[];
    saveVersion(version: Record<string, any>): any;
    getVersionHistory(recordId: string): any[];
    createCategory(cat: Record<string, any>): any;
    listCategories(): any[];
}
export declare class WorkflowRepository extends BaseRepository {
    createDefinition(def: Record<string, any>, tenantId?: string): any;
    getDefinition(id: string, tenantId?: string): any | null;
    listDefinitions(domain?: string, tenantId?: string): any[];
    createVersion(version: Record<string, any>): any;
    getVersion(versionId: string): any | null;
    listVersions(definitionId: string): any[];
    createInstance(inst: Record<string, any>, tenantId?: string): any;
    getInstance(instanceId: string, tenantId?: string): any | null;
    listInstances(domain?: string, tenantId?: string): any[];
    updateInstance(instanceId: string, updates: Record<string, any>, tenantId?: string): any;
    createTask(task: Record<string, any>): any;
    updateTask(taskId: string, updates: Record<string, any>): any;
    getTask(taskId: string): any | null;
    listTasks(filter: Record<string, any>): any[];
    recordAction(action: Record<string, any>): any;
    recordOutboxEvent(event: Record<string, any>, tenantId?: string): any;
    listPendingOutboxEvents(tenantId?: string): any[];
}
export declare class ApprovalRepository extends BaseRepository {
    createWorkflow(wf: Record<string, any>, tenantId?: string): any;
    createInstance(inst: Record<string, any>, tenantId?: string): any;
    getInstance(instanceId: string, tenantId?: string): any | null;
    recordAction(action: Record<string, any>): any;
    createDelegation(del: Record<string, any>, tenantId?: string): any;
    listDelegations(filter: Record<string, any>, tenantId?: string): any[];
}
export declare class PolicyRepository extends BaseRepository {
    createPolicy(policy: Record<string, any>, tenantId?: string): any;
    getPolicy(policyId: string, tenantId?: string): any | null;
    listPolicies(domain?: string, tenantId?: string): any[];
    createRule(rule: Record<string, any>, tenantId?: string): any;
    listRules(policyId: string, tenantId?: string): any[];
    recordEvaluation(evaluation: Record<string, any>, tenantId?: string): any;
}
