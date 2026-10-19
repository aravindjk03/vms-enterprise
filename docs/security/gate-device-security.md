# VMS Enterprise: Gate Device Security & Offline Security Foundation

## 1. Physical Edge & Gate Device Security

Gate cabins, outdoor turnstiles, biometric speed lanes, security tablets, and self-service kiosks operate in semi-trusted physical environments. VMS Enterprise enforces device-aware security controls:

1. **Hardware Authentication**: Every edge terminal authenticates via unique device certificates / mutual TLS (mTLS) and hardware device identifiers.
2. **Least Privilege Gate Operators**: A `GATE_OPERATOR` or `SECURITY_GUARD` is granted fast-scan, pass verification, and gate actuation capabilities, but zero rights to alter roles, download private corporate contracts, or modify GHG accounting baselines.
3. **Device Context Tracking**: Every check-in and turnstile actuation records:
   - `deviceId`, `deviceType` (`GATE_TERMINAL`, `SECURITY_KIOSK`, `SECURITY_TABLET`), `gateId`, `siteId`, `appVersion`, and `networkSecurityState`.

---

## 2. Gate Device Security Flow Diagram (Section 64 - Diagram 10)

```mermaid
flowchart TD
    subgraph PhysicalEdge["Physical Plant Gate Ingress"]
        Kiosk["Self-Service Kiosk\n(Device ID: KSK-01)"]
        GuardTablet["Guard Tablet\n(Device ID: TAB-02)"]
        Turnstile["Speed Lane Turnstile\n(Device ID: TST-03)"]
    end

    subgraph EdgeAuth["Device Authentication Plane"]
        mTLS["Device Mutual TLS (mTLS) / Token Validator"]
        ContextBind["Bind to Site & Gate ID\n(SITE-01 / GATE-01 Only)"]
    end

    subgraph SecurityPolicy["Server-Side Policy Check"]
        PermCheck["Evaluate Role: GATE_OPERATOR\nAllowed: gate.actuate, visitor.checkin\nDenied: admin.roles, document.sensitive"]
    end

    subgraph Actuation["Gate Barrier Hardware"]
        Relay["Physical Relay Actuator\n(Pulse Open 3.0s)"]
        EventLog["Immutable gate_events Ledger"]
    end

    Kiosk & GuardTablet & Turnstile --> mTLS
    mTLS --> ContextBind
    ContextBind --> PermCheck
    PermCheck -- Authorized --> Relay
    PermCheck --> EventLog
```

---

## 3. Offline Gate Security Foundation (Section 64 - Diagram 11)

In industrial facilities during WAN outages or network partition events, plant turnstiles must maintain safe, uninterrupted throughput without creating an unrestricted security bypass.

```mermaid
sequenceDiagram
    autonumber
    actor Guard as Gate Guard / Worker
    participant GateApp as Edge Gate Client (SQLite Encrypted)
    participant CloudSync as Synchronization Daemon
    participant CoreAPI as VMS Enterprise Central API
    participant Audit as Forensic Audit Ledger

    Note over GateApp: WAN Offline Mode Engaged (Encrypted Local Storage)
    Guard->>GateApp: Scan Pre-Approved QR Gate Pass
    GateApp->>GateApp: Verify HMAC Signature with Cached Public Key
    GateApp->>GateApp: Check Cached Expiry & Revocation Blacklist
    alt Pass Expired or On Blacklist
        GateApp-->>Guard: Access Denied (Cached Policy Rejection)
    else Pass Valid within Pre-Scheduled Window
        GateApp->>GateApp: Record Local Encrypted Event (OFFLINE_CHECKIN)
        GateApp-->>Guard: Turnstile Opened (Operational Continuity Preserved)
    end

    Note over GateApp, CloudSync: WAN Network Connectivity Restored
    CloudSync->>CoreAPI: POST /api/v1/gate/sync-batch (signed offline events)
    CoreAPI->>CoreAPI: Validate Event HMAC, Device Cert & Nonce Sequence
    CoreAPI->>CoreAPI: Detect Race Conditions or Duplicate Cross-Gate Uses
    CoreAPI->>Audit: Reconcile Events with Real-Time Reconciliation Status
    CoreAPI-->>CloudSync: Sync Confirmed (Flush Edge Local Queue)
```

---

## 4. Offline Security Safeguards

1. **Encrypted Local Cache**: Edge devices store only cryptographic public keys, active daily appointment pass hashes, and active blacklists encrypted via SQLCipher using device hardware enclave keys.
2. **Strict Time-to-Live (TTL)**: Cached offline pass validations expire after a maximum window (e.g. 12 hours).
3. **No Unrestricted Bulk Data Caching**: Full employee identity history, contractor commercial contracts, and biometric neural vectors are NEVER synchronized or cached to edge gate tablets.
4. **Reconciliation & Anti-Passback Synchronization**: Upon reconnection, offline event batches are reconciled against central servers to detect double-entry, tailgating, or concurrent badge presentations across different perimeter gates.
