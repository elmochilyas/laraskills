# Metadata

Domain: Security & Identity Engineering
Subdomain: Secrets Management
Knowledge Unit: Envelope encryption DEK/KEK (Sealcraft)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Envelope encryption encrypts data with a Data Encryption Key (DEK), then encrypts the DEK with a Key Encryption Key (KEK) stored in an external KMS (AWS KMS, GCP Cloud KMS, Azure Key Vault, HashiCorp Vault Transit). The `sealcraft` package implements this pattern for Laravel, providing a `Crypt` facade replacement that transparently handles DEK generation and KEK wrapping. The KEK never leaves the KMS — encryption/decryption of the DEK happens in the KMS via API calls. Rotating the KEK does not require re-encrypting the underlying data — only the DEK needs re-wrapping. This enables key rotation without touching the encrypted data.

---

# Core Concepts

- **Data Encryption Key (DEK)**: Symmetric key (typically AES-256) used to encrypt the actual data. Generated per-record or per-batch. Stored alongside the encrypted data (wrapped).
- **Key Encryption Key (KEK)**: Master key stored in the KMS. Used to encrypt (wrap) and decrypt (unwrap) DEKs. Never stored in the application.
- **Wrapped DEK**: The DEK encrypted by the KEK. Stored alongside the ciphertext as metadata. Format: `{kms_id}:{wrapped_dek}:{iv}:{ciphertext}`.
- **KMS Provider Abstraction**: Sealcraft provides a unified interface for multiple KMS providers. The application code does not change when switching providers (e.g., from AWS KMS to Vault Transit).
- **DEK Caching**: The unwrapped DEK can be cached in memory for a configurable TTL, avoiding a KMS API call on every decryption.

---

# Mental Models

- **Physical Key Analogy**: The DEK is the key to a lockbox. The KEK is the key to the key cabinet. You store the DEK in the cabinet (wrapped by KEK). To open a lockbox, you take the DEK from the cabinet (unwrapped by KEK), then use the DEK to open the lockbox.
- **Rotation Independence**: Rotating the KEK (cabinet lock) does not require opening every lockbox. You simply re-wrap each DEK with the new KEK.

---

# Internal Mechanics

- **Encryption**: Generate random DEK → Encrypt plaintext with DEK (AES-GCM) → Call KMS `encrypt` (wrapping) with DEK as plaintext → Store `{kms_id}:{ciphertext_dek}:{iv}:{aad}` alongside ciphertext.
- **Decryption**: Parse stored composite → Call KMS `decrypt` (unwrap) with ciphertext DEK → Returns plaintext DEK → Decrypt ciphertext with DEK.
- **DEK Rotation (Re-wrapping)**: Decrypt ciphertext DEK using old KEK → Encrypt (wrap) plaintext DEK using new KEK → Store new wrapped DEK. The underlying ciphertext is unchanged.

---

# Patterns

## Per-Record DEK Pattern
- **Purpose**: Each encrypted record has its own DEK.
- **Implementation**: Generate a new DEK for each `encrypt()` call. Store wrapped DEK in the same row column.
- **Benefits**: Compromising one DEK compromises only one record.
- **Tradeoffs**: Storage overhead (wrapped DEK per record). KMS API call per encryption + decryption.

