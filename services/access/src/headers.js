export class SecurityHeadersService {
    /**
     * Generates standard production-grade HTTP security response headers.
     */
    static getHeaders(config) {
        const isProd = config?.isProduction ?? process.env['NODE_ENV'] === 'production';
        const headers = {
            // Content Security Policy (strict defaults, no inline script execution)
            'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
            // Prevent clickjacking
            'X-Frame-Options': 'DENY',
            // Prevent MIME-sniffing
            'X-Content-Type-Options': 'nosniff',
            // Referrer policy
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            // Restrict browser device hardware APIs
            'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), payment=()',
            // Cross-origin opener policy
            'Cross-Origin-Opener-Policy': 'same-origin',
            // Cross-origin resource policy
            'Cross-Origin-Resource-Policy': 'same-site',
            // Disable legacy X-XSS-Protection to avoid known vulnerabilities in older browsers
            'X-XSS-Protection': '0',
        };
        if (isProd) {
            // HTTP Strict Transport Security (HSTS) with 1 year lifetime and preloading
            headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
        }
        return headers;
    }
    /**
     * Validates if a CORS origin is explicitly allowed (never allowing wildcard * for authenticated APIs).
     */
    static validateCorsOrigin(origin, allowedOrigins) {
        if (!origin)
            return false;
        if (allowedOrigins.includes('*'))
            return false; // Prohibit wildcard on enterprise authenticated APIs!
        return allowedOrigins.includes(origin);
    }
    /**
     * Generates CORS response headers for an origin, guaranteeing no wildcard on authenticated APIs.
     */
    static getCorsHeaders(origin, allowedOrigins) {
        if (!origin || !this.validateCorsOrigin(origin, allowedOrigins)) {
            return {};
        }
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID, X-Session-ID',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
        };
    }
}
