export interface PasswordPolicyConfig {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    historyLimit: number;
}
export declare const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig;
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class PasswordSecurityService {
    private policy;
    private static readonly ITERATIONS;
    private static readonly KEY_LENGTH;
    private static readonly DIGEST;
    constructor(policy?: PasswordPolicyConfig);
    /**
     * Hashes a password using PBKDF2 with a cryptographically secure random salt.
     * Returns formatted string: "pbkdf2:iterations:saltHex:hashHex"
     */
    hashPassword(plaintext: string): string;
    /**
     * Verifies a plaintext password against a stored PBKDF2 hash using timing-safe comparison.
     */
    verifyPassword(plaintext: string, storedHash: string): boolean;
    /**
     * Validates password complexity against the enterprise password policy.
     */
    validatePolicy(password: string): PasswordValidationResult;
    /**
     * Checks whether the proposed new password has been used in recent password history.
     */
    isPasswordInHistory(plaintext: string, previousHashes: string[]): boolean;
    private resetTokens;
    /**
     * Generates a cryptographically random, short-lived password reset token.
     */
    generatePasswordResetToken(userId: string, ttlMinutes?: number): {
        resetToken: string;
        expiresAt: Date;
    };
    /**
     * Validates and consumes a password reset token.
     */
    verifyPasswordResetToken(token: string): {
        valid: boolean;
        userId?: string;
        error?: string;
    };
}
