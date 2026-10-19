/**
 * VMS Enterprise: Strongly Typed Relational Repositories
 * Enforces Tenant Isolation, Foreign Key Integrity, and Transaction Scoping
 */
import { randomUUID } from 'node:crypto';
export class BaseRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    enforceTenant(tenantId) {
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
    getTenant(tenantId) {
        return this.db.findById('tenants', tenantId);
    }
    getSite(siteId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('sites', siteId, tid);
    }
    listSites(tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findMany('sites', { tenant_id: tid }, tid);
    }
    getGate(gateId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('gates', gateId, tid);
    }
    getZone(zoneId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('zones', zoneId, tid);
    }
}
// ----------------------------------------------------------------------------
// 2. Person & Identity Repository (Reusable across all domains)
// ----------------------------------------------------------------------------
export class PersonRepository extends BaseRepository {
    createPerson(person, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('persons', {
            ...person,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getPerson(personId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('persons', personId, tid);
    }
    addContact(contact, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('person_contacts', {
            ...contact,
            tenant_id: tid,
            created_at: new Date(),
        }, tid);
    }
    addAddress(address, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('person_addresses', {
            ...address,
            tenant_id: tid,
            created_at: new Date(),
        }, tid);
    }
    addIdentityDoc(doc, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('person_identity_documents', {
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
    createTransaction(tx, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('visitor_transactions', {
            ...tx,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getTransaction(txId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('visitor_transactions', txId, tid);
    }
    getByReference(referenceNumber, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('visitor_transactions', { reference_number: referenceNumber }, tid);
        return results[0] || null;
    }
}
// ----------------------------------------------------------------------------
// 4. Customer Repository (Independent domain with multiple participants)
// ----------------------------------------------------------------------------
export class CustomerRepository extends BaseRepository {
    createAccount(account, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('customer_accounts', {
            ...account,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    createVisitTransaction(tx, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('customer_visit_transactions', {
            ...tx,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    addParticipant(participant, tenantId) {
        this.enforceTenant(tenantId);
        return this.db.insert('customer_visit_participants', {
            ...participant,
            created_at: new Date(),
        });
    }
    getParticipants(visitId, tenantId) {
        this.enforceTenant(tenantId);
        return this.db.findMany('customer_visit_participants', { customer_visit_id: visitId });
    }
    getVisit(txId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('customer_visit_transactions', txId, tid);
    }
    getVisitByReference(ref, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('customer_visit_transactions', { reference_number: ref }, tid);
        return results[0] || null;
    }
}
// ----------------------------------------------------------------------------
// 5. Contractor Repository (Company -> Contract -> Work Order -> Worker hierarchy)
// ----------------------------------------------------------------------------
export class ContractorRepository extends BaseRepository {
    createCompany(company, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('contractor_companies', {
            ...company,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    createContract(contract, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('contractor_contracts', {
            ...contract,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    createWorkOrder(wo, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('contractor_work_orders', {
            ...wo,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    addWorker(worker, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('contractor_workers', {
            ...worker,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getWorkOrder(woId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('contractor_work_orders', woId, tid);
    }
    getWorkOrderByReference(ref, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('contractor_work_orders', { reference_number: ref }, tid);
        return results[0] || null;
    }
}
// ----------------------------------------------------------------------------
// 6. Service / Work Repository
// ----------------------------------------------------------------------------
export class ServiceRepository extends BaseRepository {
    createProvider(provider, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('service_providers', {
            ...provider,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    createWorkOrder(wo, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('service_work_orders', {
            ...wo,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getWorkOrder(woId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('service_work_orders', woId, tid);
    }
    getWorkOrderByReference(ref, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('service_work_orders', { reference_number: ref }, tid);
        return results[0] || null;
    }
}
// ----------------------------------------------------------------------------
// 7. Material Repository (Multi-Line Items & Return Tracking)
// ----------------------------------------------------------------------------
export class MaterialRepository extends BaseRepository {
    createMaterial(mat, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('materials', {
            ...mat,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    createPurchaseOrder(po, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('purchase_orders', {
            ...po,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    createTransaction(tx, lines, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const createdTx = this.db.insert('material_transactions', {
            ...tx,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
        const createdLines = [];
        for (const line of lines) {
            const insertedLine = this.db.insert('material_transaction_lines', {
                ...line,
                line_id: line.serial_number || randomUUID(),
                material_transaction_id: createdTx.transaction_id,
                created_at: new Date(),
            });
            createdLines.push(insertedLine);
        }
        return { transaction: createdTx, lines: createdLines };
    }
    getTransaction(txId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('material_transactions', txId, tid);
    }
    getTransactionByReference(ref, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('material_transactions', { reference_number: ref }, tid);
        return results[0] || null;
    }
    getLines(txId) {
        return this.db.findMany('material_transaction_lines', { material_transaction_id: txId });
    }
    recordReturn(ret, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('material_returns', {
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
    createActivity(activity, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('transport_activities', {
            ...activity,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getActivity(id, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('transport_activities', id, tid);
    }
    getBySource(domain, transactionId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('transport_activities', {
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
    createDocument(doc, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('documents', {
            ...doc,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    linkDocument(documentId, entityType, entityId, relationshipType, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('document_links', {
            id: randomUUID(),
            document_id: documentId,
            entity_type: entityType,
            entity_id: entityId,
            relationship_type: relationshipType,
            tenant_id: tid,
            linked_at: new Date(),
        }, tid);
    }
    getDocument(docId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('documents', docId, tid);
    }
    getLinksForEntity(entityType, entityId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findMany('document_links', {
            entity_type: entityType,
            entity_id: entityId,
        }, tid);
    }
}
// ----------------------------------------------------------------------------
// 10. ESG / GHG Repository (Normalized Activities, Versioned Factors, Calculations)
// ----------------------------------------------------------------------------
export class GHGRepository extends BaseRepository {
    createActivity(activity, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('ghg_activities', {
            ...activity,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getActivity(id, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('ghg_activities', id, tid);
    }
    getBySource(domain, transactionId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('ghg_activities', {
            source_domain: domain,
            source_transaction_id: transactionId,
        }, tid);
        return results[0] || null;
    }
    recordCalculation(calc) {
        // ghg_calculations is an append-only immutable ledger!
        return this.db.insert('ghg_calculations', calc);
    }
    getCalculations(ghgActivityId) {
        return this.db.findMany('ghg_calculations', { ghg_activity_id: ghgActivityId });
    }
    registerFactorVersion(version) {
        // emission_factor_versions is immutable!
        return this.db.insert('emission_factor_versions', version);
    }
    getFactorVersion(factorId, versionTag, geography) {
        const results = this.db.findMany('emission_factor_versions', {
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
    recordGateEvent(event, tenantId) {
        const tid = this.enforceTenant(tenantId);
        // gate_events is an immutable append-only ledger!
        return this.db.insert('gate_events', {
            ...event,
            tenant_id: tid,
        }, tid);
    }
    listGateEvents(gateId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findMany('gate_events', { gate_id: gateId }, tid);
    }
}
// ----------------------------------------------------------------------------
// 12. Append-Only Audit & Domain Event Repository
// ----------------------------------------------------------------------------
export class AuditRepository extends BaseRepository {
    logAudit(log, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('audit_logs', {
            ...log,
            tenant_id: tid,
        }, tid);
    }
    getAuditHistory(entityType, entityId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findMany('audit_logs', {
            entity_type: entityType,
            entity_id: entityId,
        }, tid);
    }
    emitDomainEvent(event, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('domain_events', {
            ...event,
            tenant_id: tid,
        }, tid);
    }
}
// ----------------------------------------------------------------------------
// 13. Master Data Repository (Centralized & Versioned)
// ----------------------------------------------------------------------------
export class MasterDataRepository extends BaseRepository {
    createRecord(record, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('master_data_records', {
            ...record,
            tenant_id: tid,
            created_at: record.created_at || new Date(),
            updated_at: record.updated_at || new Date(),
        }, tid);
    }
    updateRecord(id, updates, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.update('master_data_records', id, {
            ...updates,
            updated_at: new Date(),
        }, tid);
    }
    getRecord(id, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('master_data_records', id, tid);
    }
    getRecordByCode(category, code, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const results = this.db.findMany('master_data_records', { category, code }, tid);
        return results[0] || null;
    }
    listRecords(category, filter, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const criteria = { ...(filter || {}) };
        if (category)
            criteria.category = category;
        return this.db.findMany('master_data_records', criteria, tid);
    }
    saveVersion(version) {
        return this.db.insert('master_data_versions', {
            ...version,
            changed_at: version.changed_at || new Date(),
        });
    }
    getVersionHistory(recordId) {
        return this.db.findMany('master_data_versions', { record_id: recordId });
    }
    createCategory(cat) {
        return this.db.insert('master_data_categories', {
            ...cat,
            created_at: new Date(),
        });
    }
    listCategories() {
        return this.db.findMany('master_data_categories', {});
    }
}
// ----------------------------------------------------------------------------
// 14. Workflow Engine Repository
// ----------------------------------------------------------------------------
export class WorkflowRepository extends BaseRepository {
    createDefinition(def, tenantId) {
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
    getDefinition(id, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('workflow_definitions', id, tid);
    }
    listDefinitions(domain, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const all = this.db.findMany('workflow_definitions', {}, tid);
        if (!domain)
            return all;
        return all.filter((d) => d.domain === domain || d.target_domain === domain);
    }
    createVersion(version) {
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
    getVersion(versionId) {
        return this.db.findById('workflow_versions', versionId);
    }
    listVersions(definitionId) {
        const all = this.db.findMany('workflow_versions', {});
        return all.filter((v) => v.definition_id === definitionId || v.definitionId === definitionId);
    }
    createInstance(inst, tenantId) {
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
    getInstance(instanceId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const row = this.db.findById('workflow_instances', instanceId, tid);
        if (!row)
            return null;
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
    listInstances(domain, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const all = this.db.findMany('workflow_instances', {}, tid);
        if (!domain)
            return all;
        return all.filter((i) => i.domain === domain || i.source_domain === domain || i.sourceDomain === domain);
    }
    updateInstance(instanceId, updates, tenantId) {
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
    createTask(task) {
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
    updateTask(taskId, updates) {
        return this.db.update('workflow_tasks', taskId, updates);
    }
    getTask(taskId) {
        return this.db.findById('workflow_tasks', taskId);
    }
    listTasks(filter) {
        const all = this.db.findMany('workflow_tasks', {});
        if (!filter || Object.keys(filter).length === 0)
            return all;
        return all.filter((t) => {
            return Object.entries(filter).every(([k, v]) => {
                if (v === undefined)
                    return true;
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
    recordAction(action) {
        const actionId = action.action_id || action.actionId || randomUUID();
        return this.db.insert('workflow_actions', {
            ...action,
            action_id: actionId,
            actionId: actionId,
            action_timestamp: new Date(),
        });
    }
    recordOutboxEvent(event, tenantId) {
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
    listPendingOutboxEvents(tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findMany('workflow_outbox_events', { status: 'PENDING' }, tid);
    }
}
// ----------------------------------------------------------------------------
// 15. Approval Engine Repository
// ----------------------------------------------------------------------------
export class ApprovalRepository extends BaseRepository {
    createWorkflow(wf, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('approval_workflows', {
            ...wf,
            tenant_id: tid,
            created_at: new Date(),
        }, tid);
    }
    createInstance(inst, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('approval_instances', {
            ...inst,
            tenant_id: tid,
            requested_at: new Date(),
            created_at: new Date(),
        }, tid);
    }
    getInstance(instanceId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('approval_instances', instanceId, tid);
    }
    recordAction(action) {
        const actionId = action.action_id || action.actionId || randomUUID();
        return this.db.insert('approval_actions', {
            ...action,
            action_id: actionId,
            actionId: actionId,
            decision_timestamp: new Date(),
        });
    }
    createDelegation(del, tenantId) {
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
    listDelegations(filter, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const all = this.db.findMany('approval_delegations', {}, tid);
        if (!filter || Object.keys(filter).length === 0)
            return all;
        return all.filter((d) => {
            return Object.entries(filter).every(([k, v]) => {
                if (v === undefined)
                    return true;
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
    createPolicy(policy, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('policy_definitions', {
            ...policy,
            tenant_id: tid,
            created_at: new Date(),
            updated_at: new Date(),
        }, tid);
    }
    getPolicy(policyId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findById('policy_definitions', policyId, tid);
    }
    listPolicies(domain, tenantId) {
        const tid = this.enforceTenant(tenantId);
        const criteria = {};
        if (domain)
            criteria.domain = domain;
        return this.db.findMany('policy_definitions', criteria, tid);
    }
    createRule(rule, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('policy_rules', {
            ...rule,
            tenant_id: tid,
            created_at: new Date(),
        }, tid);
    }
    listRules(policyId, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.findMany('policy_rules', { policy_id: policyId }, tid);
    }
    recordEvaluation(evaluation, tenantId) {
        const tid = this.enforceTenant(tenantId);
        return this.db.insert('policy_evaluation_records', {
            ...evaluation,
            tenant_id: tid,
            evaluated_at: new Date(),
        }, tid);
    }
}
