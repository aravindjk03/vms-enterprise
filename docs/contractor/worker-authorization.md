# Worker Authorization Decision Engine

## 1. Overview & Purpose

The Worker Authorization Decision Engine (`ContractorService.evaluateWorkerAuthorization`) is the critical access control gateway between database policy and physical barrier automation.

When an industrial contractor presents an RFID badge, mobile credential, or biometric identifier at a plant perimeter turnstile, the engine evaluates a complex multi-predicate decision matrix in under 50 milliseconds to grant or deny barrier rotation.

---

## 2. Multi-Predicate Evaluation Matrix

The engine evaluates nine sequential validation gates. If any gate fails, authorization is immediately denied with a specific, auditable failure code:

```mermaid
flowchart TD
    SWIPE[Turnstile Credential Swipe] --> G1{Gate 1: Company Status}
    G1 -- !ACTIVE --> R1[DENY: COMPANY_INACTIVE]
    G1 -- ACTIVE --> G2{Gate 2: Site Authorization}

    G2 -- Site Not Approved --> R2[DENY: COMPANY_NOT_APPROVED_FOR_SITE]
    G2 -- Approved --> G3{Gate 3: Contract Validity}

    G3 -- Expired / Not Active --> R3[DENY: CONTRACT_EXPIRED_OR_SUSPENDED]
    G3 -- Active & Valid --> G4{Gate 4: Work Order Status}

    G4 -- Not APPROVED/IN_PROGRESS --> R4[DENY: WORK_ORDER_NOT_APPROVED]
    G4 -- Approved --> G5{Gate 5: Worker Profile State}

    G5 -- RESTRICTED / BLACKLISTED --> R5[DENY: WORKER_STATUS_RESTRICTED]
    G5 -- ACTIVE --> G6{Gate 6: Active Assignment}

    G6 -- No Valid Active Assignment --> R6[DENY: NO_ACTIVE_WORK_ASSIGNMENT]
    G6 -- Valid Assignment --> G7{Gate 7: Date Window Bounds}

    G7 -- Outside WO/Assignment Dates --> R7[DENY: OUTSIDE_AUTHORIZATION_WINDOW]
    G7 -- Within Window --> G8{Gate 8: Headcount Cap}

    G8 -- Concurrent On-Site >= Cap --> R8[DENY: HEADCOUNT_CAP_EXCEEDED]
    G8 -- Cap Available --> G9{Gate 9: Safety Prerequisites}

    G9 -- Missing Induction / Expired Medical --> R9[DENY: SAFETY_PREREQUISITE_FAILED]
    G9 -- Satisfied --> GRANT[GRANT: UNLATCH_BARRIER]
```

---

## 3. Decision Contract Schema

The TypeScript interface `WorkerAuthorizationDecision` defines the output payload:

```typescript
export interface WorkerAuthorizationDecision {
  isAuthorized: boolean;
  contractorWorkerId: string;
  badgeNumber: string;
  workerName: string;
  companyName: string;
  workOrderNumber?: string;
  workLocation?: string;
  rejectionReason?: string;
  warnings?: string[];
  evaluatedAt: Date;
  details?: {
    companyStatus: ContractorCompanyStatus;
    contractStatus: ContractStatus;
    workOrderStatus: WorkOrderStatus;
    workerStatus: ContractorWorkerStatus;
    assignmentStatus: ContractorAssignmentStatus;
    medicalFitnessValid: boolean;
    safetyInductionValid: boolean;
    headcountCap: number;
    currentOccupancy: number;
  };
}
```

---

## 4. Rejection Codes & Operational Triage

| Rejection Code | Root Cause | Operator Triage Action |
|:---|:---|:---|
| `COMPANY_INACTIVE` | Contractor organization is suspended or pending onboarding review. | Contact Procurement / Vendor Management. |
| `COMPANY_NOT_APPROVED_FOR_SITE` | Company is not authorized for this specific plant facility. | Verify contract site scope. |
| `CONTRACT_EXPIRED_OR_SUSPENDED` | Commercial agreement has concluded or is under legal hold. | Sourcing lead must file contract extension. |
| `WORK_ORDER_NOT_APPROVED` | Work Order is still in `DRAFT` or `SUBMITTED` state. | Plant Engineer must approve work order. |
| `WORKER_STATUS_RESTRICTED` | Individual worker has safety incident or disciplinary restriction. | EHS Officer review required. |
| `NO_ACTIVE_WORK_ASSIGNMENT` | Worker has not been formally scheduled to a work order. | Contractor supervisor must assign worker. |
| `OUTSIDE_AUTHORIZATION_WINDOW` | Today's date is before `start_date` or after `end_date`. | Check shift scheduling calendar. |
| `HEADCOUNT_CAP_EXCEEDED` | Maximum authorized headcount for the work order is currently on site. | Await shift turnover or request supervisor cap elevation. |
| `SAFETY_PREREQUISITE_FAILED` | Expired EHS safety induction or occupational medical fitness. | Direct worker to Plant Safety Training Center. |
| `MANDATORY_PTW_MISSING` | Work order specifies high-hazard PTW but active permit not found. | Issue Permit-to-Work via EHS portal. |
