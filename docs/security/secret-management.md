# VMS Enterprise: Secret Management & Configuration Governance

## 1. Zero Secrets in Source Code Invariant

VMS Enterprise maintains a strict zero-tolerance invariant regarding secrets in code:
- No database passwords, JWT signing secrets, AES encryption keys, provider API keys, or private certificates may ever be hardcoded in version control.
- In production (`NODE_ENV === 'production'`), if any required secret is missing, `SecretManager` throws a fatal startup exception (`CRITICAL SECURITY FAILURE`) rather than falling back to default or insecure values.

---

## 2. Environment Separation & Tier Isolation

Configuration is strictly separated across four deployment tiers:

| Environment | Purpose | Secret Storage Strategy |
|---|---|---|
| **development** | Local developer testing | Local `.env.local` (git-ignored) with synthetic test keys |
| **test** | Automated unit / CI tests | Ephemeral in-memory mock keys generated on test setup |
| **staging** | Pre-production testing | Isolated staging secrets stored in enterprise KMS / Vault |
| **production** | Live multi-tenant operations | Secrets injected via Cloud KMS / HashiCorp Vault / AWS Secrets Manager |

### Cross-Environment Contamination Defense:
Staging and production environments never share database credentials, JWT secrets, or cryptographic key rings.

---

## 3. Environment Variable Template (`.example.env`)

The repository includes `.example.env` containing placeholders only. No real or sensitive production tokens are present:

```bash
# Security & Secret Management Placeholders
JWT_SECRET=PLACEHOLDER_MIN_32_CHAR_RANDOM_SECRET_KEY
DATA_ENCRYPTION_KEY=PLACEHOLDER_BASE64_AES_256_GCM_ENCRYPTION_KEY
DATABASE_PASSWORD=CHANGE_ME_IN_LOCAL_ENV_NEVER_IN_SOURCE
```

---

## 4. The `SecretManager` Abstraction

The `SecretManager` class decouples the application from physical secret storage mechanisms:

```typescript
export class SecretManager {
  public static getSecret(key: string, fallback?: string): string {
    const val = process.env[key];
    if (val) return val;

    const env = process.env['NODE_ENV'] as Environment;
    if (env === 'production') {
      throw new Error(`CRITICAL SECURITY FAILURE: Required secret '${key}' is missing in production environment.`);
    }

    if (fallback !== undefined) return fallback;
    return `mock-dev-secret-${key.toLowerCase()}`;
  }
}
```

This abstraction allows seamless transitions from environment variable injection to enterprise secret vaults (HashiCorp Vault, AWS Secrets Manager, Google Secret Manager) without rewriting application business services.
