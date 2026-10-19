import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

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

export class SoftwareKmsProvider implements IKeyManagementService {
  private keys: Map<string, Buffer> = new Map();
  private activeKeyId: string;

  constructor(initialKeyHex?: string) {
    this.activeKeyId = 'kms-key-v1';
    const keyBuffer = initialKeyHex
      ? Buffer.from(initialKeyHex, 'hex')
      : randomBytes(32); // 256-bit AES key
    this.keys.set(this.activeKeyId, keyBuffer);
  }

  public getActiveKeyId(): string {
    return this.activeKeyId;
  }

  public async encryptField(plaintext: string, keyId?: string): Promise<string> {
    const targetKeyId = keyId || this.activeKeyId;
    const key = this.keys.get(targetKeyId);
    if (!key) throw new Error(`KMS Key '${targetKeyId}' not found`);

    const iv = randomBytes(12); // Standard GCM 96-bit IV
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Envelope: keyId:iv:authTag:ciphertext
    return `${targetKeyId}:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  public async decryptField(envelope: string): Promise<string> {
    const parts = envelope.split(':');
    if (parts.length !== 4) {
      throw new Error('Malformed KMS encrypted envelope');
    }
    const [keyId, ivHex, authTagHex, encrypted] = parts;
    const key = this.keys.get(keyId);
    if (!key) throw new Error(`KMS Key '${keyId}' not found for decryption`);

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public async rotateKey(newKeyId: string): Promise<string> {
    const newKey = randomBytes(32);
    this.keys.set(newKeyId, newKey);
    this.activeKeyId = newKeyId;
    return newKeyId;
  }
}

/**
 * Enterprise Secret Manager Abstraction
 * Loads configuration safely without leaking secrets or falling back to dangerous defaults in production.
 */
export class SecretManager {
  private static kms: IKeyManagementService = new SoftwareKmsProvider();

  public static getKms(): IKeyManagementService {
    return this.kms;
  }

  public static setKms(provider: IKeyManagementService) {
    this.kms = provider;
  }

  public static getSecret(key: string, fallback?: string): string {
    const val = process.env[key];
    if (val) return val;

    const env = (process.env['NODE_ENV'] || 'development') as Environment;
    if (env === 'production') {
      throw new Error(`CRITICAL SECURITY FAILURE: Required secret '${key}' is missing in production environment.`);
    }

    if (fallback !== undefined) return fallback;
    return `mock-dev-secret-${key.toLowerCase()}`;
  }
}

export function loadAppConfig(): AppConfig {
  const env = (process.env['NODE_ENV'] || 'development') as Environment;

  return {
    env,
    appName: process.env['APP_NAME'] || 'VMS-Enterprise',
    port: parseInt(process.env['APP_PORT'] || '3000', 10),
    baseUrl: process.env['APP_BASE_URL'] || 'https://vms.corp.internal',
    database: {
      host: process.env['DATABASE_HOST'] || 'localhost',
      port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
      name: process.env['DATABASE_NAME'] || 'vms_enterprise_db',
      user: process.env['DATABASE_USER'] || 'vms_app_user',
      ssl: process.env['DATABASE_SSL'] === 'true' || env === 'production',
    },
    security: {
      jwtSecret: SecretManager.getSecret('JWT_SECRET', 'dev-insecure-jwt-key-minimum-32-chars-long!'),
      jwtExpirationSeconds: parseInt(process.env['JWT_EXPIRATION_SECONDS'] || '3600', 10),
      jwtRefreshExpirationSeconds: parseInt(process.env['JWT_REFRESH_EXPIRATION_SECONDS'] || '604800', 10),
      sessionInactivityMinutes: parseInt(process.env['AUTH_SESSION_INACTIVITY_TIMEOUT_MINUTES'] || '30', 10),
      absoluteSessionHours: parseInt(process.env['AUTH_ABSOLUTE_SESSION_TIMEOUT_HOURS'] || '12', 10),
      corsAllowedOrigins: (process.env['CORS_ALLOWED_ORIGINS'] || 'https://app.vms.internal,https://admin.vms.internal').split(','),
      enforceStrictRls: process.env['ENFORCE_STRICT_RLS'] !== 'false',
    },
    passwordPolicy: {
      minLength: parseInt(process.env['AUTH_PASSWORD_MIN_LENGTH'] || '12', 10),
      requireUppercase: process.env['AUTH_PASSWORD_REQUIRE_UPPERCASE'] !== 'false',
      requireLowercase: process.env['AUTH_PASSWORD_REQUIRE_LOWERCASE'] !== 'false',
      requireNumbers: process.env['AUTH_PASSWORD_REQUIRE_NUMBERS'] !== 'false',
      requireSymbols: process.env['AUTH_PASSWORD_REQUIRE_SYMBOLS'] !== 'false',
      maxFailedAttempts: parseInt(process.env['AUTH_MAX_FAILED_ATTEMPTS'] || '5', 10),
      lockoutDurationMinutes: parseInt(process.env['AUTH_LOCKOUT_DURATION_MINUTES'] || '15', 10),
    },
    rateLimit: {
      loginMax: parseInt(process.env['RATE_LIMIT_LOGIN_MAX'] || '5', 10),
      loginWindowSeconds: parseInt(process.env['RATE_LIMIT_LOGIN_WINDOW_SECONDS'] || '60', 10),
      otpMax: parseInt(process.env['RATE_LIMIT_OTP_MAX'] || '3', 10),
      otpWindowSeconds: parseInt(process.env['RATE_LIMIT_OTP_WINDOW_SECONDS'] || '60', 10),
      apiDefaultMax: parseInt(process.env['RATE_LIMIT_API_DEFAULT_MAX'] || '100', 10),
      apiWindowSeconds: parseInt(process.env['RATE_LIMIT_API_WINDOW_SECONDS'] || '60', 10),
      exportMax: parseInt(process.env['RATE_LIMIT_EXPORT_MAX'] || '10', 10),
      exportWindowSeconds: parseInt(process.env['RATE_LIMIT_EXPORT_WINDOW_SECONDS'] || '300', 10),
    },
  };
}
