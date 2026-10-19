# Customer Domain Architecture & Relational Model

## 1. Domain Architectural Model

The Customer Management Domain (`@vms/customer`) in VMS Enterprise is an enterprise-grade subsystem engineered specifically for governing business interactions with OEM customers, strategic clients, commercial partners, quality auditors, and executive delegations across high-security manufacturing plants, industrial complexes, and corporate campuses.

In mission-critical industrial manufacturing (such as automotive OEMs, aerospace, defense, and heavy machinery), customer engagements are fundamentally different from generic transient visits. They involve:
- Formal institutional relationships governed by master accounts, legal trade names, commercial ownership, and vendor ratings.
- High-stakes technical audits (e.g., IATF 16949, VDA 6.3 process audits, ISO 9001 quality audits).
- Structured product and tooling inspections prior to production part approval (PPAP) and dispatch.
- Multi-participant executive delegations arriving via shared chartered transport.
- Strict intellectual property protections including bilateral Non-Disclosure Agreements (NDAs), photography prohibitions, and technical escort mandates.
- Embedded ESG Scope 3 Category 6 (Business Travel) activity data capture to track customer travel carbon footprints without disrupting factory operations.

---

## 2. Diagram 1: Entity Architecture

The following class diagram illustrates the relational structure of the Customer Domain and its explicit connections to shared platform services.

```mermaid
classDiagram
    direction TB

    class ExternalOrganization {
        +UUID org_id
        +UUID tenant_id
        +String code
        +String name
        +UUID org_type_id
        +Boolean is_active
        +Timestamp created_at
    }

    class CustomerAccount {
        +UUID customer_account_id
        +UUID tenant_id
        +UUID external_org_id
        +String account_code
        +String account_name
        +CustomerClassification classification
        +CustomerTier tier
        +CustomerAccountStatus status
        +String registration_number
        +UUID commercial_owner_user_id
        +JSON approved_site_ids
        +Boolean default_nda_required
        +CustomerPhotoPolicy default_photography_policy
        +Boolean default_escort_required
        +Timestamp created_at
    }

    class Person {
        +UUID person_id
        +UUID tenant_id
        +String first_name
        +String last_name
        +String display_name
        +Timestamp created_at
    }

    class CustomerRepresentative {
        +UUID rep_id
        +UUID tenant_id
        +UUID customer_account_id
        +UUID person_id
        +String job_title
        +String department
        +Boolean is_primary
        +IdentityStatus identity_verification_status
        +ProfileStatus profile_status
        +Timestamp created_at
    }

    class CustomerVisitTransaction {
        +UUID transaction_id
        +UUID tenant_id
        +UUID site_id
        +UUID customer_account_id
        +CustomerVisitTypeCode visit_type_code
        +String reference_number
        +String title
        +UUID executive_host_id
        +CustomerBookingMode booking_mode
        +Timestamp scheduled_start
        +Timestamp scheduled_end
        +TransactionStage stage
        +TransactionStatus status
        +ApprovalState approval_state
        +Boolean nda_signed
        +CustomerPhotoPolicy photography_policy
        +Boolean escort_required
        +UUID transport_activity_id
        +UUID ghg_activity_id
        +UUID workflow_instance_id
        +Integer version
    }

    class CustomerVisitParticipant {
        +UUID participant_id
        +UUID customer_visit_id
        +UUID person_id
        +UUID customer_rep_id
        +String full_name
        +Boolean is_lead
        +IdentityStatus identity_status
        +PresenceStatus presence_status
        +Timestamp actual_arrival
        +Timestamp actual_entry
        +Timestamp actual_exit
    }

    class CustomerRequirement {
        +UUID requirement_id
        +UUID tenant_id
        +UUID customer_visit_id
        +RequirementType requirement_type
        +String description
        +Boolean is_mandatory
        +Boolean is_fulfilled
        +Timestamp fulfilled_at
    }

    ExternalOrganization "1" <|-- "0..*" CustomerAccount : links
    CustomerAccount "1" *-- "0..*" CustomerRepresentative : employs
    Person "1" <-- "1" CustomerRepresentative : canonical profile
    CustomerAccount "1" *-- "0..*" CustomerVisitTransaction : sponsors
    CustomerVisitTransaction "1" *-- "1..*" CustomerVisitParticipant : includes
    CustomerVisitTransaction "1" *-- "0..*" CustomerRequirement : enforces
    Person "1" <-- "0..1" CustomerVisitParticipant : resolves
    CustomerRepresentative "1" <-- "0..1" CustomerVisitParticipant : references
```

---

## 3. Diagram 2: Domain Boundary & Strict Independence

Customer transactions are completely decoupled from transient visitor transactions.
- **Strict Rule:** `visitor_type = 'CUSTOMER'` is strictly forbidden in VMS Enterprise.
- Customers have independent database schemas (`customer_accounts`, `customer_representatives`, `customer_visit_transactions`, `customer_visit_participants`, `customer_requirements`), dedicated approval workflows, dedicated lifecycle state machines, and specialized auditing features.
- Cross-domain interactions occur strictly through normalized shared platform infrastructure (Identity, Transport, GHG Engine, Gate Devices, Workflow Engine, and Audit Ledger).

```mermaid
graph TD
    subgraph Shared_Enterprise_Infrastructure["Shared Enterprise Infrastructure"]
        ID["Identity & Access (Persons, Users, RBAC)"]
        TP["Transport Service (Normalized Vectors)"]
        GHG["GHG Calculation Engine (Scope 1, 2, 3)"]
        GT["Gate Hardware Engine (Turnstiles, ANPR, Access Events)"]
        WF["Workflow & Approval Engine (Stages, Policies, Quorums)"]
        AL["Immutable Audit & Forensic Ledger (SHA-256 Chains)"]
    end

    subgraph Generic_Visitor_Domain["Domain: Generic Visitor (Part 6)"]
        VP["Visitor Profiles"]
        VT["Visitor Transactions"]
        VGP["Visitor Group Participants"]
        VEP["Visitor E-Passes"]
    end

    subgraph Customer_Management_Domain["Domain: Customer Management (Part 7)"]
        CA["Customer Accounts"]
        CR["Customer Representatives"]
        CVT["Customer Visit Transactions"]
        CVP["Customer Visit Participants"]
        CRQ["Customer Requirements & Policies"]
        CAD["Customer Audit Details"]
        CID["Customer Inspection Details"]
    end

    CA -.-> ID
    CR -.-> ID
    CVT --> TP
    CVT --> GHG
    CVT --> GT
    CVT --> WF
    CVT --> AL
    CVP -.-> ID

    VT --> TP
    VT --> GHG
    VT --> GT
    VT --> WF
    VT --> AL

    style Customer_Management_Domain fill:#f0f7ff,stroke:#005fb8,stroke-width:2px
    style Generic_Visitor_Domain fill:#fff5f0,stroke:#d13438,stroke-width:2px
    style Shared_Enterprise_Infrastructure fill:#f4f6f8,stroke:#605e5c,stroke-width:2px
```

---

## 4. Multi-Tenant Data Isolation & Site Scoping

All customer master data, visit transactions, and gate passes are strictly scoped to the tenant organization (`tenant_id`) and physical plant site (`site_id`). Cross-tenant visibility is strictly prohibited at both the database relational engine (RLS) and API service layers.
