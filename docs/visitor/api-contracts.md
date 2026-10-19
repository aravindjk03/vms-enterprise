# Visitor Domain API & Service Contracts

## 1. Overview

The Visitor domain exposes clean, type-safe RESTful API routes and service contracts adhering to enterprise idempotency, tenant context isolation, and transactional safety.

---

## 2. Service Interface: `IVisitorService`

```typescript
export interface IVisitorService {
  // 1. Ingestion & Pre-Registration
  createVisitorTransaction(
    dto: CreateVisitorTransactionDTO,
    context: TransactionExecutionContext
  ): Promise<VisitorTransactionResult>;

  // 2. Profile Search & Deduplication
  searchProfiles(
    query: ProfileSearchQuery,
    context: TransactionExecutionContext
  ): Promise<VisitorProfileMatchCandidate[]>;

  // 3. Workflow & Approval Actions
  approveVisit(
    transactionId: string,
    hostUserId: string,
    comment?: string,
    context?: TransactionExecutionContext
  ): Promise<VisitorTransaction>;

  rejectVisit(
    transactionId: string,
    hostUserId: string,
    reason: string,
    context?: TransactionExecutionContext
  ): Promise<VisitorTransaction>;

  // 4. Identity & Credentialing
  recordIdentityVerification(
    payload: RecordIdentityVerificationDTO,
    context: TransactionExecutionContext
  ): Promise<IdentityVerificationRecord>;

  issueEPass(
    transactionId: string,
    context: TransactionExecutionContext
  ): Promise<VisitorEPass>;

  // 5. Gate Operations
  checkIn(
    payload: GateCheckInPayload,
    context: TransactionExecutionContext
  ): Promise<GateCheckInResult>;

  checkOut(
    payload: GateCheckOutPayload,
    context: TransactionExecutionContext
  ): Promise<GateCheckOutResult>;

  // 6. Overstay Governance
  detectOverstays(
    options: OverstayDetectionOptions,
    context: TransactionExecutionContext
  ): Promise<OverstayRecord[]>;

  // 7. Lifecycle Modifications
  rescheduleVisit(
    transactionId: string,
    newStart: string,
    newEnd: string,
    reason: string,
    context: TransactionExecutionContext
  ): Promise<VisitorTransaction>;

  cancelVisit(
    transactionId: string,
    reason: string,
    context: TransactionExecutionContext
  ): Promise<VisitorTransaction>;

  // 8. Traceability & Reporting
  getTraceabilityChain(
    transactionId: string,
    context: TransactionExecutionContext
  ): Promise<VisitorTraceabilityChain>;

  getVisitorAnalytics(
    options: VisitorAnalyticsQuery,
    context: TransactionExecutionContext
  ): Promise<VisitorAnalyticsSummary>;
}
```

---

## 3. Core DTOs & Validation Contracts

### 3.1 `CreateVisitorTransactionDTO`

```typescript
export interface CreateVisitorTransactionDTO {
  siteId: string;
  visitorCategory: VisitorCategory;
  purpose: VisitorPurpose;
  bookingMode: BookingMode;
  hostUserId: string;
  scheduledStart: string; // ISO 8601
  scheduledEnd: string;   // ISO 8601

  // Profile Master Demographics
  visitor: {
    firstName: string;
    lastName: string;
    phone: string;        // E.164
    email?: string;
    company: string;
    designation?: string;
    isVip?: boolean;
  };

  // Group Delegation (Optional)
  groupParticipants?: Array<{
    name: string;
    phone: string;
    email?: string;
    company?: string;
    designation?: string;
  }>;

  // Embedded Transport & Mobility Vector
  transport?: {
    mode: TransportMode;
    ownership: OwnershipType;
    vehicleClass: VehicleClass;
    fuelType: FuelType;
    usageType: UsageType;
    occupancy?: number;
    origin: string;
    destination: string;
    distanceKm?: number;
    journeyType: JourneyType;
    transportServiceType?: TransportServiceType;
  };

  // Security & Escort Rules
  escortRequired?: boolean;
  idempotencyKey?: string;
}
```

---

## 4. Idempotency Guarantees

All write operations (`createVisitorTransaction`, `checkIn`, `checkOut`) support an `idempotencyKey` parameter. When retried with the exact key (e.g. during an edge network reconnection), the service intercepts the request and returns the existing result without generating duplicate database records, extra e-passes, or redundant gate events.
