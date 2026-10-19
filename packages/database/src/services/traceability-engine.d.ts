/**
 * VMS Enterprise: Bidirectional Source-to-GHG Traceability Engine
 * Full Programmatic Provenance Chain Resolver:
 * Resolves: GHG Result -> GHG Activity -> Transport Activity -> Source Transaction -> Source Domain -> Operational Data
 * Covers all 6 independent business pipelines: Visitor, Customer, Contractor, Service, Material, Vehicle
 */
import type { RelationalDatabase } from '../in-memory-db.js';
import type { SourceDomain, TenantRecord, OrganizationRecord, SiteRecord, PersonRecord, TransportActivityRecord, GHGActivityRecord, GHGCalculationRecord, EmissionFactorVersionRecord, DocumentRecord, MaterialTransactionLineRecord, MaterialReturnRecord, PurchaseOrderRecord, CustomerVisitParticipantRecord, CustomerAccountRecord, ContractorCompanyRecord, ContractorContractRecord, ContractorWorkerRecord, ServiceProviderRecord, AuditLogRecord, DomainEventRecord } from '../types.js';
export interface ProvenanceChain {
    ghgCalculation?: GHGCalculationRecord | null;
    emissionFactorVersion?: EmissionFactorVersionRecord | null;
    ghgActivity: GHGActivityRecord;
    transportActivity?: TransportActivityRecord | null;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    sourceTransaction: Record<string, any>;
    person?: PersonRecord | null;
    site?: SiteRecord | null;
    organization?: OrganizationRecord | null;
    tenant?: TenantRecord | null;
    documents: DocumentRecord[];
    materialLines?: MaterialTransactionLineRecord[];
    materialReturns?: MaterialReturnRecord[];
    purchaseOrder?: PurchaseOrderRecord | null;
    customerParticipants?: CustomerVisitParticipantRecord[];
    customerAccount?: CustomerAccountRecord | null;
    contractorCompany?: ContractorCompanyRecord | null;
    contractorContract?: ContractorContractRecord | null;
    contractorWorkers?: ContractorWorkerRecord[];
    serviceProvider?: ServiceProviderRecord | null;
    auditHistory?: AuditLogRecord[];
    domainEvents?: DomainEventRecord[];
    provenanceProof: string;
}
export interface ProvenanceVerificationResult {
    valid: boolean;
    reasons: string[];
    chain?: ProvenanceChain;
}
export declare class TraceabilityEngine {
    private db;
    constructor(db: RelationalDatabase);
    /**
     * Resolves the full provenance chain starting from a GHG Activity Record ID
     */
    traceFromGHGActivity(ghgActivityId: string, tenantId?: string): ProvenanceChain;
    /**
     * Resolves the full provenance chain starting from an immutable GHG Calculation ID
     */
    traceFromGHGCalculation(calculationId: string, tenantId?: string): ProvenanceChain;
    /**
     * Resolves all provenance chains starting from a source operational transaction
     */
    traceFromSourceTransaction(domain: SourceDomain, transactionId: string, tenantId?: string): ProvenanceChain[];
    /**
     * Verifies the strict cryptographic and structural integrity of a provenance chain
     */
    verifyProvenanceIntegrity(ghgActivityId: string, tenantId?: string): ProvenanceVerificationResult;
    private buildProvenanceChain;
    private resolveDomainEntities;
}
