# Metadata

Domain: Security & Identity Engineering
Subdomain: Secrets Management
Knowledge Unit: Secrets scanning and detection tools
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Secrets scanning tools detect hardcoded credentials, API keys, tokens, and private keys in source code before they reach production. Laravel-specific tools like `Laravel-Shield` scan for weak APP_KEY, exposed `.env` files, hardcoded database passwords, and configuration leaks. General-purpose tools (GitHub Secret Scanning, `trufflehog`, `ggshield`, `detect-secrets`) scan all file types. The primary defense is pre-commit hooks and CI pipeline scanning — catch secrets before they enter the repository history.

---

# Core Concepts

- **Entropy Detection**: High-entropy strings (random-looking) are flagged as potential secrets. SHA-256 hashes, base64 tokens, and API keys have high entropy.
- **Pattern Matching**: Known patterns (`sk_live_*` for Stripe, `ghp_*` for GitHub, `AKIA*` for AWS) match against regex patterns for different services.
- **Laravel-Shield**: CLI tool specifically for Laravel. Scans for: weak APP_KEY, exposed .env, debug mode enabled, hardcoded credentials, misconfigured sessions, composer security advisories.
- **False Positive Management**: Secrets scanners generate false positives (test keys, example values, documentation). Use inline comments (`# pragma: allowlist secret`) or `.gitignore`-style exclusion files.

---

# Mental Models

- **Secret as Liability**: Every hardcoded secret is a liability. If it reaches a repository, assume it is compromised. Rotate any secret that was ever committed.
- **Shift Left, Scan Early**: The earlier a secret is detected (pre-commit > CI > post-merge > production), the less damage it causes.

---

# Patterns

## Pre-Commit Hook Pattern
- **Implementation**: `lefthook` or `husky` + `ggshield` or `trufflehog`. Runs on `pre-commit`. Blocks the commit if secrets are detected.
- **Benefits**: Secrets never enter the local repository.
- **Tradeoffs**: Developers can bypass with `--no-verify`. Must be paired with CI scanning as backup.

## CI Pipeline Secrets Scan Pattern
- **Implementation**: GitHub Action `secret_scanning` or `trufflehog` run on PR pushes. Fails the CI if secrets detected.
- **Benefits**: Catches secrets missed by pre-commit hooks.
- **Tradeoffs**: Secret has already been pushed to the remote branch (even if not merged). Rotate the secret.

## Nightly Full Repository Scan Pattern
- **Implementation**: Scheduled CI job scanning the entire repository history with `trufflehog --since-commit HEAD~1000`.
- **Benefits**: Catches historical secrets (accidentally committed in the past).
- **Tradeoffs**: Historical secrets in git history are already compromised — rotate them regardless.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Laravel-Shield vs general scanner | Laravel-specific vs multi-language | Both. Laravel-Shield for framework-specific checks; general scanner for API key patterns |
| Pre-commit vs CI only | Developer experience vs security | Pre-commit for immediate feedback; CI as enforcement layer |
| Full history scan vs current commit | Historical vs active scanning | Current commit scan on every push; full history scan weekly |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Pre-commit hooks catch secrets before git history | Adds latency to every commit (1-3 seconds per scan) | Developers may disable hooks if latency is too high |
| CI scanning catches everything | Secret was already pushed to remote (even if not merged) | Rotation required after CI detection — increased operational overhead |
| Automated scanning reduces human error | False positives require manual review | Teams tired of false positives may ignore scanner output |

---

# Production Considerations

- **Rate Limiting**: Some scanning APIs (GitHub secret scanning API, trufflehog cloud) have rate limits. Batch scans accordingly.
- **Secret Rotation Protocol**: Define a protocol for when a secret is detected in CI: (1) rotate the secret, (2) remove it from history (BFG Repo-Cleaner), (3) document the incident.
- **Laravel-Shield CI Integration**: `php artisan shield:scan` exits with non-zero if issues found. Integrate into CI pipeline for Laravel-specific checks.
- **.env Scanning**: `.env` should never be committed. Add to `.gitignore` and use `.env.example`. Scan for `.env` files in commits.

---

# Common Mistakes

- **Relying only on one scanning tool**: No single tool catches all patterns. Use multiple scanners (Laravel-Shield + trufflehog + GitHub secret scanning).
- **Ignoring pre-commit failures**: Developers bypass hooks with `--no-verify` or `git commit --no-verify`. CI must catch what pre-commit misses.
- **Not rotating secrets after detection**: Finding a secret in a commit but not rotating it is worse than not scanning — you know it's exposed but don't act.
- **False positives drowned by noise**: If 90% of scanner results are false positives, the 10% true positives get ignored. Tune exclusions carefully.

---

# Failure Modes

- **Scanner Not Installed**: Pre-commit hook relies on a package that is not installed on the developer's machine. The hook silently fails or is skipped. CI should have its own scan.
- **Token in .env.example**: `.env.example` with real tokens committed to the repository. The template file looks innocent but contains production secrets.
- **Scanner Vulnerability**: A scanning tool with a vulnerability in its parser can be exploited by a crafted file to bypass the scan or crash the scanner. Keep scanners updated.

---

# Related Knowledge Units

- Prerequisites: .env management and APP_KEY, Dependency security (composer audit)
- Related: Server header removal and hardening, Enlightn static/dynamic security analysis
- Advanced Follow-up: CI/CD secret scanning pipeline setup, Historical secret removal with BFG Repo-Cleaner, Machine learning-based secret detection

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

## Performance Considerations

- **Authentication overhead**: Each authentication request adds 5-50ms for credential verification, session creation, and token generation. Cache session data in Redis to reduce database load.
- **Authorization check cost**: Policy and gate checks execute on every request. Policy auto-discovery adds negligible overhead (cached after first resolution). For high-throughput endpoints, cache permission results with user-based cache keys.
- **Encryption performance**: Encryption/decryption operations add 0.1-2ms per field. For high-throughput APIs, encrypt only sensitive fields rather than entire payloads.
- **Rate limiting overhead**: In-memory rate limiting (Cache::driver('array')) is faster than Redis-backed limiting. Use Redis-based limiting for distributed deployments; array-based for single-server setups.
- **Session storage**: File-based sessions degrade under high concurrency. Use Redis or database sessions for production deployments with multiple web servers.
- **Header processing**: Security headers (CSP, HSTS, etc.) are set once per response and add negligible overhead. However, CSP policy size affects browser parsing time. Keep CSP directives focused on actual requirements.
