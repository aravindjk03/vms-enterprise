import { createHmac, randomBytes } from 'node:crypto';
import { SecurityError } from './errors.js';
export class ServiceAuthService {
    services = new Map();
    /**
     * Registers a trusted internal service identity.
     */
    registerService(identity) {
        this.services.set(identity.serviceId, identity);
    }
    /**
     * Generates a tamper-evident, short-lived HMAC-signed service-to-service token.
     */
    generateServiceToken(sourceServiceId, targetAudience, ttlSeconds = 300 // 5 minutes
    ) {
        const service = this.services.get(sourceServiceId);
        if (!service || !service.isActive) {
            throw new SecurityError('AUTHENTICATION_FAILED', `Source service '${sourceServiceId}' is not registered or inactive.`);
        }
        if (!service.allowedAudiences.includes(targetAudience) && !service.allowedAudiences.includes('*')) {
            throw new SecurityError('AUTHORIZATION_DENIED', `Service '${sourceServiceId}' is not authorized to communicate with '${targetAudience}'.`);
        }
        const now = Math.floor(Date.now() / 1000);
        const payload = {
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
    verifyServiceToken(token, expectedAudience) {
        const parts = token.split('.');
        if (parts.length !== 3 || parts[0] !== 's2s') {
            return { valid: false, error: 'Malformed service token format.' };
        }
        const [, serializedPayload, signature] = parts;
        let payload;
        try {
            payload = JSON.parse(Buffer.from(serializedPayload, 'base64url').toString('utf8'));
        }
        catch {
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
        if (signature !== expectedSig) {
            return { valid: false, error: 'Service token signature mismatch.' };
        }
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (now > payload.expiresAt) {
            return { valid: false, error: 'Service token has expired.' };
        }
        // Check audience
        if (payload.audience !== expectedAudience && payload.audience !== '*') {
            return { valid: false, error: `Audience mismatch: expected '${expectedAudience}', got '${payload.audience}'.` };
        }
        return { valid: true, payload };
    }
}
