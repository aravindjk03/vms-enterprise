# Reserved Booking & Pre-Registration Workflow

## 1. Overview

**Reserved Booking** represents the scheduled pre-registration pathway used for corporate appointments, supplier meetings, OEM audits, and job candidate interviews. It enables advanced host approval, preliminary identity checks, safety pre-inductions, and QR e-Pass distribution prior to physical arrival.

---

## 2. Sequence Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Host as Plant Host (Employee)
    actor Visitor as External Visitor
    participant App as Web Application
    participant VS as VisitorService
    participant TS as TransportService
    participant GHG as GHG Engine
    participant WF as WorkflowEngine
    actor Security as Gate Security Guard

    Host->>App: Initiate Invitation (Visitor Name, Phone, Window)
    App->>VS: createVisitorTransaction(bookingMode='RESERVED')
    VS->>TS: normalizeTransportActivity(transportVector)
    TS-->>VS: NormalizedTransportActivity
    VS->>GHG: captureActivityFromTransport(siteId, normalized)
    GHG-->>VS: ghgActivity (Status=PENDING)
    VS->>WF: submitForApproval(transactionId, hostUserId)
    VS-->>App: Return Appointment Draft + Invitation Token
    
    App-->>Visitor: SMS / Email Invitation Link
    Visitor->>App: Open Invitation, Upload Govt ID & Confirm Mobility
    App->>VS: submitVisitorDetails(invitationToken, visitorPayload)
    
    WF->>Host: Approval Task in Task Center
    Host->>WF: Approve Appointment
    WF-->>VS: Workflow Transition -> APPROVED
    
    VS->>VS: issueEPass(transactionId) -> Cryptographic Opaque QR
    VS-->>Visitor: Digital Badge & Pass Delivered
    
    Note over Visitor,Security: Day of Visit (Physical Arrival)
    Visitor->>Security: Present Cryptographic QR Code
    Security->>VS: checkIn(qrPassId, gateId, method='APPOINTMENT_QR')
    VS-->>Security: Access Granted -> Badge Printed
```

---

## 3. Pre-Registration Data Contract

Reserved pre-registration captures:
- **Demographic Information**: Full name, mobile number (E.164), email address, organization/company, job title.
- **Visit Context**: Host employee reference, plant site identifier, authorized entry gate, scheduled start time, scheduled end time, visit purpose.
- **Embedded Transport Vector**: Origin city/landmark, destination facility, transport mode (e.g. `CAR`, `TRAIN`, `FLIGHT`), vehicle ownership (`PERSONAL`, `COMPANY`, `HIRED`), fuel type, occupancy, journey direction.
- **Compliance & Security Prerequisites**: Required security escort flag, high-security zone access request, safety induction status.

---

## 4. Invitation Link Lifecycle

1. **Token Generation**: Secure HMAC-SHA256 nonces with configurable expiration (default: scheduled start time + 4 hours).
2. **One-Time Access**: Nonces cannot be replayed once visitor details are submitted and verified.
3. **Rescheduling / Cancellation**: If the host reschedules or cancels, the token is invalidated immediately and a replacement invitation link is issued.
