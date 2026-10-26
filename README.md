# VMS Enterprise — Industrial Operations, Compliance & ESG Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-286%20unit%20%2B%209%20integration-success.svg)](https://nodejs.org/api/test.html)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

**VMS Enterprise** is a production-grade, multi-tenant enterprise operations platform designed for large-scale multi-site manufacturing organizations, industrial plants, logistics hubs, and corporate campuses.

Rather than a simplistic visitor registration tool, VMS Enterprise is a unified operational ecosystem spanning **Visitors, Customers, Contractors, Services, Materials, Vehicles, Gates, Access, Safety, Compliance, and Embedded ESG/GHG Activity Intelligence**.

---

## 🏛 Core Architectural Principles

1. **Independent Business Pipelines**:
   Visitor, Customer, Contractor, Service, and Material are **never** subtypes of a universal visitor object. Each business domain maintains its own database entities, state machines, business logic, validation rules, APIs, and permissions.
2. **Normalized Relational Foundation**:
   Built on PostgreSQL with strong relational constraints, composite foreign keys, tenant and site isolation, and Row-Level Security (RLS) readiness. JSONB is strictly restricted to dynamic integration payloads and calculation snapshots.
3. **Embedded ESG/GHG Activity Capture (Zero-Blocker Invariant)**:
   Scope 1, 2, and 3 activity data is captured seamlessly **inside** operational workflows (e.g., visitor pre-registration, customer delegation arrival, contractor shift turnstile swipes) rather than via disconnected post-hoc forms. Downstream carbon calculation delays or failures **never** block operational gate access or business transactions.
4. **8-Tier Bidirectional Provenance**:
   Every carbon calculation is traceable back to its originating physical transaction:
   $$\text{Operational Transaction} \longrightarrow \text{Transport Activity} \longrightarrow \text{GHG Activity} \longrightarrow \text{GHG Calculation}$$
5. **Precedence Hierarchy Engine**:
   Site EHS and physical security rules strictly override permissive commercial or contract configurations. Mandatory statutory prerequisites cannot be waived by individual work orders or account preferences.
6. **Defense-in-Depth Security**:
   All permissions and tenant boundaries are enforced server-side. Granular RBAC/ABAC matrices govern read/write operations, with PII masking for medical and statutory identification records.

---

## 📦 Monorepo Architecture & Modules

The platform is structured as a modular monolith with strict domain boundaries ready for microservice extraction:

```
vms-enterprise/
├── apps/
│   ├── api/                   # Fastify API: auth, sessions, tenant-scoped PostgreSQL access, serves the console
│   └── web/                   # React 19 + TypeScript + Vite enterprise console
├── packages/
│   ├── types/                 # Shared domain contracts, transaction envelopes, enums
│   ├── validation/            # Zod validation schemas for all inputs and state transitions
│   ├── permissions/           # RBAC/ABAC role matrices, site boundaries, and least-privilege guards
│   ├── events/                # Typed domain event bus, outbox pattern, and audit logging
│   ├── database/              # PostgreSQL normalized schema, repositories, multi-tenant RLS isolation
│   ├── ui/                    # Industrial design system tokens, typography scale, DataTable, CommandPalette
│   ├── transport/             # Normalized transport vectors, distance derivation, weighbridge measurement
│   ├── ghg/                   # GHG activity capture, emission factor versioning, Scope 3 mapping
│   ├── workflow/              # Workflow Engine, visual builder models, SLA escalation, task delegation
│   ├── visitor/               # Complete Visitor Management domain service & state machines
│   ├── customer/              # Customer Domain: Quality audits (IATF/VDA), PPAP inspections, NDA vault
│   └── contractor/            # Contractor Domain: Vendors, MSAs, Work Orders, Turnstile attendance, PTW
├── docs/                      # 60+ architectural design documents and 100+ Mermaid diagrams
│   ├── architecture/          # System architecture, domain boundaries, event models, multi-tenancy
│   ├── database/              # Relational principles, entity groups, migrations, indexing strategies
│   ├── ux/                    # Design system, navigation hierarchy, table & form frameworks
│   ├── visitor/               # Visitor lifecycle, group booking, overstay SLA, Scope 3 Cat 6
│   ├── customer/              # Customer audits, PPAP inspection workflow, bilateral NDA gating
│   └── contractor/            # Vendor MSAs, headcount caps, craft roster, Scope 3 Cat 7 commuter carbon
├── tests/                     # Unit, domain and security suites (286) + tests/integration (API + PostgreSQL)
├── Dockerfile                 # Production image (API + console, non-root)
└── docker-compose.yml         # PostgreSQL + migrations + API
```

---

## 🚀 Completed Phases (Parts 1 – 8)

