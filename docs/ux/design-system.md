# VMS Enterprise: Design System Specification

## 1. Executive Summary & Design Vision

VMS Enterprise is an industrial-grade operational management and security platform designed for mission-critical deployments across complex physical operating environments:
- Automotive manufacturing plants
- Rubber & tire manufacturing facilities
- Integrated steel mills & heavy metallurgical plants
- High-throughput logistics docks & container freight stations
- Engineering, Procurement & Construction (EPC) project sites
- Multi-building corporate campuses & R&D technical centers

The visual identity embodies **mission-critical industrial modernity**: high data density, restrained accents, zero decorative fluff, sub-second cognitive acquisition, and bulletproof accessibility across control rooms, outdoor gate cabins, executive suites, and self-service touch kiosks.

---

## 2. Visual Foundation

| Attribute | Specification | Rationale |
|---|---|---|
| **Application Canvas** | `#f8fafc` (Slate 50) | Near-white low-glare backdrop reducing eye strain during 8–12 hr shifts |
| **Card / Panel Surfaces** | `#ffffff` (Pure White) | Crisp contrast boundaries for tables, forms, and operational telemetry |
| **Control Room / Night Mode** | `#0b0f19` (Slate 950) | Deep slate canvas for low-light gate cabins, CCTV operator desks, and battery saving |
| **Primary Typography** | `#0f172a` (Slate 900) | Deep graphite/navy text providing 14.2:1 contrast ratio against white surfaces |
| **Secondary Typography** | `#475569` (Slate 600) | Balanced metadata, timestamps, and column labels (6.8:1 contrast ratio) |
| **Primary Accent System** | `#0284c7` (Sky/Blue 600) | High-visibility operational blue for primary actions and focus rings |
| **ESG / Carbon System** | `#059669` (Emerald/Teal 600) | Distinctive sustainability indicator for carbon metrics and green mobility |
| **Borders & Dividers** | `#e2e8f0` (Slate 200) | Crisp 1px geometric gridlines separating dense tabular datasets |
| **Elevation & Shadows** | Flat to `0 1px 2px rgba(0,0,0,0.05)` | Controlled, subtle elevation; strictly avoids heavy floating consumer shadows |
| **Border Radii** | `2px` to `6px` | Compact industrial geometry; avoids consumer pill bubbles and large 16px+ roundings |

---

## 3. Comprehensive Design Tokens Architecture

The design tokens are centralized within `@vms/ui/tokens` (`packages/ui/tokens/index.ts`) and exported across the entire platform. Hardcoded hex colors, ad-hoc padding values, and arbitrary font sizes are strictly prohibited across all domain modules.

### 3.1 Color Palette

#### Neutral Slate Scale (Surfaces & Structural Contrast)
- `slate-50`: `#f8fafc` — Application canvas (Light mode)
- `slate-100`: `#f1f5f9` — Table hover, subtle striping, interactive sunken state
- `slate-200`: `#e2e8f0` — Default structural borders and cell dividers
- `slate-300`: `#cbd5e1` — Strong borders, disabled control borders
- `slate-400`: `#94a3b8` — Placeholder text, inactive icon fills
- `slate-500`: `#64748b` — Helper text, captions, secondary metadata
- `slate-600`: `#475569` — Column headers, secondary text labels
- `slate-700`: `#334155` — Subtitles, section headings
- `slate-800`: `#1e293b` — Nav item active state, dark mode card surface
- `slate-900`: `#0f172a` — Primary typography, dark mode navigation bar
- `slate-950`: `#0b0f19` — Dark mode control room canvas, gate night background

#### Primary Operational Blue Scale
- `primary-50`: `#f0f9ff` — Subtle active row highlight, selection tint
- `primary-100`: `#e0f2fe` — Selected filter badge, light tag fill
- `primary-500`: `#0ea5e9` — Focus state highlight, interactive hover
- `primary-600`: `#0284c7` — Primary action buttons, active navigation indicator
- `primary-700`: `#0369a1` — Button pressed state, header emphasis
- `primary-800`: `#075985` — Deep high-contrast button background
- `primary-900`: `#0c4a6e` — Top navigation bar, enterprise brand banner

