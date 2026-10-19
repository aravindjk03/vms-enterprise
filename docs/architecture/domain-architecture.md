# VMS Enterprise: Domain Architecture Specification

## 1. Architectural Philosophy: The Domain Independence Mandate

A catastrophic antipattern in industrial facility management software is the "Universal Visitor" trap: forcing contractors, OEM technicians, bulk chemical tankers, customer audit delegations, and outbound scrap trucks into a single bloated `Visitor` table or generic workflow.

**VMS Enterprise explicitly rejects this antipattern.**

In VMS Enterprise:
1. **Visitor, Customer, Contractor, Service, Material, and Vehicle are independent, first-class business domains.**
2. Each domain owns its independent:
   - Data entities and relational schemas
   - Business validations and compliance lifecycles
   - Stage/status state machines
   - Authorization rules and role access
   - Operational user interfaces and specialized kiosks
   - Domain-specific events and metrics

---

## 2. Inventory of Top-Level Business Domains

| # | Business Domain | Primary Responsibility | Core Entities Owned |
|---|---|---|---|
| **1** | **Visitor Management** | Transient guests, candidates, business meetings, VIPs, auditors | `Visitor`, `VisitorAppointment`, `VisitorHost`, `VisitorBadge` |
| **2** | **Customer Management** | Client visits, plant tours, commercial audits, technical evaluations | `CustomerAccount`, `CustomerVisit`, `DelegationMember`, `NDACompliance` |
| **3** | **Contractor Management** | Vendor staff, long-term construction, maintenance crews, compliance | `ContractorCompany`, `Contract`, `WorkOrder`, `ContractorWorker`, `SafetyInduction` |
| **4** | **Service / Work Management** | Machinery repair, equipment commissioning, calibration, OEM technicians | `ServiceRequest`, `TechnicianAssignment`, `WorkOrderTask`, `SignOffReport` |
| **5** | **Material Management** | Logistics gate passes, inward consignment, outward dispatch, scrap, spares | `MaterialGatePass`, `MaterialItem`, `Consignment`, `ReturnableTracker` |
| **6** | **Vehicle Management** | Plant fleet, transporter lorries, private cars, tankers, weighbridge passes | `Vehicle`, `Driver`, `TransporterCompany`, `TareGrossWeightLog` |
| **7** | **Transport Management** | Normalized mobility capture across all human and goods movements | `TransportActivity`, `JourneyLeg`, `RouteMaster` |
| **8** | **Gate Management** | Physical ingress/egress points, turnstiles, ANPR, barriers, weighbridges | `Gate`, `Lane`, `BarrierController`, `HardwareTerminal` |
| **9** | **Access Management** | Zone authorization, biometric credentials, RFID badges, pass validation | `AccessPolicy`, `ZoneRule`, `CredentialMapping`, `ActivePass` |
| **10** | **Identity Verification** | Liveness check, government ID inspection, duplicate face deduplication | `IdentityProfile`, `VerificationAttempt`, `BiometricReference` |
| **11** | **Document & Legal Compliance** | NDAs, insurance certificates, licenses, pollution certificates, agreements | `Document`, `DocumentVersion`, `VerificationAudit` |
| **12** | **Safety & Permit Management** | EHS inductions, Permit to Work (PTW: Hot Work, Height, Confined Space) | `PermitToWork`, `HazardChecklist`, `InductionRecord` |
| **13** | **Emergency Management** | Plant alarms, muster station roll calls, headcounts, live zone occupancy | `EmergencyIncident`, `MusterStation`, `HeadcountSnapshot` |
| **14** | **ESG / GHG Activity Intelligence** | Embedded activity capture, carbon factor registry, emission calculation | `ESGActivityRecord`, `EmissionFactor`, `GHGCalculation` |
| **15** | **Analytics & BI** | Historical throughput, contractor overstay trends, Scope 3 summaries | `AggregatedMetric`, `OverstayRecord`, `AuditSummary` |
| **16** | **AI Intelligence** | Natural language operational querying, anomaly detection, predictive volume | `AIQueryLog`, `AnomalyAlert`, `AuditPrediction` |
| **17** | **Administration** | Multi-tenant setup, organization topology, sites, gates, zones, RBAC | `Tenant`, `Organization`, `Site`, `Role`, `User` |
| **18** | **Integration Platform** | SAP/ERP connectors, HRMS sync (Workday/Darwinbox), hardware edge SDKs | `IntegrationEndpoint`, `SyncJob`, `WebhookSubscription` |

