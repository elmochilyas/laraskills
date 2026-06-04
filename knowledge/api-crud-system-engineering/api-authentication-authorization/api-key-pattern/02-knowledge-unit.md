# API Key Pattern

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
API keys are long-lived, static credentials used for machine-to-machine (M2M) authentication. Unlike user tokens tied to individual accounts, API keys identify an application, service, or team rather than a person. They are generated once, stored as hashed values, sent via `Authorization: Bearer` or a custom header (e.g., `X-API-Key`), and typically have broader permissions than user tokens. The API key pattern is essential for CI/CD pipelines, webhook callbacks, third-party integrations, and internal service communication where interactive login is not possible.

## Core Concepts
- **API Key as service identity**: The key identifies the calling application, not a specific user. The application may act on behalf of a user or on its own behalf.
- **Key generation**: Cryptographically random string with enough entropy to prevent brute force. Minimum 32 bytes (256 bits) recommended.
- **Key hashing**: The plain-text key is shown once at creation. The stored value is a hash (bcrypt, SHA-256, or HMAC). On each request, the provided key is hashed and compared.
- **Prefix for identification**: A key prefix (e.g., `sk_live_`, `sk_test_`) identifies the key type and environment without revealing the full key.
- **Key metadata**: Store owner, description, environment, permissions, and expiration alongside the key hash for management purposes.

## Mental Models
- **API key as service account**: Like a Unix service account — not a person, but an identity that can perform actions.
- **Key as lock combination**: You get the combination once. If someone else learns it, you change the lock. You can have multiple locks (keys) for different doors.
- **Prefix as keychain tag**: Prefixes help organize keys without revealing the secret: `prod_`, `staging_`, `dev_`, `test_`.

## Internal Mechanics
- A typical API key structure: `<prefix>_<base62-random>`.
- Generation: `random_bytes(32)` → `bin2hex()` or `Base62::encode()`.
- Storage: hash the key with `hash('sha256', $key)` and store the hash. Store prefix separately.
- Lookup: extract prefix → find candidates with that prefix → hash incoming key → compare against stored hashes.
- Sanctum token storage (by default) differs: `ID|secret` format with SHA-256 hashing. For API keys, a custom model is often preferred to separate concerns from user tokens.

## Patterns
- **Custom `ApiKey` model**: Create a separate `api_keys` table with `id`, `prefix`, `key_hash`, `name`, `service_name`, `environment`, `permissions` (JSON), `expires_at`, `last_used_at`, `created_at`.
- **API Key middleware**: Custom middleware that extracts the key from `X-API-Key` header or `Authorization: Bearer`, looks up the hash, authenticates the service, and sets a custom guard.
- **Key scoping by environment**: `sk_live_*` for production, `sk_test_*` for staging/sandbox. Environment-level scoping prevents accidental production access from staging.
- **Rotation via key versioning**: `sk_v1_abc...`, `sk_v2_def...` — allow both v1 and v2 simultaneously during rotation, then revoke v1.
- **Rate limiting per key**: Use the API key as the rate limiter key: `RateLimiter::for('api-key', fn($key) => Limit::perMinute(100)->by($key))`.
- **Audit logging per key**: Log every request with the `api_key_id` to trace which service/team made the request.

## Architectural Decisions
1. **Separate table vs Sanctum tokens**: API keys should generally use a separate table because their lifecycle and permissions differ from user tokens. A joint table creates confusion between "user acting via token" and "service acting via key."
2. **Hashing algorithm**: SHA-256 is fast and sufficient for key hashing. bcrypt is slower (intentional for passwords) and unnecessary for random keys. Never store keys in plain text.
3. **Key header**: `Authorization: Bearer` is standard for user tokens. `X-API-Key` is common for API keys and avoids confusion. Some APIs accept both and distinguish by format (key prefix).
4. **Key length**: 32 bytes (64 hex chars) minimum. 40-64 bytes (80-128 hex chars) recommended for future-proofing.

## Tradeoffs (table)
| Aspect | Sanctum User Token | Custom API Key |
|--------|-------------------|----------------|
| Identity | User | Service/Application |
| Lifetime | Short (configurable) | Long (months/years) |
| Rotation | Refresh endpoint | Manual or via key versioning |
| Storage table | `personal_access_tokens` | `api_keys` (separate) |
| Header | `Authorization: Bearer` | `X-API-Key` |
| Rate limiting | By token or user ID | By key |
| Audit scope | Per user | Per service |

