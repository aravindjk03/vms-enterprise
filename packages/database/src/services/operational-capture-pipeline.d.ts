/**
 * VMS Enterprise: Operational Activity Capture & GHG Calculation Pipeline
 * 5-Step Transactional Execution Engine:
 * Step 1: Source Domain Transaction Processing
 * Step 2: Reusable Transport Activity Normalization & Insertion
 * Step 3: GHG Activity Record Generation (Pending Calculation)
 * Step 4: Domain Event Emission & Outbox Logging
 * Step 5: Asynchronous Calculation Execution & Factor Version Snapshotting
 *
 * CRITICAL INVARIANT: Operational transactions remain 100% valid even if GHG calculation
 * is delayed or encounters calculation errors.
 */
import type { RelationalDatabase } from '../in-memory-db.js';
import type { SourceDomain, TransportActivityRecord, GHGActivityRecord, GHGCalculationRecord, DomainEventRecord } from '../types.js';
export interface TransportActivityInput {
    origin: string;
    destination: string;
    distance: number;
    distanceUnit?: string;
    mode?: string;
    vehicleType?: string;
    fuelType?: string;
    ownership?: string;
    occupancy?: number;
    payloadWeightTonnes?: number;
    fuelConsumedLitres?: number;
    measurementMethod?: string;
    dataSource?: string;
    journeyType?: string;
    direction?: string;
    activityDate?: string;
    personId?: string;
    vehicleId?: string;
    organizationId?: string;
}
export interface OperationalCaptureInput {
    tenantId: string;
    siteId: string;
    sourceDomain: SourceDomain;
    transactionData: Record<string, any>;
    transportData?: TransportActivityInput;
    options?: {
        simulateDelay?: boolean;
        simulateFailure?: boolean;
        factorVersionTag?: string;
        geography?: string;
    };
}
export interface OperationalCaptureResult {
    success: boolean;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    sourceTransaction: Record<string, any>;
    transportActivity?: TransportActivityRecord;
    ghgActivity?: GHGActivityRecord;
    calculationResult?: GHGCalculationRecord;
    domainEvent?: DomainEventRecord;
    calculationStatus: 'CALCULATED' | 'PENDING' | 'FAILED' | 'SKIPPED';
    calculationError?: string;
}
export declare class OperationalCapturePipeline {
    private db;
    private refCounter;
    constructor(db: RelationalDatabase);
    /**
     * Executes the 5-step operational activity capture pipeline with transactional guarantees
     */
    execute(input: OperationalCaptureInput): Promise<OperationalCaptureResult>;
    private processSourceTransaction;
    private createTransportActivity;
    private createGHGActivity;
    private emitDomainEvent;
    private executeCalculation;
    private updateGHGActivityStatus;
    private resolveScopeMapping;
    private resolveEmissionFactorId;
}
