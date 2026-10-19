# Customer Source Provenance & Forensic Traceability

## 1. Overview & Section 61 Auditability Invariant

Regulatory reporting frameworks (CSRD, SEC Climate Disclosures, and IFRS S2) strictly prohibit synthetic, untraceable carbon claims. Every reported gram of $CO_2e$ must resolve through a complete, verifiable bidirectional provenance chain back to the original operational transaction.

---

## 2. Diagram 10: Bidirectional Provenance Traceability Chain

```mermaid
graph LR
    subgraph Operational_Layer["Operational Layer (Factory Ground)"]
        CA["Customer Account<br/>(Master Legal Entity)"]
        CV["Customer Visit Transaction<br/>(Ref: CUS-2026-003001)"]
        CP["Customer Delegates<br/>(Badge Turnstile Events)"]
    end

    subgraph Transport_Layer["Normalized Mobility Layer"]
        TA["Normalized Transport Activity<br/>(Mode: CAR, Fuel: EV, 42 km)"]
    end

    subgraph ESG_Activity_Layer["ESG Activity Layer"]
        EA["ESG Activity Record<br/>(Domain: CUSTOMER, Type: BUSINESS_TRAVEL)"]
    end

    subgraph Calculation_Layer["Cryptographic Calculation Ledger"]
        GC["GHG Calculation Record<br/>(Factor: EF-DEFRA-ROAD-EV-2026<br/>Emissions: 2.1882 kgCO2e<br/>Hash: 32-char SHA-256)"]
    end

    CA --> CV
    CV --> CP
    CV --> TA
    TA --> EA
    EA --> GC

    GC -.->|Reverse Audit Trail| EA
    EA -.->|Reverse Audit Trail| TA
    TA -.->|Reverse Audit Trail| CV
    CV -.->|Reverse Audit Trail| CA
```

---

## 3. Bidirectional Provenance Traversal

The platform exposes `getCustomerActivityTraceability(tenantId, customerVisitId)` which compiles:
1. `customerVisit`: The parent appointment, host, scheduled times, and security state.
2. `customerAccount`: Master legal trade name, OEM tier, and registration number.
3. `participants`: Complete list of delegates, arrival timestamps, and presence statuses.
4. `transportActivities`: Array of all normalized vehicles in the convoy with distance provenance.
5. `esgActivities`: Generated ESG activity records detailing unit and quantity.
6. `ghgCalculations`: Complete cryptographic calculations including emission factor versions and hashes.
7. `gateEvents`: Immutable physical gate hardware events for entry and exit.
8. `auditLogs`: Administrative ledger tracking approvals, modifications, and signoffs.
