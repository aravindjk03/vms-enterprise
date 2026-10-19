# VMS Enterprise: Privacy-by-Design & Consent Architecture

## 1. Privacy-by-Design Principles (GDPR / CCPA / DPDP Aligned)

VMS Enterprise treats personal identity information as a controlled enterprise data category subject to strict statutory privacy principles:

1. **Lawful Basis & Purpose Limitation**: Personal data is collected strictly for physical facility security, safety induction, and emergency muster accounting. Data is never repurposed for marketing or unapproved profiling.
2. **Data Minimization**: The platform strictly prohibits capturing speculative fields. If a visitor does not operate a motor vehicle, driver's license numbers and license plates are never requested or stored.
3. **Storage Limitation & Automated Retention**: Visitor KYC documents are held according to configurable statutory retention policies, after which records are automatically anonymized or purged.
4. **Right to Erasure (Right-to-be-Forgotten)**: Subjects can request deletion of non-statutory records. Biometric references and personal contact numbers are immediately expunged while maintaining anonymized operational audit counters.

---

## 2. Granular Consent Architecture

Consent is never represented as a simplistic boolean flag (`consent = true`). VMS Enterprise establishes a dedicated relational consent ledger:

```typescript
export interface ConsentRecord {
  consentId: string;
  tenantId: string;
  personId: string;
  transactionId?: string;
  purpose: string;
  consentType: 
    | 'VISITOR_REGISTRATION' 
    | 'PRIVACY_NOTICE' 
    | 'BIOMETRIC_PROCESSING' 
    | 'PHOTOGRAPHY' 
    | 'TERMS_OF_ACCESS';
  versionPresented: string;
  accepted: boolean;
  timestamp: Date;
  channel: 'WEB_PORTAL' | 'KIOSK' | 'GUARD_MOBILE' | 'PAPER_SCAN';
  evidenceReference?: string;
  withdrawn: boolean;
  withdrawnAt?: Date;
}
```

---

## 3. Supported Consent Categories

1. **Visitor Registration Consent**: Acknowledges processing of name, company affiliation, and host details for plant entry badges.
2. **Privacy Notice Acknowledgement**: Cryptographically records that the subject reviewed the active revision of the enterprise privacy policy.
3. **Biometric Processing Consent**: Explicit, freely given affirmative consent for temporary facial vector generation at automated speed gates. Processing is immediately blocked if this consent is absent or withdrawn.
4. **Plant Photography & CCTV Acknowledgement**: Discloses site-wide video surveillance and security camera monitoring.
5. **Permit-To-Work (PTW) Safety & Medical Fitness Declaration**: Affirmative acknowledgement of occupational safety standards and medical fitness for high-risk zones.

---

## 4. Consent Withdrawal & Propagation

When a subject withdraws consent:
1. The consent record is marked with `withdrawn = true` and `withdrawnAt = CURRENT_TIMESTAMP`.
2. Any downstream processing dependent on the consent (such as biometric speed-gate actuation) immediately revokes automated authorization and routes the visitor to manual desk inspection.
3. An audited privacy event `CONSENT_WITHDRAWN` is emitted to the forensic log.
