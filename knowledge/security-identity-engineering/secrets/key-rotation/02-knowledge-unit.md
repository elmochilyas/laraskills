# Metadata

Domain: Security & Identity Engineering
Subdomain: Secrets Management
Knowledge Unit: Zero-downtime key rotation (Locksmith)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

`laravel-locksmith` provides a recipe-based framework for zero-downtime API key rotation. It implements the dual-validity pattern: during rotation, both the old and new keys are accepted (grace period), then the old key is retired. Each "recipe" defines the key storage method, validation logic, and rotation process. Built-in recipes exist for Stripe, Twilio, and other services; custom recipes can be written for any API key pattern. The dual-validity grace period prevents downtime during asynchronous key distribution.

---

# Core Concepts

- **Grace Period**: After rotation, both old and new keys are valid simultaneously during a configurable window (e.g., 1 hour). Allows distributed systems to pick up the new key without immediate synchronization.
- **Recipe**: A class defining the key lifecycle: `getCurrentKeys()` (read valid keys), `rotate()` (generate new key, store, activate), `retire()` (deactivate old keys after grace period).
- **Key Pool**: Some services support multiple keys. The recipe manages which keys are in the pool. Adding a new key to the pool activates it; removing a key deactivates it.
- **Key Versioning**: Each key has a version identifier. The application tracks which version is current and which are in the grace period.

---

# Mental Models

- **Bridge Period**: Think of key rotation like bridge construction — you don't demolish the old bridge until the new one is open and traffic is flowing. The grace period is the overlap where both bridges serve traffic.
- **Recipe as Playbook**: Each recipe is a playbook for rotating a specific service's keys. The same API endpoint, Stripe webhook secret, or AWS IAM key — each has its own rotation recipe.

---

# Patterns

## Dual-Key Grace Period Pattern
- **Purpose**: Rotate keys without service interruption.
- **Implementation**: Recipe stores old and new keys. `rotate()` generates new key. Application checks both keys during `grace_period`. After grace period, `retire()` deactivates old key.
- **Benefits**: Zero downtime. Services calling the API with old keys continue to work.
- **Tradeoffs**: Both keys are valid — if one is compromised, the grace period extends the exposure window.

## Composite Key Pattern
- **Purpose**: Combine key version with the key value.
- **Implementation**: Key format: `{version_id}_{actual_key}`. The application extracts the version, looks up the corresponding secret, and validates.
- **Benefits**: Explicit key versioning — easy to identify which key a client is using.
- **Tradeoffs**: Clients must update their key storage format.

## Scheduled Rotation Pattern
- **Purpose**: Automate key rotation on a schedule.
- **Implementation**: `php artisan locksmith:rotate` in a scheduled task (weekly/monthly). Recipe rotates, grace period overlaps, then retire.
- **Benefits**: Keys are rotated without human intervention.
- **Tradeoffs**: If the new key fails (API doesn't accept it), the old key is still valid during grace period.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Locksmith vs manual rotation | Automated vs one-off manual | Locksmith for any key rotated more than once. Manual for emergency rotations |
| Grace period duration | Fast vs slow key propagation | 1 hour for most services. 24 hours for services with slow CDN propagation (Stripe webhook endpoints) |
| Key storage: DB vs .env vs Vault | Security vs accessibility | Vault for high-security keys; database with encryption for internal service keys; .env for simple deployments |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-downtime key rotation | Grace period doubles the window of key compromise | Minimize grace period; rotate more frequently |
| Recipe framework covers many services | Custom services require custom recipe development | Writing a recipe requires understanding the service's key management API |
| Automated rotation removes human error | No human oversight on each rotation | Add alerting: "key rotated" notification with manual revert option |

---

# Performance Considerations

- Key validation during grace period checks both keys — two comparison operations. Negligible overhead.
- Recipe execution (`rotate()`, `retire()`) adds one-time overhead during the scheduled task. Does not affect request-time performance.

---

# Production Considerations

- **Grace Period Monitoring**: Log which keys are in grace period. Alert if the grace period expires without the old key being retired.
- **Revert Process**: If the new key fails (external API rejects it), the recipe must support reverting to the old key. Have a manual rollback procedure.
- **Key History**: Maintain a key rotation log (who rotated what key, when). Auditable for compliance.
- **Emergency Rotation**: For compromised keys, skip the grace period (immediate rotation). Accept the brief downtime.

---

# Common Mistakes

- **Grace period too short**: 5-minute grace period for a system with cached DNS — old key is invalid before the cache expires. Clients get 401 errors.
- **Not testing the rotation recipe**: First rotation attempt in production fails because the service API changed. Always test rotation in staging.
- **Forgetting to retire the old key**: After the grace period, the old key remains valid indefinitely. Exposure window never closes. Implement an alert for unretired keys.
- **Using grace period for compromised keys**: If a key is known compromised, immediate retirement is required — no grace period.

---

# Failure Modes

- **New Key Rejected by API**: The third-party service rejects the new key (format, permissions, rate limits). Old key still works during grace period. Fix: debug the key, generate a new one, retry rotation.
- **Grace Period Never Ends**: The `retire()` step fails (network error, permission error). Old key stays valid forever. Monitor and alert on retirement failures.
- **Key Pool Exhaustion**: Some services limit the number of active keys. If rotation adds new keys without removing old ones, the pool fills up. Service rejects new key creation.

---

# Related Knowledge Units

- Prerequisites: API key management, .env and APP_KEY management
- Related: HashiCorp Vault integration, Envelope encryption DEK/KEK (Sealcraft), Column-level RSA encryption with key rotation
- Advanced Follow-up: Custom recipe development for internal services, Automated rotation with Vault integration, Key rotation compliance auditing

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
