# Transport Capture

Technician journeys are recorded on the work order (**Transport & mobility** tab) and stored once in the shared
`transport_activities` table. `service_work_order_journeys` links them to every work order they served.

`POST /api/v1/service/work-orders/:id/journeys` (`SERVICE_EXECUTE`, else `SERVICE_MANAGE`; open work orders only) takes either:

* `{ linkTransportActivityId }`: link an existing journey (`association_role = SHARED`; corrected/superseded journeys refused), or
* journey facts: `activityDate`, `technicianId` (must be assigned), `modeCode`, `ownershipCode`, `vehicleTypeCode`,
  `fuelCode`, `usageType`, `occupancy`, origin/destination (name and city), `distanceKm`, `journeyType`, `direction`,
  `measurementMethod` (ODOMETER | GPS_TRACKED | ROUTE_ESTIMATE | USER_REPORTED | UNKNOWN), `dataSource`, `vehicleRegistration`.

Rules:

* **Nothing is invented.** Unknown facts stay `NULL`. There are no default distances, modes, occupancies or
  emission factors. Completeness is assessed as COMPLETE / PARTIAL / INSUFFICIENT and `missing_facts` lists the gaps.
* **No double counting.** A journey fingerprint (tenant, person, date, route, mode, type, direction, vehicle)
  is unique among current journeys. The same journey submitted for a second work order is *linked*
  (`deduplicated: true`), not copied. A one-way leg that overlaps an existing round trip on the same route
  returns **409 POSSIBLE_DUPLICATE_JOURNEY**.
* **Corrections never overwrite.** `POST /api/v1/service/journeys/:id/corrections` (reason required) inserts a new
  version with `supersedes` and marks the old one `superseded_by`. Every linked work order is moved to the new
  version, and capture is queued again. Ledger tables have no DELETE grant for the application role.
* Master data comes from `GET /api/v1/service/transport-reference` (active modes, ownership, vehicle types, fuels).