## Performance Considerations
- Hash lookup requires scanning the `api_keys` table (or filtered by prefix). Index the `prefix` and `key_hash` columns.
- Prefix-based filtering reduces the scan set: `WHERE prefix = ? AND key_hash = ?`.
- For high-throughput systems, cache the key-to-service mapping in Redis: `SET api_key:{hash} => service_id EXPIRY 3600`.
- Key generation is a one-time cost (cryptographically random bytes) — negligible.

## Production Considerations
- **Key creation UI**: Provide an interface for users to generate, name, and scope API keys. Show the plain-text key exactly once with a warning to copy it.
- **Key revocation**: Immediate. Delete the key record or set `revoked_at`. Wait for active requests to complete before revoking.
- **Usage monitoring**: Track `last_used_at` and total request count per key. Alert on unused keys (potential security risk) or overused keys (rate limit hits).
- **Key limit per service**: Enforce a maximum number of keys per service/team to prevent key sprawl.
- **Scheduled audit**: Monthly review of active API keys. Expire keys not used in 90+ days.
- **Breach response**: Have a `php artisan api-keys:regenerate-all` command ready for emergency key rotation.

## Common Mistakes
- Storing API keys in plain text in the database.
- Generating keys with low entropy (`str_random(16)` is too short; use `Str::random(64)` at minimum).
- Using the same key across environments (dev keys can access production data).
- Not including an `environment` column, making environment scoping impossible.
- Sending API keys in URL query parameters (logged by proxies, exposed in referrer headers).
- Key rotation without a grace period — the old key stops working immediately, breaking the client.
- Hardcoding API keys in source code (use environment variables or a secrets manager).

## Failure Modes
1. **Key leaked via Git history**: A key was committed to a public repo. Solution: Revoke the key, regenerate, add to `.gitignore`, and use a secret scanner (Gitleaks, TruffleHog).
2. **Key brute-forced**: Short keys with low entropy are guessed. Solution: Use 256-bit random keys. Rate-limit authentication attempts per IP.
3. **Key shared among team members**: No accountability for who made which request. Solution: Issue individual keys per developer/service.
4. **Orphaned keys**: A developer leaves the team, their API key is still active. Solution: Automatically expire keys tied to deactivated accounts.
5. **Key in mobile app binary**: A client-side API key is extracted from the app bundle. Solution: Don't embed API keys in mobile apps. Use a backend proxy or user-specific tokens.

## Ecosystem Usage
- **Stripe API Keys**: `sk_live_...`, `pk_live_...`. Separate keys for secret and publishable usage. Environment-specific prefixes.
- **GitHub Personal Access Tokens (Classic)**: `ghp_...`. Fine-grained PATs use `github_pat_...`.
- **OpenAI API Keys**: `sk-...`. Keys are tied to organization accounts.
- **AWS Access Keys**: `AKIA...` (access key ID) + secret access key. Prefix identifies the key type and region.

## Related Knowledge Units
### Prerequisites
- Token-based authentication concepts
- Cryptographic hashing fundamentals

### Related Topics
- [sanctum-token-auth](./phase-2/03-sanctum-token-auth.md)
- [signed-request-pattern](./phase-2/07-signed-request-pattern.md)
- [rate-limiting-by-auth-tier](./phase-2/09-rate-limiting-by-auth-tier.md)

### Advanced Follow-up Topics
- Secrets management (Vault, AWS Secrets Manager)
- mTLS as an alternative to API keys for M2M auth
- Dynamic client registration (DCR) protocols

## Research Notes
### Source Analysis
Stripe's API key documentation and GitHub's token format are de facto industry references for API key design patterns. The prefix-based approach for key identification is widely adopted.

### Key Insight
The most important decision in API key design is the separation between "who" (identity) and "what they can do" (permissions). API keys should map to a service account or application identity, with permissions defined separately — not encoded in the key itself. This enables permission changes without key rotation.

### Version-Specific Notes
- Sanctum does not natively support API keys as a separate concept. Use a custom implementation for production API key management.
- Laravel 11+ recommends custom guards for API key authentication.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.