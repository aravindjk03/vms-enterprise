# Embedded ESG Activity Capture & GHG Emissions Engine

## 1. Scope 3 Category 6: Business Travel Accounting

Under the GHG Protocol Corporate Value Chain (Scope 3) Standard, customer visits to manufacturing facilities for commercial reviews, process audits, or technical inspections fall under **Category 6: Business Travel**.

### 1.1 Automated Activity Generation
When a customer visit with transport is created:
1. `TransportService` produces a `NormalizedTransportActivity`.
2. `GHGCalculationEngine.captureActivityFromTransport` automatically generates an `ESGActivityRecord`:
   - `sourceDomain: 'CUSTOMER'`
   - `activityType: 'BUSINESS_TRAVEL'`
   - `activityUnit: 'KM'`
   - `activityQuantity: distanceKm`
3. A genuine record is inserted into `ghg_activities` with `calculation_status: 'PENDING'`.

---

## 2. Emission Factor Resolution & Cryptographic Hash

The calculation engine resolves the appropriate emission factor from its registry:
- **Vehicle Mode & Fuel:** Maps to `ROAD-PETROL-CAR`, `ROAD-DIESEL-CAR`, `ROAD-ELECTRIC-CAR`, etc.
- **Geography Fallback:** Matches specific country grid factors (e.g. `IN`), falling back seamlessly to `GLOBAL` factors.
- **Reporting Methodology:** Uses DEFRA 2026 or CEA CO2 Baseline factors.
- **RFC 8785 Canonical Hash:** Generates a deterministic SHA-256 cryptographic hash of the calculation input parameters to guarantee audit immutability.

---

## 3. The Zero-Blocker Operational Invariant

**CRITICAL INVARIANT:** Operational plant gate transactions must **never** be blocked by ESG calculation delays or offline analytics services.
- If the emissions calculation engine is delayed, offline, or lacks a specific regional factor, the customer visit creation, approval, and gate check-in remain **100% operational**.
- The `ghg_activities` record remains in `PENDING` status to be processed asynchronously by reconciliation workers.
- The factory turnstile continues operating without delay.