### Part 1: Enterprise Architecture
- Domain decomposition across 18 independent business domains.
- Shared platform services: Identity, Documents, Workflow, Transport, Gate, Events, and ESG.
- Multi-tenant hierarchy: `Tenant` $\rightarrow$ `Organization` $\rightarrow$ `Site` $\rightarrow$ `Gate` $\rightarrow$ `Zone`.

### Part 2: UI/UX Foundation & Design System
- Premium industrial enterprise visual language: deep graphite typography, restrained accents, compact spacing, zero visual noise.
- Centralized design tokens (`@vms/ui/tokens`) for colors, spacing, borders, radius, shadows, and semantic statuses.
- Responsive application shell with organization/site context switcher, notification center, and Command Palette (`Ctrl+K`).
- Reusable `DataTable`, `FilterBar`, `Timeline`, and `ActivityFeed` components.

### Part 3: Relational Database & Domain Model
- Production PostgreSQL normalized schema with 15 discrete entity groups.
- Canonical Person and External Organization models preventing duplicate identity storage.
- Normalized transport model: independent vectors for Transport Mode, Ownership, Vehicle Type, Fuel, and Usage.
- Append-only audit logs and immutable gate transaction events.

### Part 4: Authentication, Authorization, Privacy & Audit
- Tenant isolation enforced at repository and database query layers.
- Granular RBAC/ABAC permissions (e.g., `visitor.approve`, `contractor.checkin`, `esg.activity.read`).
- Privacy-by-design: biometric abstraction, consent logging, and medical/PII field masking.

### Part 5: Master Data, Workflow Builder & Approval Engine
- Configuration-driven master data management with temporal versioning.
- Multi-stage Workflow Engine supporting sequential, parallel, and conditional approvals.
- Static workflow validator (`WorkflowValidator`) detecting dead ends, unreachable stages, and infinite cycles.
- SLA timeout tracking, escalations, and out-of-office task delegation.

### Part 6: Visitor Management & Embedded Scope 3 Cat 6 Carbon
- Full visitor lifecycle: Pre-registration, host approval, identity verification, check-in, overstay sweeps, checkout.
- Group delegation scheduling with multi-participant management.
- Embedded transport capture automatically deriving route distances and generating Scope 3 Category 6 (Business Travel) activity.

### Part 7: Customer Management & Quality Audits
- Customer accounts and authorized representative onboarding linked to canonical entities.
- Dedicated workflows for Quality & Process Audits (IATF 16949 / VDA 6.3) and PPAP technical inspections.
- Bilateral NDA digital vault acting as a mandatory hard gate blocker before check-in.
- Multi-representative delegations with group transport deduplication (`Trip Emissions / Occupancy`).

### Part 8: Contractor Management & Workforce Compliance
- Vendor company registration with tax ID deduplication, active MSAs, and safety performance ratings.
- Work Orders enforcing authorized location scopes and strict headcount capacity caps.
- Returning worker deduplication linking craft personnel to canonical Person records.
- Multi-source compliance evaluation: Safety Induction passports, trade licenses, medical fitness, and PTW prerequisites.
- Immutable turnstile gate attendance ledger with shift overstay sweeps and audited manual adjustments.
- Scope 3 Category 7 (Employee Commuting) carbon activity capture with zero-blocker resilience and group shuttle deduplication.

---

## 🛠 Running the Platform

### Runtime architecture

```
 Browser ──HTTPS──▶  API + web console (apps/api, Fastify, one container)
                       │  per request: BEGIN; set_config('app.current_tenant_id', <tenant from JWT>, true)
                       ▼
                     PostgreSQL 16  ── row-level security on every tenant table,
                                      append-only audit/gate/event ledgers
```

- **Authentication**: organization code + username + password → 15-minute access token (memory only) and a
  rotating refresh token in an `HttpOnly; SameSite=Strict` cookie. Refresh-token reuse revokes every session of the user.
  Accounts lock after 5 failed attempts; sign-in is rate limited per IP and per account.
- **Tenant isolation is enforced by the database**: the API connects as a member of the `vms_app` role (no
  `BYPASSRLS`, not the table owner) and refuses to start otherwise. A query without a tenant context returns nothing.
- **Authorization**: roles and site assignments are re-read from the database on every request and evaluated by
  `@vms/permissions` (RBAC/ABAC, site scoping, segregation of duties: a requester can never approve their own visit).
- **Audit**: sign-ins, failures and every state change are appended to `audit_logs`, which nobody — including the
  schema owner — can update or delete.

### What is live and what is sample data

| Area | Status |
|---|---|
| Sign-in, sessions, roles, site scoping | **Live** (PostgreSQL) |
| Executive dashboard KPI strip | **Live** |
| Visitor register: pre-register → approve/reject → gate check-in → check-out, cancel | **Live** |
| Contractor companies, customer accounts, audit ledger | **Live** (read) |
| All other module screens (analytics, ESG, materials, workflows, …) | Sample data, clearly labelled in the UI |

