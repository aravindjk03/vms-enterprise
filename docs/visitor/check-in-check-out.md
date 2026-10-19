# Physical Gate Operations: Check-In, Check-Out & Immutable Events

## 1. Overview

The physical perimeter of an industrial plant features turnstiles, optical speed lanes, boom barriers, UHF RFID readers, and 2D barcode scanners. 

Physical gate execution is strictly decoupled from high-level business workflow logic:
- **Business Workflow Engine**: Determines *eligibility* (Is this visit approved by the host and safety team?).
- **Gate Execution Engine**: Determines *physical admittance* (Is this person at the right turnstile, at the right time, with an active valid credential?).

---

## 2. Gate Event Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Visitor at Turnstile
    participant Scanner as 2D Barcode Scanner / Edge Terminal
    participant VS as VisitorService
    participant DB as Relational Database
    participant Occupancy as Emergency Occupancy Engine
    participant Barrier as Physical Turnstile Relay

    Note over Visitor,Barrier: 1. PHYSICAL CHECK-IN (ENTRY)
    Visitor->>Scanner: Present Cryptographic QR e-Pass
    Scanner->>VS: checkIn(qrPassId, gateId='GATE-01', lane='TURNSTILE-A')
    
    VS->>VS: Validate: Is Approved? Time Window Active? Not Revoked?
    
    VS->>DB: Append Immutable Record to gate_events (ENTRY_APPROVED)
    VS->>DB: Update visitor_transactions: actualEntry=NOW, status='ON_PREMISES'
    VS->>Occupancy: Increment On-Premises Headcount (+1)
    
    VS-->>Scanner: Decision: ALLOW (Green Strobe)
    Scanner->>Barrier: Send Relay Pulse -> Unlock Turnstile Arm
    Visitor->>Barrier: Pass Through Barrier
    
    Note over Visitor,Barrier: 2. PHYSICAL CHECK-OUT (EGRESS)
    Visitor->>Scanner: Scan Badge at Exit Turnstile
    Scanner->>VS: checkOut(transactionId, gateId='GATE-01')
    
    VS->>DB: Append Immutable Record to gate_events (EXIT_RECORDED)
    VS->>DB: Update visitor_transactions: actualExit=NOW, status='COMPLETED', stage='CLOSED'
    VS->>Occupancy: Decrement On-Premises Headcount (-1)
    
    VS-->>Scanner: Decision: ALLOW (Egress Unlocked)
    Scanner->>Barrier: Release Exit Turnstile
```

---

## 3. Immutable Gate Event Schema

Gate events represent a cryptographically verifiable append-only ledger:

```typescript
export interface GateEvent {
  id: string; // UUIDv4
  tenantId: string;
  siteId: string;
  gateId: string;
  laneId?: string;
  sourceDomain: 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'MATERIAL' | 'VEHICLE';
  sourceTransactionId: string;
  eventType: 'ENTRY_REQUESTED' | 'ENTRY_APPROVED' | 'ENTRY_DENIED' | 'ZONE_TRANSIT' | 'EXIT_RECORDED';
  credentialType: 'QR_EPASS' | 'RFID_BADGE' | 'BIOMETRIC_FACE' | 'MANUAL_OVERRIDE';
  decision: 'ALLOW' | 'DENY';
  denialReason?: string;
  actorId: string; // Guard ID or Edge Device Serial
  occurredAt: string; // ISO 8601 UTC
}
```

Historical gate events are **never updated or soft-deleted**. In the event of a bad scan or manual correction, a compensatory counter-event is appended with audit linkage.

---

## 4. Emergency Muster Synchronization

Every `checkIn` and `checkOut` event drives live emergency occupancy data:
- Check-in increments the plant headcount and registers the visitor on the live muster roll-call list.
- Check-out immediately decrements the headcount.
- If an emergency evacuation siren triggers, the plant emergency dashboard reads directly from the real-time active visitor roster without needing table scans.
