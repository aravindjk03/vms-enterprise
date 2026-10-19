# Customer Gate Check-In, Check-Out & Overstay SLA

## 1. Physical Gate Security Operations

When customer representatives arrive at a plant access gate (e.g., Gate 1 Executive Turnstile or Vehicle Portal):
- **Verification Gate:** Check-in requires confirmed appointment status, valid bilateral NDA, and unexpired appointment window.
- **Cross-Site Access Violation Protection:** If an operator attempts to scan or check in a customer appointment at an unauthorized plant site (e.g., Coimbatore operator scanning a Chennai visit pass), the system throws an immediate `Cross-site access violation` error.
- **Appointment Expiration Enforcement:** Appointments with scheduled end times exceeding a 4-hour grace period are automatically blocked with `Appointment window has expired`.

---

## 2. Diagram 9: Overstay SLA Detection & Escalation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Delegate
    participant Gate as Plant Gate Turnstile
    participant CS as CustomerService
    participant Cron as Overstay Sweep Worker
    participant Sec as Security Control Center

    Customer->>Gate: Check-in at 09:00 (Scheduled End: 13:00)
    Gate->>CS: checkInCustomerVisit() (status: ON_PREMISES)
    Note over Customer, Gate: 13:00 Passes - Customer remains on premises
    Note over Cron: 13:45 (>30m past scheduled end)
    Cron->>CS: getOverstayCustomerVisits(tenantId, siteId)
    CS-->>Cron: Returns Overstayed Visits with overstayMinutes = 45
    Cron->>Sec: Raise Priority-2 SLA Security Alert: "Active customer visit CUS-2026-003001 overstayed by 45m"
    Sec->>Customer: Contact Host / Security Escort for Status Update
```

---

## 3. QR E-Pass Issuance & Security Tokenization

Customer E-Passes are issued with HMAC SHA-256 signatures:
```typescript
const payload = `${tenantId}:${customerVisitId}:${refNumber}:${participantId}`;
const token = createHmac('sha256', secretKey).update(payload).digest('hex');
const qrPayload = `vms://customer-pass/${refNumber}?token=${token.slice(0, 16)}`;
```
- Sensitive personal identity details (phone, email, government ID) are **never** encoded in the plain text of QR codes.
- Security scanners validate the HMAC token against the active visit record before clearing turnstile barriers.
