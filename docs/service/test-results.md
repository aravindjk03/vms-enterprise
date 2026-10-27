# Part 9 Test Results

> This page records the Part 9 delivery. For the current, complete verification (21 integration scenarios, screen
> sweeps at three widths, role coverage) see [`../LAUNCH_READINESS.md`](../LAUNCH_READINESS.md).

Recorded on 2026-10-26 in the development container: Node v22.22.0, PostgreSQL 16.15 (local, throwaway databases only).
These results show the application behaves as specified in tests. They are **not** evidence of production
readiness or compliance certification.

## Commands run

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Unit / domain tests | `npm test` | 305 tests, 28 suites, 305 pass, 0 fail (19 of them in `tests/service-management.test.ts`) |
| Integration tests | `INTEGRATION_DATABASE_URL=postgresql://…/postgres npm run test:integration` | 19 tests, 19 pass, 0 fail |
| Web build | `npm run build:web` | exit 0; warning: main chunk 875 kB (> 500 kB), code-splitting not done yet |
| Dependency audit | `npm audit` | 0 vulnerabilities |
| Migrations, fresh database | `MIGRATION_DATABASE_URL=… npm run db:migrate` | 8 applied; immediate re-run: "database up to date (8 migrations)" |
| Migrations, existing database | same, on a database already at 007 | 008 applied, 7 already up to date; re-run no-op |
| Browser walkthrough | Playwright script against the API serving the production build | 19/19 steps pass, no browser console errors |

The integration suite creates a throwaway database per run, applies every migration, connects through the
restricted `vms_app` runtime role (row-level security enforced), and boots the real Fastify app.

## Integration scenarios (Service)

1. Manages providers on the canonical organization model without duplicates.
2. Runs the request lifecycle with requester visibility and segregation of duties (plus Idempotency-Key replay and reuse).
3. Creates work orders only for eligible providers and enforces approval separation.
4. Validates assignments and detects schedule conflicts.
5. Keeps arrival, prerequisites, start, completion and departure distinct and authorized.
6. Requires deliverable evidence and independent acceptance before closure.
7. Captures transport facts once per physical journey and queues GHG capture durably (worker run, retry no-op, correction supersedes).
8. Generates recurring occurrences idempotently and flags missed ones.
9. Reports analytics from persisted data only (no CO2e).
10. Isolates tenants and enforces row-level security on Service tables, including the legacy `service_work_locations`
    child table. This assertion **fails without migration 008** (verified by running the suite with 008 removed) and passes with it.

The 9 pre-existing platform scenarios (migrations and drift, RLS, privileged-role refusal, lockout, visitor lifecycle,
tenant isolation, refresh-token rotation, malformed requests) still pass.

## Browser walkthrough (roles exercised)

Service manager A, service manager B, EHS manager, security guard and host, each signed in separately:

* Service manager sees 8 Service menu items; host sees 1; guard has no "New request" button.
* Provider authorized for the site, technician added.
* Host submits a request and sees only their own requests.
* Manager A approves the request and creates a work order, but cannot approve their own work order; manager B approves it.
* Technician assigned → SCHEDULED. Guard records arrival and is offered only *Arrived / Departed*.
* EHS lead records the manual prerequisite verification; work started.
* Journey captured from the work order (QUEUED). The background worker creates the ledger entry (pending calculation, no CO2e).
* Completion submitted (the submitter cannot accept it); manager B accepts; work order closed.
* Calendar day, week and month views render.
* Recurring schedule created (DRAFT) and approved by the other manager. Generate #1: 9 work orders created.
  Generate #2 over the same range: 0 created, 9 already existed.
* Exceptions page renders.

## Not tested / known limits

* Real Safety/Permit and Gate/Access integrations (do not exist yet; adapters report UNAVAILABLE).
* Notification delivery (events are queued, not sent); document upload (Part 12).
* Load, concurrency at scale, accessibility audit, cross-browser testing (Chromium only).
* Missed-occurrence sweep runs on demand; it is not on a timer.
