import type { NormalizedTransportActivity, SourceDomain, TransportMode, OwnershipType, VehicleClass, FuelType, UsageType, JourneyType, TripDirection, DataProvenance, MeasurementMethod } from '@vms/types';
export interface TransportInputPayload {
    tenantId: string;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    mode: TransportMode;
    ownership: OwnershipType;
    vehicleClass: VehicleClass;
    fuelType: FuelType;
    usageType: UsageType;
    occupancy?: number;
    originLocation: string;
    destinationLocation: string;
    distanceKm?: number;
    distanceProvenance?: DataProvenance;
    measurementMethod?: MeasurementMethod;
    journeyType?: JourneyType;
    tripDirection?: TripDirection;
    fuelConsumedLitres?: number;
    payloadWeightTonnes?: number;
    dataSource?: string;
}
export declare class TransportService {
    /**
     * Derives distance if not provided or estimates distance from known GIS matrix.
     * Supports bidirectional route lookup and local campus movements.
     * Preserves provenance: SYSTEM_ESTIMATED vs USER_PROVIDED vs MEASURED vs SYSTEM_CALCULATED.
     */
    estimateDistance(origin: string, destination: string): {
        distanceKm: number;
        provenance: DataProvenance;
    };
    /**
     * Normalizes transport input across any operational domain.
     * Reusable for Visitor, Customer, Contractor, Service, Material, Vehicle.
     */
    createNormalizedTransport(payload: TransportInputPayload): NormalizedTransportActivity;
}
