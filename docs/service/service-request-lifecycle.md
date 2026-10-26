# Service Request Lifecycle

`SUBMITTED → APPROVED → WORK_ORDERED → FULFILLED`, with `REJECTED` and `CANCELLED` as terminal branches.
Type (`service_type`), priority, workflow stage (`stage`) and lifecycle status (`status`) are separate columns.

| Action | From | To | Who | Rules |
|---|---|---|---|---|
| Submit | — | SUBMITTED | `SERVICE_REQUEST_CREATE` (e.g. HOST, SERVICE_MANAGER) | Requester must be assigned to the site (tenant-wide roles excepted); zone must belong to site |
| Approve | SUBMITTED | APPROVED | `SERVICE_APPROVE` | Requester cannot approve own request (segregation of duties) |
| Reject | SUBMITTED | REJECTED | `SERVICE_APPROVE` | Reason required |
| Create work order | APPROVED / WORK_ORDERED | WORK_ORDERED | `SERVICE_MANAGE` | One request may create several work orders |
| Cancel | SUBMITTED / APPROVED | CANCELLED | requester or `SERVICE_MANAGE` | Reason required |
| Fulfil | WORK_ORDERED | FULFILLED | `SERVICE_MANAGE` | Every work order closed, cancelled or rejected |

Visibility: users with `SERVICE_READ` see requests at their sites; users who only have
`SERVICE_REQUEST_CREATE` see only their own requests. Every transition writes `service_status_history`
(append-only) and an `audit_logs` entry. Supports `Idempotency-Key`.
