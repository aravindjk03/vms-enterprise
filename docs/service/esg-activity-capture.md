# ESG Activity Capture

Service records **activity data**; it does not calculate emissions.

1. Recording a journey writes the transport activity and, in the **same transaction**, an outbox event
   `vms.esg.transport_activity.captured.v1` (idempotency key = transport activity id).
2. `OutboxWorker` (`apps/api/src/jobs/outbox-worker.ts`, started by `server.ts`) claims due events with
   `outbox_claim()` (SKIP LOCKED). Each event is processed in its own tenant-scoped transaction, with exponential
   backoff plus jitter, and becomes `FAILED` (dead letter) after the maximum number of attempts.
3. `captureTransportActivity` (`jobs/esg-capture.ts`) inserts one `ghg_activities` row per transport
   activity (`activity_type = PERSON_TRAVEL`, unique on `transport_activity_id`, so a retry inserts nothing):
   * `quantity` = distance in km, or `NULL` when unknown;
   * `data_quality` derived from the measurement method (ODOMETER/GPS → MEASURED, ROUTE_ESTIMATE → SYSTEM_ESTIMATED,
     USER_REPORTED → USER_PROVIDED, UNKNOWN → `NULL`);
   * `calculation_status` = `NEEDS_DATA` when distance or mode is missing, otherwise `PENDING_CALCULATION`;
   * `missing_facts` copied from the journey;
   * **no scope, category, emission factor or CO2e** is written. Those belong to the methodology engine (Parts 18–19).
4. A correction supersedes the earlier GHG activity (`calculation_status = SUPERSEDED`, `superseded_by`).

The UI shows the capture state per journey: QUEUED → CAPTURED (with ledger reference), FAILED, or SUPERSEDED.
The analytics summary reports activity-capture completeness counts, never emission totals.
