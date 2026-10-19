# Gate Operations, Turnstiles & Physical Access

## 1. Overview & Plant Perimeter Security

Physical plant security in industrial manufacturing operates at the front line of perimeter defense. Customer visits involve corporate executives, quality inspectors, chartered vehicles, and sensitive equipment entering through vehicle gates and pedestrian turnstiles.

The **Gate Operations** integration in `@vms/customer` coordinates access decisions, validates entry gates, controls turnstile hardware, matches vehicle plates via ANPR, and writes tamper-evident audit records to the immutable `gate_events` ledger.

---

## 2. Gate Verification Sequence & API Signatures

### 2.1 Full-Visit Check-In (`checkInCustomerVisit`)
Used when a customer delegation or individual arrives as a complete unit:
- Accepts either `GateCheckInCustomerInput` object or positional parameters for flexible integration with edge gate controllers.
- Validates visit status (`CONFIRMED` or `APPROVED`), host approval state, and bilateral NDA status.
- Sets visit stage to `IN_PROGRESS` and status to `ON_PREMISES`.
- Updates all associated delegation participants in `customer_visit_participants` to `presence_status = 'CHECKED_IN'`.
- Inserts an immutable `gate_events` record with event type `CHECK_IN`.

### 2.2 Full-Visit Check-Out (`checkOutCustomerVisit`)
- Records visit departure at security gate exit turnstiles.
- Transitions stage to `COMPLETED` and status to `DEPARTED`.
- Sets `actual_exit` timestamps across visit transactions and participants.
- Inserts an immutable `gate_events` record with event type `CHECK_OUT`.

### 2.3 Individual Delegate Check-In & Check-Out (`checkInParticipant` / `checkOutParticipant`)
Supports dual method signatures for backward compatibility with both rich UI clients and legacy physical gate controllers:
```typescript
// Dual signature support:
public async checkInParticipant(
  arg1: string | GateCheckInCustomerInput,
  customerVisitId?: string,
  participantId?: string,
  gateId?: string,
  operatorUserId = 'SYSTEM'
): Promise<CustomerVisitParticipant>
```
Allows individual delegates to pass turnstiles at different times (e.g., Lead arrives at 09:00, technical specialists arrive at 10:30).

---

## 3. ANPR Vehicle Plate Integration

When a customer delegation arrives by automobile, executive van, or coach:
1. **License Plate Capture:** The transport vector records `vehiclePlate` (e.g., `TN-09-EV-9999`).
2. **ANPR Camera Gate Trigger:** When the vehicle approaches Gate 1, the Automated Number Plate Recognition (ANPR) camera matches the optical plate against scheduled customer visits for the current operating window.
3. **Automated Barrier Actuation:** If the visit is `APPROVED` and bilateral NDAs are satisfied, the vehicle boom barrier actuates automatically, logging an ANPR gate entry transaction.

---

## 4. Immutable Gate Event Ledger (`gate_events`)

Every physical gate movement is recorded to the immutable ledger:

```typescript
this.db.insert('gate_events', {
  event_id: randomUUID(),
  tenant_id: input.tenantId,
  site_id: visit.site_id,
  gate_id: input.gateId,
  device_id: null,
  event_type: 'CHECK_IN',
  source_domain: 'CUSTOMER',
  source_transaction_id: visitId,
  person_id: participants[0]?.person_id || null,
  credential_id: null,
  decision: 'GRANTED',
  reason: 'Approved Customer Visit Check-In',
  timestamp: now,
});
```

Because `gate_events` is registered with `isImmutable: true` in the relational engine, records can never be updated or deleted, providing complete compliance integrity for external audits and accident investigations.
