# Embedded Transport Mobility Vector & Distance Derivation

## 1. Overview

Rather than capturing an overly simplistic dropdown like `Transport = Car`, VMS Enterprise captures a **10-dimensional normalized mobility vector** embedded directly inside the visitor registration workflow. This ensures rigorous Scope 3 GHG carbon calculations without burdening the visitor with carbon accounting jargon.

---

## 2. Mobility Capture & Normalization Flow

```mermaid
flowchart TD
    FormInput[Visitor Registration Form: Section F] --> UserSelects[Visitor Enters Mobility Parameters]
    
    subgraph MobilityVector [10-Dimensional Independent Vectors]
        D1[1. Transport Mode: Car / Bike / Bus / Train / Flight / Taxi / Metro]
        D2[2. Ownership: Personal / Company / Hired / Public]
        D3[3. Vehicle Class: Two-Wheeler / Sedan / SUV / Van / Bus]
        D4[4. Fuel Type: Petrol / Diesel / CNG / Electric / Hybrid]
        D5[5. Usage Type: Individual / Carpool / Shared / Public]
        D6[6. Occupancy: Number of Passengers Sharing Trip]
        D7[7. Origin: Starting City / Transit Hub]
        D8[8. Destination: Plant Facility / Site Name]
        D9[9. Journey Type: One-Way / Round-Trip / Multi-Stop]
        D10[10. Transport Service: Self-Driven / Hired Cab / Commuter Shuttle]
    end
    
    UserSelects --> MobilityVector
    MobilityVector --> NormEngine[TransportService.normalizeTransportActivity]
    
    NormEngine --> GIS{Distance Provided by User?}
    GIS -- Yes --> UserDist[Preserve Distance - Provenance: USER_PROVIDED]
    GIS -- No --> AutoRoute[GIS / Route Matrix Engine - Distance: 348 km]
    AutoRoute --> DeriveProv[Provenance: SYSTEM_ESTIMATED]
    
    UserDist --> DoubleRoundTrip{Journey Type == ROUND_TRIP?}
    DeriveProv --> DoubleRoundTrip
    
    DoubleRoundTrip -- Yes --> Multiply2[Effective Distance = Base Distance * 2]
    DoubleRoundTrip -- No --> KeepBase[Effective Distance = Base Distance]
    
    Multiply2 --> OutputRecord[(Persist to transport_activities)]
    KeepBase --> OutputRecord
```

---

## 3. Independent Dimensional Dimensions

The platform strictly avoids hard-coding rigid permutations (e.g. `Own Diesel Car`, `Company Electric Bus`). Each dimension is independent:

| Dimension | Permitted Enumerations / Data Contract |
|:---|:---|
| **Mode** | `CAR`, `TWO_WHEELER`, `BUS`, `TRAIN`, `FLIGHT`, `TAXI_CAB`, `AUTO_RICKSHAW`, `VAN`, `WALKING`, `OTHER` |
| **Ownership** | `PERSONAL`, `COMPANY`, `HIRED`, `PUBLIC`, `SUPPLIER`, `CUSTOMER`, `OTHER` |
| **Vehicle Class** | `TWO_WHEELER`, `SEDAN`, `SUV`, `VAN`, `BUS`, `UNKNOWN` |
| **Fuel Type** | `PETROL`, `DIESEL`, `CNG`, `ELECTRIC`, `HYBRID`, `NOT_APPLICABLE` |
| **Usage Type** | `INDIVIDUAL`, `CARPOOL`, `SHARED`, `PUBLIC_COMMUTE` |
| **Occupancy** | Positive Integer (e.g. `1` for solo, `4` for carpool) |
| **Journey Type** | `ONE_WAY`, `ROUND_TRIP`, `MULTI_STOP`, `LOCAL` |
| **Service Type** | `SELF_DRIVEN_PERSONAL`, `COMPANY_PROVIDED_CAB`, `HIRED_TAXI_CAB`, `PUBLIC_COMMUTER_TRANSIT` |

---

## 4. Automatic GIS Distance Derivation

When an origin city or landmark is supplied (e.g. `Bengaluru` to `Chennai Radial Tyre Plant`):
1. **Route Engine Derivation**: The system looks up standard road distances from the facility transit matrix (e.g. 348 km).
2. **Provenance Tagging**: The value is explicitly labeled `SYSTEM_ESTIMATED`.
3. **Editable Confirmation**: The visitor or receptionist can override the estimated distance. If edited, the provenance tag updates to `USER_PROVIDED`.
4. **Round-Trip Handling**: When `journeyType === 'ROUND_TRIP'`, the engine automatically doubles the one-way distance to account for outbound and return emissions.