## Cached DEK Pattern
- **Purpose**: Avoid KMS API call on every decryption.
- **Implementation**: Cache unwrapped DEK in memory for 5 minutes. Use a cache key derived from the wrapped DEK value. Invalidate on cache flush or KEK rotation.
- **Benefits**: Decryption becomes a local AES operation after the first call — ~0.5ms vs 50ms via KMS.
- **Tradeoffs**: DEK is in application memory for the cache window. If memory is dumped, DEK is exposed.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| KMS Provider | AWS vs GCP vs Azure vs Vault | Use the KMS matching your cloud provider. Vault Transit if multi-cloud or on-prem |
| DEK per record vs per batch | Security vs storage/performance | Per-record for sensitive data (PII); per-batch for bulk encryption (logs) |
| DEK caching enabled | Performance vs memory security | Enable caching with short TTL (1-5 min) for high-traffic decryption endpoints |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| KEK never stored in application — must call KMS to unwrap DEK | KMS API latency (20-100ms per unwrap) | Caching mitigates this. Without cache, every decryption is a KMS API call |
| KEK rotation does not re-encrypt data | Re-wrapping all DEKs is still required | Re-wrapping is CPU-bound (AES encrypt of small DEKs), much cheaper than re-encrypting data |
| Provider abstraction = KMS-portable | Feature parity across providers is not guaranteed | AWS KMS may support features (key policies, grants) that Vault Transit does not |

---

# Performance Considerations

- KMS `encrypt`/`decrypt` API: 20-100ms per call (network + HSM processing). This is the bottleneck.
- DEK caching: reduces KMS calls from per-decryption to per-cache-TTL. For 1000 decryptions/second with 5-minute cache: 1 KMS call per 5 minutes.
- AES-GCM encryption with DEK: ~0.5-2ms per operation (CPU-bound, hardware accelerated).
- Wrapped DEK storage overhead: ~200-500 bytes per encrypted record (KMS ID + wrapped DEK + IV + AAD).

---

# Production Considerations

- **KMS Availability**: If KMS is unavailable, decryption fails. Cache DEKs aggressively. If uncached, implement a circuit breaker with fallback to stale DEK cache after KMS timeout.
- **KMS Key Permissions**: The application's IAM role must have `kms:Encrypt` and `kms:Decrypt` permissions on the specific KEK key. Use key ARN-based policies.
- **KMS Key Rotation**: AWS KMS supports automatic annual key rotation. This rotates the backing key but the key ID remains the same — existing wrapped DEKs remain valid.
- **Cross-Region KMS**: If using multi-region deployment, KEKs must be available in all regions. Use multi-region KMS keys (AWS) or replicate key material.
- **DEK Re-wrapping Strategy**: After KEK rotation, schedule a command to re-wrap all DEKs. Process in batches.

---

# Common Mistakes

- **Not caching DEKs**: Every decryption triggers a KMS API call. 100 requests/second = 100 KMS calls/second = high latency and KMS cost.
- **Storing wrapped DEK and ciphertext separately**: If wrapped DEK is separated from ciphertext (different table, different system), decryption is impossible. Store them together.
- **Using the same KEK across environments**: Dev and prod KEK should be different. Dev KEK compromise should not affect production data.
- **Not planning for KEK rotation**: KEK is rotated but DEKs are never re-wrapped. Old KEK must remain available to decrypt old wrapped DEKs. Maintain a KEK history.
- **Assuming KMS failure is handled**: If KMS returns `AccessDeniedException`, decryption fails silently unless the application handles it. Log and monitor KMS errors.

---

# Failure Modes

- **KEK Deleted from KMS**: If the KEK is deleted (or scheduled for deletion), wrapped DEKs cannot be unwrapped. All encrypted data becomes permanently undecryptable. Prevent KEK deletion with deletion protection.
- **KMS Throttling**: KMS API rate limits (default: 5000 req/s per Region). If exceeded, decryption fails with `ThrottlingException`. Implement exponential backoff with jitter.
- **DEK Cache Poisoning**: If the cache is corrupted (stale wrapped DEK), decrypt returns garbage. Use cache integrity checks (HMAC of cached DEK).
- **Cross-Account KMS Access**: On AWS, if the KEK is in a different account, the KMS key policy must explicitly grant cross-account decrypt access.

---

# Related Knowledge Units

- Prerequisites: Laravel Crypt facade (AES-256-CBC/GCM), KMS fundamentals
- Related: Column-level RSA encryption with key rotation, Zero-downtime key rotation (Locksmith)
- Advanced Follow-up: KMS key rotation strategies, Multi-region KMS replication, DEK re-wrapping automation

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
