import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type {
  DeviceSecurityContext,
  OfflineGatePassCache,
  OfflineActionSyncRecord,
  ConflictResolutionResult,
} from '@vms/types';
import { SecurityError } from './errors.js';

export class DeviceSecurityService {
  /** Window in which a repeated offline action is treated as a duplicate presentation. */
  private static readonly DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
  private registeredDevices: Map<string, DeviceSecurityContext> = new Map();
  /** Per-device provisioning secret used to authenticate offline sync records. */
  private deviceSecrets: Map<string, string> = new Map();
  private cachedGatePasses: Map<string, OfflineGatePassCache> = new Map();
  private processedActions: Map<string, number> = new Map(); // Anti-passback & duplicate tracking -> processedAt

  /**
   * Registers or updates a gate edge terminal / kiosk / security tablet together with the
   * secret provisioned onto it. Offline records are only accepted when signed with that secret.
   */
  public registerDevice(device: DeviceSecurityContext, deviceSecret: string) {
    if (!deviceSecret || deviceSecret.length < 32) {
      throw new SecurityError('VALIDATION_ERROR', 'Device provisioning secret must be at least 32 characters.', 400);
    }
    this.registeredDevices.set(device.deviceId, device);
    this.deviceSecrets.set(device.deviceId, deviceSecret);
  }

  /**
   * Computes the signature a device attaches to an offline sync record (run on the device).
   */
  public static signOfflineRecord(record: Omit<OfflineActionSyncRecord, 'signature'>, deviceSecret: string): string {
    const canonical = [
      record.syncRecordId,
      record.deviceId,
      record.siteId,
      record.gateId,
      record.action,
      record.subjectIdentifier,
      record.passId || '',
      new Date(record.recordedAt).toISOString(),
    ].join('|');
    return createHmac('sha256', deviceSecret).update(canonical).digest('base64url');
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
    const presentedHash = createHash('sha256').update(qrToken).digest();
    const cachedHash = Buffer.from(cached.qrHash, 'hex');
    if (cachedHash.length !== presentedHash.length || !timingSafeEqual(presentedHash, cachedHash)) {
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
    const deviceSecret = this.deviceSecrets.get(deviceId);
    if (!deviceAuth || !deviceAuth.isTrusted || !deviceSecret) {
      throw new SecurityError('AUTHENTICATION_FAILED', 'Offline sync rejected: device is untrusted.');
    }

    const results: ConflictResolutionResult[] = [];
    const now = new Date();
    for (const [key, processedAt] of this.processedActions) {
      if (now.getTime() - processedAt > DeviceSecurityService.DEDUPE_WINDOW_MS) this.processedActions.delete(key);
    }

    for (const action of actions) {
      // Each record must be signed by this device and bound to the device's own site/gate.
      const expectedSig = Buffer.from(DeviceSecurityService.signOfflineRecord(action, deviceSecret));
      const presentedSig = Buffer.from(String(action.signature ?? ''));
      const signatureValid = expectedSig.length === presentedSig.length && timingSafeEqual(expectedSig, presentedSig);
      const boundToDevice =
        action.deviceId === deviceId &&
        (!deviceAuth.siteId || action.siteId === deviceAuth.siteId) &&
        (!deviceAuth.gateId || action.gateId === deviceAuth.gateId);
      if (!signatureValid || !boundToDevice) {
        results.push({
          actionId: action.syncRecordId,
          status: 'CONFLICT_DETECTED',
          conflictReason: signatureValid
            ? 'Offline record is not bound to the syncing device, site or gate.'
            : 'Offline record signature verification failed.',
          reconciledAt: now,
        });
        continue;
      }

      const dedupeKey = `${action.siteId}:${action.action}:${action.subjectIdentifier}:${action.passId || 'none'}`;

      if (this.processedActions.has(dedupeKey)) {
        results.push({
          actionId: action.syncRecordId,
          status: 'DUPLICATE_REJECTED',
          conflictReason: 'Anti-passback / duplicate presentation detected across perimeter gates.',
          reconciledAt: now,
        });
        continue;
      }

      this.processedActions.set(dedupeKey, now.getTime());
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