#### ESG & Sustainability Teal Scale
- `esg-50`: `#ecfdf5` — Sustainability summary background, green tag tint
- `esg-100`: `#d1fae5` — ESG activity captured badge fill
- `esg-500`: `#10b981` — Carbon KPI trend, active mobility indicator
- `esg-600`: `#059669` — ESG primary action, verified activity ledger icon
- `esg-700`: `#047857` — Scope 1/3 report header, high-contrast ESG text

---

### 3.2 Semantic Status Token System

To support 18 domain pipelines with strict consistency, semantic status tokens define foreground, background, border, and badge tokens for every domain state:

| Semantic State | Foreground | Background | Border | Typical Applications |
|---|---|---|---|---|
| `success` | `#15803d` | `#f0fdf4` | `#bbf7d0` | Verified, Arrived, Gate Open, Compliant, Passed, Completed |
| `warning` | `#b45309` | `#fffbeb` | `#fde68a` | Pending Approval, Overstay SLA, Expiring Soon, Inspection Needed |
| `danger` | `#b91c1c` | `#fef2f2` | `#fecaca` | Blocked, Blacklisted, Emergency, Evacuate, Violation, Security Alert |
| `info` | `#1d4ed8` | `#eff6ff` | `#bfdbfe` | Scheduled, Confirmed, In Progress, Transporter En Route |
| `pending` | `#c2410c` | `#fff7ed` | `#fed7aa` | Awaiting Host Approval, Weighbridge Queued, Gate Queue |
| `neutral` | `#475569` | `#f8fafc` | `#e2e8f0` | Archived, Closed, Logged, Superseded, Not Applicable |
| `blocked` | `#991b1b` | `#fef2f2` | `#f87171` | Access Denied, Overdue Inspection, Quarantine, LOTO Active |
| `expired` | `#9a3412` | `#fff7ed` | `#ffedd5` | PUC Expired, Insurance Lapsed, Induction Expired, NDA Void |
| `draft` | `#64748b` | `#f1f5f9` | `#cbd5e1` | Work Order Draft, Gate Pass Draft, Consignment Pending PO |
| `approved` | `#15803d` | `#f0fdf4` | `#86efac` | PTW Signed Off, Gate Pass Authorized, Visitor Approved |
| `rejected` | `#dc2626` | `#fef2f2` | `#fca5a5` | Host Declined, Safety Induction Failed, Document Rejected |
| `active` | `#0369a1` | `#f0f9ff` | `#bae6fd` | Currently On Premises, Active Shift, Pass Active |
| `inactive` | `#64748b` | `#f8fafc` | `#e2e8f0` | Suspended Pass, Decommissioned Turnstile, Shift Ended |
| `overdue` | `#c026d3` | `#fdf4ff` | `#f5d0fe` | Overstayed Authorized Zone, SLA Escalated, Returnable Overdue |

**Accessibility Requirement:** Every status badge pairs color with an explicit semantic icon (Check, AlertTriangle, ShieldAlert, Clock, Ban, XCircle) and an accessible textual label. Color is never the sole carrier of status.

---

### 3.3 Typography Hierarchy

| Level | Font Size | Line Height | Weight | Letter Spacing | Purpose |
|---|---|---|---|---|---|
| `display` | `30px` | `38px` | `800` | `-0.02em` | Cross-site executive roll-up, emergency muster count |
| `pageTitle` | `22px` | `28px` | `700` | `-0.01em` | Primary page header (`Visitor Management Console`) |
| `sectionTitle` | `16px` | `22px` | `600` | `-0.005em` | Form section headings, widget header, modal title |
| `cardTitle` | `14px` | `20px` | `600` | `0` | Widget title, table filter label, detail panel title |
| `body` | `14px` | `20px` | `400` | `0` | Standard inputs, descriptions, table body text |
| `bodyMedium` | `14px` | `20px` | `500` | `0` | Emphasized body text, table row keys, table primary entity |
| `secondary` | `12px` | `16px` | `400` | `0` | Subtitles, helper text, breadcrumb trail, table metadata |
| `caption` | `11px` | `14px` | `500` | `+0.02em` | Timestamps, table column sub-headers, provenance chips |
| `micro` | `10px` | `12px` | `700` | `+0.05em` | Status badge text (ALL CAPS), keyboard shortcuts (`[SPACE]`) |
| `kpiNumeric` | `28px` | `32px` | `700` | `-0.03em` | Operational KPI metrics, active headcount counter |
| `monoCode` | `13px` | `18px` | `500` | `0` | Pass tokens, vehicle registration, challan numbers, GUIDs |

