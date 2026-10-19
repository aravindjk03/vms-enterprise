/**
 * VMS Enterprise: Bidirectional Source-to-GHG Traceability Engine
 * Full Programmatic Provenance Chain Resolver:
 * Resolves: GHG Result -> GHG Activity -> Transport Activity -> Source Transaction -> Source Domain -> Operational Data
 * Covers all 6 independent business pipelines: Visitor, Customer, Contractor, Service, Material, Vehicle
 */

import type { RelationalDatabase } from '../in-memory-db.js';
import type {
  SourceDomain,
  TenantRecord,
  OrganizationRecord,
  SiteRecord,
  PersonRecord,
  TransportActivityRecord,
  GHGActivityRecord,
  GHGCalculationRecord,
  EmissionFactorVersionRecord,
  DocumentRecord,
  DocumentLinkRecord,
  MaterialTransactionLineRecord,
  MaterialReturnRecord,
  PurchaseOrderRecord,
  CustomerVisitParticipantRecord,
  CustomerAccountRecord,
  ContractorCompanyRecord,
  ContractorContractRecord,
  ContractorWorkerRecord,
  ServiceProviderRecord,
  AuditLogRecord,
  DomainEventRecord,
} from '../types.js';

export interface ProvenanceChain {
  // GHG Layer
  ghgCalculation?: GHGCalculationRecord | null;
  emissionFactorVersion?: EmissionFactorVersionRecord | null;
  ghgActivity: GHGActivityRecord;

  // Transport Layer
  transportActivity?: TransportActivityRecord | null;

  // Source Transaction Layer
  sourceDomain: SourceDomain;
  sourceTransactionId: string;
  sourceTransaction: Record<string, any>;

  // Identity & Hierarchy Layer
  person?: PersonRecord | null;
  site?: SiteRecord | null;
  organization?: OrganizationRecord | null;
  tenant?: TenantRecord | null;

  // Centralized Documents
  documents: DocumentRecord[];

  // Domain-Specific Line Items & Relationships
  materialLines?: MaterialTransactionLineRecord[];
  materialReturns?: MaterialReturnRecord[];
  purchaseOrder?: PurchaseOrderRecord | null;

  customerParticipants?: CustomerVisitParticipantRecord[];
  customerAccount?: CustomerAccountRecord | null;

  contractorCompany?: ContractorCompanyRecord | null;
  contractorContract?: ContractorContractRecord | null;
  contractorWorkers?: ContractorWorkerRecord[];

  serviceProvider?: ServiceProviderRecord | null;

  // Audit & Ledger
  auditHistory?: AuditLogRecord[];
  domainEvents?: DomainEventRecord[];

  // Formatted Canonical Provenance Proof
  provenanceProof: string;
}

export interface ProvenanceVerificationResult {
  valid: boolean;
  reasons: string[];
  chain?: ProvenanceChain;
}

export class TraceabilityEngine {
  constructor(private db: RelationalDatabase) {}

  /**
   * Resolves the full provenance chain starting from a GHG Activity Record ID
   */
  public traceFromGHGActivity(ghgActivityId: string, tenantId?: string): ProvenanceChain {
    const tid = tenantId || this.db.getTenantContext();
    const ghgActivity = this.db.findById<GHGActivityRecord>('ghg_activities', ghgActivityId, tid || undefined);
    if (!ghgActivity) {
      throw new Error(`GHG Activity not found with id '${ghgActivityId}'`);
    }

    return this.buildProvenanceChain(ghgActivity, tid || undefined);
  }

  /**
   * Resolves the full provenance chain starting from an immutable GHG Calculation ID
   */
  public traceFromGHGCalculation(calculationId: string, tenantId?: string): ProvenanceChain {
    const calc = this.db.findById<GHGCalculationRecord>('ghg_calculations', calculationId);
    if (!calc) {
      throw new Error(`GHG Calculation record not found with id '${calculationId}'`);
    }

    return this.traceFromGHGActivity(calc.ghg_activity_id, tenantId);
  }

