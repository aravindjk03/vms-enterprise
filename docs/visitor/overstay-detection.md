# Overstay Breach Detection & Security Dispatch Loop

## 1. Overview

In industrial manufacturing facilities (chemical compounding, rubber extrusion, assembly lines, smelting units), unauthorized individuals lingering past their scheduled departure window pose severe physical security, industrial espionage, and EHS safety risks.

The **Overstay Detection Engine** monitors on-premises visitors against their authorized schedule and dispatches automated escalations when boundaries are breached.

---

## 2. Overstay Escalation Loop Diagram

```mermaid
flowchart TD
    ScheduledEnd[Visitor Scheduled End Time Reached: e.g. 16:00] --> MonitorLoop[Overstay Detection Loop Runs Every 60s]
    
    MonitorLoop --> CheckExit{Has Visitor Checked Out?}
    CheckExit -- Yes --> Closed[Visit Cleanly Completed - No Action]
    
    CheckExit -- No (Still Inside) --> CalcGrace[Calculate Elapsed Time Past Scheduled End]
    
    CalcGrace --> WarningCheck{Elapsed Minutes >= Warning Threshold: 15 mins?}
    WarningCheck -- No --> NormalState[Within Buffer - Continue Monitoring]
    
    WarningCheck -- Yes --> GraceState[Status: WARNING - Grace Period Active]
    GraceState --> HostAlert[1. Dispatch Push / SMS Warning to Host Employee]
    
    GraceState --> BreachCheck{Elapsed Minutes >= Breach Threshold: 30 mins?}
    BreachCheck -- No --> AwaitExtension[Host May Submit Reschedule / Extension Request]
    
    BreachCheck -- Yes --> CriticalBreach[Status: OVERSTAY_BREACH - Security Violation]
    CriticalBreach --> AutoEscalate[2. Create Security Exception Incident]
    AutoEscalate --> SecurityDispatch[3. Alert Plant Security Control Room Desk]
    SecurityDispatch --> GuardPatrol[4. Dispatch Security Patrol to Host Department]
    GuardPatrol --> PhysicalExit[5. Visitor Located & Escorted to Gate for Check-Out]
    PhysicalExit --> ResolveIncident[Resolve Overstay Incident with Audit Commentary]
```

---

## 3. Threshold Configuration

Overstay parameters are configured per site or security zone:

| Threshold Tier | Default Offset | Actions Triggered |
|:---|:---|:---|
| **Early Notice** | -15 minutes before end | SMS alert to host: "Visitor meeting scheduled to conclude in 15 mins." |
| **Warning Threshold** | +15 minutes past end | Host alerted; visitor prompted on smartphone to request visit extension. |
| **Breach Threshold** | +30 minutes past end | Critical banner rendered on top of Security Dashboard; incident logged. |
| **Severe Escort Breach** | +60 minutes past end | Physical security patrol dispatched; turnstile credential auto-restricted for egress only. |

---

## 4. Operational Extension Protocol

If a meeting is legitimately running late:
1. The host clicks **Request Extension** from their Task Center or SMS link.
2. The host specifies an updated end time (e.g. +60 minutes) and mandatory business justification.
3. The engine increments the visit transaction version (`version++`), clears the active warning state, updates the e-Pass expiration timestamp, and logs the change to `audit_logs`.
