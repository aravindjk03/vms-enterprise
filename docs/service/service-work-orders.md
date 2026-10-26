# Service Work Orders

Statuses: `PENDING_APPROVAL → APPROVED → SCHEDULED → IN_PROGRESS ⇄ ON_HOLD → COMPLETION_SUBMITTED → COMPLETED → CLOSED`;
`COMPLETION_SUBMITTED → IN_PROGRESS` (returned); `CANCELLED` (before work starts or while on hold); `REJECTED`.
Stage is derived (APPROVAL, PLANNING, SCHEDULED, EXECUTION, ACCEPTANCE, CLOSED).

Creation (`SERVICE_MANAGE`):
* from an APPROVED/WORK_ORDERED request at the same site, or standalone;
* provider eligibility (`providerEligibility`): ACTIVE, within effective dates, authorized for the site,
  approved for the category — otherwise **422 PROVIDER_NOT_ELIGIBLE** with every reason;
* deliverables with `evidenceRequired` / `isMandatory`; completion criteria; safety permit flag; prerequisites.

Approval (`SERVICE_APPROVE`): the creator cannot approve. Approval does **not** grant gate access or
permission for hazardous work. If technicians were assigned while pending, approval moves straight to SCHEDULED.

Concurrency: every transition loads the work order `FOR UPDATE`; state machine rules live in
`services/service/src/model.ts` (`nextWorkOrderStatus`). Invalid transitions return **409 INVALID_STATE**.
