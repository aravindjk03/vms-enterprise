import type { DeviceSecurityContext, OfflineGatePassCache, OfflineActionSyncRecord, ConflictResolutionResult } from '@vms/types';
export declare class DeviceSecurityService {
    private registeredDevices;
    private cachedGatePasses;
    private processedActions;
    /**
     * Registers or updates a gate edge terminal / kiosk / security tablet.
     */
    registerDevice(device: DeviceSecurityContext): void;
    /**
     * Authenticates device context and verifies it is bound to the appropriate site and gate.
     */
    authenticateDevice(deviceId: string, claimedSiteId: string, claimedGateId?: string): {
        authorized: boolean;
        device?: DeviceSecurityContext;
        error?: string;
    };
    /**
     * Caches limited, pre-validated gate passes for offline execution with mandatory TTL.
     */
    cacheOfflinePass(pass: OfflineGatePassCache): void;
    /**
     * Verifies an offline gate pass presentation against cached authorizations.
     */
    verifyOfflinePass(tenantId: string, passId: string, siteId: string, gateId: string, qrToken: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Synchronizes an offline batch of recorded gate actions, reconciling conflict detection (anti-passback & duplicate passes).
     */
    reconcileOfflineBatch(deviceId: string, actions: OfflineActionSyncRecord[]): ConflictResolutionResult[];
}
