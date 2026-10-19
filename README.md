# VMS Enterprise — Industrial Operations, Compliance & ESG Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-286%20Passed-success.svg)](https://nodejs.org/api/test.html)
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
│   └── web/                   # React 19 + TypeScript + Vite + Tailwind CSS enterprise console
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
└── tests/                     # Automated unit, integration, and security test suites (286 tests)
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

## 🛠 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/aravindjk03/vms-enterprise.git
cd vms-enterprise

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
# Execute the full 286-test test suite across all 22 test suites
npm test

# Run TypeScript typecheck
npm run typecheck
```

### Production Build
```bash
npm run build:web
```

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

- **Total Test Suites**: 22 suites
- **Total Automated Tests**: 286 passed, 0 failed, 0 skipped
- **TypeScript Typecheck**: 0 errors (`tsc --noEmit`)
- **Vite Production Build**: 471ms compilation time
- **Architecture Documentation**: 60+ documents with 100+ Mermaid diagrams

---

## 📄 License

Proprietary & Confidential. Copyright © 2026. All rights reserved.
