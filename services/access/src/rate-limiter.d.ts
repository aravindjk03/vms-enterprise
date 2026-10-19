export interface RateLimitBucket {
    limit: number;
    windowMs: number;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
}
export type RateLimitCategory = 'LOGIN' | 'OTP' | 'SEARCH' | 'EXPORT' | 'DEFAULT';
export declare class RateLimiter {
    private requests;
    private buckets;
    constructor(customBuckets?: Partial<Record<RateLimitCategory, RateLimitBucket>>);
    /**
     * Consumes one request token for a client identifier and category.
     * Returns whether the request is allowed or rate-limited.
     */
    checkRateLimit(clientId: string, category?: RateLimitCategory): RateLimitResult;
    /**
     * Resets rate limit records for a client (e.g. after successful MFA or for testing).
     */
    reset(clientId: string, category?: RateLimitCategory): void;
}
