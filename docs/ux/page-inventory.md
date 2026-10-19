# VMS Enterprise: Page Inventory & Route Architecture

## 1. Route Inventory Matrix

Every domain route adheres to the standard application shell layout (`TopBar` + `LeftNav` + `MainContent`) and implements standardized page states.

| Route Path | Primary Title | Sub-Views / Tabs | Primary Role Context |
|---|---|---|---|
| `/` or `/dashboard` | Executive Command Center | Executive, Operations, Security | CXO, Plant GM, Security Chief |
| `/dashboard/operations` | Plant Operations Dashboard | Live Occupancy, Active Queues, Alerts | Operations Manager, Plant Admin |
| `/dashboard/security` | Security Control Center | ANPR Feed, Lane Status, Incidents | Security Manager, Shift In-charge |
| `/visitors` | Visitor Management | All Visitors, Scheduled, On-Premises | Receptionist, Security Guard, Host |
| `/visitors/new` | New Visitor Pre-Registration | Multi-Step Transaction Form | Receptionist, Host, Employee |
| `/visitors/repeated` | Frequent Visitor Roster | Expedited Check-in, Frequent Hosts | Receptionist, Security Guard |
| `/visitors/appointments`| Expected Appointments | Filter by Host, Time Slot, Gate | Receptionist, Security Guard |
| `/visitors/history` | Historical Visitor Ledger | Date Range, Audit Export, Log | Auditor, Security Manager |
| `/customers` | Customer Visits & Delegations | Customer Roster, Agenda, NDA Status | Commercial Lead, Executive Host |
| `/customers/visits` | Scheduled Customer Visits | Delegations, Meeting Rooms, Catering | Commercial Lead, Receptionist |
| `/customers/audits` | Customer Technical Audits | Audit Scopes, Zone Passes, Findings | Quality Head, Plant Admin |
| `/customers/inspections`| Customer Quality Inspections | Inspection Checklists, Escorts | EHS Manager, Quality Lead |
| `/contractors` | Contractor Management | Vendor Masters, Active Work Orders | EHS Manager, Contractor Desk |
| `/contractors/workers` | Contractor Worker Roster | KYC, Induction Validity, Medicals | Security Guard, EHS Officer |
| `/contractors/work-orders`| Work Orders & SOW | PO Reference, Authorized Headcount | Plant Admin, Procurement |
| `/contractors/compliance`| Contractor Compliance Audit | PF/ESI Proof, Insurance, Safety Induction| HR, Legal, EHS Officer |
| `/services` | Service & Work Management | Machinery Tickets, OEM Engineers | Maintenance Manager, Technician |
| `/services/work-orders`| Maintenance Work Orders | Hazardous Permits, Tool Checklists | Maintenance Lead, EHS Officer |
| `/materials/inward` | Material Inward Consignment | Delivery Challans, Weighbridge, Bay | Stores Officer, Security Guard |
| `/materials/outward` | Material Outward Dispatch | Gate Pass, Transporter, Invoices | Shipping Officer, Security Guard |
| `/materials/returnable` | Returnable Asset Tracker | Escrow Days, Due Dates, Overdue Alert| Stores Manager, Auditor |
| `/vehicles` | Vehicle Logistics Hub | Fleet Roster, Commercial Transporters | Transport Manager, Security Guard |
| `/vehicles/drivers` | Commercial Driver Roster | License Verification, Breathalyzer | Security Guard, Gate Officer |
| `/vehicles/transporters`| Transporter Vendor Registry| Fleet Compliance, PUC & Insurance | Logistics Manager, Security |
| `/transport/activity` | Normalized Mobility Ledger | Cross-Domain Legs, Provenance Filter| Transport Lead, ESG Specialist |
| `/transport/journeys` | Multi-Stop Journeys | Round-Trips, Inter-Plant Transfers | Logistics Lead, Fleet Supervisor |
| `/gate` | Live Gate Console (Gate Mode)| Fast-Scan Lane Ingress/Egress | Security Guard, Cabin Operator |
| `/gate/entry` | Lane Entry Controller | ANPR Scan, Driver Badge, Barrier Open | Security Guard |
| `/gate/exit` | Lane Exit Controller | Material Inspection, Odometer, Exit Pass| Security Guard |
| `/gate/exceptions` | Gate Exceptions & Blocks | Overstays, Blacklist Hits, Induction Fail| Security Manager |
| `/access` | Physical Access Governance | Turnstiles, UHF Readers, Zone Passes | Security Admin, IT Admin |
| `/access/zones` | Zone Topology & Rules | Standard, High-Security, Hazardous | Security Admin, EHS Officer |
| `/access/policies` | Access Policy Matrix | Multi-Factor Requirements, Time Windows| Security Admin |
| `/documents` | Enterprise Document Vault | Repository, OCR Status, Approvals | Legal, Compliance Officer |
| `/documents/verification`| Pending Verification Queue | Document Review, OCR Diff, Approvals| Compliance Desk |
| `/documents/expiring` | Expiring Documents Ledger | 30-Day Warning, Auto-Notifications | HR, Legal, Security |
| `/safety` | EHS & Safety Management | Inductions, Safety Briefings, Violations| EHS Manager |
| `/safety/induction` | Visitor & Contractor Induction | Interactive Video, Quiz, Digital Sign | Safety Trainer, Kiosk |
| `/safety/permits` | Permit to Work (PTW) System | Hot Work, Height, Confined Space | EHS Manager, Plant Admin |
| `/emergency` | Emergency Muster Console | Live Occupancy, Muster Station Roll-Call| Emergency Commander, EHS Officer |
| `/esg` | ESG / GHG Activity Intelligence| Scope 1 & 3 Carbon Ledger, Summary | ESG Manager, Sustainability Lead |
| `/esg/activity` | Activity Ledger (Source-Linked)| Transport, Fuel, Freight, Provenance | ESG Specialist, Carbon Auditor |
| `/esg/transport` | Commuter & Logistics Carbon | Employee, Visitor, Freight Emissions | ESG Manager |
| `/esg/emission-factors`| Emission Factor Registry | DEFRA, EPA, CEA Versioned Registry | ESG Manager, Auditor |
| `/esg/calculations` | Historical GHG Calculation Runs| Calculation Hashes, Immutability Audit| ESG Auditor |
| `/analytics` | Operations & Security BI | Throughput, Turnstile Heatmaps, SLA | Plant GM, Management |
| `/ai` | Operational AI Copilot | Natural Language Query, Anomalies | Enterprise Users |
| `/admin` | Multi-Tenant Administration | Sites, Gates, Zones, RBAC, Workflows | Super Admin, IT Admin |

