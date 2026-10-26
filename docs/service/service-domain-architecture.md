# Service / Work Management — Domain Architecture (Part 9)

## Boundary

Service is an independent domain inside the modular monolith. It does **not** reuse the Visitor or
Contractor lifecycles and does not own physical access or safety permits.

| Concept | Meaning | Table |
|---|---|---|
| Service provider | Relationship between the tenant and a canonical external organization | `service_providers` (+ `service_provider_categories`, `service_provider_sites`) |
| Technician | Relationship between a canonical person and a provider | `service_technicians` |
| Service request | A request for work | `service_requests` |
| Service work order | The authorized service activity | `service_work_orders` (+ `service_work_order_deliverables`) |
| Assignment | A technician scheduled on a work order | `service_assignments` |
| Recurring schedule / occurrence | Template and its dated instances (one work order each) | `service_schedules`, `service_occurrences` |
| Progress event | Append-only milestone (arrival ≠ start ≠ completion ≠ departure) | `service_progress_events` |
| Completion record | Submission and independent decision | `service_completion_records` |
| Exception | Issue needing follow-up (missed occurrence, no-show, …) | `service_exceptions` |
| Journey link | One physical journey ↔ every work order it served | `service_work_order_journeys` |

Shared services reused, not rebuilt: tenants/sites/zones/departments, persons, external organizations,
users/roles/RLS, documents (evidence references), transport activities, GHG activity ledger, audit log,
transactional outbox.

## Layers

```
apps/web (live Service screens) ──HTTP──▶ apps/api/src/routes/service/*  (authorization, validation, SQL)
                                              │ uses
                                              ▼
                                   services/service (@vms/service): state machines, eligibility,
                                   recurrence, overlap detection, journey rules, adapter interfaces
                                              │
                                              ▼
                                   PostgreSQL (migrations 007, 008) with row-level security per tenant
```

Background: `apps/api/src/jobs/outbox-worker.ts` claims `vms.esg.transport_activity.captured.v1`
events and creates source-linked GHG activities (`jobs/esg-capture.ts`).

## Scope limits (honest)

* Not a CMMS/EAM: there is no asset register; equipment is a free-text tag on requests/work orders.
* The declarative workflow engine from Part 5 still runs in-memory; Service approvals are implemented
  directly in the API with segregation of duties. Migrating approvals onto a persisted workflow engine is future work.
* Safety/Permit (Part 14) and Gate/Access (Part 13) are adapter boundaries reporting `UNAVAILABLE`.
* Document upload arrives with Part 12; evidence is a reference note (plus optional existing document id).
