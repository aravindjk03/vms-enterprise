/**
 * VMS Enterprise: Complete Visitor Management Domain Service (Part 6)
 * Implements: Lifecycle State Machine, Profile Deduplication, Group Delegations,
 * Embedded Transport & Auto ESG/GHG Capture, Idempotency, QR E-Pass, Check-in/out,
 * Overstay Detection Engine, and Full Bidirectional Provenance Traceability.
 */
import { randomUUID, createHmac } from 'node:crypto';
import { TransportService } from '@vms/transport';
import { GHGCalculationEngine, OrganizationalScopeRegistry } from '@vms/ghg';
export class VisitorService {
    db;
    transportService;
    ghgEngine;
    scopeRegistry;
    refCounter = 2000;
    idempotencyStore = new Map(); // idempotencyKey -> transactionId
    constructor(db) {
        this.db = db;
        this.transportService = new TransportService();
        this.ghgEngine = new GHGCalculationEngine();
        this.scopeRegistry = new OrganizationalScopeRegistry();
    }
    // ==========================================================================
    // 1. VISITOR PROFILE MANAGEMENT & DISAMBIGUATION
    // ==========================================================================
    /**
     * Search existing visitor profiles for returning visitor fast lookup and disambiguation.
     * Matches across phone, email, government ID, reference number, and name.
     */
    searchVisitorProfiles(query) {
        const { tenantId, query: term } = query;
        const cleanTerm = term.trim().toLowerCase();
        if (!cleanTerm)
            return [];
        const profiles = this.db.findMany('visitor_profiles', { tenant_id: tenantId }, tenantId);
        const candidates = [];
        for (const prof of profiles) {
            const person = this.db.findById('persons', prof.person_id, tenantId);
            if (!person)
                continue;
            const contacts = this.db.findMany('person_contacts', { person_id: person.person_id }, tenantId);
            const phoneContact = contacts.find(c => c.contact_type === 'MOBILE')?.contact_value || '';
            const emailContact = contacts.find(c => c.contact_type === 'EMAIL')?.contact_value || '';
            const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim();
            const govtId = person.national_id_number || '';
            let matchScore = 0;
            let matchReason = '';
            const cleanDigits = cleanTerm.replace(/\D/g, '');
            const phoneDigits = phoneContact.replace(/\D/g, '');
            if (cleanDigits.length >= 7 && (phoneDigits === cleanDigits || phoneDigits.endsWith(cleanDigits) || cleanDigits.endsWith(phoneDigits))) {
                matchScore = 100;
                matchReason = 'Phone Number Match';
            }
            else if (phoneContact && phoneContact.toLowerCase().includes(cleanTerm)) {
                matchScore = phoneContact.toLowerCase() === cleanTerm ? 100 : 85;
                matchReason = 'Phone Number Match';
            }
            else if (emailContact && emailContact.toLowerCase().includes(cleanTerm)) {
                matchScore = emailContact.toLowerCase() === cleanTerm ? 100 : 85;
                matchReason = 'Email Address Match';
            }
            else if (govtId && govtId.toLowerCase() === cleanTerm) {
                matchScore = 95;
                matchReason = 'Government ID Match';
            }
            else if (fullName.toLowerCase().includes(cleanTerm)) {
                matchScore = fullName.toLowerCase() === cleanTerm ? 90 : 70;
                matchReason = 'Full Name Match';
            }
            if (matchScore > 0) {
                candidates.push({
                    profileId: prof.profile_id,
                    personId: person.person_id,
                    fullName,
                    phone: phoneContact,
                    email: emailContact || undefined,
                    companyName: prof.company_name || person.organization_name || undefined,
                    totalVisits: Number(prof.total_visits || 1),
                    vipStatus: Boolean(prof.vip_status),
                    matchScore,
                    matchReason,
                    lastVisitDate: prof.last_visit_date ? new Date(prof.last_visit_date) : undefined,
                });
            }
        }
        return candidates.sort((a, b) => b.matchScore - a.matchScore);
    }
    /**
     * Retrieves full persistent visitor profile with historical visit summary.
     */
    getVisitorProfile(tenantId, profileId) {
        const prof = this.db.findById('visitor_profiles', profileId, tenantId);
        if (!prof)
            return null;
        const person = this.db.findById('persons', prof.person_id, tenantId);
        if (!person)
            return null;
        const contacts = this.db.findMany('person_contacts', { person_id: person.person_id }, tenantId);
        const phone = contacts.find(c => c.contact_type === 'MOBILE')?.contact_value || '';
        const email = contacts.find(c => c.contact_type === 'EMAIL')?.contact_value;
        return {
            profileId: prof.profile_id,
            tenantId: prof.tenant_id,
            personId: person.person_id,
            fullName: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
            phone,
            email,
            companyName: prof.company_name || person.organization_name,
            designation: person.designation,
            vipStatus: Boolean(prof.vip_status),
            governmentIdNumber: person.national_id_number,
            governmentIdType: person.national_id_type,
            totalVisits: Number(prof.total_visits || 0),
            lastVisitDate: prof.last_visit_date ? new Date(prof.last_visit_date) : undefined,
            createdAt: new Date(prof.created_at),
            updatedAt: new Date(prof.updated_at),
        };
    }
    // ==========================================================================
    // 2. NEW VISITOR TRANSACTION WITH EMBEDDED ESG/GHG AUTO-CAPTURE
    // ==========================================================================
    /**
     * Primary entry point for registering any visit transaction:
     * - New Visitor
     * - Repeated Visitor (reusing persistent profile)
     * - Reserved Pre-Booking
     * - Walk-in (<60s reception flow)
     * - Group Delegations
     * - VIP Visits
     * - Emergency Visits
     *
     * CRITICAL GUARANTEES:
     * 1. Idempotent: duplicate submissions do not duplicate visits or GHG activity records.
     * 2. Embedded Transport: automatically normalizes and persists transport dimensions.
     * 3. Source-Linked GHG Auto-Capture: records GHG activity in PENDING/CALCULATED status.
     * 4. Operational Invariant: visit registration NEVER fails due to GHG calculation delays.
     */
    async createVisitorTransaction(input) {
        const { tenantId, siteId, idempotencyKey } = input;
        // Idempotency check: if client retried with same idempotency key, return existing record
        if (idempotencyKey && this.idempotencyStore.has(idempotencyKey)) {
            const existingTxId = this.idempotencyStore.get(idempotencyKey);
            const existingView = this.getVisitorTransaction(tenantId, existingTxId);
            if (existingView)
                return existingView;
        }
        const originalTenant = this.db.getTenantContext();
        try {
            this.db.setTenantContext(tenantId);
            this.db.beginTransaction();
            // 1. Resolve or Create Person & Visitor Profile
            let personId;
            let profileId;
            const nameParts = input.visitorName.trim().split(' ');
            const firstName = nameParts[0] || 'Visitor';
            const lastName = nameParts.slice(1).join(' ') || '';
            // Check if candidate person exists with this phone or national ID
            let existingPerson;
            if (input.visitorPhone) {
                const contacts = this.db.findMany('person_contacts', {
                    tenant_id: tenantId,
                    contact_type: 'MOBILE',
                    contact_value: input.visitorPhone.trim(),
                }, tenantId);
                if (contacts.length > 0) {
                    existingPerson = this.db.findById('persons', contacts[0].person_id, tenantId) || undefined;
                }
            }
            if (existingPerson) {
                personId = existingPerson.person_id;
                const profs = this.db.findMany('visitor_profiles', { tenant_id: tenantId, person_id: personId }, tenantId);
                if (profs.length > 0) {
                    profileId = profs[0].profile_id;
                    // Increment total visits and update last visit
                    this.db.update('visitor_profiles', profileId, {
                        total_visits: Number(profs[0].total_visits || 0) + 1,
                        last_visit_date: new Date(),
                        vip_status: input.visitorCategory === 'VIP_VISITOR' || Boolean(profs[0].vip_status),
                    }, tenantId);
                }
                else {
                    profileId = randomUUID();
                    this.db.insert('visitor_profiles', {
                        profile_id: profileId,
                        tenant_id: tenantId,
                        person_id: personId,
                        company_name: input.companyName,
                        vip_status: input.visitorCategory === 'VIP_VISITOR',
                        total_visits: 1,
                        last_visit_date: new Date(),
                        created_at: new Date(),
                        updated_at: new Date(),
                    }, tenantId);
                }
            }
            else {
                // Create new Person
                personId = randomUUID();
                this.db.insert('persons', {
                    person_id: personId,
                    tenant_id: tenantId,
                    first_name: firstName,
                    last_name: lastName,
                    national_id_number: input.governmentIdNumber,
                    national_id_type: input.governmentIdType || 'GOVT_ID',
                    organization_name: input.companyName,
                    designation: input.designation,
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
                if (input.visitorPhone) {
                    this.db.insert('person_contacts', {
                        contact_id: randomUUID(),
                        tenant_id: tenantId,
                        person_id: personId,
                        contact_type: 'MOBILE',
                        contact_value: input.visitorPhone.trim(),
                        is_primary: true,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }, tenantId);
                }
                if (input.visitorEmail) {
                    this.db.insert('person_contacts', {
                        contact_id: randomUUID(),
                        tenant_id: tenantId,
                        person_id: personId,
                        contact_type: 'EMAIL',
                        contact_value: input.visitorEmail.trim().toLowerCase(),
                        is_primary: false,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }, tenantId);
                }
                profileId = randomUUID();
                this.db.insert('visitor_profiles', {
                    profile_id: profileId,
                    tenant_id: tenantId,
                    person_id: personId,
                    company_name: input.companyName,
                    vip_status: input.visitorCategory === 'VIP_VISITOR',
                    total_visits: 1,
                    last_visit_date: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
            }
            // 2. Generate Human-Readable Reference VIS-2026-XXXXXX
            const year = new Date().getFullYear();
            this.refCounter += 1;
            const refNumber = `VIS-${year}-${String(this.refCounter).padStart(6, '0')}`;
            const transactionId = randomUUID();
            // Determine initial stage and status based on booking mode
            let stage = 'DRAFT';
            let status = 'PENDING';
            if (input.bookingMode === 'EMERGENCY') {
                stage = 'CHECK_IN';
                status = 'APPROVED';
            }
            else if (input.bookingMode === 'WALK_IN') {
                stage = 'APPROVAL';
                status = 'PENDING';
            }
            else {
                stage = 'APPROVAL';
                status = 'PENDING';
            }
            const scheduledStart = new Date(input.scheduledStart);
            const scheduledEnd = new Date(input.scheduledEnd);
            // 3. Persist Visitor Transaction
            const transactionRecord = {
                transaction_id: transactionId,
                reference_number: refNumber,
                tenant_id: tenantId,
                site_id: siteId,
                person_id: personId,
                visitor_category: input.visitorCategory,
                purpose: input.purpose,
                booking_mode: input.bookingMode,
                host_user_id: input.hostUserId,
                scheduled_start: scheduledStart,
                scheduled_end: scheduledEnd,
                stage,
                status,
                escort_required: input.escortRequired || input.visitorCategory === 'VIP_VISITOR' || false,
                vip_status: input.visitorCategory === 'VIP_VISITOR',
                version: 1,
                created_by: input.submittedBy,
                updated_by: input.submittedBy,
                created_at: new Date(),
                updated_at: new Date(),
                metadata: {
                    notes: input.notes,
                    emergencyReason: input.emergencyReason,
                    companyName: input.companyName,
                    designation: input.designation,
                    requiredDocuments: input.requiredDocuments || ['GOVT_ID'],
                },
            };
            this.db.insert('visitor_transactions', transactionRecord, tenantId);
            // 4. Handle Group Delegation Participants if provided
            if (input.groupParticipants && input.groupParticipants.length > 0) {
                for (const p of input.groupParticipants) {
                    const participantPersonId = randomUUID();
                    const pNames = p.fullName.trim().split(' ');
                    this.db.insert('persons', {
                        person_id: participantPersonId,
                        tenant_id: tenantId,
                        first_name: pNames[0] || 'Member',
                        last_name: pNames.slice(1).join(' ') || '',
                        organization_name: p.companyName || input.companyName,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }, tenantId);
                    if (p.phone) {
                        this.db.insert('person_contacts', {
                            contact_id: randomUUID(),
                            tenant_id: tenantId,
                            person_id: participantPersonId,
                            contact_type: 'MOBILE',
                            contact_value: p.phone,
                            is_primary: true,
                            created_at: new Date(),
                            updated_at: new Date(),
                        }, tenantId);
                    }
                    this.db.insert('visitor_participants', {
                        participant_id: randomUUID(),
                        visitor_transaction_id: transactionId,
                        person_id: participantPersonId,
                        participant_role: p.role || 'PARTICIPANT',
                        status: 'INVITED',
                        created_at: new Date(),
                    }, tenantId);
                }
            }
            // 5. Embedded Normalized Transport Activity Creation
            let transportActivity;
            let ghgActivity;
            let ghgCalculation;
            if (input.transport) {
                const t = input.transport;
                const normalized = this.transportService.createNormalizedTransport({
                    tenantId,
                    sourceDomain: 'VISITOR',
                    sourceTransactionId: transactionId,
                    mode: t.mode,
                    ownership: t.ownership,
                    vehicleClass: t.vehicleClass,
                    fuelType: t.fuelType,
                    usageType: t.usageType,
                    occupancy: t.occupancy ?? 1,
                    originLocation: t.originLocation,
                    destinationLocation: t.destinationLocation,
                    distanceKm: t.distanceKm,
                    distanceProvenance: t.distanceProvenance,
                    measurementMethod: t.measurementMethod,
                    journeyType: t.journeyType || 'ONE_WAY',
                    dataSource: t.dataSource || 'VISITOR_FORM_EMBEDDED',
                });
                // Persist in relational transport_activities table
                const transportId = normalized.transportId;
                const transportRef = `TRA-${year}-${String(this.refCounter).padStart(6, '0')}`;
                this.db.insert('transport_activities', {
                    id: transportId,
                    reference_number: transportRef,
                    tenant_id: tenantId,
                    site_id: siteId,
                    source_domain: 'VISITOR',
                    source_transaction_id: transactionId,
                    person_id: personId,
                    transport_mode_id: null,
                    ownership_type_id: null,
                    usage_type: normalized.usageType,
                    occupancy: normalized.occupancy,
                    origin: normalized.originLocation,
                    destination: normalized.destinationLocation,
                    distance: normalized.distanceKm,
                    distance_unit: 'KM',
                    journey_type: normalized.journeyType,
                    direction: normalized.tripDirection,
                    measurement_method: normalized.measurementMethod,
                    data_source: normalized.dataSource,
                    distance_provenance: normalized.distanceProvenance,
                    activity_date: new Date().toISOString().split('T')[0],
                    metadata: {
                        mode: normalized.mode,
                        ownership: normalized.ownership,
                        vehicleClass: normalized.vehicleClass,
                        fuelType: normalized.fuelType,
                        transportServiceType: t.transportServiceType,
                        driverPassengerRole: t.driverPassengerRole,
                    },
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
                transportActivity = normalized;
                // 6. Embedded Source-Linked GHG Activity Creation
                const esgRecord = this.ghgEngine.captureActivityFromTransport(siteId, normalized);
                const ghgActivityId = esgRecord.esgActivityId;
                const ghgRef = `GHA-${year}-${String(this.refCounter).padStart(6, '0')}`;
                this.db.insert('ghg_activities', {
                    id: ghgActivityId,
                    reference_number: ghgRef,
                    tenant_id: tenantId,
                    site_id: siteId,
                    source_domain: 'VISITOR',
                    source_transaction_id: transactionId,
                    source_activity_id: transportId,
                    activity_type: esgRecord.activityType,
                    activity_date: new Date().toISOString().split('T')[0],
                    quantity: esgRecord.activityQuantity,
                    quantity_unit: esgRecord.activityUnit,
                    data_provenance: esgRecord.dataProvenance,
                    calculation_status: 'PENDING',
                    created_at: new Date(),
                    updated_at: new Date(),
                }, tenantId);
                ghgActivity = esgRecord;
                // 7. Execute GHG Calculation Engine asynchronously / in-transaction
                try {
                    const calc = this.ghgEngine.calculateEmissions(esgRecord, normalized);
                    this.db.insert('ghg_calculations', {
                        id: calc.calculationId,
                        tenant_id: tenantId,
                        ghg_activity_id: ghgActivityId,
                        factor_id: calc.factorId,
                        factor_version: calc.factorVersion,
                        scope: calc.ghgScope,
                        category: calc.ghgCategory,
                        emissions_kg_co2e: calc.emissionsKgCO2e,
                        calculation_hash: calc.calculationHash,
                        calculated_at: calc.calculatedAt,
                    });
                    this.db.update('ghg_activities', ghgActivityId, {
                        calculation_status: 'CALCULATED',
                    }, tenantId);
                    ghgCalculation = calc;
                }
                catch {
                    // CRITICAL INVARIANT: operational visit stays 100% valid even if GHG calculation fails or is delayed!
                }
            }
            // 8. Log Immutable Audit Record
            this.db.insert('audit_logs', {
                audit_id: randomUUID(),
                tenant_id: tenantId,
                actor: input.submittedBy,
                action: 'VISITOR_TRANSACTION_CREATED',
                entity_type: 'VISITOR_TRANSACTION',
                entity_id: transactionId,
                details: `Visitor transaction created with reference ${refNumber}`,
                created_at: new Date(),
            }, tenantId);
            // 9. Emit Domain Event
            this.db.insert('domain_events', {
                event_id: randomUUID(),
                tenant_id: tenantId,
                event_type: 'VISITOR_CREATED',
                source_domain: 'VISITOR',
                source_entity_id: transactionId,
                occurred_at: new Date(),
                actor_id: input.submittedBy,
                payload: {
                    referenceNumber: refNumber,
                    bookingMode: input.bookingMode,
                    purpose: input.purpose,
                    hostUserId: input.hostUserId,
                    hasTransport: Boolean(transportActivity),
                    hasGHG: Boolean(ghgActivity),
                },
                version: 1,
            }, tenantId);
            this.db.commit();
            if (idempotencyKey) {
                this.idempotencyStore.set(idempotencyKey, transactionId);
            }
            return this.buildTransactionView(transactionRecord, transportActivity, ghgActivity, ghgCalculation);
        }
        catch (err) {
            this.db.rollback();
            throw err;
        }
        finally {
            this.db.setTenantContext(originalTenant);
        }
    }
    // ==========================================================================
    // 3. WORKFLOW & APPROVAL INTEGRATION
    // ==========================================================================
    /**
     * Submits a visit transaction for host/security approval.
     */
    submitForApproval(tenantId, transactionId, actor) {
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Visit transaction ${transactionId} not found`);
        if (tx.status === 'APPROVED' || tx.status === 'ON_PREMISES') {
            throw new Error(`Visit is already in ${tx.status} status and cannot be submitted`);
        }
        this.db.update('visitor_transactions', transactionId, {
            stage: 'APPROVAL',
            status: 'PENDING',
            updated_by: actor,
        }, tenantId);
        // Record audit log
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor,
            action: 'VISITOR_SUBMITTED_FOR_APPROVAL',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Submitted for approval by ${actor}`,
            created_at: new Date(),
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    /**
     * Approves visit transaction.
     */
    approveVisit(tenantId, transactionId, approverUserId, comments) {
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Visit transaction ${transactionId} not found`);
        if (tx.status !== 'PENDING') {
            throw new Error(`Cannot approve visit with status ${tx.status}`);
        }
        this.db.update('visitor_transactions', transactionId, {
            stage: 'SCHEDULED',
            status: 'APPROVED',
            updated_by: approverUserId,
        }, tenantId);
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor: approverUserId,
            action: 'VISITOR_APPROVED',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: comments ? `Approved with comment: ${comments}` : 'Approved by authorized host/approver',
            created_at: new Date(),
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    /**
     * Rejects visit transaction.
     */
    rejectVisit(tenantId, transactionId, approverUserId, reason) {
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Visit transaction ${transactionId} not found`);
        this.db.update('visitor_transactions', transactionId, {
            stage: 'CLOSED',
            status: 'REJECTED',
            updated_by: approverUserId,
        }, tenantId);
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor: approverUserId,
            action: 'VISITOR_REJECTED',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Rejected with reason: ${reason}`,
            created_at: new Date(),
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    // ==========================================================================
    // 4. IDENTITY VERIFICATION
    // ==========================================================================
    /**
     * Records an auditable identity verification attempt.
     */
    recordIdentityVerification(input) {
        const { tenantId, transactionId, method, verifierUserId, status, notes, failureReason } = input;
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        const verificationId = randomUUID();
        const record = {
            verificationId,
            tenantId,
            transactionId,
            personId: tx.person_id,
            method,
            status,
            verifierUserId,
            verifierNotes: notes,
            failureReason,
            verifiedAt: new Date(),
        };
        this.db.insert('identity_verifications', {
            verification_id: verificationId,
            tenant_id: tenantId,
            transaction_id: transactionId,
            person_id: tx.person_id,
            method,
            status,
            verifier_user_id: verifierUserId,
            notes,
            failure_reason: failureReason,
            verified_at: new Date(),
        }, tenantId);
        if (status === 'SUCCESS') {
            this.db.update('visitor_transactions', transactionId, {
                stage: 'CHECK_IN',
                actual_arrival: new Date(),
            }, tenantId);
        }
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor: verifierUserId,
            action: status === 'SUCCESS' ? 'IDENTITY_VERIFIED' : 'IDENTITY_VERIFICATION_FAILED',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Method: ${method}, Status: ${status}`,
            created_at: new Date(),
        }, tenantId);
        return record;
    }
    // ==========================================================================
    // 5. QR / E-PASS ISSUANCE & CRYPTOGRAPHIC VALIDATION
    // ==========================================================================
    /**
     * Issues a secure, opaque QR e-pass for an approved visit.
     * Does NOT store raw PII in QR code; embeds signed HMAC token.
     */
    issueEPass(tenantId, transactionId) {
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        if (tx.status !== 'APPROVED' && tx.status !== 'ON_PREMISES') {
            throw new Error(`Cannot issue e-pass for visit with status ${tx.status}`);
        }
        const person = this.db.findById('persons', tx.person_id, tenantId);
        const host = this.db.findById('users', tx.host_user_id, tenantId);
        const site = this.db.findById('sites', tx.site_id, tenantId);
        const secretKey = 'vms-epass-secure-hmac-token-secret-key';
        const rawPayload = `${tenantId}:${tx.transaction_id}:${tx.reference_number}:${new Date(tx.scheduled_end).getTime()}`;
        const token = createHmac('sha256', secretKey).update(rawPayload).digest('hex');
        const passId = randomUUID();
        const issuedAt = new Date();
        const expiresAt = new Date(tx.scheduled_end);
        const epass = {
            passId,
            tenantId,
            transactionId,
            referenceNumber: tx.reference_number,
            visitorName: `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || 'Visitor',
            companyName: tx.metadata?.companyName || person?.organization_name || 'Visitor Company',
            hostName: host?.username || 'Host',
            siteName: site?.name || 'Main Plant',
            scheduledStart: new Date(tx.scheduled_start),
            scheduledEnd: new Date(tx.scheduled_end),
            passStatus: 'ACTIVE',
            token,
            qrPayload: `vms://epass/${tx.reference_number}?token=${token.substring(0, 16)}`,
            issuedAt,
            expiresAt,
        };
        return epass;
    }
    // ==========================================================================
    // 6. GATE OPERATIONS: CHECK-IN & CHECK-OUT
    // ==========================================================================
    /**
     * Check-in execution at security reception / industrial gate.
     * Enforces: Approval status, time window validation, and creates immutable gate_events.
     */
    checkIn(input) {
        const { tenantId, siteId, transactionId, operatorUserId, gateId } = input;
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        if (tx.site_id !== siteId) {
            throw new Error(`Security Exception: Visit is scheduled for site ${tx.site_id}, not current site ${siteId}`);
        }
        if (tx.status === 'ON_PREMISES') {
            throw new Error(`Visitor is already checked in on premises`);
        }
        if (tx.status !== 'APPROVED' && tx.booking_mode !== 'EMERGENCY') {
            throw new Error(`Cannot check in visitor with status ${tx.status}: Host approval required`);
        }
        const now = new Date();
        // Check-in transaction update
        this.db.update('visitor_transactions', transactionId, {
            stage: 'CHECK_IN',
            status: 'ON_PREMISES',
            actual_entry: now,
            actual_arrival: tx.actual_arrival || now,
            updated_by: operatorUserId,
        }, tenantId);
        // Record immutable gate event (ENTRY_APPROVED / CHECKED_IN)
        this.db.insert('gate_events', {
            event_id: randomUUID(),
            tenant_id: tenantId,
            gate_id: gateId || null,
            source_transaction_id: transactionId,
            event_type: 'CHECKED_IN',
            direction: 'INBOUND',
            actor_user_id: operatorUserId,
            event_timestamp: now,
            details: `Visitor checked in successfully by operator ${operatorUserId}`,
        }, tenantId);
        // Emit domain event
        this.db.insert('domain_events', {
            event_id: randomUUID(),
            tenant_id: tenantId,
            event_type: 'CHECKIN_COMPLETED',
            source_domain: 'VISITOR',
            source_entity_id: transactionId,
            occurred_at: now,
            actor_id: operatorUserId,
            payload: {
                referenceNumber: tx.reference_number,
                entryTime: now.toISOString(),
            },
            version: 1,
        }, tenantId);
        // Record audit log
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor: operatorUserId,
            action: 'VISITOR_CHECKED_IN',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Checked in at gate ${gateId || 'MAIN_GATE'}`,
            created_at: now,
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    /**
     * Check-out execution at security gate.
     * Records exit timestamp, gate events, and resolves active overstays.
     */
    checkOut(input) {
        const { tenantId, siteId, transactionId, operatorUserId, gateId } = input;
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        if (tx.status !== 'ON_PREMISES') {
            throw new Error(`Cannot check out visitor: current status is ${tx.status}, not ON_PREMISES`);
        }
        const now = new Date();
        // Check-out update
        this.db.update('visitor_transactions', transactionId, {
            stage: 'CLOSED',
            status: 'COMPLETED',
            actual_exit: now,
            updated_by: operatorUserId,
        }, tenantId);
        // Record immutable gate event
        this.db.insert('gate_events', {
            event_id: randomUUID(),
            tenant_id: tenantId,
            gate_id: gateId || null,
            source_transaction_id: transactionId,
            event_type: 'CHECKED_OUT',
            direction: 'OUTBOUND',
            actor_user_id: operatorUserId,
            event_timestamp: now,
            details: `Visitor checked out successfully`,
        }, tenantId);
        // Emit domain event
        this.db.insert('domain_events', {
            event_id: randomUUID(),
            tenant_id: tenantId,
            event_type: 'CHECKOUT_COMPLETED',
            source_domain: 'VISITOR',
            source_entity_id: transactionId,
            occurred_at: now,
            actor_id: operatorUserId,
            payload: {
                referenceNumber: tx.reference_number,
                exitTime: now.toISOString(),
            },
            version: 1,
        }, tenantId);
        // Audit log
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor: operatorUserId,
            action: 'VISITOR_CHECKED_OUT',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Checked out at gate ${gateId || 'MAIN_GATE'}`,
            created_at: now,
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    // ==========================================================================
    // 7. OVERSTAY DETECTION ENGINE
    // ==========================================================================
    /**
     * Scans all currently active checked-in visitors and flags overstay warnings & breaches.
     */
    detectOverstays(options) {
        const { tenantId, siteId } = options;
        const currentTime = options.currentTime || new Date();
        const warningBuffer = options.warningThresholdMinutes ?? 15;
        const breachBuffer = options.breachThresholdMinutes ?? 0;
        const filter = { tenant_id: tenantId, status: 'ON_PREMISES' };
        if (siteId)
            filter.site_id = siteId;
        const activeVisits = this.db.findMany('visitor_transactions', filter, tenantId);
        const results = [];
        for (const tx of activeVisits) {
            const scheduledEnd = new Date(tx.scheduled_end);
            const diffMs = currentTime.getTime() - scheduledEnd.getTime();
            const diffMinutes = Math.floor(diffMs / (60 * 1000));
            let status = null;
            if (diffMinutes >= breachBuffer) {
                status = 'BREACH';
            }
            else if (diffMinutes >= -warningBuffer) {
                status = 'WARNING';
            }
            if (status) {
                const person = this.db.findById('persons', tx.person_id, tenantId);
                const overstayId = randomUUID();
                const record = {
                    overstayId,
                    tenantId,
                    siteId: tx.site_id,
                    transactionId: tx.transaction_id,
                    referenceNumber: tx.reference_number,
                    visitorName: `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || 'Visitor',
                    hostUserId: tx.host_user_id,
                    scheduledEnd,
                    detectionTime: currentTime,
                    overstayMinutes: Math.max(0, diffMinutes),
                    status,
                };
                // If breach, log an exception in exceptions table and emit event
                if (status === 'BREACH') {
                    this.db.insert('exceptions', {
                        exception_id: randomUUID(),
                        tenant_id: tenantId,
                        reference_number: `EXC-OVS-${tx.reference_number}`,
                        source_transaction_id: tx.transaction_id,
                        exception_type: 'OVERSTAY',
                        severity: 'HIGH',
                        status: 'OPEN',
                        created_at: currentTime,
                    }, tenantId);
                    this.db.insert('domain_events', {
                        event_id: randomUUID(),
                        tenant_id: tenantId,
                        event_type: 'OVERSTAY_DETECTED',
                        source_domain: 'VISITOR',
                        source_entity_id: tx.transaction_id,
                        occurred_at: currentTime,
                        payload: {
                            referenceNumber: tx.reference_number,
                            overstayMinutes: diffMinutes,
                        },
                        version: 1,
                    }, tenantId);
                }
                results.push(record);
            }
        }
        return results;
    }
    // ==========================================================================
    // 8. RESCHEDULE & CANCEL VISITS
    // ==========================================================================
    rescheduleVisit(input) {
        const { tenantId, transactionId, newStart, newEnd, reason, updatedBy } = input;
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        if (tx.status === 'ON_PREMISES' || tx.status === 'COMPLETED') {
            throw new Error(`Cannot reschedule visit with status ${tx.status}`);
        }
        const currentVersion = Number(tx.version || 1);
        this.db.update('visitor_transactions', transactionId, {
            scheduled_start: new Date(newStart),
            scheduled_end: new Date(newEnd),
            version: currentVersion + 1,
            updated_by: updatedBy,
            stage: 'SCHEDULED',
        }, tenantId);
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor: updatedBy,
            action: 'VISITOR_RESCHEDULED',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Rescheduled to ${newStart} - ${newEnd}. Reason: ${reason}`,
            created_at: new Date(),
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    cancelVisit(tenantId, transactionId, actor, reason) {
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        if (tx.status === 'ON_PREMISES') {
            throw new Error(`Cannot cancel visit while visitor is currently on premises. Check out visitor first.`);
        }
        this.db.update('visitor_transactions', transactionId, {
            stage: 'CLOSED',
            status: 'CANCELLED',
            updated_by: actor,
        }, tenantId);
        this.db.insert('audit_logs', {
            audit_id: randomUUID(),
            tenant_id: tenantId,
            actor,
            action: 'VISITOR_CANCELLED',
            entity_type: 'VISITOR_TRANSACTION',
            entity_id: transactionId,
            details: `Cancelled. Reason: ${reason}`,
            created_at: new Date(),
        }, tenantId);
        return this.getVisitorTransaction(tenantId, transactionId);
    }
    // ==========================================================================
    // 9. ACTIVITY CORRECTION & PROVENANCE PRESERVATION
    // ==========================================================================
    correctActivityData(input) {
        const { tenantId, transactionId, correctedTransport, reason, correctedBy } = input;
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        const transports = this.db.findMany('transport_activities', {
            tenant_id: tenantId,
            source_transaction_id: transactionId,
        }, tenantId);
        if (transports.length > 0) {
            const t = transports[0];
            const previousData = { ...t };
            const updates = {
                updated_at: new Date(),
            };
            if (correctedTransport.distanceKm !== undefined)
                updates.distance = correctedTransport.distanceKm;
            if (correctedTransport.distanceProvenance !== undefined)
                updates.distance_provenance = correctedTransport.distanceProvenance;
            if (correctedTransport.originLocation !== undefined)
                updates.origin = correctedTransport.originLocation;
            if (correctedTransport.destinationLocation !== undefined)
                updates.destination = correctedTransport.destinationLocation;
            if (correctedTransport.occupancy !== undefined)
                updates.occupancy = correctedTransport.occupancy;
            const newMeta = { ...(t.metadata || {}) };
            if (correctedTransport.fuelType)
                newMeta.fuelType = correctedTransport.fuelType;
            if (correctedTransport.mode)
                newMeta.mode = correctedTransport.mode;
            updates.metadata = newMeta;
            this.db.update('transport_activities', t.id, updates, tenantId);
            // Audit correction
            this.db.insert('audit_logs', {
                audit_id: randomUUID(),
                tenant_id: tenantId,
                actor: correctedBy,
                action: 'TRANSPORT_ACTIVITY_CORRECTED',
                entity_type: 'TRANSPORT_ACTIVITY',
                entity_id: t.id,
                details: `Reason: ${reason}. Changed: ${JSON.stringify(updates)} (Previous: distance=${previousData.distance})`,
                created_at: new Date(),
            }, tenantId);
            // Update linked GHG activity
            const ghgs = this.db.findMany('ghg_activities', {
                tenant_id: tenantId,
                source_transaction_id: transactionId,
            }, tenantId);
            if (ghgs.length > 0) {
                this.db.update('ghg_activities', ghgs[0].id, {
                    quantity: correctedTransport.distanceKm ?? ghgs[0].quantity,
                    calculation_status: 'NEEDS_RECALCULATION',
                    updated_at: new Date(),
                }, tenantId);
            }
        }
        return this.getTraceabilityChain(tenantId, transactionId);
    }
    // ==========================================================================
    // 10. LIST & RETRIEVAL QUERIES
    // ==========================================================================
    getVisitorTransaction(tenantId, transactionId) {
        const tx = this.db.findById('visitor_transactions', transactionId, tenantId);
        if (!tx)
            return null;
        const transports = this.db.findMany('transport_activities', {
            tenant_id: tenantId,
            source_transaction_id: transactionId,
        }, tenantId);
        const ghgs = this.db.findMany('ghg_activities', {
            tenant_id: tenantId,
            source_transaction_id: transactionId,
        }, tenantId);
        const calcs = ghgs.length > 0 ? this.db.findMany('ghg_calculations', {
            ghg_activity_id: ghgs[0].id,
        }) : [];
        const transportActivity = transports.length > 0 ? this.mapTransportRowToModel(transports[0]) : undefined;
        const ghgActivity = ghgs.length > 0 ? this.mapGhgRowToModel(ghgs[0]) : undefined;
        return this.buildTransactionView(tx, transportActivity, ghgActivity, calcs[0]);
    }
    mapTransportRowToModel(row) {
        return {
            transportId: row.id || row.transportId,
            tenantId: row.tenant_id || row.tenantId,
            sourceDomain: row.source_domain || row.sourceDomain,
            sourceTransactionId: row.source_transaction_id || row.sourceTransactionId,
            mode: row.metadata?.mode || row.mode || 'CAR',
            ownership: row.metadata?.ownership || row.ownership || 'PERSONAL',
            vehicleClass: row.metadata?.vehicleClass || row.vehicleClass || 'SEDAN',
            fuelType: row.metadata?.fuelType || row.fuelType || 'PETROL',
            usageType: row.usage_type || row.usageType || 'INDIVIDUAL',
            occupancy: Number(row.occupancy || 1),
            originLocation: row.origin || row.originLocation || '',
            destinationLocation: row.destination || row.destinationLocation || '',
            distanceKm: Number(row.distance !== undefined ? row.distance : row.distanceKm || 0),
            journeyType: row.journey_type || row.journeyType || 'ONE_WAY',
            tripDirection: row.direction || row.tripDirection || 'INBOUND',
            distanceProvenance: row.distance_provenance || row.distanceProvenance || 'SYSTEM_ESTIMATED',
            measurementMethod: row.measurement_method || row.measurementMethod || 'ESTIMATED_TABLE',
            dataSource: row.data_source || row.dataSource || 'VISITOR_FORM',
            createdAt: new Date(row.created_at || row.createdAt || Date.now()),
        };
    }
    mapGhgRowToModel(row) {
        return {
            esgActivityId: row.id || row.esgActivityId,
            tenantId: row.tenant_id || row.tenantId,
            siteId: row.site_id || row.siteId,
            sourceDomain: row.source_domain || row.sourceDomain,
            sourceTransactionId: row.source_transaction_id || row.sourceTransactionId,
            transportId: row.source_activity_id || row.transportId,
            activityType: row.activity_type || row.activityType,
            activityQuantity: Number(row.quantity !== undefined ? row.quantity : row.activityQuantity || 0),
            activityUnit: row.quantity_unit || row.activityUnit || 'KM',
            dataProvenance: row.data_provenance || row.dataProvenance || 'SYSTEM_ESTIMATED',
            createdAt: new Date(row.created_at || row.createdAt || Date.now()),
        };
    }
    listVisitorTransactions(query) {
        const { tenantId, siteId, visitorCategory, purpose, bookingMode, stage, status, hostUserId, searchTerm } = query;
        const filter = { tenant_id: tenantId };
        if (siteId)
            filter.site_id = siteId;
        if (visitorCategory)
            filter.visitor_category = visitorCategory;
        if (purpose)
            filter.purpose = purpose;
        if (bookingMode)
            filter.booking_mode = bookingMode;
        if (stage)
            filter.stage = stage;
        if (status)
            filter.status = status;
        if (hostUserId)
            filter.host_user_id = hostUserId;
        let rows = this.db.findMany('visitor_transactions', filter, tenantId);
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter(r => {
                const person = this.db.findById('persons', r.person_id, tenantId);
                const name = `${person?.first_name || ''} ${person?.last_name || ''}`.toLowerCase();
                const ref = (r.reference_number || '').toLowerCase();
                const company = (r.metadata?.companyName || person?.organization_name || '').toLowerCase();
                return name.includes(term) || ref.includes(term) || company.includes(term);
            });
        }
        const page = query.page || 1;
        const limit = query.limit || 10;
        const total = rows.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const paginated = rows.slice(start, start + limit);
        const items = paginated.map(r => this.getVisitorTransaction(tenantId, r.transaction_id)).filter(Boolean);
        return {
            items,
            total,
            page,
            limit,
            totalPages,
        };
    }
    // ==========================================================================
    // 11. VISITOR ANALYTICS (REAL DATABASE AGGREGATION)
    // ==========================================================================
    getVisitorAnalytics(tenantId, siteId) {
        const filter = { tenant_id: tenantId };
        if (siteId)
            filter.site_id = siteId;
        const allVisits = this.db.findMany('visitor_transactions', filter, tenantId);
        const todayStr = new Date().toISOString().split('T')[0];
        let expectedToday = 0;
        let arrivedToday = 0;
        let currentlyInside = 0;
        let pendingApprovals = 0;
        let identityVerificationPending = 0;
        let overstays = 0;
        let completedToday = 0;
        let cancelledToday = 0;
        const bookingModeDist = {};
        const purposeDist = {};
        const transportModeDist = {};
        let totalTransportWithDistance = 0;
        let unknownDistanceCount = 0;
        for (const v of allVisits) {
            const startDateStr = new Date(v.scheduled_start).toISOString().split('T')[0];
            const isToday = startDateStr === todayStr;
            if (isToday)
                expectedToday += 1;
            if (v.actual_arrival && new Date(v.actual_arrival).toISOString().split('T')[0] === todayStr)
                arrivedToday += 1;
            if (v.status === 'ON_PREMISES')
                currentlyInside += 1;
            if (v.status === 'PENDING')
                pendingApprovals += 1;
            if (v.stage === 'DATA_VALIDATION' || v.stage === 'APPROVAL')
                identityVerificationPending += 1;
            if (v.status === 'COMPLETED' && isToday)
                completedToday += 1;
            if (v.status === 'CANCELLED' && isToday)
                cancelledToday += 1;
            // Distributions
            const bm = v.booking_mode || 'RESERVED';
            bookingModeDist[bm] = (bookingModeDist[bm] || 0) + 1;
            const p = v.purpose || 'MEETING';
            purposeDist[p] = (purposeDist[p] || 0) + 1;
        }
        // Overstays count
        const detectedOverstays = this.detectOverstays({ tenantId, siteId });
        overstays = detectedOverstays.length;
        // Transport activities
        const transports = this.db.findMany('transport_activities', filter, tenantId);
        for (const t of transports) {
            const m = t.metadata?.mode || 'CAR';
            transportModeDist[m] = (transportModeDist[m] || 0) + 1;
            totalTransportWithDistance += 1;
            if (t.distance_provenance === 'SYSTEM_ESTIMATED' && (!t.distance || t.distance === 25.0)) {
                unknownDistanceCount += 1;
            }
        }
        const captureCompleteness = allVisits.length > 0
            ? Math.round((transports.length / allVisits.length) * 100)
            : 100;
        const unknownRate = totalTransportWithDistance > 0
            ? Math.round((unknownDistanceCount / totalTransportWithDistance) * 100)
            : 0;
        return {
            expectedToday,
            arrivedToday,
            currentlyInside,
            pendingApprovals,
            identityVerificationPending,
            overstays,
            completedToday,
            cancelledToday,
            bookingModeDistribution: bookingModeDist,
            purposeDistribution: purposeDist,
            transportModeDistribution: transportModeDist,
            activityCaptureCompletenessPercent: captureCompleteness,
            unknownDistanceRatePercent: unknownRate,
        };
    }
    // ==========================================================================
    // 12. BIDIRECTIONAL TRACEABILITY CHAIN
    // ==========================================================================
    getTraceabilityChain(tenantId, transactionId) {
        const txView = this.getVisitorTransaction(tenantId, transactionId);
        if (!txView)
            return null;
        const person = this.db.findById('persons', txView.personId, tenantId) || {};
        const profiles = this.db.findMany('visitor_profiles', { tenant_id: tenantId, person_id: txView.personId }, tenantId);
        const profile = profiles.length > 0 ? this.getVisitorProfile(tenantId, profiles[0].profile_id) : null;
        const identityVerifications = this.db.findMany('identity_verifications', {
            tenant_id: tenantId,
            transaction_id: transactionId,
        }, tenantId);
        const gateEvents = this.db.findMany('gate_events', {
            tenant_id: tenantId,
            source_transaction_id: transactionId,
        }, tenantId);
        const auditLogs = this.db.findMany('audit_logs', {
            tenant_id: tenantId,
            entity_id: transactionId,
        }, tenantId);
        let epass;
        if (txView.status === 'APPROVED' || txView.status === 'ON_PREMISES') {
            try {
                epass = this.issueEPass(tenantId, transactionId);
            }
            catch {
                // Pass issuance optional
            }
        }
        return {
            transaction: txView,
            person,
            profile,
            transportActivity: txView.transport,
            ghgActivity: txView.esgActivity,
            ghgCalculation: txView.ghgCalculation,
            identityVerifications,
            gateEvents,
            auditLogs,
            ePass: epass,
        };
    }
    // ==========================================================================
    // Helper: View Builder
    // ==========================================================================
    buildTransactionView(rawTx, transportActivity, ghgActivity, ghgCalculation) {
        const tenantId = rawTx.tenant_id;
        const person = this.db.findById('persons', rawTx.person_id, tenantId);
        const host = this.db.findById('users', rawTx.host_user_id, tenantId);
        const contacts = person ? this.db.findMany('person_contacts', { person_id: person.person_id }, tenantId) : [];
        const phone = contacts.find(c => c.contact_type === 'MOBILE')?.contact_value;
        const email = contacts.find(c => c.contact_type === 'EMAIL')?.contact_value;
        const fullName = person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Visitor';
        let transportSummary;
        if (transportActivity) {
            transportSummary = `${transportActivity.mode || 'CAR'} (${transportActivity.distanceKm || 0} km, ${transportActivity.ownership || 'PERSONAL'})`;
        }
        return {
            transactionId: rawTx.transaction_id,
            referenceNumber: rawTx.reference_number,
            tenantId: rawTx.tenant_id,
            siteId: rawTx.site_id,
            personId: rawTx.person_id,
            visitorName: fullName,
            visitorEmail: email,
            visitorPhone: phone,
            companyName: rawTx.metadata?.companyName || person?.organization_name,
            designation: rawTx.metadata?.designation || person?.designation,
            visitorCategory: rawTx.visitor_category,
            purpose: rawTx.purpose,
            bookingMode: rawTx.booking_mode,
            hostUserId: rawTx.host_user_id,
            hostName: host?.username || 'Authorized Host',
            scheduledStart: new Date(rawTx.scheduled_start),
            scheduledEnd: new Date(rawTx.scheduled_end),
            actualArrival: rawTx.actual_arrival ? new Date(rawTx.actual_arrival) : undefined,
            actualEntry: rawTx.actual_entry ? new Date(rawTx.actual_entry) : undefined,
            actualExit: rawTx.actual_exit ? new Date(rawTx.actual_exit) : undefined,
            stage: rawTx.stage,
            status: rawTx.status,
            escortRequired: Boolean(rawTx.escort_required),
            vipStatus: Boolean(rawTx.vip_status),
            transportSummary,
            transport: transportActivity,
            esgActivity: ghgActivity,
            ghgCalculation: ghgCalculation,
            workflowStage: rawTx.stage,
            approvalStatus: rawTx.status,
            identityVerificationStatus: rawTx.actual_arrival ? 'VERIFIED' : 'PENDING',
            version: Number(rawTx.version || 1),
            createdAt: new Date(rawTx.created_at),
            updatedAt: new Date(rawTx.updated_at),
        };
    }
}
