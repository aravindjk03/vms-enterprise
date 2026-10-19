export class RateLimiter {
    requests = new Map();
    buckets = {
        LOGIN: { limit: 5, windowMs: 60 * 1000 }, // 5 per minute
        OTP: { limit: 3, windowMs: 60 * 1000 }, // 3 per minute
        SEARCH: { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
        EXPORT: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 per 5 minutes
        DEFAULT: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
    };
    constructor(customBuckets) {
        if (customBuckets) {
            this.buckets = { ...this.buckets, ...customBuckets };
        }
    }
    /**
     * Consumes one request token for a client identifier and category.
     * Returns whether the request is allowed or rate-limited.
     */
    checkRateLimit(clientId, category = 'DEFAULT') {
        const bucket = this.buckets[category] || this.buckets.DEFAULT;
        const now = Date.now();
        const key = `${category}:${clientId}`;
        const timestamps = this.requests.get(key) || [];
        // Evict timestamps older than sliding window
        const validTimestamps = timestamps.filter(ts => now - ts < bucket.windowMs);
        if (validTimestamps.length >= bucket.limit) {
            const oldest = validTimestamps[0];
            const resetSeconds = Math.ceil((oldest + bucket.windowMs - now) / 1000);
            return {
                allowed: false,
                remaining: 0,
                resetSeconds: Math.max(1, resetSeconds),
            };
        }
        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);
        return {
            allowed: true,
            remaining: bucket.limit - validTimestamps.length,
            resetSeconds: Math.ceil(bucket.windowMs / 1000),
        };
    }
    /**
     * Resets rate limit records for a client (e.g. after successful MFA or for testing).
     */
    reset(clientId, category) {
        if (category) {
            this.requests.delete(`${category}:${clientId}`);
        }
        else {
            for (const k of Array.from(this.requests.keys())) {
                if (k.endsWith(`:${clientId}`)) {
                    this.requests.delete(k);
                }
            }
        }
    }
}
