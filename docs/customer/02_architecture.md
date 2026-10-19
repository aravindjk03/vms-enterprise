# Customer Domain Architecture & Relational Model

## 1. Domain Architectural Model

The Customer Management Domain (`@vms/customer`) is built upon clean relational foundations with strict domain boundaries, multi-tenant isolation, and explicit decoupling from the generic visitor subsystem.

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
        +String reference_number
        +UUID tenant_id
        +UUID site_id
        +UUID customer_account_id
        +CustomerVisitTypeCode visit_type_code
        +String title
        +UUID executive_host_id
        +CustomerBookingMode booking_mode
        +Timestamp scheduled_start
        +Timestamp scheduled_end
        +Timestamp actual_arrival
        +Timestamp actual_entry
        +Timestamp actual_exit
        +TransactionStage stage
        +TransactionStatus status
        +Integer version
        +ApprovalState approval_state
        +Boolean nda_signed
        +String nda_document_ref
        +CustomerPhotoPolicy photography_policy
        +Boolean escort_required
        +UUID transport_activity_id
        +UUID ghg_activity_id
        +JSON audit_details
        +JSON inspection_details
        +JSON closure_summary
    }

    class CustomerVisitParticipant {
        +UUID participant_id
        +UUID customer_visit_id
        +UUID person_id
        +UUID customer_rep_id
        +String full_name
        +String designation
        +String email
        +String phone
        +Boolean is_lead
        +IdentityStatus identity_status
        +PresenceStatus presence_status
        +Timestamp actual_arrival
        +Timestamp actual_entry
        +Timestamp actual_exit
        +String transport_mode
    }

    class CustomerRequirement {
        +UUID requirement_id
        +UUID tenant_id
        +UUID customer_visit_id
        +CustomerRequirementType requirement_type
        +String description
        +Boolean is_mandatory
        +Boolean is_fulfilled
        +Timestamp fulfilled_at
        +RequirementScope scope
    }

    class NormalizedTransportActivity {
        +UUID id
        +String reference_number
        +UUID tenant_id
        +UUID site_id
        +String source_domain
        +String source_transaction_id
        +TransportMode mode
        +OwnershipType ownership
        +VehicleClass vehicle_class
        +FuelType fuel_type
        +UsageType usage_type
        +Integer occupancy
        +Decimal distance
        +DataProvenance distance_provenance
    }

    class GHGActivity {
        +UUID id
        +String reference_number
        +UUID tenant_id
        +UUID site_id
        +String source_domain
        +String source_transaction_id
        +String scope
        +String category
        +Decimal activity_quantity
        +String activity_unit
        +String calculation_status
    }

    class GateEvent {
        +UUID event_id
        +UUID tenant_id
        +UUID site_id
        +UUID gate_id
        +String source_domain
        +UUID source_transaction_id
        +GateEventType event_type
        +Timestamp timestamp
    }

    class SiteSecurityRule {
        +String rule_id
        +UUID site_id
        +String rule_type
        +String policy_value
        +Boolean is_mandatory
    }

    ExternalOrganization "1" <-- "1..*" CustomerAccount : links canonical org
    CustomerAccount "1" <-- "0..*" CustomerRepresentative : maintains reps
    Person "1" <-- "1" CustomerRepresentative : resolves identity
    CustomerAccount "1" <-- "0..*" CustomerVisitTransaction : executes visits
    CustomerVisitTransaction "1" <-- "1..*" CustomerVisitParticipant : includes delegates
    Person "1" <-- "1" CustomerVisitParticipant : resolves individual
    CustomerVisitTransaction "1" <-- "0..*" CustomerRequirement : enforces compliance
    CustomerVisitTransaction "1" --> "0..1" NormalizedTransportActivity : derives movement
    NormalizedTransportActivity "1" --> "0..1" GHGActivity : feeds Scope 3
    CustomerVisitTransaction "1" --> "0..*" GateEvent : logs audit turnstiles
    SiteSecurityRule "1..*" --> "1" CustomerVisitTransaction : overrides policies
```

---

## 3. Database Schema Mapping & Constraints

### 3.1 Primary Customer Domain Tables
1. **`customer_accounts`**: Stores institutional customer profile, OEM tier, commercial owner, approved sites, and default security rules. Unique on `(tenant_id, account_code)`.
2. **`customer_representatives`**: Associates external customer contacts to canonical `persons` records, maintaining verified email, phone, job title, and designation.
3. **`customer_visit_types`**: Seed master table of supported customer engagements (`CUSTOMER_MEETING`, `PLANT_VISIT`, `MANAGEMENT_VISIT`, `CUSTOMER_AUDIT`, `CUSTOMER_INSPECTION`, `DELEGATION_VISIT`, `PRODUCT_REVIEW`, `PROCESS_REVIEW`).
4. **`customer_visit_transactions`**: The central transactional ledger for customer visits, holding state, timestamps, host sponsor, security settings, and references to transport, GHG, and audit records.
5. **`customer_visit_participants`**: Individual delegation attendees, tracking presence status (`EXPECTED`, `ARRIVED`, `CHECKED_IN`, `DEPARTED`, `NO_SHOW`), turnstile entries, and identity verification.
6. **`customer_requirements`**: Evaluated compliance requirements (NDA, safety inductions, PPE, quality escorts, photography prohibitions) bound to the visit.

### 3.2 Immutability and Audit Invariants
- Financial and carbon calculations in `ghg_calculations` and `gate_events` are strictly immutable (`isImmutable: true`).
- Any state transition, participant arrival, or schedule adjustment generates an audit log entry in `audit_logs` and an event in `domain_events`.
