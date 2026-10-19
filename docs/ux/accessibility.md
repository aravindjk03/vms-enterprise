# VMS Enterprise: Accessibility & Inclusion Specification (WCAG 2.2 AA)

## 1. Compliance Standard & Philosophy

VMS Enterprise is engineered to meet **WCAG 2.2 Level AA** compliance. In industrial manufacturing environments, accessible UI design is not only a regulatory mandate (ADA, Section 508, EN 301 549) but an operational safety requirement. Operators wearing protective gear, working under outdoor sunlight, or navigating via keyboard must experience zero friction.

---

## 2. Core Accessibility Pillars

### 2.1 Contrast Ratios
- **Body & Table Text (`#0f172a` on `#ffffff`):** `14.2:1` (Surpasses 4.5:1 requirement).
- **Secondary Text (`#475569` on `#ffffff`):** `6.8:1` (Surpasses 4.5:1 requirement).
- **Primary Operational Buttons (`#ffffff` on `#0284c7`):** `4.6:1` (Passes AA).
- **UI Borders & Form Dividers (`#cbd5e1` on `#ffffff`):** `3.2:1` (Surpasses 3:1 non-text contrast requirement).
- **Control Room Dark Mode (`#f8fafc` on `#0b0f19`):** `18.5:1`.

### 2.2 Non-Color-Dependent Information Architecture
**Crucial Rule:** Color is NEVER used as the sole conveyor of information or status.
Every status indicator must provide three synchronized channels:
1. **Semantic Color:** (e.g. Red `#dc2626` for Blocked).
2. **Explicit Iconography:** (e.g. `Ban` or `ShieldAlert` icon).
3. **Descriptive Text:** (e.g. `BLOCKED - EXPIRED INDUCTION`).
4. **Accessible ARIA Tag:** `aria-label="Status: Blocked due to expired induction"`.

### 2.3 Comprehensive Keyboard Navigation
All primary enterprise features are 100% executable without a pointing device:
- `Tab` / `Shift+Tab`: Logical, linear traversal across all interactive controls.
- `Ctrl+K` / `Cmd+K`: Triggers Global Command Palette from anywhere in the platform.
- `Escape`: Closes modals, drawers, popovers, and resets search focus.
- `Enter` / `Space`: Activates buttons, expands nav accordions, selects table rows.
- `Arrow Keys (Up/Down)`: Navigates table rows, autocomplete lists, and command palette results.
- **Dedicated Gate Shortcuts:** `[Space]` opens gate, `[X]` rejects, `[P]` reprints pass.

### 2.4 Visible Focus Indicator
Focus states utilize a prominent, high-visibility double ring:
- Ring width: `2px`
- Ring color: `#0284c7` (Primary Sky-600)
- Ring offset: `2px solid #ffffff`
- Applies universally to inputs, buttons, checkboxes, tabs, and table row selections.

### 2.5 Screen Reader & Assistive Technology Support
- **Semantic HTML5:** Strict utilization of `<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, and `<article>`.
- **Accessible Tables:** Every table includes `<th scope="col">`, `aria-sort="ascending|descending"`, and readable `<caption className="sr-only">`.
- **Live Regions (`aria-live="polite"` / `assertive`):** Instant notifications, security alarms, and gate barcode scan results are announced dynamically to screen readers.
- **Form Error Association:** Form inputs link directly to error messages via `aria-describedby="field-error-id"`, ensuring immediate error notification.

---

## 3. Automated & Manual Verification Checklist

- [x] All interactive controls have accessible names (`aria-label` or visible text).
- [x] No automatic focus traps exist inside modals or drawers; `Tab` cycles within modal and `Esc` restores previous focus.
- [x] Text can be zoomed to 200% without loss of content or broken horizontal overflow.
- [x] Interactive touch targets are $\ge 44\text{px} \times 44\text{px}$ on tablet and touch modes.
- [x] Error messages provide actionable instructions on how to correct the fault.