---

## 3. High-Level Domain Boundary Diagram

```mermaid
graph TD
    subgraph Operational_Domains["Primary Operational Business Domains"]
        VIS[Visitor Management]
        CUST[Customer Management]
        CONT[Contractor Management]
        SERV[Service / Work Management]
        MAT[Material Management]
        VEH[Vehicle Management]
    end

    subgraph Cross_Cutting_Services["Cross-Cutting Platform Capabilities"]
        TRANS[Transport Model]
        ESG[ESG Activity Capture & GHG Engine]
        DOC[Document Compliance]
        SAFE[Safety & PTW Engine]
        GATE[Gate & Access Engine]
        WORKFLOW[Workflow & Approval Engine]
        IDENTITY[Identity & Verification]
        AUDIT[Audit & Provenance]
    end

    VIS --> TRANS
    VIS --> WORKFLOW
    VIS --> DOC
    VIS --> GATE
    VIS --> ESG

    CUST --> TRANS
    CUST --> WORKFLOW
    CUST --> DOC
    CUST --> GATE
    CUST --> ESG

    CONT --> TRANS
    CONT --> SAFE
    CONT --> DOC
    CONT --> WORKFLOW
    CONT --> GATE
    CONT --> ESG

    SERV --> TRANS
    SERV --> SAFE
    SERV --> DOC
    SERV --> WORKFLOW
    SERV --> GATE
    SERV --> ESG

    MAT --> VEH
    MAT --> TRANS
    MAT --> WORKFLOW
    MAT --> DOC
    MAT --> GATE
    MAT --> ESG

    VEH --> TRANS
    VEH --> DOC
    VEH --> GATE
    VEH --> ESG

    GATE --> IDENTITY
    TRANS --> ESG
    ESG --> AUDIT
    WORKFLOW --> AUDIT
```

---

## 4. Common Transaction Architecture & Stage vs. Status

To maintain consistent governance across diverse operational pipelines, every business transaction inherits a standardized architectural envelope while maintaining domain-specific fields.

### The Critical Distinction: Stage vs. Status

A frequent bug in enterprise architectures is collapsing operational **Stage** and operational **Status** into a single string. 
- **Stage** represents *where the transaction resides in its business progression*.
- **Status** represents *the health or outcome within that particular stage*.

