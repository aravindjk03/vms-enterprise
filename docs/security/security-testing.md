# VMS Enterprise: Automated Security Verification & Testing Guide

## 1. Security Testing Methodology

VMS Enterprise maintains an automated test suite enforcing non-negotiable security invariants. Security tests run alongside standard unit and integration tests on every commit:

```bash
npm test
```

---

## 2. Test Environment Topology (Section 62 Specification)

The security test suite constructs an isolated multi-tenant topology:

- **Tenants**:
  - `TENANT_A` (`00000000-0000-0000-0000-000000000001`): Global Manufacturing Corp.
  - `TENANT_B` (`00000000-0000-0000-0000-000000000002`): Competitor Logistics Inc.
- **Physical Sites**:
  - `SITE_A1`: Primary Manufacturing Plant (Detroit) under Tenant A.
  - `SITE_A2`: Secondary Assembly Plant (Munich) under Tenant A.
  - `SITE_B1`: Logistics Hub (Chicago) under Tenant B.
- **Test Identities**: Multiple user contexts spanning `SUPER_ADMIN`, `SECURITY_MANAGER`, `SECURITY_GUARD`, `GATE_OPERATOR`, `RECEPTIONIST`, `HOST`, `EHS_MANAGER`, `ESG_MANAGER`, and `AUDITOR`.

---

## 3. The 20 Mandatory Security Tests (Section 61 Compliance)

| Test ID | Security Invariant Tested | Implementation Location | Result |
|---|---|---|---|
| **Test 1** | Cross-tenant data access must fail | `tests/security.test.ts` (it 1) | PASS |
| **Test 2** | User without permission cannot call restricted API | `tests/security.test.ts` (it 2) | PASS |
| **Test 3** | User with `visitor.read` cannot access contractor administration | `tests/security.test.ts` (it 3) | PASS |
| **Test 4** | Site A user cannot access Site B resources | `tests/security.test.ts` (it 4) | PASS |
| **Test 5** | Gate operator cannot modify roles | `tests/security.test.ts` (it 5) | PASS |
| **Test 6** | ESG user cannot access restricted identity documents | `tests/security.test.ts` (it 6) | PASS |
| **Test 7** | Unauthorized document download fails | `tests/security.test.ts` (it 7) | PASS |
| **Test 8** | Unauthorized export fails | `tests/security.test.ts` (it 8) | PASS |
| **Test 9** | Expired session fails | `tests/security.test.ts` (it 9) | PASS |
| **Test 10** | Revoked session fails | `tests/security.test.ts` (it 10) | PASS |
| **Test 11** | MFA-required user cannot bypass MFA | `tests/security.test.ts` (it 11) | PASS |
| **Test 12** | Direct API manipulation of `tenant_id` fails | `tests/security.test.ts` (it 12) | PASS |
| **Test 13** | Direct API manipulation of `site_id` fails | `tests/security.test.ts` (it 13) | PASS |
| **Test 14** | Insecure Direct Object Reference (IDOR) attempts fail | `tests/security.test.ts` (it 14) | PASS |
| **Test 15** | Privilege escalation attempts fail | `tests/security.test.ts` (it 15) | PASS |
| **Test 16** | Audit records cannot be modified through ordinary application APIs | `tests/security.test.ts` (it 16) | PASS |
| **Test 17** | Sensitive data is not exposed in error responses | `tests/security.test.ts` (it 17) | PASS |
| **Test 18** | Secrets are not present in source code | `tests/security.test.ts` (it 18) | PASS |
| **Test 19** | Rate limiting activates correctly | `tests/security.test.ts` (it 19) | PASS |
| **Test 20** | Bulk operations enforce permissions on every item | `tests/security.test.ts` (it 20) | PASS |
