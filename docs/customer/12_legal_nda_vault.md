# Legal & Bilateral NDA Vault

## 1. Overview & Intellectual Property Protections

Manufacturing facilities are epicenters of proprietary intellectual property (IP), including patent-pending robotics, secret chemical formulas, prototype vehicle CAD models, and custom manufacturing tooling. When hosting customer delegates and third-party auditors, executing and verifying a **Bilateral Non-Disclosure Agreement (NDA)** is a mandatory legal safeguard.

The **Legal & Bilateral NDA Vault** in `@vms/customer` provides cryptographic, gate-enforced NDA compliance.

---

## 2. Diagram 10: Bilateral NDA Gate Enforcement Tree

The following decision tree is executed whenever a customer representative or delegation attempts entry at any physical security gate or turnstile:

```mermaid
flowchart TD
    Start([Check-In Attempt at Gate Turnstile]) --> CheckVisitExists{Does Customer Visit Exist?}
    CheckVisitExists -- No --> DenyNotFound[DENY: Invalid Visit Reference]
    CheckVisitExists -- Yes --> CheckApproval{Is Visit Formally APPROVED?}
    
    CheckApproval -- No --> DenyNotApproved[DENY: Visit Pending Host Authorization]
    CheckApproval -- Yes --> LoadAccount[Retrieve Customer Account Rules]
    
    LoadAccount --> CheckNDARequired{Is default_nda_required TRUE on Account?}
    
    CheckNDARequired -- No --> PassNDACheck[Bilateral NDA Check Passed (Not Required)]
    CheckNDARequired -- Yes --> CheckSigned{Is visit.nda_signed TRUE?}
    
    CheckSigned -- Yes --> VerifyDocRef{Has valid nda_document_ref?}
    VerifyDocRef -- Yes --> PassNDACheck
    VerifyDocRef -- No --> DenyMissingDoc[DENY: Signed Flag True but Document Ref Missing]
    
    CheckSigned -- No --> DenyNDABreach[DENY: Bilateral NDA Unsigned / Unverified<br/>Check-In Strictly Blocked at Gate]

    PassNDACheck --> CheckIdentity{Identity Verified?}
    CheckIdentity -- Yes --> GrantEntry[GRANT ACCESS: Turnstile Barrier Opens<br/>Log gate_event CHECK_IN]
    CheckIdentity -- No --> DenyIdentity[DENY: Identity Verification Incomplete]
```

---

## 3. The Gate Blocking Invariant

If a bilateral NDA is required by the customer account, the check-in API strictly blocks site entry until the legal agreement is recorded:

```typescript
// Gate Check-in verification in CustomerService:
const account = this.db.findById('customer_accounts', visit.customer_account_id, input.tenantId);
if ((visit.nda_signed === false) && Boolean(account?.default_nda_required)) {
  throw new Error(`Check-in blocked: Bilateral NDA has not been signed or verified for customer visit '${visit.reference_number}'`);
}
```

Attempting to check in via `checkInCustomerVisit` or checking in individual delegation attendees via `checkInParticipant` immediately throws this security exception.

---

## 4. NDA Verification Protocol (`verifyCustomerNda`)

When legal counsel, the plant manager, or an authorized commercial host verifies the executed bilateral agreement, they call the verification endpoint:

```typescript
await service.verifyCustomerNda(
  tenantId,
  visit.transactionId,
  'NDA-2026-CONFIDENTIAL-99'
);
```

### 4.1 Internal Verification Mechanics
1. **Updates Transaction:** Sets `nda_signed: true` and records `nda_document_ref` on the `customer_visit_transactions` table.
2. **Fulfills Precedence Requirement:** Locates the associated `customer_requirements` record for `requirement_type = 'NDA'` and marks `is_fulfilled: true` with a timestamp.
3. **Immutable Audit Record:** Writes an audit log record with the verifying user, agreement reference number, and timestamp.
4. **Unblocks Gate Check-In:** Subsequent attempts to check in at security turnstiles now succeed immediately.
