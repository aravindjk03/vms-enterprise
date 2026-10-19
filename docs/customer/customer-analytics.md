# Customer Management Operational & ESG Analytics

## 1. Overview & Genuine Data Derivation Invariant

All operational metrics, visit counts, overstay incidents, and Scope 3 emissions totals provided by `CustomerService.getCustomerAnalyticsSummary` are **derived strictly from persisted relational database records**. Synthetic, fabricated, or hardcoded metrics are strictly forbidden.

---

## 2. Real-Time Operational KPI Dimensions

The analytics engine aggregates data along five critical dimensions:
1. **Account Portfolio:** Total registered accounts, active accounts, and distribution across OEM and strategic customer classifications.
2. **Daily Plant Throughput:** Total visits scheduled today, currently on-premises count, and completed checkouts.
3. **Audit & Inspection Activity:** Count of active and completed process audits (`CUSTOMER_AUDIT`) and tooling trials (`CUSTOMER_INSPECTION`).
4. **Mobility & Transport Distribution:** Breakdown of transportation modes (`CAR`, `BUS`, `TRAIN`, `FLIGHT`, `TWO_WHEELER`, `WALKING`) and fleet fuel types (`ELECTRIC`, `PETROL`, `DIESEL`).
5. **Scope 3 Category 6 Carbon Emissions:** Total calculated kilograms of $CO_2e$ attributed to customer delegations arriving at the facility.

---

## 3. Site-Level Scoping & Filtering

All analytics queries accept an optional `siteId` parameter:
```typescript
const plantSummary = await customerService.getCustomerAnalyticsSummary(tenantId, siteId);
```
- If `siteId` is provided, metrics are strictly constrained to visits occurring at that specific plant campus.
- Multi-site enterprise dashboards omit `siteId` to retrieve global tenant-wide aggregations.
