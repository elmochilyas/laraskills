# Metadata

Domain: Security & Identity Engineering
Subdomain: Secrets Management
Knowledge Unit: HashiCorp Vault integration packages
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

HashiCorp Vault integration for Laravel is provided by community packages (`deepdigs/laravel-vault-suite`, `thetribeofdan/laravel_vault`) that replace `.env` file loading with Vault-based secret resolution. Secrets are fetched from Vault at application boot (or cached for a configurable TTL) rather than stored in `.env` files. Two modes: Token mode (Vault token authentication) and File mode (Kubernetes/approle authentication). The primary value is centralized secret management across services, automated secret rotation, and audit logging of secret access — at the cost of Vault infrastructure and operational complexity.

---

# Core Concepts

- **Vault KV Store**: Path-based secret storage (`secret/data/development/app`). Each path contains key-value pairs (e.g., `DB_PASSWORD`, `API_KEY`).
- **Authentication Methods**: Token (static token), AppRole (role ID + secret ID), Kubernetes (service account), LDAP, OIDC. The package authenticates to Vault on boot.
- **Token Mode**: The package uses a Vault token (from `VAULT_TOKEN` env var or file). Token must have read access to the configured secret paths.
- **File Mode**: The package authenticates using AppRole or Kubernetes auth, obtaining a short-lived token for each session.
- **Secret Caching**: Fetched secrets are cached in Laravel's cache (configurable TTL) to avoid Vault read on every request.

---

# Mental Models

- **Vault as Centralized .env**: Instead of each environment having its own `.env` file, all secrets live in Vault. The application authenticates to Vault to get its environment configuration.
- **Secret as Service**: Secrets are not files — they are API responses. The application reads them from Vault like it reads any other API.

---

# Patterns

## Vault Path Per Environment Pattern
- **Implementation**: Secrets stored at `secret/data/{environment}/{service}`. Path configured via single env var `VAULT_PATH_PREFIX`.
- **Benefits**: Environment isolation via Vault paths. No `.env` files per environment.
- **Tradeoffs**: Vault path structure must be consistent across all services.

## Cached Secrets with Grace Period Pattern
- **Implementation**: Fetch secrets on boot, cache for 1 hour. If Vault is unreachable at cache expiry, use stale cache for another hour (grace period). Log the failure.
- **Benefits**: Application remains operational during Vault downtime.
- **Tradeoffs**: Secrets may be stale for up to 2 hours after rotation.

## AppRole Auto-Provisioning Pattern
- **Implementation**: Each application instance gets a unique AppRole role ID + secret ID. Secret ID is delivered out-of-band (Kubernetes secret, AWS Secret Store).
- **Benefits**: No long-lived Vault tokens. Each instance authenticates independently.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Token mode vs File mode | Single server vs containerized | Token mode for traditional deployments; File mode (AppRole/K8s) for containerized |
| Caching enabled vs disabled | Performance vs real-time secret rotation | Caching enabled with 1-hour TTL for performance; disabled only for high-security environments requiring immediate rotation propagation |
| All configs in Vault vs only secrets | Total config vs secrets-only | Secrets only — keep non-sensitive config in `.env` or config cache. Vault for secrets, not configuration |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Centralized secret management — rotate one, update all services | Vault infrastructure to maintain | Vault cluster (server, storage backend, HA configuration) adds operational overhead |
| Audit trail for secret access | Every `config('app.key')` call becomes a Vault read (if uncached) | Performance impact mitigated by caching |
| No .env files in production | Vault availability is a boot-time dependency | If Vault is down during deployment, the application fails to boot (unless cached secrets are available) |

---

# Performance Considerations

- Vault read latency: ~10-50ms per fetch (network round trip).
- With caching: one Vault read per cache TTL period. Without caching: one Vault read per config access.
- Cache key per secret path. Use Redis cache for fast access.

---

# Production Considerations

- **Vault Availability**: Vault must be available during application boot (and periodically for cache refresh). Monitor Vault health. Use Vault HA (standby nodes, auto-unseal).
- **Vault Agent**: Consider using Vault Agent sidecar to handle authentication and secret injection, rather than embedding Vault logic in the Laravel package.
- **Secret Rotation**: When a secret is rotated in Vault, the cache must be flushed. Implement a webhook endpoint in Laravel that Vault calls on secret rotation to invalidate the cache.
- **Unsealing**: Vault requires unsealing after restart (unless auto-unseal with KMS is configured). Unsealed Vault is a prerequisite for application boot.

---

# Common Mistakes

- **Not caching Vault secrets**: Every `config('database.connections.mysql.password')` triggers a Vault read. At 100 requests/second with 10 config reads each, that's 1000 Vault reads/second — unsustainable.
- **Using Vault for non-secret config**: Storing `APP_NAME` or `LOG_LEVEL` in Vault — these do not need centralized management. Keep non-sensitive config in `.env`.
- **Hardcoded Vault paths**: `$vault->get('secret/data/production/app/DB_PASSWORD')` — path changes between environments require code changes. Use configurable path prefixes.
- **Not handling Vault downtime gracefully**: Application crashes if Vault is unreachable at boot. Implement graceful fallback: use cached secrets, then environment variables, then fail.

---

# Failure Modes

- **Vault Sealed**: After restart, Vault is sealed and cannot serve requests. All applications relying on Vault for config fail to boot. Implement auto-unseal (KMS, Cloud HSM).
- **Token Expiry**: Vault token expires (default: 24 hours). Application cannot read new secrets. Existing cached secrets continue to work until cache TTL expires. Use AppRole with automatic token renewal.
- **Path Change**: Vault path restructured (e.g., `secret/data/production/app` → `secret/data/production/laravel-app`). All applications lose their config reference until code is updated.

---

# Related Knowledge Units

- Prerequisites: .env management and APP_KEY, Environment configuration
- Related: Zero-downtime key rotation (Locksmith), Envelope encryption DEK/KEK (Sealcraft)
- Advanced Follow-up: Vault AppRole setup for Laravel, Vault Agent sidecar injection, Vault KV v1 vs v2 path differences

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
