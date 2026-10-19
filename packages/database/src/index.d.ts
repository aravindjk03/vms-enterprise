/**
 * VMS Enterprise: Database and Domain Model Foundation
 * PostgreSQL 16+ Production Relational Data Architecture Package
 */
export { RelationalDatabase, type TableDefinition, type DatabaseConstraint } from './in-memory-db.js';
export { SchemaValidator, type ParsedSchema, type ParsedTable } from './schema-validator.js';
export { BaseRepository, TenantRepository, PersonRepository, VisitorRepository, CustomerRepository, ContractorRepository, ServiceRepository, MaterialRepository, TransportRepository, DocumentRepository, GHGRepository, GateRepository, AuditRepository, MasterDataRepository, WorkflowRepository, ApprovalRepository, PolicyRepository, } from './repositories/index.js';
export { OperationalCapturePipeline, type OperationalCaptureInput, type OperationalCaptureResult, type TransportActivityInput, } from './services/operational-capture-pipeline.js';
export { TraceabilityEngine, type ProvenanceChain, type ProvenanceVerificationResult, } from './services/traceability-engine.js';
export { MigrationRunner, type MigrationStatus } from './migrations/runner.js';
export type * from './types.js';
