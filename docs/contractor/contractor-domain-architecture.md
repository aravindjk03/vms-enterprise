# Contractor Management Domain Architecture & Relational Model

## 1. Domain Architectural Model

The Contractor Management Domain (`@vms/contractor`) in VMS Enterprise is an enterprise-grade subsystem engineered specifically for governing industrial contractor companies, multi-tiered commercial contracts, discrete work orders, contingent craft labor forces, and workforce compliance across high-security manufacturing plants, industrial complexes, and corporate campuses.

In mission-critical industrial manufacturing (automotive assembly, heavy fabrication, aerospace, continuous process plants, and high-voltage utilities), contractor management fundamentally diverges from transient visitor management:
- **Domain Independence Invariant:** A contractor worker is **not** a visitor. They operate under contractual obligations, work orders, insurance indemnities, specialized trade certifications, and statutory safety prerequisites.
- **Hierarchical Governance:** Authority cascades from Contractor Company &rarr; Commercial Contract &rarr; Authorized Work Order &rarr; Worker Assignment &rarr; Physical Gate Access.
- **Returning Worker Deduplication:** Craftspeople return across multiple contractors or projects over decades; their canonical human identity (`Person`) and historical records are preserved without redundant profile generation.
- **Strict Authorization Decision Engine:** Physical turnstile badge-ins must evaluate multi-variable compliance predicates in real time (Company active, Contract active, Work Order approved, Headcount cap available, Worker active, Assignment valid, Safety induction current, Medical fitness verified, PTW active).
- **Zero-Blocker Embedded ESG/GHG Capture:** Workforce commute activity data (GHG Protocol Scope 3 Category 7: Employee & Contractor Commuting) is embedded seamlessly at turnstiles without causing physical queuing or turnstile lockups if downstream carbon calculation engines experience latency.
- **Group Transport Deduplication:** Shared contractor shuttles record a single physical vehicle movement with incremented occupancy to prevent multi-passenger emission multiplication.

---

## 2. Diagram 1: Company &rarr; Contract &rarr; Work Order Hierarchy

```mermaid
graph TD
    classDef company fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef contract fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef workOrder fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;

    C[Contractor Company<br/>Apex Industrial Infrastructure Ltd<br/>Vendor Code: VEND-APEX-01<br/>Safety Rating: GRADE_A / PLATINUM]:::company

    C --> CT1[Contract 1: Master Maintenance Agreement<br/>Ref: CNT-2026-081<br/>Type: MASTER_SERVICES_AGREEMENT<br/>Status: ACTIVE]:::contract
    C --> CT2[Contract 2: Substation Turnkey Expansion<br/>Ref: CNT-2026-082<br/>Type: TURNKEY<br/>Status: ACTIVE]:::contract

    CT1 --> WO1[Work Order 101: Boiler Piping Overhaul<br/>Ref: WO-INFRA-8801<br/>Cap: 15 Workers<br/>Status: APPROVED]:::workOrder
    CT1 --> WO2[Work Order 102: Emergency Valve Seal<br/>Ref: WO-INFRA-8804<br/>Cap: 4 Workers<br/>Status: APPROVED]:::workOrder
    CT2 --> WO3[Work Order 201: HT Transformer Bushing<br/>Ref: WO-ELEC-8802<br/>Cap: 8 Workers<br/>Status: APPROVED]:::workOrder
```

---

## 3. Diagram 2: Company &rarr; Worker Relationship & Canonical Person Linking

```mermaid
graph LR
    classDef person fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef worker fill:#334155,stroke:#64748b,stroke-width:2px,color:#fff;
    classDef company fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;

    P[Canonical Person<br/>Ramesh K. Yadav<br/>Govt ID Hash: 78a9c...<br/>Phone: +91 98220 12345]:::person

    CMP1[Apex Industrial<br/>Company ID: CMP-001]:::company
    CMP2[SolidGround Masonry<br/>Company ID: CMP-002]:::company

    CW1[Contractor Worker Profile 1<br/>Badge: CW-4001<br/>Trade: High-Pressure Steam Pipefitter<br/>Status: ACTIVE]:::worker
    CW2[Contractor Worker Profile 2<br/>Badge: CW-3108<br/>Historical Archive: 2024 Project<br/>Status: INACTIVE]:::worker

    P --> CW1
    P --> CW2
    CW1 --> CMP1
    CW2 --> CMP2
```

---

## 4. Diagram 3: Work Order &rarr; Worker Assignment Relationship & Headcount Cap

