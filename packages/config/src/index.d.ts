export type Environment = 'development' | 'test' | 'staging' | 'production';
export interface AppConfig {
    env: Environment;
    appName: string;
    port: number;
    baseUrl: string;
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        ssl: boolean;
    };
    security: {
        jwtSecret: string;
        jwtExpirationSeconds: number;
        jwtRefreshExpirationSeconds: number;
        sessionInactivityMinutes: number;
        absoluteSessionHours: number;
        corsAllowedOrigins: string[];
        enforceStrictRls: boolean;
    };
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
        maxFailedAttempts: number;
        lockoutDurationMinutes: number;
    };
    rateLimit: {
        loginMax: number;
        loginWindowSeconds: number;
        otpMax: number;
        otpWindowSeconds: number;
        apiDefaultMax: number;
        apiWindowSeconds: number;
        exportMax: number;
        exportWindowSeconds: number;
    };
}
/**
 * Secret Management & Key Management Abstraction (Cloud KMS / Vault / HSM Ready)
 */
export interface IKeyManagementService {
    encryptField(plaintext: string, keyId?: string): Promise<string>;
    decryptField(ciphertext: string, keyId?: string): Promise<string>;
    rotateKey(keyId: string): Promise<string>;
    getActiveKeyId(): string;
}
export declare class SoftwareKmsProvider implements IKeyManagementService {
    private keys;
    private activeKeyId;
    constructor(initialKeyHex?: string);
    getActiveKeyId(): string;
    encryptField(plaintext: string, keyId?: string): Promise<string>;
    decryptField(envelope: string): Promise<string>;
    rotateKey(newKeyId: string): Promise<string>;
}
/**
 * Enterprise Secret Manager Abstraction
 * Loads configuration safely without leaking secrets or falling back to dangerous defaults in production.
 */
export declare class SecretManager {
    private static kms;
    static getKms(): IKeyManagementService;
    static setKms(provider: IKeyManagementService): void;
    static getSecret(key: string, fallback?: string): string;
}
export declare function loadAppConfig(): AppConfig;
