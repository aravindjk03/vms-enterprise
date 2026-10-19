import { randomUUID } from 'node:crypto';
import { NormalizedTransportActivitySchema } from '@vms/validation';
// Distance lookup cache representing GIS route estimation engine (symmetric routing)
const KNOWN_ROUTE_DISTANCES = {
    'BENGALURU:CHENNAI PLANT': 348,
    'MUMBAI:PUNE PLANT': 148,
    'DELHI:NOIDA FACILITY': 42,
    'SAN FRANCISCO:SAN JOSE': 77,
    'DETROIT:CHICAGO HUB': 455,
};
export class TransportService {
    /**
     * Derives distance if not provided or estimates distance from known GIS matrix.
     * Supports bidirectional route lookup and local campus movements.
     * Preserves provenance: SYSTEM_ESTIMATED vs USER_PROVIDED vs MEASURED vs SYSTEM_CALCULATED.
     */
    estimateDistance(origin, destination) {
        const o = origin.trim().toUpperCase();
        const d = destination.trim().toUpperCase();
        // Intra-facility / same campus location
        if (o === d) {
            return {
                distanceKm: 0.0,
                provenance: 'SYSTEM_CALCULATED',
            };
        }
        const forwardKey = `${o}:${d}`;
        const reverseKey = `${d}:${o}`;
        const known = KNOWN_ROUTE_DISTANCES[forwardKey] ?? KNOWN_ROUTE_DISTANCES[reverseKey];
        if (known !== undefined) {
            return {
                distanceKm: known,
                provenance: 'SYSTEM_ESTIMATED',
            };
        }
        // Default fallback estimation based on standard regional transit leg
        return {
            distanceKm: 25.0,
            provenance: 'SYSTEM_ESTIMATED',
        };
    }
    /**
     * Normalizes transport input across any operational domain.
     * Reusable for Visitor, Customer, Contractor, Service, Material, Vehicle.
     */
    createNormalizedTransport(payload) {
        let resolvedDistance = payload.distanceKm;
        let resolvedProvenance = payload.distanceProvenance;
        const journeyType = payload.journeyType || 'ONE_WAY';
        // Automatic derivation if user did not supply measured distance
        if (resolvedDistance === undefined || resolvedDistance === null) {
            const derived = this.estimateDistance(payload.originLocation, payload.destinationLocation);
            // Double the leg distance if round-trip is specified and distance is system estimated
            resolvedDistance = journeyType === 'ROUND_TRIP' ? derived.distanceKm * 2 : derived.distanceKm;
            resolvedProvenance = derived.provenance;
        }
        else if (!resolvedProvenance) {
            resolvedProvenance = 'USER_PROVIDED';
        }
        // Resolve measurement method
        let resolvedMethod = payload.measurementMethod || 'GIS_ROUTING';
        if (!payload.measurementMethod) {
            if (resolvedProvenance === 'MEASURED') {
                if (payload.payloadWeightTonnes !== undefined) {
                    resolvedMethod = 'WEIGHBRIDGE_SCALE';
                }
                else if (payload.fuelConsumedLitres !== undefined) {
                    resolvedMethod = 'ODOMETER';
                }
                else {
                    resolvedMethod = 'TELEMATICS_GPS';
                }
            }
            else if (resolvedProvenance === 'SYSTEM_ESTIMATED' || resolvedProvenance === 'SYSTEM_CALCULATED') {
                resolvedMethod = 'GIS_ROUTING';
            }
            else {
                resolvedMethod = 'DECLARED_MANIFEST';
            }
        }
        const activity = {
            transportId: randomUUID(),
            tenantId: payload.tenantId,
            sourceDomain: payload.sourceDomain,
            sourceTransactionId: payload.sourceTransactionId,
            mode: payload.mode,
            ownership: payload.ownership,
            vehicleClass: payload.vehicleClass,
            fuelType: payload.fuelType,
            usageType: payload.usageType,
            occupancy: payload.occupancy || 1,
            originLocation: payload.originLocation,
            destinationLocation: payload.destinationLocation,
            distanceKm: resolvedDistance,
            journeyType,
            tripDirection: payload.tripDirection || 'INBOUND',
            fuelConsumedLitres: payload.fuelConsumedLitres,
            payloadWeightTonnes: payload.payloadWeightTonnes,
            distanceProvenance: resolvedProvenance,
            measurementMethod: resolvedMethod,
            dataSource: payload.dataSource || 'OPERATIONAL_FORM',
            createdAt: new Date(),
        };
        // Strict runtime validation
        return NormalizedTransportActivitySchema.parse(activity);
    }
}
