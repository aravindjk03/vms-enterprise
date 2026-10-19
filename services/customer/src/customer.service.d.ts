/**
 * VMS Enterprise: Complete Customer Management Domain Service (Part 7)
 * Implements: Independent Customer Domain, Organization & Person Mapping,
 * Multi-Participant Delegations, Configurable Requirements & Approvals,
 * Embedded Transport & Auto ESG/GHG Capture, Gate Integration, Visit Closure,
 * Activity Correction & Provenance Traceability, and Real Operational Analytics.
 */
import type { RelationalDatabase } from '@vms/database';
import type { CustomerAccount, CustomerRepresentative, CustomerVisitTransaction, CustomerVisitParticipant, CustomerRequirement, CustomerDelegationView, CustomerAnalyticsSummary } from '@vms/types';
import type { CreateCustomerAccountInput, UpdateCustomerAccountInput, CreateCustomerRepresentativeInput, UpdateCustomerRepresentativeInput, CreateCustomerVisitInput, CheckInCustomerParticipantInput, CheckOutCustomerParticipantInput, CloseCustomerVisitInput, RescheduleCustomerVisitInput, CancelCustomerVisitInput, CustomerActivityCorrectionInput, CustomerVisitQuery, CustomerAccountQuery, CustomerRepresentativeQuery, CustomerEPass, CustomerTraceabilityChain } from './types.js';
export declare class CustomerService {
    private db;
    private transportService;
    private ghgEngine;
    private scopeRegistry;
    private refCounter;
    private idempotencyStore;
    constructor(db: RelationalDatabase);
    /**
     * Registers a new customer account linked to a canonical external organization.
     * Performs probable duplicate detection across organization name and registration number.
     */
    createCustomerAccount(input: CreateCustomerAccountInput): Promise<CustomerAccount>;
    /**
     * Updates an existing customer account.
     */
    updateCustomerAccount(customerAccountId: string, input: UpdateCustomerAccountInput): Promise<CustomerAccount>;
    /**
     * Deactivates a customer account. Preserves historical visit transactions.
     */
    deactivateCustomerAccount(tenantId: string, customerAccountId: string, deactivatedBy: string): Promise<CustomerAccount>;
    /**
     * Retrieves customer accounts with search, filtering, and pagination.
     */
    getCustomerAccounts(query: CustomerAccountQuery): {
        items: CustomerAccount[];
        total: number;
    };
    /**
     * Gets a customer account by ID.
     */
    getCustomerAccountById(tenantId: string, customerAccountId: string): Promise<CustomerAccount | null>;
    /**
     * Creates a customer representative linked to a canonical person.
     * Performs person deduplication based on phone, email, or government ID.
     */
    createRepresentative(input: CreateCustomerRepresentativeInput): Promise<CustomerRepresentative>;
    /**
     * Alias for createRepresentative matching test interface.
     */
    createCustomerRepresentative(input: CreateCustomerRepresentativeInput): Promise<CustomerRepresentative>;
    /**
     * Updates an existing representative.
     */
    updateRepresentative(repId: string, input: UpdateCustomerRepresentativeInput): Promise<CustomerRepresentative>;
    /**
     * Retrieves representatives with optional filtering and PII security masking.
     */
    getRepresentatives(query: CustomerRepresentativeQuery, callerRole?: string): {
        items: CustomerRepresentative[];
        total: number;
    };
    /**
     * Alias for getRepresentatives matching test interface.
     * Supports both (query, role) and (tenantId, customerAccountId, role).
     * Returns array accessible via indexing and property.
     */
    listCustomerRepresentatives(arg1: string | CustomerRepresentativeQuery, arg2?: string, arg3?: string): Promise<Array<CustomerRepresentative & {
        phone: string;
    }>>;
    /**
     * Resolves effective requirements applying the strict precedence hierarchy:
     * Mandatory Site Security Rule > Global Default > Customer Account Setting > Visit Type Requirement > Visit Specific Exception.
     * Under no circumstances can a less restrictive account setting override a mandatory site security rule.
     */
    resolveEffectiveRequirements(tenantId: string, siteId: string, customerAccountId: string, visitTypeCode: string, customRequirements?: string[]): CustomerRequirement[];
    /**
     * Creates a customer visit transaction.
     * Supports RESERVED, WALK_IN, DELEGATION, and RECURRING booking modes.
     * Handles idempotency, multiple participants, group transport, and auto ESG capture.
     */
    createCustomerVisit(input: CreateCustomerVisitInput): Promise<CustomerVisitTransaction>;
    /**
     * Approves a customer visit request.
     */
    approveVisit(tenantId: string, visitId: string, approverUserId: string, notes?: string): Promise<CustomerVisitTransaction>;
    /**
     * Approves a customer visit request (matching test wrapper).
     */
    approveCustomerVisit(tenantId: string, transactionId: string, approvedBy: string, notes?: string): Promise<CustomerVisitTransaction>;
    /**
     * Rejects a customer visit request.
     */
    rejectVisit(tenantId: string, visitId: string, approverUserId: string, reason: string): Promise<CustomerVisitTransaction>;
    /**
     * Requests changes on a customer visit request.
     */
    requestChanges(tenantId: string, visitId: string, approverUserId: string, changeDetails: string): Promise<CustomerVisitTransaction>;
    /**
     * Verifies bilateral NDA compliance for a customer visit.
     */
    verifyNda(tenantId: string, visitId: string, verifierUserId: string, documentRef: string): Promise<CustomerVisitTransaction>;
    /**
     * Verifies bilateral NDA compliance for a customer visit (matching test wrapper).
     */
    verifyCustomerNda(tenantId: string, visitId: string, documentRef: string, expiryDate?: string, verifierUserId?: string): Promise<CustomerVisitTransaction>;
    /**
     * Performs participant-level check-in at a security gate.
     * Enforces mandatory NDA and approval requirements.
     */
    /**
     * Performs participant-level check-in at a security gate.
     * Enforces mandatory NDA and approval requirements.
     * Supports both object-based input and positional argument styles.
     */
    checkInParticipant(arg1: CheckInCustomerParticipantInput | string, transactionId?: string, participantId?: string, gateId?: string, operatorUserId?: string): Promise<CustomerVisitParticipant>;
    /**
     * Performs participant-level check-out at a security gate.
     * Supports both object-based input and positional argument styles.
     */
    checkOutParticipant(arg1: CheckOutCustomerParticipantInput | string, transactionId?: string, participantId?: string, gateId?: string, operatorUserId?: string): Promise<CustomerVisitParticipant>;
    /**
     * Performs gate check-in for the full visit or primary transaction.
     * Enforces Bilateral NDA and Approval requirement.
     */
    checkInCustomerVisit(input: {
        tenantId: string;
        transactionId?: string;
        customerVisitId?: string;
        gateId?: string;
        operatorUserId: string;
        notes?: string;
    }): Promise<CustomerVisitTransaction>;
    /**
     * Group check-in for all participants in a customer delegation.
     */
    checkInAll(tenantId: string, siteId: string, customerVisitId: string, operatorUserId: string, gateId?: string): Promise<CustomerVisitParticipant[]>;
    /**
     * Group check-out for all on-premises participants in a customer delegation.
     */
    checkOutAll(tenantId: string, siteId: string, customerVisitId: string, operatorUserId: string, gateId?: string): Promise<CustomerVisitParticipant[]>;
    /**
     * Closes a customer visit transaction.
     * Records closure notes, follow-up flags, actual start/end, and evidence links.
     */
    closeVisit(input: CloseCustomerVisitInput): Promise<CustomerVisitTransaction>;
    /**
     * Formal visit closure with findings report (matching test wrapper).
     */
    closeCustomerVisit(input: CloseCustomerVisitInput | {
        tenantId: string;
        transactionId?: string;
        customerVisitId?: string;
        closedByUserId?: string;
        closedBy?: string;
        notes: string;
        completed?: boolean;
        followUpRequired?: boolean;
        evidenceDocumentRefs?: string[];
    }): Promise<CustomerVisitTransaction>;
    /**
     * Reschedules a customer visit, incrementing version and preserving audit history.
     */
    rescheduleVisit(input: RescheduleCustomerVisitInput): Promise<CustomerVisitTransaction>;
    /**
     * Reschedules a customer visit (matching test wrapper with positional or object arguments).
     */
    rescheduleCustomerVisit(arg1: string | RescheduleCustomerVisitInput, transactionId?: string, newStart?: Date | string, newEnd?: Date | string, updatedBy?: string, reason?: string): Promise<CustomerVisitTransaction>;
    /**
     * Cancels a customer visit with reason logging.
     */
    cancelVisit(input: CancelCustomerVisitInput): Promise<CustomerVisitTransaction>;
    /**
     * Cancels a customer visit (matching test wrapper with positional or object arguments).
     */
    cancelCustomerVisit(arg1: string | CancelCustomerVisitInput, transactionId?: string, cancelledBy?: string, reason?: string): Promise<CustomerVisitTransaction>;
    /**
     * Corrects operational transport activity data.
     * Preserves historical calculations in audit history, updates transport activity,
     * updates source-linked GHG activity, and triggers recalculated emissions.
     */
    correctActivityData(input: CustomerActivityCorrectionInput): Promise<CustomerVisitTransaction>;
    /**
     * Retrieves delegation view for a customer visit transaction.
     */
    getDelegationView(tenantId: string, customerVisitId: string): CustomerDelegationView;
    /**
     * Alias for getDelegationView matching test interface.
     */
    getCustomerDelegationSummary(tenantId: string, transactionId: string): Promise<CustomerDelegationView>;
    /**
     * Issues appointment-linked e-pass with HMAC token.
     * Does NOT expose sensitive customer identity PII in QR payload.
     */
    issueEPass(tenantId: string, customerVisitId: string, participantId?: string): CustomerEPass;
    /**
     * Resolves the full bidirectional provenance chain for a customer visit.
     * Customer Visit -> Transport Activities -> GHG Activities -> GHG Calculations.
     */
    getCustomerActivityTraceability(tenantId: string, customerVisitId: string): CustomerTraceabilityChain;
    /**
     * Retrieves customer visit query list with filtering and pagination.
     */
    getCustomerVisits(query: CustomerVisitQuery): {
        items: CustomerVisitTransaction[];
        total: number;
    };
    /**
     * Derives real operational analytics from persisted database records.
     * Does NOT fabricate emissions totals or artificial metrics.
     */
    getCustomerAnalytics(tenantId: string, siteId?: string): CustomerAnalyticsSummary;
    /**
     * Retrieves effective customer visit requirements for a transaction.
     */
    getCustomerVisitRequirements(tenantId: string, transactionId: string): Promise<CustomerRequirement[]>;
    /**
     * Detects active customer visits past their scheduled departure time.
     */
    getOverstayCustomerVisits(tenantId: string, siteId?: string): Promise<Array<CustomerVisitTransaction & {
        overstayMinutes: number;
    }>>;
    /**
     * Real operational analytics summary derived from persisted database records.
     */
    getCustomerAnalyticsSummary(tenantId: string, siteId?: string): Promise<CustomerAnalyticsSummary>;
    private mapCustomerAccountRecord;
    private mapCustomerRepRecord;
    private mapCustomerVisitRecord;
    private mapParticipantRecord;
    private recordAuditLog;
}
