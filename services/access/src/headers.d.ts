export interface SecurityHeadersConfig {
    allowedOrigins?: string[];
    isProduction?: boolean;
}
export declare class SecurityHeadersService {
    /**
     * Generates standard production-grade HTTP security response headers.
     */
    static getHeaders(config?: SecurityHeadersConfig): Record<string, string>;
    /**
     * Validates if a CORS origin is explicitly allowed (never allowing wildcard * for authenticated APIs).
     */
    static validateCorsOrigin(origin: string | undefined, allowedOrigins: string[]): boolean;
    /**
     * Generates CORS response headers for an origin, guaranteeing no wildcard on authenticated APIs.
     */
    static getCorsHeaders(origin: string | undefined, allowedOrigins: string[]): Record<string, string>;
}
