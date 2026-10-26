# Technician Management

A technician is a **relationship** (`service_technicians`) between a canonical `persons` row and a
provider; identity fields stay on the person. Unique per (provider, person). A person may also be a
contractor worker (`contractor_workers.person_id`); the API reports this (`isContractorWorker`,
`contractorVendorCode`) without merging the relationships.

Assignment rules (`technicianEligibility`): technician belongs to the work order's provider, is ACTIVE,
within effective dates. Provider registration alone gives no technician site access; physical access is
decided by Gate/Access (Part 13).

Endpoints: `GET/POST /api/v1/service/technicians`, `GET/PATCH /api/v1/service/technicians/:id`
(every change requires a reason and is audited).
