# VMS Enterprise: Authorization Architecture & Policy Enforcement

## 1. Server-Side Authorization Model

In VMS Enterprise, authorization is strictly decoupled from the UI layer. Hiding buttons or routes in the web application provides convenient navigation but zero security assurance. Every incoming API request passes through a centralized Policy Enforcement Point (`SecurityGateway` + `evaluateAccess`).

---

## 2. Authorization Flow Diagram (Section 64 - Diagram 2)

```mermaid
flowchart TD
    Req[Incoming Request with Session Token] --> SessionVal[Validate Session & Derive UserContext]
    SessionVal --> TenantCheck{User Tenant == Resource Tenant?}
    TenantCheck -- No (unless SUPER_ADMIN) --> DenyTenant[DENY: Cross-tenant access prohibited]
    TenantCheck -- Yes --> PermCheck{Role has Action Capability?}
    PermCheck -- No --> DenyPerm[DENY: Role lacks capability]
    PermCheck -- Yes --> SiteCheck{Site Scoped Role\n(Guard / Gate Operator)?}
    SiteCheck -- Yes: Site != Home Site --> DenySite[DENY: Scoped strictly to home site]
    SiteCheck -- No / Site Matches --> SoDCheck{Action is Approval AND\nActor == Record Creator?}
    SoDCheck -- Yes --> DenySoD[DENY: Segregation of duties violation]
    SoDCheck -- No --> ClassCheck{Resource Classification\nRestricted or Highly Restricted?}
    ClassCheck -- Clearance Insufficient --> DenyClass[DENY: Data classification clearance required]
    ClassCheck -- Clearance Valid --> TimeCheck{Within Authorized Shift / Time?}
    TimeCheck -- Outside (unless Emergency) --> DenyTime[DENY: Outside authorized time window]
    TimeCheck -- Valid --> Allow[ALLOW ACCESS\nApply Field Redaction Matrix]
```

---

## 3. Resource-Level Authorization

Authorization decisions are never made on entity existence alone (`GET /visitors/:id`). The request must be evaluated against four concurrent dimensions:

1. **Tenant Isolation**: Does the resource belong to the user's active tenant organization?
2. **Site Scoping**: Does the resource reside within a plant or physical campus the user is authorized to operate?
3. **Role Capability**: Does the user's role possess the explicit permission (e.g. `visitor.read`, `contractor.approve`)?
4. **Data Sensitivity**: Does the resource or any embedded child entity carry a data classification level exceeding the user's clearance?

---

## 4. Multi-Level Facility Topology Scoping

```
TENANT (Conglomerate)
  └── ORGANIZATION (Operating Division)
        └── SITE (Manufacturing Plant / Facility)
              ├── GATE (Main Inbound, Commercial Logistics, Emergency Gate)
              └── ZONE (Lobby, Administrative Office, Industrial Shopfloor, Hazardous Hazmat)
```

- **Site Scoping**: A `SECURITY_GUARD` assigned to `Detroit Plant (SITE_A1)` is rejected immediately if attempting to actuate turnstiles or inspect access logs at `Munich Facility (SITE_A2)`.
- **Gate Scoping**: Turnstiles and barriers enforce gate pass criteria (`authorizedGates: string[]`). An executive pedestrian pass cannot actuate a commercial truck weighbridge barrier.
- **Zone Scoping**: Hazardous shopfloor zones require Permit-To-Work (`PTW_APPROVE`) safety clearance and valid safety induction before access grants are authorized.

---

## 5. Time-Based Access Evaluation

Access policies evaluate server-side epoch timestamps against scheduled visit windows:
- **Shift Restrictions**: Security guards and gate operators are bounded by active shift hours (e.g., 06:00 to 18:00 local site time).
- **Scheduled Appointment Window**: Visitor access is granted only within `scheduledStart` to `scheduledEnd` plus an operational grace buffer.
- **Clock Manipulation Defense**: The system ignores client device clocks and relies strictly on NTP-synchronized backend server time.
