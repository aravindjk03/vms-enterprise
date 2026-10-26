# Service API Contracts

Base path `/api/v1/service`. All endpoints need a bearer access token. Tenant scope comes from the token and is
enforced by PostgreSQL row-level security. Site scope is enforced in the API (`siteScope` / `requireSite`).
Errors use `{ "error": { "code", "message", "requestId" } }`.

**Idempotency:** every creating POST accepts an `Idempotency-Key` header (8–128 characters). A replay returns the stored
2xx response with `Idempotent-Replay: true`. Reusing a key with a different body returns **422 IDEMPOTENCY_KEY_REUSED**;
a concurrent duplicate returns **409 IDEMPOTENCY_IN_PROGRESS**; a malformed key returns **400 INVALID_IDEMPOTENCY_KEY**.
Failed (≥400) responses are not stored, so the client can retry.

| Method & path | Permission | Notes |
|---|---|---|
| GET `/organizations?q` | SERVICE_MANAGE | Canonical external organizations (for provider onboarding) |
| GET `/staff?q` | SERVICE_MANAGE | Tenant users (internal owner picker) |
| GET `/providers` · `/providers/:id` | SERVICE_READ | Filters: q, status, category, siteId; paging `limit` ≤ 100, `offset` |
| POST `/providers` | SERVICE_MANAGE | Uses an existing organization or creates one (no duplicates); categories, sites, agreement, effective dates |
| PATCH `/providers/:id` | SERVICE_MANAGE | Every change requires a `reason`; audited with before and after |
| GET `/technicians` · `/technicians/:id` | SERVICE_READ | Shows contractor cross-reference |
| POST `/technicians` · PATCH `/technicians/:id` | SERVICE_MANAGE | Existing person or new canonical person |
| GET `/requests` · `/requests/:id` | SERVICE_READ (or own requests with SERVICE_REQUEST_CREATE) | Filters: q, status, priority, serviceType, siteId |
| POST `/requests` | SERVICE_REQUEST_CREATE | Idempotent |
| POST `/requests/:id/approve` · `/reject` | SERVICE_APPROVE | Not by the requester; reject needs reason |
| POST `/requests/:id/cancel` | requester or SERVICE_MANAGE | Reason required |
| POST `/requests/:id/fulfil` | SERVICE_MANAGE | All work orders finished |
| GET `/work-orders` | SERVICE_READ | Filters: q, status, priority, providerId, siteId, technicianId, from, to, overdue; sort |
| GET `/work-orders/:id` | SERVICE_READ | Detail incl. deliverables, assignments, progress, completions, exceptions, journeys, history, readiness, integrations |
| POST `/work-orders` | SERVICE_MANAGE | 422 PROVIDER_NOT_ELIGIBLE; idempotent |
| POST `/work-orders/:id/approve` · `/reject` · `/cancel` | SERVICE_APPROVE / SERVICE_APPROVE / SERVICE_MANAGE | Creator cannot approve |
| POST `/work-orders/:id/assignments` | SERVICE_MANAGE | 422 TECHNICIAN_NOT_ELIGIBLE, 409 SCHEDULE_CONFLICT |
| POST `/work-orders/:id/assignments/:assignmentId/cancel` | SERVICE_MANAGE | Reason required |
| POST `/work-orders/:id/progress` | per event (see completion doc) | `{ eventType, occurredAt?, outcome?, comment? }` |
| POST `/work-orders/:id/progress/:eventId/corrections` | SERVICE_EXECUTE | Appends a CORRECTION event; reason required |
| POST `/work-orders/:id/deliverables/:deliverableId/evidence` | SERVICE_EXECUTE | `{ evidenceNote, documentId? }` |
| POST `/work-orders/:id/completion` | SERVICE_EXECUTE | 409 DELIVERABLES_OUTSTANDING |
| POST `/work-orders/:id/completion/accept` · `/return` | SERVICE_ACCEPT | Not by the submitter (403); return needs remarks |
| POST `/work-orders/:id/close` | SERVICE_MANAGE | From COMPLETED |
| POST `/work-orders/:id/exceptions` · GET `/exceptions` · POST `/exceptions/:id/resolve` | SERVICE_EXECUTE or SERVICE_MANAGE / SERVICE_READ / SERVICE_MANAGE | Resolution note required |
| GET `/transport-reference` | SERVICE_READ | Transport master data |
| POST `/work-orders/:id/journeys` | SERVICE_EXECUTE or SERVICE_MANAGE | 200 deduplicated, 201 created, 409 POSSIBLE_DUPLICATE_JOURNEY |
| POST `/journeys/:id/corrections` | SERVICE_EXECUTE or SERVICE_MANAGE | Supersession; reason required |
| GET `/journeys/:id/trace` | SERVICE_READ | Provenance chain |
| GET `/schedules` · `/schedules/:id` | SERVICE_READ | |
| POST `/schedules` | SERVICE_MANAGE | Recurrence validated (`INVALID_RULE`) |
| POST `/schedules/:id/approve` | SERVICE_APPROVE | Not by the creator |
| POST `/schedules/:id/pause` · `/resume` · `/end` | SERVICE_MANAGE | |
| POST `/schedules/:id/generate` | SERVICE_MANAGE | `{ from, to }` ≤ 366 days; returns created/existing counts |
| POST `/occurrences/sweep-missed` | SERVICE_MANAGE | `{ graceMinutes }` |
| GET `/calendar` | SERVICE_READ | `from`, `to` ≤ 62 days |
| GET `/analytics/summary` | SERVICE_READ | Counts and activity-capture completeness only |

Common status codes: 400 validation, 401 unauthenticated, 403 permission, site scope or segregation of duties on approvals
(`FORBIDDEN`), 404 (also used for rows outside the tenant, which RLS hides), 409 state or scheduling conflict, 422 eligibility or idempotency misuse.
