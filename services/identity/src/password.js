import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
export const DEFAULT_PASSWORD_POLICY = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    historyLimit: 5,
};
export class PasswordSecurityService {
    policy;
    static ITERATIONS = 100_000;
    static KEY_LENGTH = 64;
    static DIGEST = 'sha512';
    constructor(policy = DEFAULT_PASSWORD_POLICY) {
        this.policy = policy;
    }
    /**
     * Hashes a password using PBKDF2 with a cryptographically secure random salt.
     * Returns formatted string: "pbkdf2:iterations:saltHex:hashHex"
     */
    hashPassword(plaintext) {
        const salt = randomBytes(16).toString('hex');
        const hash = pbkdf2Sync(plaintext, salt, PasswordSecurityService.ITERATIONS, PasswordSecurityService.KEY_LENGTH, PasswordSecurityService.DIGEST).toString('hex');
        return `pbkdf2:${PasswordSecurityService.ITERATIONS}:${salt}:${hash}`;
    }
    /**
     * Verifies a plaintext password against a stored PBKDF2 hash using timing-safe comparison.
     */
    verifyPassword(plaintext, storedHash) {
        const parts = storedHash.split(':');
        if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
            return false;
        }
        const iterations = parseInt(parts[1], 10);
        const salt = parts[2];
        const expectedHash = parts[3];
        const computed = pbkdf2Sync(plaintext, salt, iterations, PasswordSecurityService.KEY_LENGTH, PasswordSecurityService.DIGEST).toString('hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        const computedBuffer = Buffer.from(computed, 'hex');
        if (expectedBuffer.length !== computedBuffer.length) {
            return false;
        }
        return timingSafeEqual(expectedBuffer, computedBuffer);
    }
    /**
     * Validates password complexity against the enterprise password policy.
     */
    validatePolicy(password) {
        const errors = [];
        if (!password || password.length < this.policy.minLength) {
            errors.push(`Password must be at least ${this.policy.minLength} characters in length.`);
        }
        if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter.');
        }
        if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter.');
        }
        if (this.policy.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one numerical digit.');
        }
        if (this.policy.requireSymbols && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            errors.push('Password must contain at least one special symbol.');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Checks whether the proposed new password has been used in recent password history.
     */
    isPasswordInHistory(plaintext, previousHashes) {
        const limit = Math.min(previousHashes.length, this.policy.historyLimit);
        const recentHashes = previousHashes.slice(-limit);
        for (const storedHash of recentHashes) {
            if (this.verifyPassword(plaintext, storedHash)) {
                return true;
            }
        }
        return false;
    }
    resetTokens = new Map();
    /**
     * Generates a cryptographically random, short-lived password reset token.
     */
    generatePasswordResetToken(userId, ttlMinutes = 30) {
        const resetToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        this.resetTokens.set(resetToken, { userId, expiresAt });
        return { resetToken, expiresAt };
    }
    /**
     * Validates and consumes a password reset token.
     */
    verifyPasswordResetToken(token) {
        const entry = this.resetTokens.get(token);
        if (!entry) {
            return { valid: false, error: 'Password reset token is invalid or already consumed.' };
        }
        if (Date.now() > entry.expiresAt.getTime()) {
            this.resetTokens.delete(token);
            return { valid: false, error: 'Password reset token has expired.' };
        }
        // Single-use token: consume upon successful verification
        this.resetTokens.delete(token);
        return { valid: true, userId: entry.userId };
    }
}
