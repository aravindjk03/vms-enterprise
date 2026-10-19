# VMS Enterprise: Database Migration Strategy & Lifecycle

This document describes the database migration architecture, version numbering standards, rollback procedures, and automated CI/CD schema verification pipelines.

---

## 1. Migration File Structure

Database migrations are maintained under `packages/database/migrations/` using deterministic numeric prefixes:

```
packages/database/migrations/
├── 001_initial_schema.sql      # Canonical DDL: extensions, 105+ tables, constraints, indexes, RLS, views
└── 002_seed_data.sql           # Deterministic seeds: tenant GLOBAL-MFG, sites, factors, users, rules
```

### Migration Rules:
1. **Idempotence**: All DDL statements use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and all seeds use `ON CONFLICT DO NOTHING`.
2. **Transaction Scoping**: Each migration script executes within an explicit `BEGIN; ... COMMIT;` block. If any statement encounters an error, the migration is completely rolled back.
3. **No Breaking Schema Changes**: Column drops or destructive type changes require a two-phase migration cycle (deprecate -> soft-ignore -> drop in subsequent major release).

---

## 2. Programmatic Migration Runner

The TypeScript `MigrationRunner` class (`packages/database/src/migrations/runner.ts`) provides full lifecycle management across both local development, test automation, and production runtimes:

```typescript
import { RelationalDatabase, MigrationRunner } from '@vms/database';

const db = new RelationalDatabase();
const runner = new MigrationRunner(db);

// Execute migrations and seeds
const { schema, seedCount } = await runner.runMigrations();

// Check migration status
const status = runner.verifyMigrationStatus();
console.log(`Tables: ${status.tableCount}, Seeded rows: ${status.seedRowCount}`);

// Reset database to clean slate for isolated testing
runner.resetDatabase();
```

---

## 3. Rollback Procedures

For operational disaster recovery and blue-green database deployments:
1. **Schema Rollback**: Every migration `NNN_name.sql` is mirrored by a companion rollback script `NNN_name.down.sql` reversing created tables, views, and indexes.
2. **Database Snapshot Backups**: In production PostgreSQL 16+ deployments, automated physical WAL-G or pgBackRest snapshots are taken prior to applying migrations.
3. **Point-In-Time Recovery (PITR)**: Production clusters are configured with continuous Write-Ahead Log (WAL) archiving allowing recovery to any transaction timestamp.

---

## 4. Continuous Integration & Schema Validation

During CI builds (`npm.cmd test`), the schema parser `SchemaValidator` dynamically parses the raw SQL migrations and enforces the following architectural gates:
- Minimum of 50 tables defined.
- Mandatory primary key on every table.
- Mandatory Row-Level Security policy definitions.
- Mandatory compatibility views (`esg_activity_records`, `ghg_calculation_results`, `scope_mapping_rules`).
- Foreign key presence across all parent-child relationships.
