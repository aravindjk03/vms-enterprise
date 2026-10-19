# VMS Enterprise: Shared Platform Services Architecture

## 1. Architectural Philosophy: The Shared Service Invariant

In VMS Enterprise, shared services provide foundational capabilities across all transactional business domains (**Visitor, Customer, Contractor, Service, Material, Vehicle**). 

### The Core Invariant:
**The shared layer must never contain domain-specific assumptions or hard-coded business logic.**

For example:
- The **Transport Service** handles normalized mobility dimensions (mode, ownership, fuel, vehicle class, occupancy, route) identically whether the subject is an executive client, an HVAC service technician, or a 40-tonne raw material lorry.
- The **Document Service** handles cryptographic storage, OCR verification, expiration tracking, and audits identically whether the document is a visitor government ID, a contractor labor license, an OEM technician calibration certificate, or a hazardous transport PUC.
- The **Gate Engine** validates physical passage eligibility identically across human turnstiles, vehicle boom barriers, and logistics weighbridges, strictly separated from business workflow rules.

---

## 2. Shared Services Architecture Diagram

```mermaid
flowchart TB
    subgraph Consumer_Domains["Business Consumer Domains"]
        D_VIS["Visitor Domain"]
        D_CUST["Customer Domain"]
        D_CONT["Contractor Domain"]
        D_SERV["Service Domain"]
        D_MAT["Material Domain"]
        D_VEH["Vehicle Domain"]
    end

    subgraph Core_Shared_Platform["Cross-Cutting Shared Platform Services"]
        direction TB
        
        subgraph Sec_Ident["Identity & Governance"]
            SVC_ID["Identity & Auth Service\n(OAuth2 / OIDC / MFA / Passkeys)"]
            SVC_PERM["Authorization Service\n(RBAC + ABAC + Tenant Guard)"]
            SVC_AUDIT["Audit & Provenance Engine\n(Append-Only Cryptographic Log)"]
        end

        subgraph Process_Eng["Process & Orchestration"]
            SVC_WF["Workflow & Approval Engine\n(State Machine / Escalations / SLAs)"]
            SVC_NOTIF["Notification Hub\n(Email, SMS, WhatsApp, WebPush)"]
            SVC_EVT["Event Bus / Outbox Service\n(Redis Streams / Kafka Bridge)"]
        end

        subgraph Physical_Infra["Physical Execution & Assets"]
            SVC_GATE["Gate Execution Engine\n(Hardware Bridge / Passage Rules)"]
            SVC_ACC["Access & Zone Engine\n(Credentials / Zone Capacities)"]
            SVC_DOC["Document & Vault Service\n(S3-Compatible / KMS Encrypted)"]
        end

        subgraph Mobility_ESG["Mobility & Sustainability"]
            SVC_TRANS["Normalized Transport Service\n(Dimensional Validation & Derivation)"]
            SVC_ACT["ESG Activity Capture Service\n(Source-Linked Normalizer)"]
            SVC_GHG["GHG Calculation Engine\n(Versioned Factor Registry)"]
        end

        subgraph Data_Obs["Data & Observability"]
            SVC_SRCH["Search & Indexing Engine"]
            SVC_REP["Reporting & Export Service"]
            SVC_OBS["Observability & Telemetry\n(OpenTelemetry, Prometheus, Logs)"]
        end
    end

    Consumer_Domains --> Sec_Ident
    Consumer_Domains --> Process_Eng
    Consumer_Domains --> Physical_Infra
    Consumer_Domains --> Mobility_ESG
    Consumer_Domains --> Data_Obs

    SVC_TRANS --> SVC_ACT
    SVC_ACT --> SVC_GHG
    SVC_GATE --> SVC_ACC
```

---

## 3. Inventory & Specifications of Shared Platform Services

### 3.1 Identity, Authentication & Authorization Service
- **Identity Provider Integration:** SAML 2.0 / OIDC integrations with Azure AD, Okta, Google Workspace, and Ping Identity.
- **Authentication:** Multi-factor authentication (MFA via TOTP, SMS, FIDO2 WebAuthn), session tokens, ephemeral JWTs for API access.
- **Granular Authorization:** Hybrid RBAC (Role-Based Access Control) + ABAC (Attribute-Based Access Control) enforcing contextual rules:
  - Multi-tenant boundary checks: `tenant_id`, `organization_id`, `site_id`.
  - Temporal boundaries: Active shift or scheduled appointment window.
  - Least privilege: Privacy partitions preventing ESG managers from viewing biometric templates or government ID scans.

### 3.2 Configurable Workflow & Approval Engine
- **Engine Principles:** Decoupled DAG (Directed Acyclic Graph) state machine.
- **Capabilities:**
  - Sequential, parallel, and multi-tier approval hierarchies.
  - Dynamic escalations based on SLA timers (e.g., auto-escalate to Plant Manager if unapproved after 2 hours).
  - Out-of-office delegation with audit tracking.
  - Conditional branch evaluation based on transaction attributes (e.g., if contractor headcount > 20 or visitor requires restricted chemical zone access, require EHS Head approval).

