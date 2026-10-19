# VMS Enterprise: Responsive Architecture & Device Modes

## 1. Centralized Breakpoints Specification

VMS Enterprise supports high-density 4K control room monitors, standard corporate laptops, ruggedized field tablets, mobile devices, and self-service touchscreen kiosks.

| Breakpoint Name | Viewport Width | Typical Target Hardware | Primary UI Layout Mode |
|---|---|---|---|
| **Desktop / Ultrawide** | $\ge 1280\text{px}$ | Control room displays, workstation PCs | Full 240px LeftNav, 12-col grid, wide dense tables (30+ rows) |
| **Compact Desktop** | $1024\text{px} - 1279\text{px}$ | Standard enterprise laptops, guard cabin PCs | Collapsible LeftNav (60px rail), 8-col grid, sticky column tables |
| **Tablet / Field** | $768\text{px} - 1023\text{px}$ | Ruggedized tablets (iPad Pro, Panasonic Toughbook) | Icon rail nav, touch-optimized rows (44px), split-screen gate lane |
| **Mobile** | $< 768\text{px}$ | Security patrol smartphones, host mobile browser | Off-canvas drawer nav, single-column task cards, bottom action bar |

---

## 2. Specialized Form Factor Modes

### 2.1 Gate Mode (`/gate`): Mission-Critical Lane Operation
Security guards operating in outdoor booths or dusty gate cabins require maximum speed and minimal cognitive friction:
- **Scan-First Layout:** The primary scan/search input is permanently focused. Scanning an RFID card, QR code pass, or ANPR plate immediately resolves the pass.
- **Split-Screen Inspection:**
  - *Left View:* Camera snapshot / live photo match + Identity credentials.
  - *Right View:* Decision panel with oversized high-visibility buttons (`[SPACE] ALLOW PASSAGE (GREEN)` / `[X] DENY PASSAGE (RED)`).
- **Physical Keyboard Shortcuts:**
  - `[SPACE]` $\rightarrow$ Actuate barrier open & record entry
  - `[ESC]` $\rightarrow$ Cancel / Clear active scan
  - `[X]` $\rightarrow$ Hold for physical inspection
  - `[P]` $\rightarrow$ Reprint visitor/material gate pass
- **Night / Sunlight High-Contrast:** Toggle between deep slate night mode (`#0b0f19`) and outdoor sunlight mode (`#ffffff` canvas with high-contrast text).

---

### 2.2 Kiosk Mode (`/kiosk`): Self-Service Welcome Terminal
For unattended visitor registration at corporate lobbies or plant gates:
- **Simplified Touch Interface:** Giant touch targets ($\ge 56\text{px} \times 56\text{px}$) with minimum 16px finger spacing.
- **Four Primary Actions:**
  1. `[ I Have an Appointment ]` $\rightarrow$ Enter mobile / OTP / QR code
  2. `[ Walk-in Visitor ]` $\rightarrow$ Step-by-step pre-registration form with webcam snapshot
  3. `[ Scan QR Pass ]` $\rightarrow$ Immediate check-in badge printing
  4. `[ Request Reception Assistance ]` $\rightarrow$ Ring concierge chime
- **Privacy Shield:** Biometric data, phone numbers, and host names are masked or wiped after each session.
- **Inactivity Timeout:** Resets to the welcome screen after 60 seconds of idle time.

---

### 2.3 Mobile Task Mode (< 768px)
Instead of attempting to squeeze a 12-column table onto a mobile screen, the mobile experience adapts to task-oriented cards:
- **Host Persona:** Focuses on 1-click Visitor Approvals, meeting room booking, and arrival alerts.
- **Patrol Guard Persona:** Focuses on roving QR scanner, zone overstay check, and emergency muster roll-call.
- **Navigation:** Floating bottom navigation bar with Quick Scan (`QR`), Approvals (`Bell`), and Today's Roster.

---

## 3. Responsive Data Table Handling

- **Desktop ($\ge 1024\text{px}$):** Standard high-density table with all 8 columns visible.
- **Tablet ($768\text{px} - 1023\text{px}$):** Priority columns retained (`ID`, `Entity`, `Status`, `Action`), secondary columns moved to quick-inspect drawer.
- **Mobile ($< 768\text{px}$):** Table rows transform into touch-friendly operational cards displaying the entity photo, status pill, transaction ID, and a primary action button.