```mermaid
graph TD
    classDef wo fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef assign fill:#0f766e,stroke:#14b8a6,stroke-width:2px,color:#fff;
    classDef worker fill:#334155,stroke:#64748b,stroke-width:2px,color:#fff;
    classDef cap fill:#b91c1c,stroke:#ef4444,stroke-width:2px,color:#fff;

    WO[Work Order: WO-INFRA-8801<br/>Authorized Cap: 3 Workers]:::wo

    WO --> AS1[Assignment 1<br/>Worker: Ramesh Yadav (CW-4001)<br/>Status: ACTIVE]:::assign
    WO --> AS2[Assignment 2<br/>Worker: Suresh Nair (CW-4005)<br/>Status: ACTIVE]:::assign
    WO --> AS3[Assignment 3<br/>Worker: Amit Verma (CW-4006)<br/>Status: ACTIVE]:::assign

    AS1 --> W1[Worker: CW-4001]:::worker
    AS2 --> W2[Worker: CW-4005]:::worker
    AS3 --> W3[Worker: CW-4006]:::worker

    WO -.-> REJ[4th Assignment Rejected<br/>HEADCOUNT_CAP_EXCEEDED]:::cap
```

---

## 5. Diagram 4: Multi-Source Compliance Evaluation Pipeline

```mermaid
flowchart TD
    classDef step fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef valid fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef fail fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff;

    START[Worker Presents Credential at Turnstile]:::step --> C1{1. EHS Safety Induction Valid?}:::step
    C1 -- Yes --> C2{2. Trade Qualification Verified?}:::step
    C1 -- No / Expired --> BLK1[Deny Entry: INDUCTION_LAPSED]:::fail

    C2 -- Yes --> C3{3. Medical Fitness Current?}:::step
    C2 -- No / Unverified --> BLK2[Deny Entry: TRADE_UNQUALIFIED]:::fail

    C3 -- Yes --> C4{4. Work Order Permit-to-Work Active?}:::step
    C3 -- No / Expired --> BLK3[Deny Entry: MEDICAL_FITNESS_EXPIRED]:::fail

    C4 -- Yes --> C5{5. Document Expiry Horizon Check}:::step
    C4 -- No PTW --> BLK4[Deny Entry: MANDATORY_PTW_MISSING]:::fail

    C5 -- Within Grace Period --> WARN[Allow Entry with Visual Amber Flag]:::valid
    C5 -- All Clear --> PASS[Compliance Status: FULLY_COMPLIANT]:::valid
```

---

## 6. Diagram 5: Work Authorization Decision Engine

```mermaid
flowchart TD
    classDef decision fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef allow fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef deny fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff;

    REQ[Badge Swipe at Gate 2 Turnstile] --> D1{Company Status == ACTIVE?}:::decision
    D1 -- No --> DENY1[DENIED: COMPANY_INACTIVE]:::deny
    D1 -- Yes --> D2{Contract Status == ACTIVE?}:::decision

    D2 -- No --> DENY2[DENIED: CONTRACT_EXPIRED_OR_SUSPENDED]:::deny
    D2 -- Yes --> D3{Work Order Status == APPROVED?}:::decision

    D3 -- No --> DENY3[DENIED: WORK_ORDER_NOT_APPROVED]:::deny
    D3 -- Yes --> D4{Worker Status == ACTIVE & !RESTRICTED?}:::decision

    D4 -- No --> DENY4[DENIED: WORKER_RESTRICTED]:::deny
    D4 -- Yes --> D5{Assignment Status == ACTIVE?}:::decision

    D5 -- No --> DENY5[DENIED: NO_ACTIVE_ASSIGNMENT]:::deny
    D5 -- Yes --> D6{Date within WO & Assignment Range?}:::decision

    D6 -- No --> DENY6[DENIED: OUTSIDE_VALIDITY_WINDOW]:::deny
    D6 -- Yes --> D7{Concurrent On-Site < WO Cap?}:::decision

    D7 -- No --> DENY7[DENIED: HEADCOUNT_CAP_REACHED]:::deny
    D7 -- Yes --> D8{All Safety Prerequisites Satisfied?}:::decision

    D8 -- No --> DENY8[DENIED: COMPLIANCE_DEFICIENT]:::deny
    D8 -- Yes --> ALLOW[AUTHORIZED: TURNSTILE_UNLATCH]:::allow
```

---

## 7. Diagram 6: Attendance Lifecycle

```mermaid
stateDiagram-v2
    [*] --> EXPECTED: Work Order Scheduled Shift

    EXPECTED --> CHECKED_IN: Physical Turnstile Entry Swipe
    EXPECTED --> NO_SHOW: Shift End without Entry Swipe

    CHECKED_IN --> CHECKED_OUT: Turnstile Exit Swipe (Normal)
    CHECKED_IN --> OVERSTAY: Continuous Presence > Shift Threshold (e.g. 12h)

    OVERSTAY --> CHECKED_OUT: Late Turnstile Exit Swipe
    OVERSTAY --> MANUAL_AUDIT: Security EOD Sweep Reconciliation

    CHECKED_OUT --> AUDITED_CORRECTION: Supervisor / EHS Time Correction
    AUDITED_CORRECTION --> [*]
    CHECKED_OUT --> [*]
    NO_SHOW --> [*]
```

