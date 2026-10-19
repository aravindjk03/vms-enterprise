# VMS Enterprise: Enterprise Data Table Framework Specification

## 1. Design Philosophy: High-Density Tabular Operations

In high-throughput industrial environments (security gate cabins, warehouse dispatch desks, contractor onboarding offices), operators scan hundreds of records per shift. The `DataTable` component is engineered for:
- **Maximum Information Density:** Up to 25–30 rows visible per viewport on standard 1080p monitors.
- **Visual Hierarchy:** Immediate recognition of Identity, Status, Critical Timestamps, and Action triggers.
- **Predictable Keyboard Navigation:** Arrow key row selection, `[Enter]` to inspect details, `[Space]` to toggle multi-selection.
- **Zero Layout Shifts:** Fixed row heights and column boundaries prevent jumping during data streaming or pagination.

---

## 2. Structural Anatomy of the Enterprise DataTable

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR: [Global Table Search] [Status Filters] [Date Filter] [Saved Views] │
│          [Density Toggle] [Columns Visibility] [Export CSV] [Bulk Actions]  │
├────────────────────────────────────────────────────────────────────────┤
│ TABLE HEADER: Sticky (Top: 0), Sort Indicators, Select-All Checkbox     │
├────────────────────────────────────────────────────────────────────────┤
│ DATA ROWS:                                                             │
│ [x] | ID (Mono) | Identity / Entity | Status Badge | Timestamps | Actions│
│ [ ] | VIS-0182  | Aravind Swaminathan| ON PREMISES  | 09:41 AM   | [...]  │
│ [ ] | VIS-0183  | Rajesh Kumar      | OVERSTAY      | 08:15 AM   | [...]  │
├────────────────────────────────────────────────────────────────────────┤
│ FOOTER: [Showing 1-25 of 1,280 records] [Rows per Page: 25/50/100] [1 2 3 >]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Technical Capabilities

### 3.1 Density Modes
- **Dense Mode (Default for Gate/Security Cabin):**
  - Row height: `34px`
  - Font size: `12px`
  - Padding: `4px 8px`
  - Allows 25+ rows in an 800px vertical viewport.
- **Comfortable Mode (Executive / Audit):**
  - Row height: `44px`
  - Font size: `14px`
  - Padding: `10px 12px`

### 3.2 Column Configuration & Visibility
- Maximum **6 to 8 default columns** in standard views to prevent horizontal blowout.
- An interactive **Column Customizer** popover allows operators to toggle additional domain columns:
  - Default Visitor Columns: `Selection`, `Transaction ID`, `Visitor Name`, `Company`, `Host`, `Status`, `Check-In Time`, `Actions`.
  - Configurable Extra Columns: `Transport Mode`, `Vehicle Plate`, `Induction Expiry`, `Government ID Type`, `Zone Allocated`, `Gate of Entry`.

### 3.3 Server-Side Pagination & Sorting
- Compatible with query parameter pagination (`page=1&limit=25&sortBy=scheduledStart&sortOrder=desc`).
- Client-side virtualization support for local cached datasets up to 10,000 records.

### 3.4 Multi-Row Bulk Operations
When one or more rows are selected via checkbox, the toolbar transforms to expose bulk operational actions:
- `[Approve Selected (N)]`
- `[Print Visitor Badges (N)]`
- `[Batch Check-Out]`
- `[Export Selected to CSV]`

### 3.5 Five Canonical Table States
1. **Loading:** Row skeleton loaders mimicking actual column geometries.
2. **Empty:** Highlighting that no records have been created in this site/period.
3. **No Results:** Explains that active filter criteria matched 0 records, with a clear `[Reset Filters]` button.
4. **Error:** Server connection failure message with a `[Retry]` trigger.
5. **Populated:** Interactive sorted and paginated records.

---

## 4. Column Formatting Standards

- **Identifiers:** Monospace font (`JetBrains Mono`, `13px`), left-aligned, clickable to open quick inspect drawer.
- **Entity Names:** Semi-bold `14px` with secondary subtitle (e.g., `Aravind Swaminathan` / `TCS Ltd`).
- **Status Badges:** Standardized semantic badge with icon (e.g., `[✓] ON PREMISES`).
- **Timestamps:** 24-hour military or standard ISO format with relative tooltip (e.g., `10:04 AM` with tooltip `24-Oct-2026 10:04:12 UTC`).
- **Actions:** Trailing fixed column with Quick Inspect eye icon and overflow dropdown menu (`...`).
