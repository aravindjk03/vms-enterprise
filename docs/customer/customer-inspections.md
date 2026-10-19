# Customer Technical & Product Inspections

## 1. Overview & Inspection Classifications

Customer inspections involve hands-on verification of manufactured components, raw materials, stamping dies, injection molds, or production machinery prior to formal production part approval (PPAP) and dispatch release.

### 1.1 Inspection Categories
- `TOOLING_INSPECTION`: Die trials, dimensional verification of stamping tools and molds.
- `FIRST_ARTICLE_INSPECTION`: Full geometric and chemical validation of first batch production parts (AS9102 / IATF).
- `PRE_SHIPMENT_INSPECTION`: Final acceptance testing and packaging verification prior to shipping critical lots.
- `PROCESS_RUNOFF`: Multi-hour continuous production run-off demonstrating target Cp and Cpk capability indices.

---

## 2. Diagram 4: Customer Technical & PPAP Inspection Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Inspector as Customer Lead Inspector
    actor SQE as Plant Supplier Quality Engineer
    participant CS as CustomerService
    participant Gate as Plant Gate Turnstile
    participant Lab as Metrology / Cleanroom Lab
    participant DB as RelationalDatabase

    Inspector->>CS: Submit Inspection Request (Type: CUSTOMER_INSPECTION)
    Note over CS: Injects Cleanroom PPE, Photography Prohibited & Technical Escort
    CS->>SQE: Inspection Notification & Approval Request
    SQE->>CS: approveCustomerVisit(notes: "Tooling dies & CMM fixture prepared")
    
    Inspector->>Gate: Present QR E-Pass & Credentials
    Gate->>CS: checkInCustomerVisit()
    Note over Gate: Bilateral NDA verified; Badge issued
    
    Inspector->>Lab: Execute Geometric Measurement & PPAP First Article Verification
    
    alt Inspection Criteria Satisfied
        SQE->>CS: closeCustomerVisit(notes: "Die trials passed - Cpk > 1.67", followUpRequired: false)
        CS->>DB: Record inspection status = PASSED & link metrology certificate
    else Discrepancy / Non-Conformance Found
        SQE->>CS: closeCustomerVisit(notes: "Flash defect on parting line", followUpRequired: true)
        CS->>DB: Log quarantine hold reference & schedule re-trial
    end
```

---

## 3. Technical Escort & Cleanroom PPE Mandates

Inspections frequently occur in sensitive cleanrooms, metrology labs, or high-temperature foundry areas. The system dynamically enforces:
- Cleanroom gowning and ESD (Electrostatic Discharge) protection requirements.
- Hazardous area authorizations (restricted zone clearance).
- Photography prohibitions to prevent unauthorized capture of die geometries or confidential fixtures.

---

## 3. Discrepancy Logging & Hold Authorizations

If parts fail inspection criteria during the customer visit:
- The customer lead inspector can log discrepancies directly into the visit findings.
- The system enables quarantine holds on the associated batch/lot reference IDs.
- Formal visit closure records whether the visit resulted in `PASSED`, `CONDITIONAL_PASS`, or `FAILED_REWORK_REQUIRED`.
