# VMS Enterprise: Cryptographic Key Management & Encryption Architecture

## 1. Key Management Principles

VMS Enterprise employs industry-standard cryptographic primitives via the `node:crypto` standard library. Custom or non-standard cryptographic algorithms are strictly prohibited.

### Key Governance Lifecycle:
1. **Purpose-Specific Key Segregation**: Encryption keys are dedicated to specific security domains (e.g. Master Data Encryption Key, JWT Token Signing Key, Session HMAC Key, Document URL Signing Key).
2. **Key Rotation**: Cryptographic keys support seamless rotation without downtime. Envelopes embed key identifiers (`keyId:iv:authTag:ciphertext`), enabling the decryptor to resolve the correct key version.
3. **No Colocation**: Cryptographic keys are never stored on the same storage volume or database table as the encrypted data. In production, keys are managed within dedicated Hardware Security Modules (HSM) or Cloud Key Management Services.

---

## 2. Key Management Service (KMS) Abstraction

The platform implements the `IKeyManagementService` contract:

```typescript
export interface IKeyManagementService {
  encryptField(plaintext: string, keyId?: string): Promise<string>;
  decryptField(ciphertext: string, keyId?: string): Promise<string>;
  rotateKey(keyId: string): Promise<string>;
  getActiveKeyId(): string;
}
```

The system ships with `SoftwareKmsProvider` for local development and testing, and is prepared for enterprise Cloud KMS providers:
- **AWS KMS**: Using Customer Master Keys (CMKs) with envelope encryption (`GenerateDataKey`).
- **Google Cloud KMS**: Regional key rings with HSM protection levels.
- **HashiCorp Vault**: Transit Secrets Engine with automated cryptographic key rotation.

---

## 3. Sensitive Field Encryption: AES-256-GCM

When storing restricted or highly restricted fields at rest (e.g., biometric references, external API credentials), the platform employs **AES-256-GCM** (Galois/Counter Mode) authenticated encryption:

- **Key Size**: 256 bits (32 bytes).
- **Initialization Vector (IV)**: 96-bit (12-byte) cryptographically random nonce generated uniquely per encryption operation.
- **Authentication Tag**: 128-bit (16-byte) tag ensuring integrity and authenticating the ciphertext.
- **Envelope Format**:
  $$\text{Envelope} = \text{keyId} : \text{iv}_{\text{hex}} : \text{tag}_{\text{hex}} : \text{ciphertext}_{\text{hex}}$$

Any unauthorized alteration of the ciphertext or IV causes a tag mismatch, preventing tampering and chosen-ciphertext attacks.
