import type { ServiceIdentity, ServiceTokenPayload } from '@vms/types';
export declare class ServiceAuthService {
    private services;
    /**
     * Registers a trusted internal service identity.
     */
    registerService(identity: ServiceIdentity): void;
    /**
     * Generates a tamper-evident, short-lived HMAC-signed service-to-service token.
     */
    generateServiceToken(sourceServiceId: string, targetAudience: string, ttlSeconds?: number): string;
    /**
     * Verifies an inbound service token, checking cryptographic signature, expiry, and audience match.
     */
    verifyServiceToken(token: string, expectedAudience: string): {
        valid: boolean;
        payload?: ServiceTokenPayload;
        error?: string;
    };
}
