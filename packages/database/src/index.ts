/**
 * VMS Enterprise: Database and Domain Model Foundation
 * PostgreSQL 16+ Production Relational Data Architecture Package
 */

// Core Relational Engine & Validation
export { RelationalDatabase, type TableDefinition, type DatabaseConstraint } from './in-memory-db.js';
export { SchemaValidator, type ParsedSchema, type ParsedTable } from './schema-validator.js';

// Strongly Typed Repositories
export {
  BaseRepository,
  TenantRepository,
  PersonRepository,
  VisitorRepository,
  CustomerRepository,
  ContractorRepository,
  ServiceRepository,
  MaterialRepository,
  TransportRepository,
  DocumentRepository,
  GHGRepository,
  GateRepository,
  AuditRepository,
  MasterDataRepository,
  WorkflowRepository,
  ApprovalRepository,
  PolicyRepository,
} from './repositories/index.js';

// Operational Pipeline & Provenance Traceability Services
export {
  OperationalCapturePipeline,
  type OperationalCaptureInput,
  type OperationalCaptureResult,
  type TransportActivityInput,
} from './services/operational-capture-pipeline.js';

export {
  TraceabilityEngine,
  type ProvenanceChain,
  type ProvenanceVerificationResult,
} from './services/traceability-engine.js';

// Migration & Seed Management
export { MigrationRunner, type MigrationStatus } from './migrations/runner.js';

// Comprehensive TypeScript Interface Contracts
export type * from './types.js';