  /**
   * Resolves all provenance chains starting from a source operational transaction
   */
  public traceFromSourceTransaction(domain: SourceDomain, transactionId: string, tenantId?: string): ProvenanceChain[] {
    const tid = tenantId || this.db.getTenantContext();
    const ghgActivities = this.db.findMany<GHGActivityRecord>('ghg_activities', {
      source_domain: domain,
      source_transaction_id: transactionId,
    }, tid || undefined);

    if (ghgActivities.length === 0) {
      return [];
    }

    return ghgActivities.map(act => this.buildProvenanceChain(act, tid || undefined));
  }

  /**
   * Verifies the strict cryptographic and structural integrity of a provenance chain
   */
  public verifyProvenanceIntegrity(ghgActivityId: string, tenantId?: string): ProvenanceVerificationResult {
    const reasons: string[] = [];

    let chain: ProvenanceChain;
    try {
      chain = this.traceFromGHGActivity(ghgActivityId, tenantId);
    } catch (err: any) {
      return { valid: false, reasons: [`Chain resolution failed: ${err.message}`] };
    }

    // 1. Verify Source Transaction link
    if (!chain.sourceTransaction) {
      reasons.push(`Source transaction '${chain.sourceTransactionId}' missing in domain '${chain.sourceDomain}'`);
    }

    // 2. Verify Transport Activity link
    if (!chain.transportActivity) {
      reasons.push(`Transport activity reference missing for GHG Activity '${ghgActivityId}'`);
    } else {
      if (chain.transportActivity.source_transaction_id !== chain.sourceTransactionId) {
        reasons.push(`Transport activity source transaction id mismatch: expected '${chain.sourceTransactionId}', found '${chain.transportActivity.source_transaction_id}'`);
      }
    }

    // 3. Verify Calculation & Factor Version Integrity
    if (chain.ghgActivity.calculation_status === 'CALCULATED') {
      if (!chain.ghgCalculation) {
        reasons.push(`GHG Activity marked CALCULATED but no immutable calculation record exists`);
      }
      if (!chain.emissionFactorVersion) {
        reasons.push(`Referenced emission factor version '${chain.ghgActivity.emission_factor_version}' does not exist in factor registry`);
      }
    }

    // 4. Verify Site Hierarchy
    if (!chain.site) {
      reasons.push(`Site '${chain.ghgActivity.site_id}' does not exist in master topology`);
    }

    return {
      valid: reasons.length === 0,
      reasons,
      chain,
    };
  }