---

### 3.4 Spacing & Dense Grid System

Based on a strict **4px industrial baseline grid**:
- `baseline`: `4px`
- `xs`: `4px` (Button icon gap, chip padding, badge spacing)
- `sm`: `8px` (Form element vertical gap, compact table cell padding)
- `md`: `12px` (Standard input horizontal padding, card content padding)
- `lg`: `16px` (Standard card header padding, section spacing)
- `xl`: `20px` (Page grid gap, modal margin)
- `2xl`: `24px` (Major layout boundary spacing)
- `3xl`: `32px` (Page gutter, executive section separation)
- `4xl`: `48px` (Screen boundary margin on ultrawide monitors)

---

### 3.5 Border, Radius & Elevation Tokens

- **Radius:**
  - `none`: `0px`
  - `sm`: `2px` (Badges, tags, dense table rows)
  - `md`: `4px` (Inputs, buttons, dropdown menus, cards)
  - `lg`: `6px` (Modals, drawers, high-level dashboards)
- **Borders:**
  - `subtle`: `1px solid #e2e8f0` (Slate-200)
  - `strong`: `1px solid #cbd5e1` (Slate-300)
  - `focus`: `2px solid #0284c7` (Sky-600)
  - `error`: `1px solid #dc2626` (Red-600)
- **Shadows:**
  - `flat`: `none`
  - `subtle`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - `card`: `0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)`
  - `modal`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`

---

### 3.6 Micro-Interactions & Animation Guidelines

- **Duration:** Maximum `150ms` for interactive transitions (hover, active, focus).
- **Easing:** `cubic-bezier(0, 0, 0.2, 1)` (Standard industrial ease-out).
- **Forbidden:** No bouncing springs, no floating 3D transforms, no decorative entrance stagger cascades. Gate operations prioritize latency and clarity over decorative movement.

---

## 4. Component Library Architecture (Section 33)

Exported through `@vms/ui`:

| Category | Components | Purpose & Scope |
|---|---|---|
| **Foundation** | `Button`, `Input`, `Select`, `Combobox`, `Checkbox`, `Radio` / `RadioGroup`, `Switch`, `Textarea`, `DatePicker`, `DateTimePicker`, `FileUploader` | Core interactive primitives styled to tokens with ARIA compliance |
| **Status** | `StatusBadge`, `ApprovalStatusBadge`, `Alert`, `Banner`, `Progress`, `ExpiryIndicator` | Semantic status badges with dual icon + text coding |
| **Layout** | `Card`, `Section`, `Drawer`, `Modal`, `Tabs`, `SplitView`, `PageShell`, `Panel`, `Accordion` | Structural wrappers, side sheets, dialogs, collapsible panels |
| **Data Presentation** | `DataTable`, `FilterBar`, `Pagination`, `Search`, `SavedView` | High-density tables, multi-column filters, view presets |
| **Domain Entities** | `PersonCard`, `VisitorCard`, `CompanyCard`, `VehicleCard`, `MaterialCard`, `DocumentCard`, `TransportCard` | Specialized business entity summary and preview cards |
| **Operational & Control** | `Timeline`, `ApprovalPanel`, `CommandPalette`, `NotificationCenter`, `OccupancyPanel`, `GateDecisionPanel`, `ContextSwitcher`, `ActivityFeed`, `SyncStatusIndicator`, `GlobalSearch`, `EntityDetailPage`, `DashboardFramework` | Mission-critical gate consoles, multi-site context, offline sync |
| **Page States (Section 37)** | `LoadingState`, `EmptyState`, `NoPermissionState`, `ErrorState`, `NotFoundState`, `ValidationErrorState`, `NetworkErrorState`, `ServerErrorState`, `OfflineState`, `SyncPendingState`, `SessionExpiredState` | Standardized canonical UX state wrappers across all routes |
| **ESG & Traceability** | `ActivitySustainabilityCapture` | Reusable operational form envelope embedding transport and Scope 1/3 capture |

