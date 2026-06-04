# Metadata

Domain: Security & Identity Engineering
Subdomain: Secrets Management
Knowledge Unit: Column-level RSA encryption with key rotation
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Column-level encryption in Laravel is implemented via packages like `EloquentEncryption` which transparently encrypt/decrypt specific model attributes using RSA public-key cryptography. Each user (or record owner) has an RSA key pair. Data is encrypted with the user's public key and can only be decrypted with the corresponding private key. Key rotation generates a new RSA key pair and re-encrypts all data for that user. This pattern is useful for scenarios where different users should not be able to read each other's encrypted data (even with database access), or when compliance requires separate keys per entity.

---

# Core Concepts

- **RSA Key Pair**: Public key encrypts, private key decrypts. Each encryptable entity (user, tenant) has their own pair. Public key stored in the database; private key encrypted with APP_KEY or a KEK and stored.
- **Laravel Encrypted Casts**: `protected $casts = ['ssn' => 'encrypted']` (built-in AES). Column-level RSA encryption replaces or augments this with asymmetric encryption.
- **Key Rotation**: Generate new RSA key pair for the user. Decrypt all data with old private key. Re-encrypt with new public key. Update stored keys.
- **Storage Overhead**: RSA ciphertext is key-size dependent (256 bytes for 2048-bit RSA) plus the plaintext length. Significant storage increase for short fields.

---

# Mental Models

- **User-Specific Lockbox**: Each user has their own lockbox (RSA key pair). Your data in their box can only be read by them. Even the application cannot read encrypted data without the user's private key.
- **Per-User Key Rotation**: When a user's key is rotated, only that user's data must be re-encrypted — not the entire database.

---

# Patterns

## Derived Key Pattern
- **Purpose**: Avoid storing the private key directly.
- **Implementation**: Derive the encryption key from user credentials (password + salt). Data can only be decrypted when the user provides their password (client-side or server-side with password).
- **Benefits**: Zero-knowledge encryption — server cannot decrypt without user's password.
- **Tradeoffs**: Password reset = data loss. Must have recovery mechanism.

## Wrapped Private Key Pattern
- **Purpose**: Server can decrypt without user interaction.
- **Implementation**: Private key encrypted with APP_KEY (or KMS-wrapped). Server can decrypt any user's data.
- **Benefits**: Admin recovery, background processing, search indexing.
- **Tradeoffs**: Server compromise exposes all private keys.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| RSA vs AES per-user key | Asymmetric vs symmetric per-user | RSA for separate read/write keys (public key encrypt, private key decrypt). AES symmetric if both operations require the same key |
| Key rotation scope | Per-user vs per-tenant | Per-user for individual data isolation; per-tenant for organizational isolation |
| Private key storage | Database vs KMS vs user-derived | Database with APP_KEY encryption for simplicity; KMS for compliance; user-derived for zero-knowledge |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Per-user isolation — even app cannot read all data | Cannot query encrypted columns (no WHERE, no ORDER BY) | All queries on encrypted fields must be performed in application memory |
| Key rotation affects one user at a time | RSA key generation is slow (~1-5 seconds per 2048-bit key) | Batch key rotation operations; run in queue |
| Compliance-friendly (separate keys per user) | Key management overhead | Key inventory, backup, rotation schedule needed |

---

# Performance Considerations

- RSA encryption (public key): ~1-3ms per field. RSA decryption (private key): ~5-20ms per field (2048-bit key).
- With many encrypted columns per request, decryption time adds up. 10 encrypted fields = 50-200ms of CPU time.
- RSA key generation: 1-5 seconds. Generate in background queue job.
- Caching decrypted values: use Laravel cache with short TTL for frequently accessed encrypted fields.

---

# Production Considerations

- **Key Backup**: RSA private keys are single points of failure. If the private key is lost (corrupted DB, deleted row), encrypted data is unrecoverable. Back up keys separately and securely.
- **Key Rotation Testing**: Test key rotation with a subset of users before full rollout. Verify that all data can be re-encrypted and decrypted after rotation.
- **Compliance**: Column-level encryption with per-user keys is often required for healthcare (HIPAA) and finance (PCI) compliance. Document the key management process.
- **Search**: Full-text search on encrypted columns is impossible. Consider searchable encrypted fields (deterministic encryption with separate search key) or external search index.

---

# Common Mistakes

- **Storing private key in the same database as encrypted data**: DB breach exposes both encrypted data and the key. Protect private key with APP_KEY encryption or KMS wrapping.
- **Not planning for key recovery**: User loses their password (derived key pattern). Recovery mechanism must exist — email-based recovery that generates a new key pair.
- **Assuming RSA encrypts arbitrary length**: RSA has a maximum plaintext length (key size - 42 bytes for padding). For fields longer than ~214 bytes (2048-bit key), use hybrid encryption (RSA + AES).
- **Rotating keys without decryption verification**: Old data decrypted with old key, encrypted with new key. If any record fails re-encryption, that data is lost. Verify each record during rotation.

---

# Failure Modes

- **Private Key Corruption**: A single bit flip in the stored private key renders it unusable. All encrypted data for that user is permanently lost. Backup keys with error correction.
- **Key Rotation Interrupted**: Server crashes during re-encryption. Some records encrypted with new key, some with old. Partial corruption. Mitigation: use a transaction-like process (mark records as "migrated" after successful re-encryption).
- **APP_KEY Rotation + Private Key Loss**: If private keys are encrypted with APP_KEY and APP_KEY rotates without re-encrypting private keys, all private keys are lost. Coordinate rotations.

