# Customer Audits & Inspections Management

## 1. Overview

In industrial manufacturing, customer audits and inspections are high-stakes regulatory and commercial events. Automobile OEMs, aerospace prime contractors, and medical device clients frequently send specialized audit teams to inspect production lines, evaluate supplier quality assurance systems, verify cleanroom environments, and sign off on new tooling prior to mass production.

VMS Enterprise provides first-class support for customer audits and inspections within `@vms/customer`.

---

## 2. Diagram 6: Audit & Inspection Process Flow

```mermaid
flowchart TD
    subgraph "Phase 1: Scheduling & Scoping"
        A[Customer Schedules Audit / Inspection] --> B{Select Domain Type}
        B -- CUSTOMER_AUDIT --> C1[Capture Audit Details<br/>Type: VDA 6.3 / IATF 16949<br/>Scope: Production lines<br/>Lead Auditor designation]
        B -- CUSTOMER_INSPECTION --> C2[Capture Inspection Details<br/>Category: Pre-dispatch / Tooling / First Article<br/>Part reference numbers<br/>Lead Inspector designation]
        C1 --> D[Precedence Engine: Inject Mandatory QA Manager Escort]
        C2 --> D
    end

    subgraph "Phase 2: Approvals & Gate Entry"
        D --> E[Plant Manager / Host Formally Approves Agenda]
        E --> F[Verify Bilateral NDA & Safety Induction]
        F --> G[Gate Check-In at Security Turnstiles]
        G --> H[Auditors enter facility under QA Escort]
    end

    subgraph "Phase 3: Execution & Formal Closure"
        H --> I[Physical Plant Audit / Line Inspection]
        I --> J[Exit Gate Turnstiles (Check-Out)]
        J --> K[Host Submits Formal Closure Sign-off]
        K --> L{Observations / Non-Conformances?}
        L -- Yes --> M[Record Follow-up Action Items & PPAP Tracker refs]
        L -- No --> N[Record Clean Approval Certificate]
        M --> O[Attach Evidence Documents & Final Report]
        N --> O
        O --> P([Visit Marked CLOSED with Full Evidence Vault])
    end
```

---

## 3. Audit & Inspection Details Model

### 3.1 Customer Audit Details (`CustomerAuditDetails`)
Captured when `visitTypeCode = 'CUSTOMER_AUDIT'`:
- **`auditType`:** Categorization adhering to automotive and industrial standards:
  - `PROCESS_AUDIT` (e.g., VDA 6.3 Process Audit for manufacturing stages)
  - `SYSTEM_AUDIT` (e.g., IATF 16949 / ISO 9001 Management System Audit)
  - `PRODUCT_AUDIT` (e.g., Product capability and dimensional audits)
  - `QUALITY_AUDIT`
  - `COMPLIANCE_AUDIT`
  - `SUPPLIER_ASSESSMENT`
- **`auditScope`:** Explicit manufacturing lines, cleanrooms, or assembly stations authorized for inspection (e.g., *"Radial tire extruders and ultrasonic bead inspection lines"*).
- **`leadAuditorName` & `leadAuditorPersonId`:** Lead auditor responsible for formal audit protocols.
- **`auditingOrganization`:** Name of OEM or certified auditing body.

### 3.2 Customer Inspection Details (`CustomerInspectionDetails`)
Captured when `visitTypeCode = 'CUSTOMER_INSPECTION'`:
- **`inspectionCategory`:**
  - `PRE_DISPATCH`: Finished goods batch inspection prior to container loading.
  - `TOOLING`: Die, mold, and tooling verification before pilot runs.
  - `FIRST_ARTICLE`: Production Part Approval Process (PPAP) Level 3 first article validation.
  - `PRODUCT_INSPECTION`
  - `PROCESS_INSPECTION`
- **`productProcessReference`:** Serial numbers, batch identifiers, or part numbers undergoing inspection.

---

## 4. Formal Closure & Evidence Repository

Customer audits cannot be concluded with a simple security gate departure. They require formal administrative closure with signoffs and documentation:

```typescript
const closedAudit = await service.closeCustomerVisit({
  tenantId: TENANT_A,
  transactionId: auditVisit.transactionId,
  closedByUserId: HOST_USER_ID,
  notes: 'VDA 6.3 Process audit completed. 2 minor observations documented in PPAP tracker.',
  followUpRequired: true,
  evidenceDocumentRefs: ['DOC-AUDIT-VDA-2026-01', 'DOC-PPAP-SIGNOFF-04'],
});
```

### 4.1 Closure Summary Contract (`CustomerVisitClosure`)
- **`completed`:** Boolean flag certifying all audit items were executed.
- **`followUpRequired`:** Triggers automated reminders for corrective action plans (8D / CAPA).
- **`evidenceDocumentRefs`:** Array of linked document IDs in the centralized document vault.
- **`closedBy` & `closedAt`:** Audit timestamp and authorizer user ID.
