# VMS Enterprise: Provenance & Data Quality Architecture

This document describes the data provenance hierarchy, quality classifications, evidence linkages, and audit verification algorithms implemented across the VMS Enterprise ESG accounting engine.

---

## 1. Data Quality Hierarchy

In accordance with the GHG Protocol Corporate Value Chain (Scope 3) Standard and the ISO 14064-1 specification, VMS Enterprise categorizes all operational activity inputs into four distinct data quality levels:

| Level | Code | Description | Example Sources | Uncertainty Rating |
| :---: | :--- | :--- | :--- | :---: |
| **L1** | `MEASURED_PRIMARY` | Direct physical measurement from calibrated facility hardware or audited logs. | Weighbridge gross/tare receipts, physical odometer readings, utility fuel meters, certified telematics. | ±1% to ±3% |
| **L2** | `CALCULATED_GEO` | Algorithmic routing derived from verified geographic origins and destinations. | Google Maps Distance Matrix API, GPS route geometry between validated facility coordinates. | ±5% to ±8% |
| **L3** | `ESTIMATED_SECONDARY`| User-declared distance or operational approximations based on standard travel corridors. | Visitor travel declarations, scheduled courier route tables, typical supplier distance averages. | ±10% to ±15% |
| **L4** | `DEFAULT_BENCHMARK` | Industry or regional benchmark averages applied when specific journey data is absent. | State/provincial average employee commute distance, standard short-haul freight defaults. | ±20% to ±30% |

---

## 2. Evidence Linkages & Centralized Vault Integration

To withstand rigorous third-party ESG audits (e.g. PwC, EY, Deloitte, Bureau Veritas):
1. Every `ghg_activities` record can reference an optional `evidence_id` pointing to an audited document in `documents`.
2. Physical evidence (e.g. weighbridge printout PDF, signed delivery challan scan, fuel pump invoice, boarding pass) is registered in `documents` with SHA-256 cryptographic hashes.
3. A polymorphic entry in `document_links` binds the document to the operational transaction and GHG activity:
   ```json
   {
     "document_id": "00000000-0000-0000-0000-000000000999",
     "entity_type": "GHG_ACTIVITY",
     "entity_id": "GHG-2026-000567",
     "relationship_type": "AUDIT_EVIDENCE"
   }
   ```

---

## 3. Derivation Chain Tracking

Every calculated carbon emission output records an unbroken derivation chain:
```
GHG Result (co2e)
  └── GHG Activity (quantity, unit, scope, category, data_quality)
        └── Transport Activity (distance, mode, fuel, occupancy, payload)
              └── Source Domain Transaction (visitor, material, contractor, service)
                    └── Operational Master Data (person, vendor, site, gate)
```

### Derivation Invariants:
1. **Source Independence**: The transport activity is independent of domain logic, allowing uniform calculation formulas across diverse workflows.
2. **Input Snapshotting**: The `ghg_calculations` record preserves a permanent JSON snapshot of all inputs (`distance`, `occupancy`, `payloadWeightTonnes`, `factorValue`, `factorUnit`, `reportingYear`) at the exact millisecond of calculation.
3. **No Retroactive Mutability**: Recalculating carbon figures (e.g. due to revised emission factors) generates a new calculation row (`calculation_version = calculation_version + 1`), preserving historical reporting figures intact.
