export class SecurityError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 403, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'SecurityError';
    }
}
export class SafeErrorHandler {
    /**
     * Sanitizes any server error into a standardized, leak-free API response.
     * Eliminates database queries, stack traces, paths, or secret leakage.
     */
    static toSafeResponse(err, requestId) {
        const timestamp = new Date().toISOString();
        if (err instanceof SecurityError) {
            return {
                statusCode: err.statusCode,
                body: {
                    code: err.code,
                    message: err.message,
                    requestId,
                    timestamp,
                },
            };
        }
        if (err instanceof Error) {
            const msg = err.message.toLowerCase();
            if (msg.includes('tenant') || msg.includes('isolation') || msg.includes('cross-tenant')) {
                return {
                    statusCode: 403,
                    body: {
                        code: 'AUTHORIZATION_DENIED',
                        message: 'Access to the requested resource is denied.',
                        requestId,
                        timestamp,
                    },
                };
            }
            if (msg.includes('permission') || msg.includes('lacks capability') || msg.includes('segregation of duties')) {
                return {
                    statusCode: 403,
                    body: {
                        code: 'AUTHORIZATION_DENIED',
                        message: 'You lack the authorization required to perform this action.',
                        requestId,
                        timestamp,
                    },
                };
            }
            if (msg.includes('not found')) {
                return {
                    statusCode: 404,
                    body: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'The requested resource was not found.',
                        requestId,
                        timestamp,
                    },
                };
            }
            if (msg.includes('session') || msg.includes('expired')) {
                return {
                    statusCode: 401,
                    body: {
                        code: 'SESSION_EXPIRED',
                        message: 'Your session has expired or is invalid. Please authenticate again.',
                        requestId,
                        timestamp,
                    },
                };
            }
            if (msg.includes('validation') || msg.includes('invalid input') || msg.includes('required')) {
                return {
                    statusCode: 400,
                    body: {
                        code: 'VALIDATION_ERROR',
                        message: 'The submitted request contained invalid input parameters.',
                        requestId,
                        timestamp,
                    },
                };
            }
        }
        // Generic safe fallback for unhandled internal errors — NEVER expose stack trace or database errors!
        return {
            statusCode: 500,
            body: {
                code: 'INTERNAL_ERROR',
                message: 'An internal error occurred. Please contact system administrator with the Request ID.',
                requestId,
                timestamp,
            },
        };
    }
}
