# Customer Quality & Process Audits

## 1. Overview & Industrial Significance

In automotive manufacturing and tier-1 industrial supply chains, customer audits represent formal, legally binding evaluations of plant quality management systems, line capability, and statistical process controls.

Supported audit types in VMS Enterprise include:
- `IATF_16949`: International Automotive Task Force quality management system audit.
- `VDA_6_3`: German automotive industry standard process audit for product life cycles.
- `ISO_9001`: General quality management system compliance.
- `SPECIAL_PROCESS_AUDIT`: Heat treatment (CQI-9), plating (CQI-11), or welding audits.
- `LINE_CERTIFICATION`: Customer-specific production line sign-off prior to SOP (Start of Production).

---

## 2. Diagram 6: Customer Audit & Technical Inspection Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Auditor as Lead Customer Auditor
    actor Host as Plant Quality Manager
    participant CS as CustomerService
    participant Gate as Plant Gate Turnstile
    participant DB as RelationalDatabase

    Auditor->>CS: Submit Visit Request (Type: CUSTOMER_AUDIT)
    Note over CS: Precedence engine injects QUALITY_REP & ESCORT
    CS->>Host: Approval Task Assigned
    Host->>CS: approveCustomerVisit(notes: "Audit agenda confirmed")
    Auditor->>Gate: Present QR E-Pass & ID
    Gate->>CS: checkInCustomerVisit()
    Note over Gate: Bilateral NDA verified; Badge issued
    Auditor->>Host: Conduct VDA 6.3 Process Walkthrough
    Host->>CS: closeCustomerVisit(followUpRequired: true, notes: "2 minor findings in PPAP")
    CS->>DB: Record closure summary and PPAP tracker references
    CS-->>Auditor: Formal Audit Closure Report Generated
```

---

## 3. Mandatory Audit Requirements Injection

When a visit is scheduled with `visitTypeCode = 'CUSTOMER_AUDIT'`, the precedence resolution engine automatically injects non-negotiable requirements:
1. `QUALITY_REP`: Mandates attendance of the plant Quality Assurance Manager and audit escort.
2. `ESCORT`: Mandates designated corporate host accompaniment across manufacturing lines.
3. `SAFETY_INDUCTION`: Mandates safety briefing and acknowledgment before entering active shop floors.
4. `PPE`: Enforces safety shoes, high-visibility vest, and eye protection requirements.

---

## 4. Audit Findings & Non-Conformance Traceability

Upon audit completion, the closure report captures:
- Lead auditor signature / verification.
- Classification of non-conformances (Major, Minor, Opportunity for Improvement).
- PPAP or corrective action document reference IDs (`evidenceDocumentRefs`).
- Follow-up timeline and re-audit triggers.