| Operational Stage (`stage`) | Possible Statuses (`status`) | Description |
|---|---|---|
| `DRAFT` | `DRAFT`, `INCOMPLETE` | User is assembling data; not yet submitted. |
| `APPROVAL` | `PENDING`, `APPROVED`, `REJECTED`, `ESCALATED`, `EXPIRED` | Under workflow evaluation by hosts, safety managers, or security. |
| `SCHEDULED` | `CONFIRMED`, `RESCHEDULED`, `CANCELLED` | Approved and awaiting the scheduled arrival window. |
| `CHECK_IN` | `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `NO_SHOW` | Arrived at gate; undergoing physical verification and badge issue. |
| `ACTIVE` | `ON_PREMISES`, `IN_RESTRICTED_ZONE`, `OVERSTAY_WARNING` | Subject or asset is physically on-site. |
| `CHECK_OUT` | `IN_PROGRESS`, `COMPLETED`, `HELD_FOR_INSPECTION` | Surrendering badge, verifying returnable material, tare weighing. |
| `CLOSED` | `ARCHIVED`, `CANCELLED`, `REJECTED`, `EXPIRED` | Finalized record, immutable for compliance and auditing. |

### Common Transaction Envelope Model

```typescript
export interface CommonTransactionEnvelope {
  transactionId: string;         // e.g., "VIS-2026-000482", "MAT-2026-019284"
  tenantId: string;              // Tenant boundary
  organizationId: string;        // Operating entity
  siteId: string;                // Physical plant location
  sourceDomain: 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'SERVICE' | 'MATERIAL' | 'VEHICLE';
  stage: TransactionStage;       // DRAFT, APPROVAL, SCHEDULED, CHECK_IN, ACTIVE, CHECK_OUT, CLOSED
  status: TransactionStatus;     // PENDING, APPROVED, REJECTED, ON_PREMISES, etc.
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;               // Optimistic concurrency control
  metadata?: Record<string, unknown>; // Domain-extensible JSONB
}
```

---

## 5. Detailed Domain Pipeline Specifications & Workflows

### 5.1 Visitor Pipeline

**Domain Mission:** Orchestrate short-term individual or delegation visits with automated sponsor notification, fast-lane pre-registration, safety induction, and automatic ESG transport tracking.

- **Visitor Categories:**
  - `NEW_VISITOR` - First-time visitor requiring identity verification and full safety induction.
  - `REPEATED_VISITOR` - Recognized visitor with active KYC; expedited check-in.
  - `GROUP_VISITOR` - Delegations, university tours, plant open-days managed under a lead contact.
  - `VIP_VISITOR` - Board members, dignitaries; expedited escort protocol, VIP parking reservation.
  - `AUDITOR` - ISO, ESG, financial or statutory inspectors; requires compliance escort and specific zone access.
  - `CONSULTANT` - Professional advisory staff working on-site under project sponsorship.
  - `GOVERNMENT_OFFICIAL` - Regulatory inspectors (Pollution Board, Labor, Fire); urgent high-priority routing.
  - `INTERVIEW_CANDIDATE` - HR recruitment applicant; scoped solely to HR meeting rooms.
  - `OTHER` - Ad-hoc general visits.
- **Visit Purposes (Master-Driven):**
  - `MEETING`, `AUDIT`, `INSPECTION`, `TRAINING`, `INTERVIEW`, `CONSULTATION`, `SITE_VISIT`, `VENDOR_NEGOTIATION`, `OTHER`.
- **Booking Modes:**
  - `RESERVED` - Pre-registered invitation generated by host employee.
  - `WALK_IN` - Registered at security gate kiosk upon arrival.
  - `RECURRING` - Multi-day pass for long-term project consultants.
  - `GROUP` - Batch registration via CSV upload or group booking link.
  - `EMERGENCY` - Immediate access granted for crisis management / incident response.

#### Visitor Pipeline Flow Diagram

```mermaid
flowchart TD
    V_Start([1. Invitation / Kiosk Walk-in]) --> V_Type{Booking Mode}
    V_Type -->|Pre-Booked| V_Pre[Host Initiates Invite via Portal]
    V_Type -->|Walk-in| V_Walk[Visitor Registers at Gate Kiosk]
    
    V_Pre --> V_Transport[Transport & Origin Capture\nMode, Fuel, Vehicle, Distance]
    V_Walk --> V_Transport
    
    V_Transport --> V_ESG_Gen[Auto-Generate ESG Activity Record\nProvenance: USER_PROVIDED / ESTIMATED]
    V_Transport --> V_Approval{Host Approval Required?}
    
    V_Approval -->|Yes| V_Pending[Stage: APPROVAL / Status: PENDING]
    V_Pending -->|Approved| V_Appr[Stage: SCHEDULED / Status: CONFIRMED]
    V_Pending -->|Rejected| V_Rej[Stage: CLOSED / Status: REJECTED]
    V_Approval -->|Auto-Approved VIP| V_Appr
    
    V_Appr --> V_Gate[Arrival at Site Gate]
    V_Gate --> V_Identity[Identity & Photo / Biometric Verification]
    V_Identity --> V_Safety[Brief Safety / EHS Induction Video]
    V_Safety --> V_Badge[Issue Digital Pass / QR / RFID Badge]
    
    V_Badge --> V_CheckIn[Stage: ACTIVE / Status: ON_PREMISES]
    V_CheckIn --> V_Inside[On-Site Activity / Host Accompaniment]
    
    V_Inside --> V_Exit[Arrival at Egress Gate]
    V_Exit --> V_BadgeSurrender[Scan & Return Badge]
    V_BadgeSurrender --> V_CheckOut[Stage: CLOSED / Status: CHECKED_OUT]
    V_CheckOut --> V_GHG_Trigger[Trigger GHG Emission Engine Calculation]
