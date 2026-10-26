# Launch Readiness

Status as of 2026-10-26, branch `claude/clever-babbage-pg96lc`. This page lists what was reviewed and fixed, how it was
verified, and what is still open. Passing these checks shows the application behaves as tested; it is not a security
certification or a compliance attestation.

## What was reviewed

1. A full code review of the API, database and web console (15 findings, all fixed; see below).
2. A UI audit of every screen in demo and live mode, for 5 roles, at 400, 1024 and 1440 px (about 430 screenshots).

## Fixed: security and data correctness

| Area | Problem | Fix |
|---|---|---|
| Visitor approvals | A receptionist (or guard, service manager) who also held the HOST role could approve any visit at the site, because the host-only rule checked only the primary role | The rule applies whenever the approval right comes only from HOST, whichever role is primary |
| Provider management | A site-scoped manager could block a provider tenant-wide and remove its authorizations at other sites; unknown owner ids caused 500s | Site-scoped managers change authorizations at their own sites only; provider-wide fields need a tenant-wide admin when the provider serves other sites; owners validated |
| GHG ledger | Two quick journey corrections could leave the original GHG record active next to the latest one (double counting) | Supersession walks the whole correction chain |
| Sessions | Two tabs refreshing at once was treated as token theft and signed the user out everywhere | Short grace window answers "retry" for a just-rotated token; theft detection unchanged after it |
| Rate limits | Behind a reverse proxy all users shared one budget (10 sign-ins/min for the whole company) | Per-user limit for signed-in traffic, per-account and per-address sign-in limits, warning when `TRUST_PROXY` is off behind a proxy |
| Roles | Only 6 of 19 roles existed per tenant, so HOST, RECEPTIONIST, SECURITY_MANAGER, AUDITOR, … could not be assigned | Migration 009 adds the full catalog to every tenant and seeds it for new tenants |
| Service requests | Schedules accepted any request id (500 on unknown ids) and never moved the request on; a request whose work orders were all rejected was stuck | Linked requests validated and advanced; such requests can be cancelled; "fulfilled" requires completed work |
| Evidence | Evidence could not be corrected after a reviewer returned a completion | Replaceable while work is open (never during review); earlier evidence kept in the progress log and audit trail |
| Dates | Calendar dates were serialized as UTC instants and could show the previous day | DATE columns are returned and displayed as plain dates |
| Child-table isolation | `service_work_locations` had no row-level security (migration 008, earlier) | Parent-scoped policy |

## Fixed: web console

* **Role-based menus** are built from the permissions the server grants across all of a user's roles. Screens backed by
  live data come first; screens that still show sample data are tagged "sample" or grouped under **Preview**.
* **Demo mode** is used only by demo builds or a host with no API. If the server is briefly unreachable, the console
  shows a retry screen; it never falls back to sample data.
* **Responsive layout**: the menu becomes a drawer below 900 px, the menu list scrolls, and every screen fits without
  horizontal page scrolling at 400, 1024 and 1440 px.
* **Styling**: the Visitor, Customer, Kiosk and Gate screens were written with Tailwind classes, but Tailwind was never
  installed, so they rendered unstyled. Tailwind 4 utilities are now built in, scoped so the rest of the UI is unchanged.
* **Navigation**: menu groups list one entry per distinct screen (previously up to 10 entries opened the same screen);
  Visitor items and Task Center tabs follow the selected menu item; "New Transaction" no longer opens the visitor form.
* **Honest controls**: no developer state switcher, no `alert()` placeholders (toasts instead), Export CSV downloads a
  file, AI Copilot states it is not connected, the live header no longer shows a simulated emergency siren, sample
  notifications or sync states.
* **Live data screens**: visitor register pages through all visits and lets the operator pick the gate (active gates
  only, own site first); contractor, customer and audit tables page with totals; service lists keep Status visible.
* **Content**: no internal build-part references in the UI; the sample tenant is fictional (Northwind Tyres &
  Polymers) and sample contacts use the reserved `.example` mail domain.

## Verification (run on Node 22.22, PostgreSQL 16.15)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (also from a clean clone of the branch) |
| `npm test` | 305 / 305 pass (28 suites) |
| `npm run test:integration` | 21 / 21 pass (below) |
| Migrations | fresh database: 9 applied, 19 roles per tenant; re-run: no-op |
| `npm run build:web` | builds; main script 881 kB (208 kB gzip), stylesheet 23 kB |
| `npm audit` and `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| Screen sweep | demo: 81 screens at 400 and 1024 px; live: 225 screen visits per width for service manager, guard, host and admin at 400 and 1440 px; no horizontal overflow, no console or page errors |
| Browser workflows | Service (5 roles, 19 steps) and Visitor (register, approve, check in/out at a chosen gate, audit, sign-out) pass |
| Sessions | reload keeps the session; sign-out survives reload and clears all cookies |

Integration scenarios: migrations are recorded and re-runs are no-ops; drift detection; refusal to run as a role that
bypasses RLS; RLS in the database; generic login errors and lockout; visitor lifecycle with segregation of duties
(including a receptionist who is also a host); tenant isolation; refresh rotation, parallel-tab refresh and reuse
detection, readable session hint, logout; malformed/forged requests and security headers; and 12 Service scenarios
(providers, request lifecycle, eligibility, conflicts, milestones, evidence correction, transport and GHG capture with
correction chains, recurrence, analytics, provider site scoping, request/schedule consistency, child-table RLS).

## Not done or not verified

* **CI on GitHub** has not run: GitHub refuses to start Actions jobs on this account ("account is locked due to a billing
  issue"). The Docker image build therefore has not been verified (no Docker daemon in the development container).
* **Preview modules** (material, vehicle, transport, access, documents, safety, emergency, ESG, analytics, AI copilot,
  most admin screens, task center) still show sample data. They are labelled, but they are not product features yet.
* **Integrations** that do not exist yet: safety/permit, gate hardware and access control, notification delivery,
  document upload, an AI model. The UI and API say so where they appear.
* **Sample data** still names real companies as visitors' and customers' employers (e.g. Siemens, Tesla); the tenant
  and mail domains are fictional. Replace with fully fictional data before public demos if required.
* **Not tested**: load and performance, an accessibility audit (keyboard, screen readers, contrast), browsers other than
  Chromium, backup/restore and disaster recovery, penetration testing.
* **Bundle size**: the console ships as one 881 kB script; code-splitting would speed up the first load on slow networks.