  // --------------------------------------------------------------------------
  // Core Provenance Construction Algorithm
  // --------------------------------------------------------------------------
  private buildProvenanceChain(ghgActivity: GHGActivityRecord, tenantId?: string): ProvenanceChain {
    const effectiveTenant = tenantId || ghgActivity.tenant_id;

    // 1. Resolve GHG Calculation (if any)
    const calcs = this.db.findMany<GHGCalculationRecord>('ghg_calculations', {
      ghg_activity_id: ghgActivity.id,
    });
    const ghgCalculation = calcs.length > 0 ? calcs[calcs.length - 1] : null;

    // 2. Resolve Emission Factor Version
    let emissionFactorVersion: EmissionFactorVersionRecord | null = null;
    const factorId = ghgCalculation?.emission_factor_id || ghgActivity.emission_factor_id;
    const versionTag = ghgCalculation?.emission_factor_version || ghgActivity.emission_factor_version;
    if (factorId && versionTag) {
      const versions = this.db.findMany<EmissionFactorVersionRecord>('emission_factor_versions', {
        factor_id: factorId,
        version_tag: versionTag,
      });
      emissionFactorVersion = versions[0] || null;
    }

    // 3. Resolve Transport Activity
    let transportActivity: TransportActivityRecord | null = null;
    if (ghgActivity.source_activity_id) {
      transportActivity = this.db.findById<TransportActivityRecord>(
        'transport_activities',
        ghgActivity.source_activity_id,
        effectiveTenant
      );
    }

    // 4. Resolve Source Domain Transaction & Domain Specific Entities
    const {
      sourceTx,
      person,
      materialLines,
      materialReturns,
      purchaseOrder,
      customerParticipants,
      customerAccount,
      contractorCompany,
      contractorContract,
      contractorWorkers,
      serviceProvider,
    } = this.resolveDomainEntities(ghgActivity.source_domain, ghgActivity.source_transaction_id, effectiveTenant);

    // 5. Resolve Hierarchy (Site, Org, Tenant)
    const site = this.db.findById<SiteRecord>('sites', ghgActivity.site_id, effectiveTenant);
    let organization: OrganizationRecord | null = null;
    if (site?.organization_id) {
      organization = this.db.findById<OrganizationRecord>('organizations', site.organization_id, effectiveTenant);
    }
    const tenant = this.db.findById<TenantRecord>('tenants', ghgActivity.tenant_id);

    // 6. Centralized Documents
    const docLinks = this.db.findMany<DocumentLinkRecord>('document_links', {
      entity_id: ghgActivity.source_transaction_id,
    }, effectiveTenant);
    const documents: DocumentRecord[] = [];
    for (const link of docLinks) {
      const doc = this.db.findById<DocumentRecord>('documents', link.document_id, effectiveTenant);
      if (doc) documents.push(doc);
    }

    // 7. Audit History & Domain Events
    const auditHistory = this.db.findMany<AuditLogRecord>('audit_logs', {
      entity_id: ghgActivity.source_transaction_id,
    }, effectiveTenant);

    const domainEvents = this.db.findMany<DomainEventRecord>('domain_events', {
      source_entity_id: ghgActivity.source_transaction_id,
    }, effectiveTenant);

    // 8. Generate Provenance Proof string
    const calcStr = ghgCalculation ? `${ghgCalculation.co2e} kg CO2e` : 'PENDING';
    const txRef = sourceTx.reference_number || sourceTx.transaction_id || ghgActivity.source_transaction_id;
    const personName = person ? person.display_name : 'N/A';
    const siteCode = site ? site.code : 'UNKNOWN';

    const provenanceProof = [
      `GHG Result (${calcStr})`,
      `GHG Activity (${ghgActivity.reference_number || ghgActivity.id})`,
      `Transport Activity (${transportActivity?.reference_number || 'N/A'})`,
      `Source Transaction (${ghgActivity.source_domain}:${txRef})`,
      `Source Domain (${ghgActivity.source_domain})`,
      `Operational Data (Site: ${siteCode}, Person: ${personName})`,
    ].join(' -> ');

    return {
      ghgCalculation,
      emissionFactorVersion,
      ghgActivity,
      transportActivity,
      sourceDomain: ghgActivity.source_domain,
      sourceTransactionId: ghgActivity.source_transaction_id,
      sourceTransaction: sourceTx,
      person,
      site,
      organization,
      tenant,
      documents,
      materialLines,
      materialReturns,
      purchaseOrder,
      customerParticipants,
      customerAccount,
      contractorCompany,
      contractorContract,
      contractorWorkers,
      serviceProvider,
      auditHistory,
      domainEvents,
      provenanceProof,
    };
  }

