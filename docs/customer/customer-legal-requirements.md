# Customer Legal Requirements & Bilateral NDA Vault

## 1. Overview & IP Protection Mandates

Manufacturing facilities house confidential prototypes, tooling blueprints, and proprietary process recipes. Allowing customer representatives into these facilities without a valid, signed bilateral Non-Disclosure Agreement (NDA) creates catastrophic intellectual property liability.

### 1.1 NDA Architectural Invariants
- If an account has `default_nda_required = true`, **all** visits sponsored by that account inherit a mandatory bilateral NDA requirement.
- An unfulfilled NDA acts as a **hard gate blocker**. Physical turnstile check-in is strictly blocked until an authorized user verifies the legal agreement reference via `verifyCustomerNda`.
- Bypass attempts trigger security audit alerts.

---

## 2. Diagram 8: Bilateral NDA Gating & Gate Check-In Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Representative
    actor Guard as Security Guard
    participant Gate as Gate Turnstile Terminal
    participant CS as CustomerService
    participant DB as RelationalDatabase

    Customer->>Guard: Arrives at Gate 1; presents QR E-Pass
    Guard->>Gate: Scan QR Pass (checkInCustomerVisit)
    Gate->>CS: checkInCustomerVisit(transactionId, gateId)
    CS->>DB: Query visit transaction & customer account
    alt NDA Requirement Not Fulfilled (nda_signed = false)
        CS-->>Gate: Throw Error: "Check-in blocked: Bilateral NDA has not been signed or verified"
        Gate-->>Guard: Display Red Screen: Entry Prohibited (Unsigned NDA)
        Guard-->>Customer: Entry Denied; Redirect to Commercial Legal Desk
    else NDA Verified (nda_signed = true)
        CS->>DB: Insert gate_event (CHECKED_IN)
        CS->>DB: Update customer_visit_transactions (status: ON_PREMISES)
        CS-->>Gate: Check-in Approved
        Gate-->>Customer: Turnstile Unlocks; Issue Printed Security Badge
    end
```

---

## 3. NDA Verification & Expiry Management

Authorized legal officers or commercial account managers record NDA verification:
```typescript
await customerService.verifyCustomerNda(
  tenantId,
  customerVisitId,
  'NDA-2026-CONFIDENTIAL-99',
  '2028-12-31' // Optional expiration date
);
```
Once verified, the requirement status transitions to `isFulfilled: true`, and the parent visit unlocks for security gate clearance.
