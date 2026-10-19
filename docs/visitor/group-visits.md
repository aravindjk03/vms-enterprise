# Group Delegations & Transport Deduplication

## 1. Overview

Corporate plant tours, regulatory inspection delegations, OEM vendor audits, and academic visits typically arrive as **Groups** sharing a common schedule, host, purpose, and vehicular transport (e.g. chartered bus, tempo traveler, shared SUV).

Registering group participants individually creates severe operational bottlenecks and, critically, **corrupts ESG Scope 3 commuter calculations** by multiplying vehicular trip emissions across every passenger.

---

## 2. Group Delegation Architecture Diagram

```mermaid
classDiagram
    class VisitorTransaction {
        +UUID id
        +String referenceNumber "VIS-2026-GRP-001"
        +BookingMode bookingMode "GROUP"
        +String groupName "ISO 14001 External Audit Team"
        +Integer totalParticipants 5
        +UUID hostUserId
        +Timestamp scheduledStart
        +Timestamp scheduledEnd
    }

    class GroupLeader {
        +UUID visitorProfileId
        +String name "Dr. Meenakshi Sundaram"
        +String phone "+91-9840912345"
        +String role "Lead Auditor (Primary Contact)"
    }

    class VisitorGroupParticipant {
        +UUID id
        +String name
        +String phone
        +String designation
        +String individualBadgeNumber
        +String gatePassToken
        +String status "CHECKED_IN"
    }

    class NormalizedTransportActivity {
        +UUID transportId
        +TransportMode mode "BUS"
        +OwnershipType ownership "COMPANY"
        +Integer occupancy 5
        +Float distanceKm 85
        +String deduplicationKey "VEH-GRP-2026-01"
    }

    class GHGActivity {
        +UUID id
        +Float emissionsKgCO2e 62.4
        +String scope "SCOPE_3"
        +String category "BUSINESS_TRAVEL"
    }

    VisitorTransaction "1" *-- "1" GroupLeader : designated leader
    VisitorTransaction "1" *-- "many" VisitorGroupParticipant : contains roster
    VisitorTransaction "1" --> "1" NormalizedTransportActivity : single shared journey
    NormalizedTransportActivity "1" --> "1" GHGActivity : single emission record
```

---

## 3. Operational Invariants for Group Visits

1. **Roster Bulk Ingestion**: Organizers or hosts can upload group rosters via CSV/Excel or enter them line-by-line. Roster fields: Name, Phone, Email, Company, Govt ID type/number.
2. **Individual Badge & Pass Generation**: Every participant receives their own personalized QR code e-Pass and printed gate badge for physical access tracking and emergency muster accountability.
3. **Emergency Muster Fidelity**: In an evacuation, every participant is an individual occupancy count, ensuring accurate missing persons headcounts.
4. **Transport Deduplication Guarantee**:
   - The shared transport vector (e.g. 1 chartered diesel bus travelling 85 km) is recorded **once** at the group transaction header.
   - Occupancy is populated with the participant count (`occupancy = 5`).
   - The system attributes the vehicle's fuel burn once rather than generating 5 separate 85 km bus journeys.
   - Individual emissions per visitor are calculated as $\text{Total Trip Emissions} / \text{Occupancy}$ for internal allocation.