```

---

### 5.2 Customer Pipeline

**Domain Mission:** High-touch management of commercial clients, potential customers, customer quality auditors, and executive delegations. Emphasizes hospitality, confidentiality (automatic NDA capture), security clearance, and corporate sustainability reporting.

- **Customer Visit Types:**
  - `CUSTOMER_MEETING` - Commercial negotiations, contract reviews.
  - `CUSTOMER_AUDIT` - Rigorous vendor qualification or ISO/IATF quality audits.
  - `CUSTOMER_INSPECTION` - Factory acceptance testing (FAT) for specialized goods.
  - `TECHNICAL_VISIT` - Engineering co-design, prototyping workshop.
  - `PLANT_VISIT` - General showcase of manufacturing automation and capacity.
  - `DELEGATION` - Multi-stakeholder corporate or overseas delegation.
  - `MANAGEMENT_VISIT` - CXO-level bilateral meetings.
- **Domain Specializations:**
  - Executive welcoming workflow (digital signage sync).
  - Mandatory pre-signed Non-Disclosure Agreement (NDA) integration.
  - Conference room & hospitality provisioning coordination.
  - Dedicated host escort assignment.
  - ESG Scope 3 Category 6 (Business Travel / Client Visit) activity logging.

#### Customer Pipeline Flow Diagram

```mermaid
flowchart TD
    C_Init([Customer Visit Request]) --> C_Acct[Associate Customer Account & Host]
    C_Acct --> C_Transport[Capture Itinerary & Flight / Train / Car Details]
    C_Transport --> C_ESG[Generate Source-Linked ESG Activity Record]
    C_Transport --> C_NDA[Dispatch Electronic NDA for Digital Signature]
    C_NDA --> C_NDAVerif{NDA Executed?}
    C_NDAVerif -->|No| C_Hold[Hold in Stage: APPROVAL / Status: PENDING_NDA]
    C_NDAVerif -->|Yes| C_Approval[VP / Plant Manager Security Approval]
    C_Approval --> C_Confirmed[Stage: SCHEDULED / Status: CONFIRMED]
    C_Confirmed --> C_VIPArrival[Gate Fast-Track Reception & Concierge Badge]
    C_VIPArrival --> C_Active[Stage: ACTIVE / Status: ON_PREMISES]
    C_Active --> C_Checkout[Executive Host Signs Off Exit]
    C_Checkout --> C_Closed[Stage: CLOSED / Status: COMPLETED]
```

---

### 5.3 Contractor Management Pipeline

**Domain Mission:** Comprehensive governance of external contractors, specialized sub-contractors, and contingent workforces operating within manufacturing facilities. Enforces strict statutory, labor, safety, and training prerequisites prior to site authorization.

- **Contractor Domain Entities:**
  - `ContractorCompany` - Vendor master, labor license, insurance policy, ESI/PF registration.
  - `Contract` & `WorkOrder` - Commercial PO scope, designated execution dates, authorized headcounts.
  - `ContractorWorker` - Individual worker profile, KYC, medical fitness certificate, age proof.
  - `SafetyInduction` - Mandatory safety training, hazard awareness, test score, expiration date.
  - `PermitToWork` (PTW) - Critical link to high-risk work permits (Hot work, height, electrical).
  - `DailyAttendance` - Turnstile-level shift tracking, muster logging, overtime control.

#### Contractor Pipeline Flow Diagram

```mermaid
flowchart TD
    K_Init([Vendor Registration & Work Order]) --> K_Comp[Verify Contractor Company Compliance & Insurance]
    K_Comp --> K_Workers[Register Worker Roster & Identity Documents]
    K_Workers --> K_Medical[Medical Fitness & KYC Document Audit]
    K_Medical --> K_Training[EHS Safety Induction & Assessment Test]
    K_Training --> K_TrainPass{Passed Assessment?}
    K_TrainPass -->|Fail| K_Retrain[Mandatory Retraining]
    K_TrainPass -->|Pass| K_PermitCheck{Requires High-Risk PTW?}
    
    K_PermitCheck -->|Yes| K_PTW[Safety Officer Approves PTW: Hot/Height/Confined]
    K_PermitCheck -->|No| K_BadgeIssue[Generate Biometric / RFID Contractor Credential]
    K_PTW --> K_BadgeIssue
    
    K_BadgeIssue --> K_Commute[Log Daily Commuter Transport Activity\nBus / Van Pool / Two-Wheeler]
    K_Commute --> K_ESG[Generate Commute ESG Activity Record]
    
    K_BadgeIssue --> K_GatePass[Shift Ingress at Turnstile Gate]
    K_GatePass --> K_Active[Stage: ACTIVE / Status: ON_SITE_SHIFT]
    K_Active --> K_ExitTurnstile[Shift Egress Scan]
    K_ExitTurnstile --> K_ShiftClose[Stage: CLOSED / Status: SHIFT_COMPLETED]
