# Contractor Worker Assignments

## 1. Overview & Purpose

A Contractor Worker Assignment (`contractor_worker_assignments`) forms the explicit operational link between an individual contractor craftsperson and an authorized work order.

While a worker profile records human capabilities, trade skills, and medical certifications, an assignment confers operational authorization to be present in a designated physical area of the facility during specified dates.

---

## 2. Assignment Relational Structure

| Column Name | Data Type | Nullable | Constraints & Description |
|:---|:---|:---|:---|
| `assignment_id` | UUID | No | Primary Key |
| `tenant_id` | UUID | No | Multi-tenant isolation key |
| `work_order_id` | UUID | No | Foreign Key to `contractor_work_orders` |
| `contractor_worker_id` | UUID | No | Foreign Key to `contractor_workers` |
| `status` | ENUM | No | Lifecycle state (`ACTIVE`, `PENDING_APPROVAL`, `ON_HOLD`, `COMPLETED`, `REVOKED`) |
| `assigned_role` | VARCHAR(128) | Yes | Craft or operational duty (e.g. `Lead Welder`, `Rigging Supervisor`) |
| `start_date` | DATE | No | Date assignment takes effect |
| `end_date` | DATE | No | Date assignment concludes |
| `shift_pattern` | VARCHAR(64) | Yes | Assigned shift (e.g. `DAY_SHIFT`, `NIGHT_ROTATION`) |
| `assigned_by_user_id` | UUID | Yes | Manager or coordinator executing assignment |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Modification timestamp |

---

## 3. Assignment Invariants & Verification Logic

When `ContractorService.assignWorkerToWorkOrder` executes, the following integrity constraints are strictly enforced:

1. **Company Alignment:** The worker's employer company must match the contractor company contracted on the Work Order.
2. **Work Order Status:** The target Work Order must be in `APPROVED` or `IN_PROGRESS` state. Assignments cannot be made to `DRAFT`, `SUBMITTED`, `REJECTED`, or `COMPLETED` work orders.
3. **Temporal Bounding Invariant:**
   $$\text{WO.start\_date} \le \text{Assignment.start\_date} \le \text{Assignment.end\_date} \le \text{WO.end\_date}$$
   Any assignment extending past the Work Order's approved end date is rejected with an `INVALID_ASSIGNMENT_DATE_RANGE` error.
4. **Headcount Capacity Check:** The count of existing `ACTIVE` assignments for the Work Order is verified against `authorized_worker_count`. If saturated, the assignment is blocked unless authorized by an elevated manager.

```mermaid
flowchart TD
    REQ[Assign Worker Request] --> C1{Worker Company == WO Company?}
    C1 -- No --> REJ1[Error: Cross-Company Assignment Prohibited]
    C1 -- Yes --> C2{WO Status in [APPROVED, IN_PROGRESS]?}
    C2 -- No --> REJ2[Error: Work Order Not Active]
    C2 -- Yes --> C3{Assignment Dates within WO Date Bounds?}
    C3 -- No --> REJ3[Error: Dates Outside Work Order Validity]
    C3 -- Yes --> C4{Active Assignments < WO Headcount Cap?}
    C4 -- No --> REJ4[Error: Headcount Capacity Saturated]
    C4 -- Yes --> CREATE[Insert contractor_worker_assignments record]
```

---

## 4. Reassignment & Termination Workflows

- **Reassignment (`reassignWorker`):** Concludes the previous assignment with status `COMPLETED` and timestamped notes, and opens a new assignment under the replacement Work Order, re-verifying safety prerequisites for the new location.
- **De-assignment (`endAssignment`):** Sets assignment status to `COMPLETED` or `REVOKED`. If the worker has no other active assignments, their gate access credentials immediately transition to inactive.
