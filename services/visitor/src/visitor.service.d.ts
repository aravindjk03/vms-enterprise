/**
 * VMS Enterprise: Complete Visitor Management Domain Service (Part 6)
 * Implements: Lifecycle State Machine, Profile Deduplication, Group Delegations,
 * Embedded Transport & Auto ESG/GHG Capture, Idempotency, QR E-Pass, Check-in/out,
 * Overstay Detection Engine, and Full Bidirectional Provenance Traceability.
 */
import type { RelationalDatabase } from '@vms/database';
import type { VisitorProfile, VisitorEPass, OverstayRecord, VisitorAnalyticsSummary, IdentityVerificationRecord } from '@vms/types';
import type { CreateVisitorInput, SearchVisitorQuery, ProfileMatchCandidate, CheckInInput, CheckOutInput, RescheduleVisitInput, IdentityVerificationInput, ActivityCorrectionInput, OverstayDetectionOptions, VisitorListQuery, VisitorListResult, VisitorTransactionView, VisitorTraceabilityChain } from './types.js';
export declare class VisitorService {
    private db;
    private transportService;
    private ghgEngine;
    private scopeRegistry;
    private refCounter;
    private idempotencyStore;
    constructor(db: RelationalDatabase);
    /**
     * Search existing visitor profiles for returning visitor fast lookup and disambiguation.
     * Matches across phone, email, government ID, reference number, and name.
     */
    searchVisitorProfiles(query: SearchVisitorQuery): ProfileMatchCandidate[];
    /**
     * Retrieves full persistent visitor profile with historical visit summary.
     */
    getVisitorProfile(tenantId: string, profileId: string): VisitorProfile | null;
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
    createVisitorTransaction(input: CreateVisitorInput): Promise<VisitorTransactionView>;
    /**
     * Submits a visit transaction for host/security approval.
     */
    submitForApproval(tenantId: string, transactionId: string, actor: string): VisitorTransactionView;
    /**
     * Approves visit transaction.
     */
    approveVisit(tenantId: string, transactionId: string, approverUserId: string, comments?: string): VisitorTransactionView;
    /**
     * Rejects visit transaction.
     */
    rejectVisit(tenantId: string, transactionId: string, approverUserId: string, reason: string): VisitorTransactionView;
    /**
     * Records an auditable identity verification attempt.
     */
    recordIdentityVerification(input: IdentityVerificationInput): IdentityVerificationRecord;
    /**
     * Issues a secure, opaque QR e-pass for an approved visit.
     * Does NOT store raw PII in QR code; embeds signed HMAC token.
     */
    issueEPass(tenantId: string, transactionId: string): VisitorEPass;
    /**
     * Check-in execution at security reception / industrial gate.
     * Enforces: Approval status, time window validation, and creates immutable gate_events.
     */
    checkIn(input: CheckInInput): VisitorTransactionView;
    /**
     * Check-out execution at security gate.
     * Records exit timestamp, gate events, and resolves active overstays.
     */
    checkOut(input: CheckOutInput): VisitorTransactionView;
    /**
     * Scans all currently active checked-in visitors and flags overstay warnings & breaches.
     */
    detectOverstays(options: OverstayDetectionOptions): OverstayRecord[];
    rescheduleVisit(input: RescheduleVisitInput): VisitorTransactionView;
    cancelVisit(tenantId: string, transactionId: string, actor: string, reason: string): VisitorTransactionView;
    correctActivityData(input: ActivityCorrectionInput): VisitorTraceabilityChain;
    getVisitorTransaction(tenantId: string, transactionId: string): VisitorTransactionView | null;
    private mapTransportRowToModel;
    private mapGhgRowToModel;
    listVisitorTransactions(query: VisitorListQuery): VisitorListResult;
    getVisitorAnalytics(tenantId: string, siteId?: string): VisitorAnalyticsSummary;
    getTraceabilityChain(tenantId: string, transactionId: string): VisitorTraceabilityChain | null;
    private buildTransactionView;
}