```

---

### 5.4 Service / Work Management Pipeline

**Domain Mission:** Direct control over external service engineers, equipment installers, calibrators, and emergency warranty repair teams. Bridges service tickets with physical machine location and safety clearances.

- **Service Pipeline Features:**
  - `ServiceRequest` - Triggered by maintenance breakdowns or scheduled preventative maintenance.
  - `TechnicianProfile` - Competency certificates, OEM authorization letter, calibration tool serials.
  - `ToolInwardDeclaration` - Recording test kits, laptops, calibration rigs entering the site to avoid export customs disputes upon exit.
  - `WorkLocationBinding` - Scoped access strictly to Machine Cell #4 or Boiler Room #2.
  - `ServiceSignOff` - Maintenance Manager sign-off confirming job completion before technician departure.

#### Service Pipeline Flow Diagram

```mermaid
flowchart TD
    S_Req([Breakdown / Service Ticket]) --> S_OEM[Assign Service Vendor & Technicians]
    S_OEM --> S_Transport[Capture Technician Logistics & Tool Transit]
    S_Transport --> S_ESG[Generate Technician Commute ESG Activity]
    S_Transport --> S_ToolPass[Register Inward Tool & Equipment Pass]
    S_ToolPass --> S_PlantApprover[Maintenance Head Approves Access]
    S_PlantApprover --> S_Arrive[Technician Arrival at Security Gate]
    S_Arrive --> S_ToolInspect[Security Inspects Tools vs. Manifest]
    S_ToolInspect --> S_Badge[Issue Service Pass & Lockout/Tagout (LOTO) Key]
    S_Badge --> S_Active[Work Execution at Machine Location]
    S_Active --> S_SignOff[Host Completes Digital Work Sign-Off]
    S_SignOff --> S_ExitCheck[Security Re-verifies Outward Tools]
    S_ExitCheck --> S_GateExit[Egress & Final Closure]
```

---

### 5.5 Material Management Pipeline

**Domain Mission:** Flawless tracking of goods moving into and out of the industrial boundary. Governs tax compliance, delivery challans, returnable tracking, security physical inspections, and supply chain transport emissions.

- **Material Classifications:**
  - `MATERIAL_INWARD` - Raw materials, consumables, office assets arriving on site.
  - `MATERIAL_OUTWARD` - Finished goods, inter-plant transfers, customer dispatches.
  - `RETURNABLE` - Reusable packaging, leased dies, tools sent for servicing, calibration samples. Requires return tracking, deadline SLA alerts, and security reminders.
  - `NON_RETURNABLE` - Consumed materials, permanent sales dispatches, scrap.
  - `SCRAP` - Metal cuttings, waste chemicals, hazardous industrial scrap. Requires environmental permits and weighbridge verification.
  - `SAMPLE` - Lab testing specimens, prototype evaluation parts.
  - `EQUIPMENT` & `TOOL` - Heavy machinery for installation or site work.
  - `EMERGENCY` - Critical replacement spare parts delivered during machine breakdowns.

#### Material Pipeline Flow Diagram

```mermaid
flowchart LR
    M_Req([Material Movement Request]) --> M_Type{Pass Type}
    M_Type -->|Inward| M_InChallan[Inward PO / Invoice / Delivery Challan]
    M_Type -->|Outward| M_OutPass[Outward Gate Pass & Tax Invoice]
    
    M_InChallan --> M_Veh[Link Logistics Transporter & Truck]
    M_OutPass --> M_Veh
    
    M_Veh --> M_TranspLog[Capture Route, Fuel, Payload, Transporter]
    M_TranspLog --> M_ESG[Generate Scope 3 Cat 4/9 Transport ESG Activity]
    
    M_TranspLog --> M_GateArrive[Truck Arrives at Logistics Gate]
    M_GateArrive --> M_WeighGross[Weighbridge: Gross Weight Captured]
    M_WeighGross --> M_Unload[Unload / Inspection by Stores Dept]
    M_Unload --> M_WeighTare[Weighbridge: Tare Weight Captured\nNet Material Calculated]
    
    M_WeighTare --> M_RetCheck{Returnable Material?}
    M_RetCheck -->|Yes| M_ReturnTracker[Open Returnable Tracker & Escrow SLA]
    M_RetCheck -->|No| M_ClosePass[Finalize Inward/Outward Pass]
    M_ReturnTracker --> M_ClosePass
    M_ClosePass --> M_TruckExit[Security Validates Challan & Clears Exit Barrier]
