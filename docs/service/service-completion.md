# Progress and Completion

Progress milestones (`POST /work-orders/:id/progress`) — each is an append-only `service_progress_events` row:

| Event | Status effect | Permission |
|---|---|---|
| ARRIVED | none (arrival ≠ start) | `SERVICE_ARRIVAL_RECORD` or `SERVICE_EXECUTE` |
| PREREQUISITES_CHECKED (VERIFIED / NOT_VERIFIED + what was checked) | none | `SERVICE_PREREQ_VERIFY` |
| WORK_STARTED | SCHEDULED → IN_PROGRESS (needs an assignment and, if required, latest prerequisite check VERIFIED) | `SERVICE_EXECUTE` |
| WORK_PAUSED (reason) / WORK_RESUMED | IN_PROGRESS ⇄ ON_HOLD | `SERVICE_EXECUTE` |
| DEPARTED | none (departure ≠ completion; needs a prior arrival) | as ARRIVED |

Reported times may be up to 7 days in the past, never in the future. Time corrections add a
`CORRECTION` event referencing the original (`corrects_event_id`) with a reason; database triggers make
progress events and status history immutable, even for the schema owner.

Completion: mandatory deliverables need evidence (`/deliverables/:id/evidence`) before
`POST /completion` (else **409 DELIVERABLES_OUTSTANDING**). Accept/return (`SERVICE_ACCEPT`) must be by
someone other than the submitter (API check + `ck_service_completion_sod` constraint). Return needs remarks
and sends the work back to IN_PROGRESS. Accepted → COMPLETED → `close` → CLOSED.
