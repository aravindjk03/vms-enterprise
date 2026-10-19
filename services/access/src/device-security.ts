import { createHash, randomUUID } from 'node:crypto';
import type {
  DeviceSecurityContext,
  OfflineGatePassCache,
  OfflineActionSyncRecord,
  ConflictResolutionResult,
} from '@vms/types';
import { SecurityError } from './errors.js';

export class DeviceSecurityService {
  private registeredDevices: Map<string, DeviceSecurityContext> = new Map();
  private cachedGatePasses: Map<string, OfflineGatePassCache> = new Map();
  private processedActions: Set<string> = new Set(); // Anti-passback & duplicate tracking

  /**
   * Registers or updates a gate edge terminal / kiosk / security tablet.
   */
  public registerDevice(device: DeviceSecurityContext) {
    this.registeredDevices.set(device.deviceId, device);
  }

  /**
   * Authenticates device context and verifies it is bound to the appropriate site and gate.
   */
  public authenticateDevice(
    deviceId: string,
    claimedSiteId: string,
    claimedGateId?: string
  ): { authorized: boolean; device?: DeviceSecurityContext; error?: string } {
    const device = this.registeredDevices.get(deviceId);
    if (!device) {
      return { authorized: false, error: 'Unrecognized hardware terminal identifier.' };
    }

    if (!device.isTrusted) {
      return { authorized: false, error: 'Device is flagged as untrusted or compromised.' };
    }

    if (device.siteId && device.siteId !== claimedSiteId) {
      return { authorized: false, error: `Device '${deviceId}' is assigned to site '${device.siteId}', cannot operate on site '${claimedSiteId}'.` };
    }

    if (claimedGateId && device.gateId && device.gateId !== claimedGateId) {
      return { authorized: false, error: `Device '${deviceId}' is assigned to gate '${device.gateId}', cannot operate on gate '${claimedGateId}'.` };
    }

    return { authorized: true, device };
  }

  /**
   * Caches limited, pre-validated gate passes for offline execution with mandatory TTL.
   */
  public cacheOfflinePass(pass: OfflineGatePassCache) {
    this.cachedGatePasses.set(`${pass.tenantId}:${pass.passId}`, pass);
  }

  /**
   * Verifies an offline gate pass presentation against cached authorizations.
   */
  public verifyOfflinePass(
    tenantId: string,
    passId: string,
    siteId: string,
    gateId: string,
    qrToken: string
  ): { allowed: boolean; reason?: string } {
    const cached = this.cachedGatePasses.get(`${tenantId}:${passId}`);
    if (!cached) {
      return { allowed: false, reason: 'Pass not found in edge offline authorization cache.' };
    }

    if (cached.isBlacklisted) {
      return { allowed: false, reason: 'Pass has been revoked by security operations.' };
    }

    if (cached.siteId !== siteId || cached.gateId !== gateId) {
      return { allowed: false, reason: 'Pass is not valid for this site and gate perimeter.' };
    }

    const now = Date.now();
    if (now < cached.validFrom.getTime() || now > cached.validTo.getTime()) {
      return { allowed: false, reason: 'Pass is outside its authorized validity window.' };
    }

    // Verify cryptographic QR hash
    const expectedHash = createHash('sha256').update(qrToken).digest('hex');
    if (expectedHash !== cached.qrHash) {
      return { allowed: false, reason: 'Cryptographic pass token verification failed.' };
    }

    return { allowed: true };
  }

  /**
   * Synchronizes an offline batch of recorded gate actions, reconciling conflict detection (anti-passback & duplicate passes).
   */
  public reconcileOfflineBatch(
    deviceId: string,
    actions: OfflineActionSyncRecord[]
  ): ConflictResolutionResult[] {
    const deviceAuth = this.registeredDevices.get(deviceId);
    if (!deviceAuth || !deviceAuth.isTrusted) {
      throw new SecurityError('AUTHENTICATION_FAILED', 'Offline sync rejected: device is untrusted.');
    }

    const results: ConflictResolutionResult[] = [];
    const now = new Date();

    for (const action of actions) {
      const dedupeKey = `${action.action}:${action.subjectIdentifier}:${action.passId || 'none'}`;

      if (this.processedActions.has(dedupeKey)) {
        results.push({
          actionId: action.syncRecordId,
          status: 'DUPLICATE_REJECTED',
          conflictReason: 'Anti-passback / duplicate presentation detected across perimeter gates.',
          reconciledAt: now,
        });
        continue;
      }

      this.processedActions.add(dedupeKey);
      results.push({
        actionId: action.syncRecordId,
        status: 'RECONCILED',
        reconciledAt: now,
      });
    }

    deviceAuth.lastSyncAt = now;
    return results;
  }
}
