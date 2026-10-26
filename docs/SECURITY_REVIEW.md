# Security Review & Remediation Log — October 2026

Scope: full repository (database schema, domain services, identity/access libraries, web console, build and
deployment). Each finding below was reproduced against the code before it was fixed and re-tested afterwards
(unit suite, PostgreSQL integration suite, and targeted exploit scripts).

## 1. Database wiring

| # | Finding | Impact | Fix |
|---|---|---|---|
| D1 | The platform had no database connection at all: the console used hard-coded mock data and the services ran on an in-memory imitation of PostgreSQL | Nothing was persisted; no server-side enforcement existed | New Fastify API (`apps/api`) on PostgreSQL via `pg`; console signs in and uses live data |
| D2 | `001_initial_schema.sql` aborted on PostgreSQL (`permit_types.tenant_id` had no type) | Schema could never be created | Column typed as `UUID` |
| D3 | Six indexes referenced non-existent columns (`account_id`, `contracting_company_id`, `clock_out_time`, `source_entity_id`, …) | Migration failure | Indexes point at the real columns |
| D4 | 14 workflow / approval / master-data tables were defined 2–3 times with different columns; `CREATE TABLE IF NOT EXISTS` silently kept the first, so migration 003's columns never existed | Part 5 workflow engine schema missing; 003 failed | Migration 003 is the single definition; duplicates removed from 001 |
| D5 | `src/schema.sql` / `src/seeds.sql` were drifted copies of migrations 001/002 | Two sources of truth | Removed; runner uses migrations only |
| D6 | No migration runner or ledger | Unknown schema state in each environment | `npm run db:migrate`: ordered, transactional, advisory-locked, SHA-256 drift detection |
| D7 | Row-level security on 10 of ~120 tenant tables, 6 of them without any policy, none effective for the table owner | Any connection could read every tenant's data | Migration 006: `tenant_read` / `tenant_write` policies on **every** table with `tenant_id`; runtime role `vms_app` (no `BYPASSRLS`, not owner); API refuses privileged roles |
| D8 | Audit, gate-event, domain-event and calculation ledgers were mutable | Evidence could be altered | Triggers block `UPDATE`/`DELETE` for every role; runtime role has no `UPDATE/DELETE` grants |

## 2. Application security findings

| # | Severity | Finding | Fix |
|---|---|---|---|
| S1 | Critical | Break-glass let any user grant themselves any role (incl. `SUPER_ADMIN`), immediately, unaudited; elevated contexts bypassed tenant isolation and never expired after revocation | Authenticated requester, second-person approval in the same tenant, eligible-role allow-list (no admin roles), mandatory audit of request/approve/use/revoke, expiry carried in the context and enforced by `evaluateAccess` |
| S2 | High | Break-glass grants with a non-numeric duration never expired | Finite duration required |
| S3 | High | In-memory tenant isolation failed open with no tenant context, empty or conflicting overrides; `tenant_id` could be changed by update | Fails closed; explicit `runAsSystem` for seeding/outbox relay; tenant column immutable |
| S4 | High | Permission normalization granted a legacy capability when *any* mapped permission was held (guards could export customer data, EHS could write contractor data, etc.) | Requires *all* mapped permissions; export and emergency permissions no longer implied |
| S5 | High | Approval segregation of duties bypassable via caller-supplied requester id; tasks approvable across tenants | Stored requester is authoritative; tasks are tenant-bound |
| S6 | High | Gate e-pass HMAC keys hard-coded in source; tokens deterministic and truncated to 64 bits | Per-tenant keys derived from `EPASS_SIGNING_SECRET`; pass id + expiry signed; full token |
| S7 | High | Path traversal in document storage keys; declared upload size trusted | Path segments restricted to identifiers; actual buffer length enforced |
| S8 | High | Gate devices authenticated by id only; offline sync records unsigned and unbound | Per-device secret, HMAC-signed records bound to device site/gate, site-scoped time-bounded dedupe |
| S9 | Medium | Gateway checked only the first of `tenantId`/`tenant_id` (two-key smuggling); exports did the same and accepted records without a tenant | Every alias validated; records without a tenant refused |
| S10 | Medium | Session refresh revived idle-timed-out sessions | Inactivity enforced on refresh |
| S11 | Medium | MFA: unlimited guessing across challenges, TOTP replay, 32-bit plaintext recovery codes, silent re-enrolment, admin roles without MFA | Per-user lockout, last-step replay guard, 64-bit hashed codes with constant-time compare, re-enrolment needs current factor, admin roles require MFA |
| S12 | Medium | Masking and audit scrubbing ignored nested arrays; OTP/PIN/ID numbers not scrubbed | Recursive masking/scrubbing; key list extended |
| S13 | Medium | Gateway audited only successful requests | Denied / failed requests audited; correlation ids validated |
| S14 | Medium | Biometric enrolment accepted another person's consent; references not tenant-keyed; expired retention still verified | Consent bound to person; tenant-keyed references; expiry denies |
| S15 | Medium | A later consent refusal was ignored when a purpose was given | Latest decision per purpose wins |
| S16 | Medium | Secrets fell back to a well-known JWT key unless `NODE_ENV` was exactly `production`; template placeholders accepted; `.env.staging` / `.env.production` not git-ignored | Fail closed outside development/test, placeholders rejected, random dev fallbacks, `.env.*` ignored |
| S17 | Low | AES-GCM accepted truncated auth tags | 16-byte tags required |
| S18 | Low | Non-constant-time HMAC comparisons; service tokens replayable, unbounded TTL, missing expiry accepted | `timingSafeEqual`, nonce replay cache, TTL ≤ 15 min, expiry mandatory |
| S19 | Low | Rate limiter bypass with category `__proto__`; unbounded memory | Own-property lookup; periodic pruning |
| S20 | Info | Console access control was client-side only (persona switcher) | Live mode takes the role from the server; every API call is authorized server-side |
| S21 | High | `zod` < 4.6.6 memory exhaustion advisory (GHSA-mrhx-c7xc-m3w5) | Upgraded to 4.6.7; CI runs `npm audit` |
| S22 | High | Stale compiled `.js` files committed beside the sources were served by Vite instead of the TypeScript (shipped build lacked the Contractor module) | Generated files removed and git-ignored; `npm run build` no longer emits in place |

## 3. Known gaps / next steps

- The API's sign-in flow does not yet challenge for MFA (the hardened `MfaService` has no database persistence for
  TOTP secrets yet). Until then, protect administrator accounts with strong unique passwords and network controls.
- Only the visitor lifecycle, dashboard KPIs, contractor companies, customer accounts and the audit ledger are wired to
  the database; other console modules display labelled sample data.
- Rate limiting is per API instance (in memory); use a shared store or the load balancer when running several replicas.
- Child tables without a `tenant_id` column (e.g. `material_transaction_lines`, `approval_actions`) rely on their parent
  row's isolation; add `tenant_id` + RLS to them before exposing them through the API.
