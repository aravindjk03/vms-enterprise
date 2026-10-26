# Recurring Services

Template: `service_schedules` (DAILY / WEEKLY with ISO weekdays / MONTHLY day 1–28, interval 1–52,
start/end date, local start time, duration, site time zone, deliverables).

Lifecycle: `DRAFT → ACTIVE` (approve; creator cannot approve) `⇄ PAUSED`, `→ ENDED`.

Generation (`POST /schedules/:id/generate {from,to}`, ACTIVE only, ≤ 1 year per call):
* `expandOccurrences` is a pure, DST-safe function (site-local wall clock → UTC);
* each date inserts `service_occurrences` with `UNIQUE (schedule_id, occurrence_date)` — re-running the
  same or overlapping range creates nothing new (idempotent); each new occurrence gets **its own** work order
  (APPROVED via the approved schedule), never one long-lived work order;
* provider eligibility is re-checked per occurrence.

Missed occurrences (`POST /occurrences/sweep-missed {graceMinutes}`): past occurrences whose work never
started are marked `MISSED` and a `MISSED_OCCURRENCE` exception is raised (unique per occurrence).
Nothing is ever marked complete automatically. Running the sweep on a timer is an operations task (not yet scheduled).