```

---

### 5.6 Vehicle Management Pipeline

**Domain Mission:** Governance of all rolling stock entering plant premises, including internal forklifts, company pool cars, commercial logistics lorries, and visitor private vehicles.

- **Vehicle Governance Attributes:**
  - Vehicle Registration, Class, Fuel Type, Engine Emission Standard (Euro 6 / BS-VI / Electric).
  - Mandatory Document Checks: Insurance Policy, Pollution Certificate (PUC), Fitness Certificate, Hazardous Chemical Transport License.
  - Driver Licensing & Alcohol / Breathalyzer test verification at gate.
  - Weight discrepancy alert (Weighbridge Gross - Tare vs. Declared PO weight).
  - Direct integration with Normalized Transport and ESG Activity engines.

#### Vehicle Pipeline Flow Diagram

```mermaid
flowchart TD
    V_Arrival([Commercial / Fleet Vehicle Arrives]) --> V_ANPR[ANPR Camera Scans Registration Plate]
    V_ANPR --> V_DriverCheck[Driver Verification & Breathalyzer / KYC]
    V_DriverCheck --> V_DocCheck{Insurance & PUC Valid?}
    
    V_DocCheck -->|Expired / Missing| V_Hold[Gate Denial: Security Incident Logged]
    V_DocCheck -->|Valid| V_TypeCheck{Vehicle Purpose}
    
    V_TypeCheck -->|Raw Material / Dispatch| V_TareGross[Weighbridge Gross Weighing]
    V_TypeCheck -->|Passenger / Employee / Service| V_Parking[Direct to Designated Zone / Bay]
    
    V_TareGross --> V_TranspLog[Capture Route, Fuel Litres / Distance, Engine Type]
    V_Parking --> V_TranspLog
    
    V_TranspLog --> V_ESG_Emit[Auto-Generate Scope 1 / Scope 3 Vehicle ESG Activity]
    
    V_ESG_Emit --> V_Active[Stage: ACTIVE / Status: ON_PREMISES]
    V_Active --> V_Work[Loading / Unloading / Maintenance on Site]
    
    V_Work --> V_ExitGate[Arrival at Exit Weighbridge / Gate]
    V_ExitGate --> V_WeighTareExit[Tare Weight Verification & Gate Pass Clearance]
    V_WeighTareExit --> V_BarrierClear[Boom Barrier Actuation & Exit Audit]
    V_BarrierClear --> V_Closed[Stage: CLOSED / Status: CHECKED_OUT]