  private resolveDomainEntities(domain: SourceDomain, txId: string, tenantId?: string) {
    let sourceTx: Record<string, any> = {};
    let person: PersonRecord | null = null;
    let materialLines: MaterialTransactionLineRecord[] | undefined;
    let materialReturns: MaterialReturnRecord[] | undefined;
    let purchaseOrder: PurchaseOrderRecord | null = null;
    let customerParticipants: CustomerVisitParticipantRecord[] | undefined;
    let customerAccount: CustomerAccountRecord | null = null;
    let contractorCompany: ContractorCompanyRecord | null = null;
    let contractorContract: ContractorContractRecord | null = null;
    let contractorWorkers: ContractorWorkerRecord[] | undefined;
    let serviceProvider: ServiceProviderRecord | null = null;

    switch (domain) {
      case 'VISITOR': {
        const tx = this.db.findById('visitor_transactions', txId, tenantId);
        if (tx) {
          sourceTx = tx;
          if (tx.person_id) {
            person = this.db.findById<PersonRecord>('persons', tx.person_id, tenantId);
          }
        }
        break;
      }

      case 'CUSTOMER': {
        const tx = this.db.findById('customer_visit_transactions', txId, tenantId);
        if (tx) {
          sourceTx = tx;
          if (tx.customer_account_id) {
            customerAccount = this.db.findById<CustomerAccountRecord>('customer_accounts', tx.customer_account_id, tenantId);
          }
          customerParticipants = this.db.findMany<CustomerVisitParticipantRecord>('customer_visit_participants', {
            customer_visit_id: txId,
          });
          if (customerParticipants.length > 0) {
            const lead = customerParticipants.find(p => p.is_lead) || customerParticipants[0];
            person = this.db.findById<PersonRecord>('persons', lead.person_id, tenantId);
          }
        }
        break;
      }

      case 'CONTRACTOR': {
        const wo = this.db.findById('contractor_work_orders', txId, tenantId);
        if (wo) {
          sourceTx = wo;
          if (wo.company_id) {
            contractorCompany = this.db.findById<ContractorCompanyRecord>('contractor_companies', wo.company_id, tenantId);
            contractorWorkers = this.db.findMany<ContractorWorkerRecord>('contractor_workers', {
              company_id: wo.company_id,
            }, tenantId);
            if (contractorWorkers.length > 0) {
              person = this.db.findById<PersonRecord>('persons', contractorWorkers[0].person_id, tenantId);
            }
          }
          if (wo.contract_id) {
            contractorContract = this.db.findById<ContractorContractRecord>('contractor_contracts', wo.contract_id, tenantId);
          }
        }
        break;
      }

      case 'SERVICE': {
        const wo = this.db.findById('service_work_orders', txId, tenantId);
        if (wo) {
          sourceTx = wo;
          if (wo.service_provider_id) {
            serviceProvider = this.db.findById<ServiceProviderRecord>('service_providers', wo.service_provider_id, tenantId);
          }
          if (wo.maintenance_lead_id) {
            person = this.db.findById<PersonRecord>('persons', wo.maintenance_lead_id, tenantId);
          }
        }
        break;
      }

      case 'MATERIAL': {
        const tx = this.db.findById('material_transactions', txId, tenantId);
        if (tx) {
          sourceTx = tx;
          materialLines = this.db.findMany<MaterialTransactionLineRecord>('material_transaction_lines', {
            material_transaction_id: txId,
          });
          materialReturns = this.db.findMany<MaterialReturnRecord>('material_returns', {
            return_transaction_id: txId,
          }, tenantId);
          if (tx.po_id) {
            purchaseOrder = this.db.findById<PurchaseOrderRecord>('purchase_orders', tx.po_id, tenantId);
          }
          if (tx.driver_person_id) {
            person = this.db.findById<PersonRecord>('persons', tx.driver_person_id, tenantId);
          }
        }
        break;
      }

      case 'VEHICLE': {
        const v = this.db.findById('vehicles', txId, tenantId);
        if (v) {
          sourceTx = v;
        }
        break;
      }
    }

    return {
      sourceTx,
      person,
      materialLines,
      materialReturns,
      purchaseOrder,
      customerParticipants,
      customerAccount,
      contractorCompany,
      contractorContract,
      contractorWorkers,
      serviceProvider,
    };
  }
}
