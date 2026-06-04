# ECC Standardized Knowledge — API Key Pattern

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | API Key Pattern |
| Difficulty | Intermediate |
| Category | Authentication |
| Last Updated | 2026-06-02 |

## Overview

API keys are long-lived, static credentials for machine-to-machine authentication that identify a service or application rather than a person. They provide a lightweight authentication mechanism for CI/CD pipelines, webhook callbacks, third-party integrations, and internal service communication where interactive login is impossible. The engineering value lies in enabling programmatic access without human presence while maintaining auditability through key tracking.

## Core Concepts

- **Service identity**: API keys authenticate calling applications, not individual users. The permissions model operates at the service level.
- **Key generation**: Cryptographically random strings with minimum 256 bits of entropy prevent brute force. Laravel's `Str::random(64)` is the baseline.
- **Key hashing**: Plain-text keys are shown once at creation. Stored as SHA-256 hashes. Never store plain-text keys.
- **Prefix-based identification**: Prefixes like `sk_live_`, `sk_test_` enable key type and environment identification without revealing the secret.
- **Separate storage model**: API keys should use a dedicated `api_keys` table rather than Sanctum's `personal_access_tokens` because lifecycle and permission semantics differ from user tokens.

## When To Use

- Service-to-service communication where no user context is needed
- CI/CD pipeline authentication for deployment triggers
- Third-party integrations with your API (partner integrations)
- Webhook callback authentication (incoming webhook verification)
- Sandbox/test environment access for developers

## When NOT To Use

- First-party SPA authentication (use Sanctum SPA cookie auth instead)
- Mobile app authentication (use Sanctum token auth with user context)
- Scenarios requiring fine-grained, per-user authorization (use token abilities + policies)
- Public-facing anonymous access (no auth needed or use rate limiting by IP)
- When OAuth2 compliance is required (use Passport)

## Best Practices

- **Generate with sufficient entropy**: Minimum 32 bytes (64 hex chars) from a cryptographically secure source. `random_bytes(32)` then `bin2hex()`.
- **Prefix for discoverability**: Store prefix separately from hash to allow efficient lookup: `WHERE prefix = ? AND key_hash = ?`.
- **Hash with SHA-256**: Fast and sufficient for random keys. Do not use bcrypt (unnecessary for high-entropy keys).
- **Environment scoping**: Include an `environment` column to prevent staging keys from accessing production.
- **One-time display**: Show the plain-text key exactly once at creation with a copy warning.
- **Rotation with versioning**: Support concurrent key versions (`sk_v1_...`, `sk_v2_...`) during rotation periods.
- **Rate limit per key**: Use the API key as the rate limiter key for service-level throttling.
- **Audit every request**: Log `api_key_id` with every request for traceability.

## Architecture Guidelines

- Place API key authentication in a dedicated middleware that runs before rate limiting.
- Use a custom guard for API key auth, registered in `config/auth.php`.
- Store keys in a separate `api_keys` table with columns: `prefix`, `key_hash`, `name`, `service_name`, `environment`, `permissions` (JSON), `expires_at`, `last_used_at`.
- Index `prefix` and `key_hash` columns. Prefix-based filtering reduces scan set.
- Cache key-to-service mappings in Redis for high-throughput systems.

## Performance Considerations

- Hash lookup costs: one indexed query per request (negligible).
- Redis caching of key-to-service mappings reduces DB load for repeated keys.
- Key generation is a one-time cost — negligible.
- For high-throughput M2M APIs, use HMAC signed requests instead of static API keys.

## Security Considerations

- Plain-text key storage in database is the most common critical vulnerability. Always hash.
- Low-entropy keys (`str_random(16)`) can be brute-forced. Use `Str::random(64)` minimum.
- URL query parameter transmission exposes keys in server logs and referrer headers. Use `Authorization: Bearer` or `X-API-Key` header.
- Keys embedded in mobile app binaries can be extracted. Never embed secrets in client apps.
- Orphaned keys from departed developers create persistent attack surfaces. Implement automatic expiration tied to account status.
- Hardcoded keys in source code are a version control leak risk. Use environment variables or a secrets manager.

## Common Mistakes

- **Storing plain-text keys in database**: A single DB leak compromises all keys. Always hash with SHA-256.
- **Insufficient entropy**: `Str::random(16)` produces 128 bits — below the 256-bit minimum. Use `Str::random(64)`.
- **Same key across environments**: Dev keys accidentally accessing production data. Use environment-scoped prefixes.
- **No grace period during rotation**: Old key stops working immediately, breaking clients. Support concurrent key versions.
- **Keys in URL parameters**: Exposed through proxy logs, browser history, and referrer headers. Use header-only transmission.

## Anti-Patterns

- **API key as user identifier**: API keys identify services, not users. For user context, combine with token auth or use signed requests.
- **Encoding permissions in the key itself**: Permission changes require key rotation. Store permissions in a separate column or table.
- **Shared team keys**: No individual accountability. Issue separate keys per developer or service.
- **Unlimited keys per service**: Unbounded key creation leads to key sprawl and forgotten credentials. Enforce a maximum per service.

## Examples

- Custom `ApiKey` model with `ApiKeyMiddleware` that extracts key from `X-API-Key` header, looks up by prefix, hashes the provided secret, and compares against stored hash.
- Rate limiter keyed by API key: `RateLimiter::for('api-key', fn($request) => Limit::perMinute(100)->by($request->header('X-API-Key')))`.

## Related Topics

- **Prerequisites**: Token-based authentication, cryptographic hashing fundamentals
- **Closely Related**: Sanctum Token Auth, Signed Request Pattern, Rate Limiting by Auth Tier
- **Advanced**: Secrets management (Vault, AWS Secrets Manager), mTLS for M2M auth
- **Cross-Domain**: Security & Identity Engineering (authentication provider internals)

## AI Agent Notes

When generating code related to API keys: always use a separate `api_keys` table, hash keys with SHA-256, include prefix-based lookup, generate with minimum 64 characters from cryptographically secure random, never log or display plain-text keys after creation, and include environment scoping.

## Verification

Sources: Stripe API key documentation, GitHub PAT format, Sanctum source code (`vendor/laravel/sanctum/src/HasApiTokens.php`), domain-analysis.md (api-authentication-authorization section).
