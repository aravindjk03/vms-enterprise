import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ServiceIdentity, ServiceTokenPayload } from '@vms/types';
import { SecurityError } from './errors.js';

export class ServiceAuthService {
  private static readonly MAX_TTL_SECONDS = 900;
  private services: Map<string, ServiceIdentity> = new Map();
  /** nonce -> expiresAt (epoch seconds); each token is accepted once within its lifetime. */
  private seenNonces: Map<string, number> = new Map();

  /**
   * Registers a trusted internal service identity.
   */
  public registerService(identity: ServiceIdentity) {
    this.services.set(identity.serviceId, identity);
  }

  /**
   * Generates a tamper-evident, short-lived HMAC-signed service-to-service token.
   */
  public generateServiceToken(
    sourceServiceId: string,
    targetAudience: string,
    ttlSeconds: number = 300 // 5 minutes
  ): string {
    const service = this.services.get(sourceServiceId);
    if (!service || !service.isActive) {
      throw new SecurityError('AUTHENTICATION_FAILED', `Source service '${sourceServiceId}' is not registered or inactive.`);
    }

    if (!service.allowedAudiences.includes(targetAudience) && !service.allowedAudiences.includes('*')) {
      throw new SecurityError('AUTHORIZATION_DENIED', `Service '${sourceServiceId}' is not authorized to communicate with '${targetAudience}'.`);
    }

    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > ServiceAuthService.MAX_TTL_SECONDS) {
      throw new SecurityError('VALIDATION_ERROR', `Service token TTL must be between 1 and ${ServiceAuthService.MAX_TTL_SECONDS} seconds.`, 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: ServiceTokenPayload = {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      audience: targetAudience,
      issuedAt: now,
      expiresAt: now + ttlSeconds,
      nonce: randomBytes(16).toString('hex'),
    };

    const serializedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', service.publicKeyOrSecret)
      .update(serializedPayload)
      .digest('base64url');

    return `s2s.${serializedPayload}.${signature}`;
  }

  /**
   * Verifies an inbound service token, checking cryptographic signature, expiry, and audience match.
   */
  public verifyServiceToken(
    token: string,
    expectedAudience: string
  ): { valid: boolean; payload?: ServiceTokenPayload; error?: string } {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 's2s') {
      return { valid: false, error: 'Malformed service token format.' };
    }

    const [, serializedPayload, signature] = parts;
    let payload: ServiceTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(serializedPayload, 'base64url').toString('utf8'));
    } catch {
      return { valid: false, error: 'Invalid service token JSON encoding.' };
    }

    const service = this.services.get(payload.serviceId);
    if (!service || !service.isActive) {
      return { valid: false, error: 'Unknown or inactive service sender.' };
    }

    // Verify cryptographic signature
    const expectedSig = createHmac('sha256', service.publicKeyOrSecret)
      .update(serializedPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, error: 'Service token signature mismatch.' };
    }

    // Check expiration (a missing or non-numeric expiry is invalid, never "no expiry")
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt) || now > payload.expiresAt) {
      return { valid: false, error: 'Service token has expired.' };
    }
    if (typeof payload.issuedAt !== 'number' || payload.expiresAt - payload.issuedAt > ServiceAuthService.MAX_TTL_SECONDS) {
      return { valid: false, error: 'Service token lifetime exceeds policy.' };
    }

    // Check audience
    if (payload.audience !== expectedAudience && payload.audience !== '*') {
      return { valid: false, error: `Audience mismatch: expected '${expectedAudience}', got '${payload.audience}'.` };
    }

    // Replay protection
    for (const [nonce, exp] of this.seenNonces) {
      if (exp < now) this.seenNonces.delete(nonce);
    }
    if (typeof payload.nonce !== 'string' || this.seenNonces.has(`${payload.serviceId}:${payload.nonce}`)) {
      return { valid: false, error: 'Service token replay detected.' };
    }
    this.seenNonces.set(`${payload.serviceId}:${payload.nonce}`, payload.expiresAt);

    return { valid: true, payload };
  }
}
