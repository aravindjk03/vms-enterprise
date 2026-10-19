# Customer Transport Capture & Group Journey Normalization

## 1. Overview & Transport Vector Normalization

Customer mobility represents a major contributor to Scope 3 upstream emissions. The Customer Domain utilizes the `@vms/transport` service to normalize all travel data into canonical vectors.

### 1.1 Dimensional Vectors Captured
- `mode`: `CAR`, `BUS`, `TRAIN`, `FLIGHT`, `TWO_WHEELER`, `WALKING`.
- `ownership`: `COMPANY`, `PERSONAL`, `HIRED`, `PUBLIC`, `CUSTOMER`.
- `vehicleClass`: `SEDAN`, `SUV`, `HATCHBACK`, `MINI_BUS`, `COACH_BUS`, `LIGHT_COMMERCIAL_VAN`.
- `fuelType`: `PETROL`, `DIESEL`, `ELECTRIC`, `CNG`, `HYBRID`.
- `usageType`: `INDIVIDUAL`, `SHARED`.
- `occupancy`: Total number of human passengers sharing the physical vehicle movement.
- `originLocation` & `destinationLocation`: Default resolved to plant site name if omitted.
- `distanceKm`: Normalized one-way or round-trip kilometers traveled.

---

## 2. Group Journey Deduplication Invariant

When 5 delegates arrive in 1 hired van:
- The system persists **exactly 1 physical vehicle movement** in `transport_activities`.
- `occupancy` is set to 5.
- The GHG engine allocates passenger-km proportional to occupancy:
  $$\text{Effective Quantity} = \frac{\text{Distance (km)}}{\text{Occupancy}}$$
- This mathematically guarantees that emissions are neither undercounted nor multiplied five-fold across participants.

---

## 3. Multi-Vehicle Delegations (`additionalTransports`)

Large delegations often arrive in a convoy across multiple vehicles (e.g., 2 executive sedans and 1 passenger van):
- The API accepts `input.transport` (primary vehicle) and `input.additionalTransports` (convoy array).
- Each vehicle generates its own normalized `transport_activities` record tied to `source_transaction_id = visitId`.
- The database schema indexes these movements under `idx_transport_activities_source` without artificial unique constraint crashes.
- The delegation summary accurately calculates `vehiclesCount: 3`.

---

## 4. Distance Measurement Provenance

The system tracks data provenance for greenhouse gas audit trails:
- `GIS_ROUTING`: Calculated via automated road network map APIs.
- `ODOMETER`: Security guard or driver recorded physical odometer reading.
- `USER_ESTIMATED`: Host or customer provided estimated distance.
- `SYSTEM_CALCULATED`: Default facility centroid to local transit hub routing.
