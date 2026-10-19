# VMS Enterprise: Tamper-Evident Forensic Audit Architecture

## 1. Audit Principles & Non-Negotiables

VMS Enterprise maintains a comprehensive, immutable, and tamper-evident audit ledger:
1. **Zero Secret Logging**: Passwords, hashes, JWT tokens, session cookies, private encryption keys, and raw facial biometric vectors are strictly scrubbed before persistence.
2. **Cryptographic Tamper-Evidence**: Records are linked in a cryptographic SHA-256 hash chain:
   $$\text{Hash}_n = \text{SHA-256}(\text{CanonicalPayload}_n \parallel \text{Hash}_{n-1})$$
   Any retroactive edit, deletion, or reordering breaks the chain pointer and is detected immediately by `verifyChainIntegrity()`.
3. **Immutability Invariant**: The underlying relational storage engine forbids all `UPDATE` and `DELETE` queries on the `audit_logs` table.

---

## 2. Audit Architecture Diagram (Section 64 - Diagram 8)

```mermaid
flowchart TD
    subgraph ActionSources["Audited Application Actions"]
        A1["Authentication: LOGIN, LOGOUT, MFA_CHANGE"]
        A2["Governance: USER_CREATED, ROLE_CHANGED"]
        A3["Operations: VISITOR_CHECKIN, GATE_ACTUATE"]
        A4["Compliance: DOCUMENT_VIEWED, PTW_APPROVE"]
        A5["ESG / GHG: FACTOR_MODIFIED, CALCULATION_VIEWED"]
    end

    subgraph AuditPipeline["Tamper-Evident Audit Service"]
        Scrubber["Sensitive Key Scrubber\n(Redacts passwords, tokens, templates)"]
        Canonical["Canonical JSON Serializer"]
        Chain["Cryptographic Hash Chainer\nHash_n = SHA256(Payload_n + Hash_{n-1})"]
    end

    subgraph ImmutableStorage["Append-Only Ledger"]
        AuditRecord0[("Audit Record #0\nHash: 0000...a1b2")]
        AuditRecord1[("Audit Record #1\nPrevHash: a1b2\nHash: c3d4")]
        AuditRecord2[("Audit Record #2\nPrevHash: c3d4\nHash: e5f6")]
    end

    ActionSources --> Scrubber
    Scrubber --> Canonical
    Canonical --> Chain
    Chain --> AuditRecord0
    AuditRecord0 --> AuditRecord1
    AuditRecord1 --> AuditRecord2
```

---

## 3. Security Event vs Audit Event vs Operational Event (Section 64 - Diagram 12)

VMS Enterprise categorizes system occurrences into three distinct event tiers:

```mermaid
flowchart LR
    subgraph Operational["1. Operational Events"]
        O1["Visitor Checked In"]
        O2["Truck Weighed In"]
        O3["Badge Printed"]
    end

    subgraph Audit["2. Audit Events"]
        A1["Document Downloaded"]
        A2["PTW Permit Approved"]
        A3["Role Permission Assigned"]
    end

    subgraph Security["3. Security Events & Alerts"]
        S1["Multiple Failed Logins (Brute Force)"]
        S2["Impossible Login Pattern"]
        S3["Repeated Authorization Denials"]
        S4["Mass Data Export Attempt"]
    end

    Operational -->|Tracked by Operations DB| DB1[(Operational DB)]
    Audit -->|Chained to Hash Ledger| DB2[(Audit Ledger)]
    Security -->|Dispatches Alerts| AlertMgr[Security Alert Manager]
```

---

## 4. Audit Record Data Schema

```typescript
export interface AuditRecord {
  auditId: string;
  tenantId: string;
  actorUserId: string;
  actorRoleContext: EnterpriseRole;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  requestId: string;
  correlationId: string;
  source: string;
  ipMetadata?: string;
  deviceMetadata?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  reason?: string;
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  hash: string;
  previousHash?: string;
}
```

---

## 5. Correlation ID Propagation

Every incoming request generates a standardized correlation and request identifier (e.g. `REQ-2026-001001`). This ID propagates across:
- Gateway Ingress → Domain Handlers → Database Transactions → Outbox CloudEvents → Notification Messages → Forensic Audit Records.
In incident investigations, a single correlation ID reconstructs the entire end-to-end execution path.
