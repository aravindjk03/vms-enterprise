# Complete Bidirectional 4-Node Traceability Chain

## 1. Executive Summary

Enterprise sustainability auditors (e.g. CSRD, SEC Climate Disclosures, ISO 14064, GHG Protocol) strictly prohibit orphan carbon metrics. If a sustainability report states that a manufacturing facility emitted $142.5\text{ kg CO}_2\text{e}$ from visitor transit, the auditor must be able to drill down to the exact vehicle, distance, origin, appointment, and human being.

VMS Enterprise enforces a **bidirectional, 4-node provenance chain**:

$$\text{Source Transaction} \longleftrightarrow \text{Transport Activity} \longleftrightarrow \text{GHG Activity} \longleftrightarrow \text{GHG Calculation Result}$$

---

## 2. Four-Node Provenance Chain Diagram

```mermaid
graph LR
    subgraph Node1 [1. Source Transaction]
        TX[Visitor Transaction<br/><b>VIS-2026-000182</b><br/>Aravind Swaminathan<br/>Sievert Industrial Automation<br/>Host: Vikram Mehta<br/>Site: Chennai Plant]
    end

    subgraph Node2 [2. Transport Activity]
        TRA[Transport Activity<br/><b>TRA-CHN-00182</b><br/>Mode: CAR (Diesel Sedan)<br/>Origin: Bengaluru<br/>Distance: 348 km<br/>Provenance: SYSTEM_ESTIMATED]
    end

    subgraph Node3 [3. GHG Activity]
        GHA[GHG Activity<br/><b>GHA-2026-000182</b><br/>Domain: VISITOR<br/>Activity Type: BUSINESS_TRAVEL<br/>Quantity: 348 km<br/>Status: CALCULATED]
    end

    subgraph Node4 [4. GHG Calculation Result]
        CALC[GHG Calculation<br/><b>CALC-2026-000182</b><br/>Factor: DEFRA-2026-CAR-DIESEL<br/>Factor Version: v2.1<br/>Scope: Scope 3 Cat 6<br/><b>Result: 59.51 kg CO2e</b>]
    end

    TX -->|creates| TRA
    TRA -->|normalizes| GHA
    GHA -->|evaluates| CALC
    
    CALC -.->|audits back to| GHA
    GHA -.->|audits back to| TRA
    TRA -.->|audits back to| TX
```

---

## 3. Bidirectional Traversal APIs

`VisitorService.getTraceabilityChain(transactionId)` resolves the complete graph in real time:

```typescript
const chain = await visitorService.getTraceabilityChain('tx-vis-101');

console.log(chain);
// Output:
// {
//   visitorTransaction: { id: 'tx-vis-101', referenceNumber: 'VIS-2026-000182', name: 'Aravind Swaminathan' },
//   transportActivity: { transportId: 'TRA-CHN-00182', mode: 'CAR', distanceKm: 348, provenance: 'SYSTEM_ESTIMATED' },
//   ghgActivity: { id: 'GHA-2026-000182', activityType: 'BUSINESS_TRAVEL', quantity: 348, status: 'CALCULATED' },
//   ghgCalculation: { id: 'CALC-2026-000182', factorId: 'DEFRA-2026-CAR-DIESEL', kgCO2e: 59.51, scope: 'SCOPE_3' }
// }
```

Reverse traversal is supported: given any `ghgActivityId` or `calculationId`, the platform navigates backward to identify the specific guest who visited the facility.

---

## 4. Immutable Provenance Invariants

1. **Mandatory Source Identifiers**: No record can be saved into `ghg_activities` without a valid `source_domain` and `source_transaction_id`.
2. **Audit Logging on Recalculation**: If an authorized Sustainability Manager adjusts distance or vehicle classification, the system does not overwrite historical records. It appends a new calculation version with explicit audit reason codes (`MEASUREMENT_CORRECTION`, `ROUTE_VERIFICATION`).