---

## 8. Diagram 7: Transport / Commute Activity Capture & Group Deduplication

```mermaid
sequenceDiagram
    autonumber
    actor Worker as Contractor Worker
    participant Gate as RFID Turnstile Controller
    participant CS as ContractorService
    participant TS as TransportService
    participant GHG as GHGCalculationEngine
    participant DB as RelationalDatabase (Ledger)

    Worker->>Gate: Present RFID Badge CW-4001 (Bus Passenger)
    Gate->>CS: checkInContractorWorker(workerId, transportData)
    Note over CS: Identify Mode = BUS, Trip Ref = SHUTTLE-ROUTE-PUNE-NORTH-AM
    CS->>TS: normalizeTransportActivity(distance, occupancy, mode)
    TS-->>CS: NormalizedTransportActivity

    alt First Passenger on Shared Bus
        CS->>DB: Insert new transport_activity (movement_count = 1, occupancy = 1)
        CS->>GHG: captureActivityFromTransport(activityRecord)
        Note over GHG: Calculate vehicle fuel combustion
    else Subsequent Passenger on Shared Bus
        CS->>DB: Update existing transport_activity (increment occupancy += 1)
        Note over CS: Zero additional vehicle movements recorded!
        Note over GHG: Allocate per-capita emission split
    end

    CS->>DB: Insert contractor_attendance_records
    CS-->>Gate: Entry Authorized (Turnstile Barrier Unlatched)
```

---

## 9. Diagram 8: Contractor-to-GHG Traceability Chain (Scope 3 Category 7)

```mermaid
graph LR
    classDef company fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef entity fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#fff;
    classDef transport fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef esg fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef ghg fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fff;

    CMP[Contractor Company<br/>Apex Industrial]:::company --> CT[Contract<br/>CNT-2026-081]:::entity
    CT --> WO[Work Order<br/>WO-INFRA-8801]:::entity
    WO --> W[Worker<br/>Ramesh Yadav]:::entity
    W --> ATT[Attendance Event<br/>att-501 @ Gate 2]:::entity
    ATT --> TRA[Transport Activity<br/>Mode: BUS, Dist: 28.5 km]:::transport
    TRA --> ESG[ESG Activity Record<br/>Scope 3 Cat 7<br/>Provenance: SYSTEM_ESTIMATED]:::esg
    ESG --> GHG[GHG Calculation<br/>Emissions: 2.14 kg CO₂e<br/>Factor: DEFRA-2024-BUS]:::ghg
```

---

## 10. Diagram 9: Access / Gate & Turnstile Integration

```mermaid
graph TD
    classDef hw fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef vms fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef action fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;

    READER[Industrial RFID / Biometric Turnstile Head]:::hw -->|Wiegand / OSDP| CONTROLLER[Edge Access Controller<br/>Gate 2 Contractor Portal]:::hw
    CONTROLLER -->|REST / WebSocket| GATEWAY[Access Integration Gateway]:::vms
    GATEWAY -->|evaluateWorkerAuthorization| CS[ContractorService]:::vms
    CS -->|Query DB & Compliance| DB[(Relational Database)]:::vms
    CS -- Authorization Granted --> GATEWAY
    GATEWAY -->|Pulse Relay Unlatch| CONTROLLER
    CONTROLLER -->|Rotate Turnstile| TURNSTILE[Physical Turnstile Mechanism]:::action
    GATEWAY -->|checkInWorker + captureTransport| CS
```

---

## 11. Diagram 10: Safety & Permit Integration

```mermaid
graph LR
    classDef ptw fill:#7c2d12,stroke:#f97316,stroke-width:2px,color:#fff;
    classDef safety fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef gate fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;

    PTW[Permit-to-Work Engine<br/>PTW-HOT-2026-401<br/>Hazard: High Temperature Welding<br/>Status: ACTIVE]:::ptw

    EHS[EHS Department<br/>Induction Certificate: DOC-IND-901<br/>Medical Fitness: FIT-MED-2026]:::safety

    AUTH[Contractor Authorization Engine]:::safety
    GATE[Physical Turnstile Gate]:::gate

    PTW -->|Permit Validity Binding| AUTH
    EHS -->|Induction & Fitness Status| AUTH
    AUTH -->|Permit Verified Valid| GATE
```
