# Service Scheduling

* Calendar: `GET /api/v1/service/calendar?from&to[&siteId&providerId&technicianId&category&status]`,
  range ≤ 62 days, scoped to the user's sites. UI: day / week / month views with site, provider and status filters.
* Assignment windows default to the work order window; `validateWindow` rejects end ≤ start.
* Overlap detection (`findOverlaps`, half-open intervals — back-to-back is allowed) across all of the
  technician's active assignments in the tenant. Policy `SERVICE_ASSIGNMENT_OVERLAP_POLICY`:
  `BLOCK` (default) returns **409 SCHEDULE_CONFLICT** with the conflicting work orders; `WARN` allows the
  assignment only with `acknowledgeConflicts: true`, recorded on the assignment (`conflict_acknowledged`).
* Times are stored as UTC instants; recurring templates are defined in the site's local time zone.
