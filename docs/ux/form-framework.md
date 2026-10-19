# VMS Enterprise: Enterprise Form Framework Specification

## 1. Architectural Philosophy: The Transactional Form Pattern

Industrial workflows in multi-site manufacturing facilities require forms that handle high data integrity, strict statutory compliance, physical access authorization, and automated ESG activity capture—without cognitive overload.

### The Unified Transaction Form Layout:
```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: Transaction Code, Tenant Context, Status Badge, Progress Steps  │
├────────────────────────────────────────────────────────────────────────┤
│ TRANSACTION SUMMARY CARD: Real-time validation status & key entities   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 1: Operational Business Information (Domain Specific)          │
│ SECTION 2: Identity & Compliance Verification (KYC / NDA / Induction)  │
│ SECTION 3: Physical Access & Zone Authorization (Gates / Zones / Dates) │
│ SECTION 4: Activity & Sustainability (Embedded Transport Capture)      │
│ SECTION 5: Mandatory Supporting Documents (PDFs / Scans / Certificates) │
│ SECTION 6: Multi-Stage Approval Workflow (Host / Safety / Security)     │
│ SECTION 7: Audit & Data Provenance Preview                             │
├────────────────────────────────────────────────────────────────────────┤
│ ACTIONS FOOTER: [Cancel] [Reset] [Save Draft] [Validate] [Submit Transaction] │
└────────────────────────────────────────────────────────────────────────┘
```

**Domain-Specific Rule:** Irrelevant sections are NEVER forced into transactions. For example, a Visitor does not fill out Weighbridge Tare/Gross weights, and a raw Material delivery does not complete a personal EHS Induction quiz.

---

## 2. Form Types & Complexity Tiers

### Tier 1: Single-Page Fast Forms (< 6 fields)
- **Use Cases:** Walk-in badge reprint, gate overstay extension, quick emergency check-out, driver breathalyzer logging.
- **Layout:** Compact 1-column or 2-column inline grid with autofocus on primary scan/search field. Single-click submit.

### Tier 2: Multi-Step Transaction Forms (Complex Workflows)
- **Use Cases:** New Visitor Pre-Registration, Contractor Work Order onboarding, Inward Material Consignment, Maintenance Service Request.
- **Layout:** Stepper bar at top with validation status per step (`Draft`, `Valid`, `Invalid`). Steps can be completed non-linearly, with draft auto-saving to local storage.

---

## 3. Form Component Standards

### 3.1 Field Hierarchy & Micro-Copy
- **Label:** `13px`, Slate 700, font-weight 600. Required fields flagged with a subtle red asterisk (`*`), optional fields explicitly tagged with `(Optional)`.
- **Input Box:** `36px` height (Dense mode) or `40px` (Standard). `1px solid #cbd5e1`, 4px radius, `14px` text.
- **Focus State:** `2px solid #0284c7` (Sky-600) with a 2px offset; accessible WCAG 2.2 AA compliant focus ring.
- **Helper Text:** `12px`, Slate 500, displayed directly beneath the input.
- **Inline Error:** `12px`, Red-600 with `AlertCircle` micro-icon; triggers immediately on `blur` or when submission is attempted.
- **Unsaved Changes Warning:** Prompts modal confirmation before route change or tab close if dirty state exists.

---

## 4. Critical ESG / GHG Activity Capture Rules

### Rule 1: Embedded Within Operational Context
The operational user (Receptionist, Host, Contractor Supervisor, Logistics Gate Officer) must NEVER leave their operational workflow to input sustainability metrics. The **Activity & Sustainability** section sits natively inside the transaction form.

### Rule 2: Operational Data In, Normalized Activity Out
Operational users enter everyday physical facts:
- **Transport Mode:** `Car`, `Two-Wheeler`, `Bus`, `Train`, `Flight`, `Van`, `Truck`, `Walking`.
- **Ownership:** `Personal`, `Company`, `Hired / Taxi`, `Supplier`, `Transporter`, `Public`.
- **Vehicle Type:** `Sedan`, `SUV`, `Hatchback`, `Two-Wheeler`, `Heavy Truck`, etc.
- **Fuel Type:** `Diesel`, `Petrol`, `Electric`, `CNG`, `Hybrid`.
- **Passenger Occupancy:** Integer count (e.g., `2` occupants for carpool allocation).
- **Origin & Destination:** Origin city / address and Site destination.
- **Estimated Distance (km):** Auto-calculated by routing service, editable by operator with provenance tracking.
- **Journey Type:** `One-Way` vs. `Round-Trip` (auto-doubles distance for symmetric return journeys).

### Rule 3: Strict Prohibition of GHG Accounting Jargon
**NEVER** expose the following fields to operational forms:
- $\times$ *Scope 1 / Scope 2 / Scope 3 Category*
- $\times$ *Emission Factor Code / kgCO2e multiplier*
- $\times$ *GHG Protocol Corporate Standard calculation formula*
- $\times$ *Global Warming Potential (GWP) metrics*

These calculations are executed strictly downstream by the `@vms/ghg` background engine.

---

## 5. Provenance UI Pattern

When values are automatically derived, subtle badges inform the user of the data provenance:
- `Distance: 350 km` $\rightarrow$ `[SYSTEM_ESTIMATED]` (GIS Routing)
- `Fuel: Diesel` $\rightarrow$ `[FROM_VEHICLE_PROFILE]` (Linked fleet record)
- `Occupancy: 3` $\rightarrow$ `[USER_PROVIDED]`
- `Gross Weight: 24,180 kg` $\rightarrow$ `[MEASURED]` (Weighbridge Scale #2)

This builds trust and ensures regulatory audit readiness (ISO 14064, CSRD, BRSR).