```

---

### 5.7 Vehicle & Transport Integrated Architecture Diagram (Diagram 9)

The Vehicle and Transport domains provide a normalized mobility and freight foundation across all enterprise physical movements:

```mermaid
graph TB
    subgraph Vehicle_Domain["Vehicle Management Domain"]
        VEH_REG["Vehicle Master & Registration\n(Fleet, Supplier, Transporter, Private)"]
        DRV_MGT["Driver Profile & Breathalyzer\n(KYC, License, Alcohol Test)"]
        DOC_MGT["Vehicle Compliance Vault\n(PUC, Insurance, Fitness, Hazchem)"]
    end

    subgraph Gate_Edge_Hardware["Physical Gate & Weighbridge Layer"]
        ANPR_CAM["ANPR High-Speed Cameras\n(Plate OCR Match)"]
        WEIGH_HW["Weighbridge Indicator (RS-232/Modbus)\n(Gross Weight & Tare Weight)"]
        BARRIER_RELAY["Boom Barrier Actuator\n(Lane Ingress / Egress)"]
        TELEMATICS["GPS Telematics / Odometer Logger\n(Distance & Fuel Meter)"]
    end

    subgraph Transport_Normalization["Normalized Transport Service"]
        DIM_VEC["Independent Dimensional Vectors\nMode | Ownership | Vehicle Class | Fuel | Usage | Occupancy"]
        ROUTE_DERIV["Symmetric GIS Distance Derivation\n(Bidirectional Matrix & Round-Trip 2x)"]
        PROV_TAG["Provenance Engine\nMEASURED | USER_PROVIDED | SYSTEM_ESTIMATED"]
        MEAS_METH["Measurement Method Classifier\nWEIGHBRIDGE | ODOMETER | TELEMATICS | GIS"]
    end

    subgraph Operational_Pipelines["Cross-Pipeline Mobility Consumers"]
        VIS_PIPE["Visitor Transport"]
        CUST_PIPE["Customer Delegation Itinerary"]
        CONT_PIPE["Contractor Commute Bus / Pool"]
        SERV_PIPE["OEM Technician Van Transit"]
        MAT_PIPE["Material Freight Inward / Outward"]
    end

    subgraph ESG_GHG_Output["ESG Activity & Carbon Accounting"]
        ESG_ACT["Source-Linked ESG Activity Record\n(Tonnes-KM / Litres / Passenger-KM)"]
        GHG_CALC["GHG Calculation Engine\n(Versioned Factors: DEFRA / CEA / EPA)"]
        OCC_ALLOC["Occupancy Allocator\n(Passenger Carpools vs Freight Decoupling)"]
    end

    VEH_REG & DRV_MGT & DOC_MGT --> Gate_Edge_Hardware
    ANPR_CAM & WEIGH_HW & TELEMATICS --> Transport_Normalization
    Operational_Pipelines --> Transport_Normalization

    Transport_Normalization --> DIM_VEC
    DIM_VEC & ROUTE_DERIV & PROV_TAG & MEAS_METH --> ESG_ACT
    ESG_ACT --> OCC_ALLOC
    OCC_ALLOC --> GHG_CALC
```

---

## 6. Domain Lifecycle Matrices

Each domain features customized lifecycle progressions. The platform avoids forcing heterogeneous domains into an artificial identical workflow.

| Stage | Visitor | Customer | Contractor | Service | Material | Vehicle |
|---|---|---|---|---|---|---|
| **DRAFT** | Invitation Draft / Walk-in | Visit Request Form | Vendor Profile / PO Allocation | Breakdown Ticket / OEM Request | Challan Draft / Pass Request | Trip Log Draft |
| **APPROVAL** | Host Sponsor Approval | VP / Director Approval + NDA | Safety Officer + EHS Audit + PTW | Maintenance Head Approval | Store Keeper + Commercial Clearance | Security Fleet Officer Verification |
| **SCHEDULED** | Calendar Invite Sent | Delegation Protocol Configured | Worker Roster Scheduled | Tech Arrival Window Booked | Inward Dock Slot Booked | ANPR Whitelist Queued |
| **CHECK_IN** | Kiosk Photo & EHS Video | Executive Concierge Welcome | Shift Turnstile Biometric Scan | Tool Inspection & LOTO Key Issue | Logistics Weighbridge Gross Weight | ANPR Match + Driver Breathalyzer |
| **ACTIVE** | Badge Active (Escorted) | On Premises in VIP Area | Shift Active on Shopfloor | Technician Servicing Machinery | Unloading at Warehouse Bay | Parked in Designated Commercial Bay |
| **CHECK_OUT** | Badge Surrendered | Executive Sign-off | Shift Turnstile Egress Scan | Work Sign-off & Tool Re-inspection | Tare Weight Logged & Gate Pass Signed | Exit Weighbridge + Security Clearance |
| **CLOSED** | Visit Archived | Visit Report & ESG Logged | Shift Logged to Attendance ERP | Ticket Closed & ESG Logged | ERP Movement Recorded & ESG Logged | Fleet Log Archived & ESG Logged |

