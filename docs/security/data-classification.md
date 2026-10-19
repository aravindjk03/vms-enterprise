# VMS Enterprise: Data Classification & Field-Level Protection Framework

## 1. Data Classification Tiers

VMS Enterprise classifies all domain entities, database columns, documents, and API payloads into five discrete metadata-driven security classification levels:

| Classification Level | Definition & Criteria | Concrete Platform Examples | Access Clearance Requirement |
|---|---|---|---|
| **PUBLIC** | Information intended for public consumption or unauthenticated display. | Plant address, public visitor guidelines, emergency muster point map. | Unrestricted / Anonymous |
| **INTERNAL** | Standard operational data accessible to all authenticated organization staff. | Site names, gate codes, generic department listings, plant operational hours. | Authenticated User |
| **CONFIDENTIAL** | Business operational records containing commercially or legally sensitive metadata. | Visitor logs, host names, material challan numbers, delivery manifests, GHG totals. | Role Capability (e.g. `visitor.read`, `material.read`) |
| **RESTRICTED** | Personally Identifiable Information (PII), regulatory documents, contracts. | Government ID numbers, phone numbers, email addresses, NDA agreements, contractor rates. | Explicit Clearance (e.g. `SECURITY_MANAGER`, `LEGAL`, `HR`) |
| **HIGHLY_RESTRICTED** | Cryptographic secrets, raw biometrics, high-risk security files. | Biometric vector references, hardware enrollment keys, break-glass credentials. | `SUPER_ADMIN` + Dual Control or Dedicated Security Module |

---

## 2. Field-Level Redaction & Masking Rules

Data classification rules dictate dynamic field-level masking before API payloads are serialized to clients:

### 1. National Identity / Government ID Masking:
- **Format**: `XXXX-XXXX-1234`
- **Rule**: Only the final 4 alphanumeric characters are exposed to operational gate personnel. All preceding characters are replaced with `X`.
- **Exemption**: High-clearance security investigations by `SECURITY_MANAGER` or statutory legal audits.

### 2. Contact Phone Number Masking:
- **Format**: `******1234`
- **Rule**: Operational views mask leading phone digits, revealing only the last 4 digits for identity verification at reception desks.

### 3. The ESG Sustainability Privacy Guard:
When an `ESG_MANAGER` or `ESG_METHODOLOGY_ADMIN` inspects transportation data linked to a visitor appointment for Scope 3 emissions calculations:
- **Exposed Fields**: `transactionId`, `visitorName`, `originLocation`, `destinationLocation`, `distanceKm`, `mode`, `fuelType`, `occupancy`, `emissionsKgCO2e`.
- **Strictly Redacted Fields**: `governmentIdNumber`, `governmentIdType`, `governmentIdScanUrl`, `facialBiometricTemplate`, `nationalIdNumber`, `visitorPhone`, `visitorEmail`, `driverLicenseNumber`.

---

## 3. Metadata-Driven Classification Implementation

In code, entities and fields register classification annotations:

```typescript
export interface DataClassificationAnnotation {
  field: string;
  classification: DataClassificationLevel;
  maskingStrategy: 'TRUNCATE_LAST_4' | 'MASK_ALL' | 'REMOVE_PROPERTY';
}
```

The ABAC evaluator uses these annotations to construct the `maskedFields` array returned in `AccessDecision`, ensuring consistent enforcement across both REST APIs and GraphQL responses.
