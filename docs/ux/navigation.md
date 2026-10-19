# VMS Enterprise: Global Navigation Specification

## 1. Architectural Overview

The VMS Enterprise navigation architecture provides seamless operational context across 18 specialized industrial domains while strictly enforcing role-aware visibility and multi-level organizational scoping (Organization $\rightarrow$ Site $\rightarrow$ Gate $\rightarrow$ Zone).

### Core Structural Layout
```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [Brand & Org/Site Switcher] [Global Search Ctrl+K] [Alerts] [User] │
├────────────────────────┬───────────────────────────────────────────────┤
│ LEFT NAVIGATION        │ MAIN CONTENT AREA                             │
│ - Collapsed (60px)     │ - Dynamic Breadcrumbs                         │
│ - Expanded (240px)     │ - Page Header & Contextual Actions            │
│ - Nested Accordions    │ - Operational Filter Bar                      │
│ - Role Filtered        │ - Tabular / Form / Dashboard Viewports        │
│ - Mobile Drawer Mode   │ - Contextual Right Drawer (Quick Inspect)     │
└────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Global Navigation Hierarchy (18 Top-Level Domains)

| Domain | Key Route | Sub-Routes & Sections | Icons & Semantics |
|---|---|---|---|
| **Dashboard** | `/dashboard` | `Executive`, `Operations`, `Security` | `LayoutDashboard` |
| **Visitor** | `/visitors` | `All Visitors`, `New Visitor`, `Repeated Visitor`, `Group Visitors`, `VIP Visitors`, `Appointments`, `Visitor History` | `Users` |
| **Customer** | `/customers` | `Customer Visits`, `Meetings`, `Audits`, `Inspections`, `Delegations`, `Customer History` | `Handshake` |
| **Contractor** | `/contractors` | `Contractor Companies`, `Workers`, `Work Orders`, `Attendance`, `Training`, `Permits`, `Compliance` | `HardHat` |
| **Service / Work** | `/services` | `Service Requests`, `Technicians`, `Work Orders`, `Work Locations`, `Permits`, `Completion` | `Wrench` |
| **Material** | `/materials` | `Material Inward`, `Material Outward`, `Returnable`, `Non-returnable`, `Scrap`, `Samples`, `Tools`, `Equipment` | `Package` |
| **Vehicle** | `/vehicles` | `Vehicles`, `Drivers`, `Transporters`, `Documents` | `Truck` |
| **Transport** | `/transport` | `Activity`, `Journeys`, `Vehicle Activity`, `Mobility History` | `Compass` |
| **Gate** | `/gate` | `Live Gate`, `Entry`, `Exit`, `Gate Passes`, `Exceptions`, `Overstay` | `Shield` |
| **Access** | `/access` | `Gates`, `Zones`, `Policies`, `Credentials`, `Restricted Areas`, `Access History` | `KeyRound` |
| **Documents** | `/documents` | `Repository`, `Verification`, `Expiring`, `Expired`, `Legal`, `NDA` | `FileCheck` |
| **Safety** | `/safety` | `Induction`, `Training`, `PPE`, `Permits`, `Exceptions` | `Flame` |
| **Emergency** | `/emergency` | `Live Occupancy`, `Emergency Events`, `Muster`, `Missing Persons`, `Reports` | `AlertOctagon` (Critical Red) |
| **ESG / GHG** | `/esg` | `Activity Overview`, `Activity Ledger`, `Transport Activity`, `Material Transport`, `Emission Factors`, `Calculations`, `Scope Mapping`, `Data Quality`, `Reports` | `Leaf` (Emerald) |
| **Analytics** | `/analytics` | `Operations`, `Security`, `Visitors`, `Customers`, `Contractors`, `Materials`, `Vehicles`, `Transport`, `Compliance`, `ESG` | `BarChart3` |
| **AI Copilot** | `/ai` | `Operational Query`, `Anomaly Detection`, `Volume Forecasting` | `Sparkles` |
| **Administration** | `/admin` | `Users`, `Roles`, `Permissions`, `Sites`, `Gates`, `Zones`, `Master Data`, `Workflow Builder`, `Rules`, `Notifications`, `Integrations`, `Audit Logs`, `Privacy`, `Retention`, `Settings` | `Settings` |

---

## 3. Role-Aware Navigation Visibility Matrix

To avoid cognitive overload and enforce least-privilege information architecture, navigation items are filtered by the active user's `EnterpriseRole`:

| Domain | SUPER_ADMIN / SITE_ADMIN | SECURITY_GUARD | RECEPTIONIST | HOST | EHS_MANAGER | ESG_MANAGER | AUDITOR | MANAGEMENT |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | Full (All 3) | Security | Reception | Host | Operations | ESG Summary | All (Read) | Executive |
| **Visitor** | Full | View / Gate | Full Pass | My Visitors | Read | Masked Read | Audit View | Read Rollup |
| **Customer** | Full | View | Full Pass | My Clients | Read | Masked Read | Audit View | Read Rollup |
| **Contractor** | Full | View / Badge | View | Hidden | Full (PTW) | Masked Read | Audit View | Read Rollup |
| **Service** | Full | View / Badge | View | Hidden | Full (PTW) | Masked Read | Audit View | Read Rollup |
| **Material** | Full | Gate Checks | Hidden | Hidden | Read | Masked Read | Audit View | Read Rollup |
| **Vehicle** | Full | Full Gate | View | Hidden | Read | Masked Read | Audit View | Read Rollup |
| **Transport** | Full | View | Hidden | Hidden | Read | Full Engine | Read | Read Rollup |
| **Gate** | Full | Full Live | View Passes | Hidden | View | Hidden | Read Logs | View Monitor |
| **Access** | Full | View Local | View Badges | Hidden | High Hazard | Hidden | Read Logs | View Rollup |
| **Documents** | Full | Std Docs | Std KYC | Hidden | Safety/Permits | Hidden (PII) | Compliance | View Rollup |
| **Safety** | Full | View Alerts | Hidden | Hidden | Full Control | Hidden | Audit View | Status View |
| **Emergency** | Full | Muster Lane | Muster Desk | Roll-Call | Command | Roll-Call | Post-Incident | Live Count |
| **ESG / GHG** | Full | Hidden | Hidden | Hidden | Read Scope | Full Command | Full Audit | ESG Summary |
| **Analytics** | Full | Gate Stats | Daily Desk | My Stats | Safety BI | Carbon BI | Audit Logs | Exec BI |
| **AI Copilot** | Full | Quick Query | Quick Query | Assistant | Safety Query | ESG Assistant | Query | Exec Query |
| **Admin** | Full Control | Hidden | Hidden | Hidden | Zone Config | Factor Master | Audit Logs | Settings Read |

---

## 4. Organizational & Site Context Switcher

The context switcher is located prominently in the Top Bar and follows the hierarchy:
`Organization` $\rightarrow$ `Site` $\rightarrow$ `Gate` $\rightarrow$ `Zone`

### Multi-Site Selection Rules:
1. **Single Site Assigned (e.g., Security Guard):** Pinned to the home site (e.g. `MRF -> Chennai Plant -> Gate 1`). The dropdown is locked or displays site details in read-only mode.
2. **Multi-Site Assigned (e.g., Regional EHS Manager):** Fast switcher filtered to authorized sites.
3. **Enterprise-Wide (e.g., Management / Super Admin):** Option for `All Sites (Enterprise Roll-up)` alongside individual site drill-downs.

---

## 5. Left Navigation Modes

### 5.1 Expanded Desktop Mode (Default: 240px)
- Displays domain icon, domain label, expandable chevron indicator, and active badge count (e.g., `Overdue: 3`).
- Sub-menus expand with smooth 100ms accordion transitions.
- Fixed scrollable container with bottom pin for User Settings and Collapse toggle.

### 5.2 Collapsed Rail Mode (60px)
- Collapses to icons only with instant hover tooltips (30ms delay).
- Clicking an icon opens a floating popover submenu containing its nested sub-routes.
- Maximizes screen estate for wide 12-column tabular data and operational command dashboards.

### 5.3 Mobile Drawer Mode (< 768px)
- Slides in from the left over a dark backdrop overlay (`rgba(15, 23, 42, 0.6)`).
- Touch-friendly 44px tap targets.
- Closes automatically upon route selection or backdrop tap.