---

# Related Knowledge Units

- Prerequisites: Laravel Crypt facade (AES-256-CBC/GCM), Envelope encryption DEK/KEK
- Related: Secrets scanning and detection tools, Zero-downtime key rotation
- Advanced Follow-up: Hybrid encryption (RSA + AES) for long fields, Deterministic encryption for searchable encrypted fields, FPE (Format-Preserving Encryption) for legacy system compatibility

## Ecosystem Usage
- **Laravel Env Key Management**: APP_KEY in .env is the root encryption key; used for cookie encryption, signed URL generation, and encrypted Eloquent casts. Rotated via php artisan key:generate.
- **HashiCorp Vault Integration**: Community Laravel packages provide Vault-based secret resolution with caching, AppRole/Kubernetes authentication, and automatic secret rotation.
- **Envelope Encryption**: Community packages implement DEK/KEK patterns where data encryption keys are wrapped by a master key stored in an external KMS (AWS KMS, Azure Key Vault).
- **Column-level Encryption**: Laravel's encrypted cast and community packages (spatie/laravel-encrypted-attributes, paragonie/easy-crypto-php) transparently encrypt/decrypt database columns.
- **Secrets Scanning**: Community packages and CI tools (GitLeaks, TruffleHog, sensorpro/secrets-scanning) scan codebases for accidentally committed secrets; integrate into CI pipelines as pre-commit hooks or PR checks.
- **Key Rotation**: Zero-downtime key rotation practices use versioned keys: new data encrypted with new key, old data decrypted with old key. Community packages like locksmith/laravel-key-rotation automate this.
- **Credential isolation**: config/services.php, config/broadcasting.php, config/mail.php manage API credentials; environment-specific configuration via .env prevents credential exposure across environments.
- **External secrets management**: AWS Secrets Manager, Azure Key Vault, GCP Secret Manager provide API-based secret retrieval; community packages wrap these services for Laravel configuration hydration.

## Research Notes
- The APP_KEY rotation process in Laravel requires decrypting all encrypted data with the old key before rotating, then re-encrypting with the new key — automated tools like locksmith/laravel-key-rotation handle this via Artisan commands.
- Vault integration packages (deepdigs/laravel-vault-suite) intercept env() calls using a custom environment loader — secrets are loaded from Vault at boot time and cached for the configured TTL, after which env() returns values from the Vault-backed cache.
- Envelope encryption in Laravel (via community packages) implements the AWS KMS Envelope Encryption pattern — the Data Encryption Key (DEK) is generated locally, encrypted with a Key Encryption Key (KEK) from KMS, and stored alongside the encrypted data.
- Column-level encryption in Laravel uses the encrypted Eloquent cast, which transparently encrypts on model save and decrypts on model retrieval — the encryption uses AES-256-CBC with the application key and a random initialization vector (IV).
- Secrets scanning tools integrated into CI/CD can detect secrets in commits with regex patterns, entropy analysis, and context-aware matching — false positive rates are a significant operational concern requiring continuous tuning.
- The config/services.php file pattern for external API credentials (storing keys in .env and referencing via env() in config files) is the recommended approach for credential isolation — config caching (config:cache) freezes these values in production.
- GitHub's secret scanning integration with Laravel projects detects APP_KEY, database credentials, and API tokens in public repositories — prevention via .env file exclusion from version control is the primary defense.
- Versioned key rotation systems maintain a key hierarchy: the current version is used for encryption, while all previous versions are available for decryption — this enables zero-downtime key rotation without service interruption.

## Internal Mechanics
- **APP_KEY Generation**: php artisan key:generate generates a 32-byte (256-bit) random string encoded in base64 (ase64:...) — used as the encryption key for Crypt facade, cookie encryption, and signed URL generation. The key is stored in .env as APP_KEY=base64:....
- **Vault Package Resolution Flow**: deepdigs/laravel-vault-suite registers a custom environment loader in ootstrap/app.php → at application boot, the loader authenticates to Vault using configured auth method → fetches secrets from configured paths → caches them in Laravel's cache → makes them available via env() calls.
- **Envelope Encryption Flow**: Data is encrypted with a locally-generated Data Encryption Key (DEK) using symmetric encryption → the DEK is sent to an external KMS (AWS KMS, Azure Key Vault) for encryption with a Key Encryption Key (KEK) → the wrapped DEK is stored alongside the encrypted data → decryption requests the KMS to unwrap the DEK, then uses it to decrypt the data.
- **Column Encryption (Eloquent Cast)**: The encrypted cast in Eloquent intercepts setAttribute() → $model->setAttribute('ssn', ) → the cast's set() method calls Crypt::encrypt() → stores ciphertext in the database column. On getAttribute(), the cast's get() method calls Crypt::decrypt() returning plaintext.
- **Secrets Scanning Flow**: CI pipeline scans repository files with tools like GitLeaks or TruffleHog → each file is scanned for regex patterns matching known secret formats (AWS keys, GitHub tokens, APP_KEY patterns) → entropy analysis detects high-randomness strings → matches are reported with file path, line number, and secret type.
- **Composer Audit Resolution**: composer audit queries the FriendsOfPHP/security-advisories database → each installed package is matched against the advisory database → advisories are reported with CVE ID, severity, and suggested upgrade version.
