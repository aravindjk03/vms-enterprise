# VMS Enterprise: Dashboard Framework & Specialized Consoles

## 1. Modular Dashboard Architecture

Dashboards in VMS Enterprise are not rigid, monolithic templates. They are constructed from an extensible grid of decoupled, reusable telemetry widgets:

```
┌────────────────────────────────────────────────────────────────────────┐
│ GLOBAL DASHBOARD FILTER BAR:                                           │
│ [Date Range: Today / 7D / 30D] [Site: Chennai Plant] [Gate: All]       │
│ [Auto-Refresh: 15s / 1m / Off] [Saved Preset] [Export Report PDF/Excel] │
├────────────────────────────────────────────────────────────────────────┤
│ WIDGET GRID (12-Column Responsive Layout)                               │
│ [ Widget 1: KPI Summary ] [ Widget 2: Live Occupancy ] [ Widget 3: ... ]│
│ [ Widget 4: Real-Time Activity Feed ] [ Widget 5: Security Alerts ]    │
│ [ Widget 6: Carbon & Mobility Trend ] [ Widget 7: Pending Approvals ]  │
└────────────────────────────────────────────────────────────────────────┘
```

### Supported Widget Types:
1. `KpiWidget`: Big numeric metric with delta comparison (`+14% vs yesterday`) and sparkline.
2. `LiveOccupancyWidget`: Real-time breakdown of people on premises by domain (Staff, Visitors, Contractors, Drivers).
3. `ActivityFeedWidget`: Streaming chronological event log with domain icons and timestamps.
4. `StatusAlertWidget`: Critical, High, Medium, Low operational alerts with acknowledge actions.
5. `ApprovalQueueWidget`: Pending sign-offs with SLA countdown timers.
6. `GateLaneMonitorWidget`: Live physical barrier and turnstile state (Open / Closed / Fault / Offline).
7. `TrendChartWidget`: Time-series bar/area charts for throughput, gate traffic, and carbon trajectories.
8. `ComplianceMeterWidget`: Visual gauges for induction compliance %, PTW approvals, and document audits.

---

## 2. Executive Dashboard (CXO / Plant General Manager)

Engineered for cross-site situational awareness and ESG alignment:

### 2.1 Top KPI Row
- **People Currently Inside Facility:** `1,428` (Breakdown: 850 Staff, 420 Contractors, 112 Visitors, 46 Drivers)
- **Today's Total Visitors:** `142` (112 Checked-in, 18 Scheduled, 12 Exited)
- **Today's Contractor Workforce:** `520` Active across 24 Work Orders
- **Today's Customer Delegations:** `4` Accounts on site (VIP Protocols active)
- **Today's Material Consignments:** `68` Inward Challans, `34` Outward Dispatches
- **Commercial Vehicles Inside:** `42` Heavy trucks in staging & weighbridge bays

### 2.2 Second Telemetry Band
- **Gate Throughput Velocity:** 182 movements/hour across 4 operational gates.
- **Pending Executive Approvals:** `3` VIP Delegations awaiting host authorization.
- **Critical Operational Exceptions:** `0` Active perimeter breaches, `2` Overstay warnings.
- **Facility Safety / Emergency Status:** `NORMAL / DEFCON 4` (All muster stations green).

### 2.3 Third Trend Band
- **Multi-Pipeline Weekly Throughput:** Stacked area view of Visitors, Contractors, and Commercial Freight.
- **Capacity Utilization:** Plant zone density vs. regulatory limits.

### 2.4 Fourth Band: ESG & Sustainability Intelligence
- **Daily Commuter & Logistics Carbon:** `4,820 kg CO2e` captured across active movements.
- **Mobility Modal Share:** `38% Public Transit / Bus`, `34% Carpool`, `28% Private Vehicle`.
- **Multi-Site Carbon Benchmark:** Chennai Plant vs. Pune Plant vs. Jamshedpur Works.

---

## 3. Operations Dashboard (Plant Operations & Facility Desk)

Prioritizes active logistical queues and actionable operational bottlenecks:

- **Live Site Occupancy:** Real-time gauge against max permissible fire code capacity.
- **Visitor Pipeline Health:** Expected (`18`) | Arrived (`112`) | Active Inside (`98`) | Exited (`14`) | Overdue (`2`).
- **Contractor Compliance Queue:** Checked-in (`420`) | Safety Induction Lapsed (`8` blocked at gate) | Active PTWs (`14`).
- **Commercial Vehicle Staging:** Expected (`12`) | In Weighbridge (`4`) | Unloading Bay (`28`) | Tare Weighing (`6`).
- **Material Inspection Pipeline:** Awaiting Quality Inward Inspection (`5` consignments) | Approved (`63`).
- **Approval SLA Watch:** Overdue Host approvals highlighted in high-contrast amber.

---

## 4. Security Dashboard (Security Control Room & Shift Chief)

Prioritizes physical safety, identity verification, and perimeter alerts:

- **Live Perimeter & Gate Activity:** Split-lane telemetry for Pedestrian Turnstiles and Commercial Boom Barriers.
- **Access Denied Stream:** Immediate visual card with camera snapshot, badge ID, and denial rationale (e.g. `Expired Safety Induction`, `Unassigned Zone`).
- **Identity & KYC Exceptions:** Facial mismatch or invalid government ID scans flagged for manual supervisor review.
- **Restricted Zone Violations:** Instant audible/visual trigger if a visitor badge pings an unauthorized hazardous zone sensor.
- **Active Overstay Tracker:** Chronological table of passes exceeding authorized exit timestamps, with host contact and location tracking.
- **Recent Security Incidents:** Tamper-evident incident log with one-click export for corporate audits.
