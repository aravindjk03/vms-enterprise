# Embedded ESG Activity Capture & The Zero-Blocker Invariant

## 1. Overview & Purpose

A fundamental design requirement of VMS Enterprise is the seamless, embedded capture of environmental sustainability (ESG) activity data within standard operational transactions.

In high-throughput industrial plants, hundreds of contractor personnel enter through turnstiles during tight 15-minute shift change windows. Under no circumstances can ESG data capture introduce operational delays or compromise physical safety.

This leads directly to the **Zero-Blocker Invariant**:
> **Zero-Blocker Invariant:** Operational transactions (physical turnstile entry, attendance recording, gate unlatching) must proceed with 100% reliability regardless of downstream GHG calculation engine availability, network latencies, or calculation timeouts.

---

## 2. Zero-Blocker Architecture & Graceful Fallback

The integration between `ContractorService` and `GHGCalculationEngine` follows an unblockable, fail-open design pattern:

```mermaid
flowchart TD
    SWIPE[Contractor Worker Swipes Badge at Turnstile] --> AUTH{Worker Authorized?}
    AUTH -- No --> DENY[Deny Entry & Keep Barrier Locked]
    
    AUTH -- Yes --> LOG[Record Attendance in contractor_attendance_records]
    LOG --> UNLATCH[Send Signal to Unlatch Physical Turnstile]
    
    UNLATCH --> ESG[Attempt Embedded GHG Calculation]
    
    ESG --> TRY{Call GHGCalculationEngine.calculate()}
    TRY -- Success --> SAVE[Save GHG Calculation Record: Status = CALCULATED]
    
    TRY -- Latency / Error / Exception --> CATCH[Catch Exception in Isolated Block]
    CATCH --> OUTBOX[Queue to Asynchronous Outbox: Status = PENDING_CALCULATION]
    CATCH --> AUDIT[Log Non-Blocking Warning in System Telemetry]
    
    OUTBOX --> WORKER_ENTERS[Worker Successfully Enters Plant Floor]
    SAVE --> WORKER_ENTERS
```

### Key Architectural Safeguards:
1. **Isolated Try-Catch Block:** The call to `ghgEngine.captureActivityFromTransport` is encapsulated inside an independent try-catch block. An error thrown by the calculation engine never bubbles up to fail the check-in call.
2. **Transaction Integrity:** The attendance record is committed first. Even if power is severed to the downstream analytics server, the presence ledger is complete and accurate.
3. **Asynchronous Outbox Reconciliation:** Any transport activity whose GHG calculation could not be immediately computed is picked up by a background worker for asynchronous reconciliation once the calculation service recovers.

---

## 3. Operational UX Constraints

To maintain high user adoption and zero friction:
- **No ESG Jargon at Gates:** Turnstile LCD screens and security guard interfaces never display terms like "Scope 3 Category 7", "CO₂e", "GWP-100", or "Emission Factors".
- **Intuitive Inputs:** Interfaces prompt for simple operational variables: "Mode: Contractor Shuttle Bus", "Vehicle Reg: MH-12-AB-9901".
- **Background Emission Derivation:** The system resolves vehicle characteristics, fuel types, and regional emission factors invisibly using predefined organizational policies.

---

## 4. GHG Emission Calculation Methodology (Scope 3 Category 7)

For contractor workforce commuting, emissions are calculated using international standards (GHG Protocol Corporate Value Chain Standard):

$$\text{Emissions (kg }\text{CO}_2\text{e)} = \frac{\text{One-Way Distance (km)} \times 2 \times \text{EF}_{\text{mode}}}{\text{Occupancy}}$$

Where:
- $\text{Distance (km)}$: Highway transit distance from origin hub to plant gate.
- $\text{EF}_{\text{mode}}$: Mode-specific vehicle emission factor (e.g. DEFRA 2024 Bus factor = $0.1022\text{ kg CO}_2\text{e / vehicle-km}$).
- $\text{Occupancy}$: Total verified passengers sharing the vehicle journey.
- $2$: Multiplier applied for round-trip daily commute accounting.