Without an API (e.g. the GitHub Pages build) the console starts in **demo mode**: sample data everywhere and a
role switcher for previewing personas.

### Quick start with Docker Compose (recommended)

```bash
cp .example.env .env
# set POSTGRES_PASSWORD, APP_DB_PASSWORD, JWT_SECRET, EPASS_SIGNING_SECRET  (openssl rand -base64 48)
docker compose up -d --build          # db → migrate (one-shot) → api
# create the first administrator (password is read from the environment, never from argv)
docker compose run --rm -e BOOTSTRAP_PASSWORD='Choose-A-Str0ng!Passphrase' migrate \
  node --import tsx packages/database/scripts/bootstrap-user.ts \
  --tenant GLOBAL-MFG --username admin.detroit --role SUPER_ADMIN
open http://localhost:8080             # organization code: GLOBAL-MFG
```

The seed migration (`002_seed_data.sql`) creates the demo tenant `GLOBAL-MFG` with sites, gates and users
(`admin.detroit`, `guard.detroit`, `host.mary`, `esg.officer`); none of them can sign in until a password is set
with `db:bootstrap-user`. Put a TLS-terminating reverse proxy in front for real deployments and set `TRUST_PROXY=true`.

### Local development (without Docker)

Prerequisites: Node.js 22+, PostgreSQL 16+.

```bash
npm install
export MIGRATION_DATABASE_URL=postgresql://<owner>@localhost:5432/vms_enterprise_db
APP_DB_USER=vms_api APP_DB_PASSWORD='<16+ chars>' npm run db:migrate -- --create-app-user
BOOTSTRAP_PASSWORD='<policy-compliant>' npm run db:bootstrap-user -- --tenant GLOBAL-MFG --username admin.detroit --role SUPER_ADMIN

npm run build:web                       # console served by the API from dist/
DATABASE_URL=postgresql://vms_api:<password>@localhost:5432/vms_enterprise_db \
WEB_DIST_DIR=dist npm run api:dev       # http://localhost:8080  (NODE_ENV=development: random dev secrets)

npm run dev                             # optional: Vite UI on :3000 in demo mode
```

| Command | Purpose |
|---|---|
| `npm run db:migrate` | Apply pending migrations (`--status` to list, `--create-app-user` to create/rotate the runtime role) |
| `npm run db:bootstrap-user` | Set a user's password (policy-checked) and optionally grant a role |
| `npm run api:dev` / `npm run api:start` | Run the API (+ web console) |
| `npm run build` | Typecheck and build the web console |
| `npm test` | 286 unit / domain tests |
| `npm run test:integration` | API + PostgreSQL end-to-end tests (needs `INTEGRATION_DATABASE_URL` of a role that can create databases) |

Migrations are recorded in `schema_migrations` with a SHA-256 checksum; editing an applied migration is refused —
add a new numbered file instead. Do not run `tsc` without `--noEmit`: it writes `.js` files next to the sources and
Vite would serve those stale files instead of the TypeScript.

### Deployment

- **Container**: `Dockerfile` builds one non-root image (API + console) with a health check on `/api/health`;
  readiness (`/api/ready`) also verifies the database and that no migration is pending.
- **CI** (`.github/workflows/deploy.yml`): dependency audit, typecheck, unit tests, integration tests against a
  PostgreSQL 16 service, web build and Docker image build on every push and pull request.
- **GitHub Pages**: pushes to `main` publish the static demo console (Settings → Pages → Source: GitHub Actions).

See [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) for the security review and remediation log.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `Cmd + K` | Open Enterprise Command Palette |
| `V` (in Palette) | New Visitor Pre-Registration |
| `W` (in Palette) | Gate Walk-In Registration (<60s) |
| `G` (in Palette) | Open Industrial Gate Console (High-Contrast Lane Terminal) |
| `C` (in Palette) | Register Contractor Vendor Company |
| `K` (in Palette) | Register Contractor Craft Worker |

---

## 📊 Verification & Test Metrics

- **Unit / domain tests**: 286 passed across 22 suites (`npm test`)
- **Integration tests**: 9 end-to-end scenarios on real PostgreSQL — migrations & drift detection, RLS, privileged
  role refusal, login lockout, visitor lifecycle with segregation of duties, cross-tenant isolation, refresh-token
  rotation/reuse, input validation and security headers (`npm run test:integration`)
- **TypeScript Typecheck**: 0 errors (`tsc --noEmit`)
- **Dependencies**: `npm audit` — 0 known vulnerabilities
- **Architecture Documentation**: 60+ documents with 100+ Mermaid diagrams

---

## 📄 License

Proprietary & Confidential. Copyright © 2026. All rights reserved.
