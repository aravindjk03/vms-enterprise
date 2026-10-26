# Source Provenance

Every downstream record can be traced back to the business event that produced it:

```
service_request ──▶ service_work_order ──▶ service_work_order_journeys ──▶ transport_activities ──▶ ghg_activities
       (request_id)        (association_role PRIMARY/SHARED)         (source_domain='SERVICE', source_entity_*)   (transport_activity_id,
                                                                                                             source_domain/entity)
```

* `GET /api/v1/service/journeys/:id/trace` returns the journey, every linked work order and request, the outbox event
  state and the GHG activity reference (shown in the **Activity traceability** tab).
* Recurring work: `service_schedules → service_occurrences → service_work_orders.occurrence_id`.
* Status changes: `service_status_history` (append-only; entity, from, to, actor, reason, time).
  Milestones: `service_progress_events` (append-only, with corrections linked by `corrects_event_id`).
  Every write also produces an `audit_logs` record.
* Historical evidence is never edited in place: journeys and GHG activities are superseded; progress is corrected
  by appending; completion decisions are separate records.
