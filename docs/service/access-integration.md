# Access Integration (boundary only)

Gate/Access is Part 13. Service publishes the facts Gate will need (work order, site, zone, window,
assigned technicians) but **never** grants physical access:

* Provider registration does not grant site access.
* Work-order approval does not grant gate access (stated in the UI and the API response notes).
* `AccessIntegrationAdapter` → `UnavailableAccessAdapter` reports `integration: 'UNAVAILABLE'`;
  the work order detail shows *Gate integration unavailable*.

Arrival/departure today are **reported** milestones (`ARRIVED` / `DEPARTED`, permission
`SERVICE_ARRIVAL_RECORD`, held by reception and security roles). They are labelled "reported" because no
gate device or credential confirms them. Gate-confirmed events will be linked in Part 13 without rewriting
the reported ones.
