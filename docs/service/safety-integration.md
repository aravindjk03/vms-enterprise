# Safety Integration (boundary only)

The Safety/Permit service is built in Part 14. Until then Service uses `SafetyPermitAdapter`
(`services/service/src/adapters.ts`), whose only implementation, `UnavailableSafetyAdapter`, reports
`integration: 'UNAVAILABLE'`. **No permit is ever reported as valid by default.**

How prerequisites behave until Part 14:

* A work order can be flagged `safety_permit_required` and can list prerequisites (induction, PPE, LOTO, …).
* The work order detail shows the integration as *Unavailable* and readiness as *Prerequisites not verified*.
* `WORK_STARTED` is refused (**409 PREREQUISITES_UNMET**) while the work order requires a permit or lists prerequisites and the
  latest `PREREQUISITES_CHECKED` event is not `VERIFIED`.
* A manual check needs `SERVICE_PREREQ_VERIFY`. By default only EHS_MANAGER, SITE_ADMIN and SUPER_ADMIN have it;
  SERVICE_MANAGER deliberately does **not**, so the person organizing the work cannot clear its safety gate.
  The check stores the outcome, what was checked, the verifier and the time, append-only.

Service approval never means safety approval. When Part 14 arrives, a real adapter replaces the manual step;
the history of manual checks stays as evidence.