### 3.3 Document & Legal Compliance Service
- **Centralized Schema:** Single repository for documents across all domains (`owner_type`, `owner_id`, `doc_type`, `version`, `expiry_date`, `verification_status`).
- **Capabilities:**
  - Automated OCR extraction and identity verification.
  - NDA workflow: Pre-signing with DocuSign / Adobe Sign webhook integration or internal canvas signature.
  - Document expiration monitors triggering pro-active renewal notifications before site arrival.
  - Zero plain-text document storage; S3 client-side envelope encryption with AES-256-GCM.

### 3.4 Normalized Transport Service
- **Single Source of Truth:** Reusable across Visitor, Customer, Contractor, Service, Material, and Vehicle.
- **Decoupled Dimensions:** Independent dimensional vectors avoiding brittle combinations (e.g., `Mode: Car` + `Ownership: Personal` + `Fuel: Petrol` + `Usage: Carpool`).
- **Automated Distance Derivation:** Integrated GIS route estimation between Origin and Destination with explicit provenance tracking (`MEASURED`, `USER_PROVIDED`, `SYSTEM_ESTIMATED`).

### 3.5 Gate Management & Physical Access Control Engine
- **Separation of Eligibility from Passage:**
  - *Business Pipeline:* Determines if an appointment, contractor work order, or material consignment is commercially and administratively valid.
  - *Gate Engine:* Evaluates real-time physical conditions (lane authorization, current zone occupancy, active emergency muster lockouts, hardware health) before issuing an actuation trigger to hardware.
- **Offline Tolerance:** Local edge gateway maintains an encrypted SQLite/Redis cache of scheduled transactions and valid cryptographic tokens for up to 72 hours of network disconnection.

```mermaid
flowchart TD
    subgraph Gate_Architecture["Gate Management Architecture"]
        ClientApp["Gate Terminal / Kiosk UI"] --> GateAPI["Gate Management API"]
        GateAPI --> GatePolicy["Physical Access Policy Evaluator"]
        
        GatePolicy --> BizCheck["Query Pipeline State\n(Must be Stage: CHECK_IN / Status: APPROVED)"]
        GatePolicy --> SafetyCheck["Query EHS State\n(Induction Valid & PTW Active?)"]
        GatePolicy --> CapacityCheck["Query Zone Capacity\n(Zone Not Overcrowded?)"]
        
        BizCheck & SafetyCheck & CapacityCheck --> DecisionNode{"All Gates Cleared?"}
        
        DecisionNode -->|No| RejectGate["Issue Gate Refusal Alert\nLog Security Audit Event"]
        DecisionNode -->|Yes| EdgeCmd["Dispatch Unlock Command to Edge Controller"]
        
        EdgeCmd --> EdgeRelay["Site Edge Gateway (MQTT / WSS)"]
        EdgeRelay --> HW_Turnstile["Turnstile Relay / Boom Barrier Actuator"]
        EdgeRelay --> HW_Feedback["Sensor Feedback: Passage Complete / Tailgate Alert"]
        HW_Feedback --> GateAPI
        GateAPI --> LogPassage["Transition Stage: ACTIVE / Status: ON_PREMISES"]
    end
```

### 3.6 Event Bus & Outbox Service
- **Transactional Outbox Pattern:** Ensures zero message loss during database commit and broker publication.
- **Transport Agnostic:** Pluggable adapter interface supporting Redis Streams in single-cluster deployments, seamlessly upgrading to Apache Kafka / Redpanda for multi-region scale.
- **Event Contracts:** Strongly typed Avro / JSON schemas with strict semantic versioning.

### 3.7 Audit & Provenance Service
- **Immutable Audit Trail:** Append-only cryptographic transaction ledger.
- **Forensic Attribution:** Captures `who`, `when`, `what`, `client_ip`, `user_agent`, `previous_state`, `new_state`, and `mutation_source`.
- **ESG Provenance:** Tracks data genesis (`MEASURED`, `USER_PROVIDED`, `SYSTEM_ESTIMATED`, `SYSTEM_CALCULATED`, `IMPORTED`).

### 3.8 Notification Hub
- **Multi-Channel Dispatch:** Email (SMTP/SendGrid), SMS (Twilio), WhatsApp Business API, Push Notifications (Firebase FCM), In-App WebSockets.
- **Template Management:** Localized, role-tailored notifications with dynamic variable interpolation and rate limiting.

### 3.9 Observability & System Health
- **Distributed Tracing:** OpenTelemetry instrumentation across all services and database queries.
- **Metrics:** Prometheus exporters tracking gate passage latency, workflow approval duration, ESG calculation throughput.
- **Structured Logging:** JSON logs with correlation IDs (`trace_id`, `span_id`, `tenant_id`).