---

## 2. Standardized Page State Architecture (Section 37 & 42)

To eliminate visual inconsistencies across hundreds of enterprise views, every view implements standardized canonical states defined in `@vms/ui/components/operational/PageStates.tsx`:

### 2.1 Default State (Populated View)
- Displays operational filters, active telemetry counters, actionable data tables or visual charts.
- Sticky table headers, clean zebra rows, responsive pagination controls.

### 2.2 Loading State (`LoadingState`)
- Clean skeleton placeholders matching the exact geometry of target table rows, KPI cards, and form inputs.
- Avoids spinning circular spinners that jump content or shift layout dimensions.

### 2.3 Empty State (`EmptyState`)
- Centered industrial icon (`Inbox`, `ClipboardList`, `CheckCircle2`).
- Human-readable title (e.g., `No Active Overstays Detected`).
- Contextual description explaining why no data is present.
- Optional primary action button (e.g., `Register Visitor`, `Create Work Order`).

### 2.4 No Permission State (`NoPermissionState` / 403 Forbidden)
- High-visibility `ShieldAlert` badge.
- Explanation of required role or capability (e.g., `Requires 'SYSTEM_ADMIN_MANAGE' or 'GATE_ACTUATE' capability`).
- Guidance: `Contact your Site Administrator to request access.`
- Return to Dashboard button.

### 2.5 Error State (`ErrorState` / Operational Fault Recovery)
- `AlertTriangle` icon with clear fault description.
- Actionable recovery options: `[Retry Operation]`, `[Switch to Offline Mode]`, `[Export Diagnostic Log]`.
- Strictly avoids showing unformatted stack traces or raw database exceptions to operational guards.

### 2.6 Not Found State (`NotFoundState` / 404)
- `FileQuestion` icon indicating missing record, route, or resource.
- Guidance with back/dashboard navigation actions.

### 2.7 Validation Error State (`ValidationErrorState` / 422)
- Highlights form-level or payload-level constraint violations.
- Direct links/focus triggers to invalid inputs with remediation hints.

### 2.8 Network Error State (`NetworkErrorState`)
- Detects connection dropouts with retry backoff and diagnostic ping.

### 2.9 Server Error State (`ServerErrorState` / 500)
- Graceful server failure presentation with incident reference code for IT helpdesk dispatch.

### 2.10 Offline State (`OfflineState`)
- Industrial offline badge with local IndexedDB/cache status and queue count.
- Clear indication of read-only vs. offline-transaction capabilities.

### 2.11 Sync Pending State (`SyncPendingState`)
- Progress indicator with queue size, last synced timestamp, and manual "Force Sync" trigger.

### 2.12 Session Expired State (`SessionExpiredState` / 401)
- Preserves draft form state in memory while requesting operator re-authentication.

---

## 3. Visual Traceability & Enterprise Auditability

Every transactional record and detail view incorporates an **Audit & Provenance Header**:
- **Transaction ID:** Monospace identifier (e.g., `VIS-2026-00182`, `MAT-IN-2026-0982`).
- **Created By & At:** Operator ID + UTC timestamp + Site context.
- **Last Modified:** Actor ID + timestamp.
- **Source Linkage:** Explicit link to originating ERP PO, Transporter Challan, or Work Order.
- **Verification History:** Badge indicating whether identity/documents were human-verified or OCR-verified.
- **Activity Status:** For ESG reporting, explicit indication: `Captured (Linked to ESG Activity #ACT-8291)`.
