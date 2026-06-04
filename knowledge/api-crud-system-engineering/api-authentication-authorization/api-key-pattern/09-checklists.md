# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** API Key Pattern
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] API Key Pattern implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for API Key Pattern
- [ ] Full test coverage for API Key Pattern
- [ ] Security review completed for API Key Pattern
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for API Key Pattern

---

# Architecture Checklist

- [ ] Place API key authentication in a dedicated middleware that runs before rate limiting.
- [ ] Use a custom guard for API key auth, registered in `config/auth.php`.
- [ ] Store keys in a separate `api_keys` table with columns: `prefix`, `key_hash`, `name`, `service_name`, `environment`, `permissions` (JSON), `expires_at`, `last_used_at`.
- [ ] Index `prefix` and `key_hash` columns. Prefix-based filtering reduces scan set.
- [ ] Cache key-to-service mappings in Redis for high-throughput systems.
- [ ] Evaluate: Dedicated api_keys Table vs Sanctum personal_access_tokens
- [ ] Evaluate: SHA-256 vs bcrypt for Key Hashing
- [ ] Evaluate: Header vs URL Parameter for Key Transmission

---

# Implementation Checklist

- [ ] Keys generated with cryptographically secure random
- [ ] Keys hashed in database (bcrypt or SHA-256)
- [ ] Plaintext key returned only at creation
- [ ] Key prefix for identification
- [ ] Middleware hashes incoming key, looks up hash
- [ ] Key metadata (name, permissions, expiration) stored
- [ ] Key rotation with grace period before revocation
- [ ] Key revocation sets `revoked_at`
- [ ] Key expiration checked per request
- [ ] Key usage events logged
- [ ] Implement API Key Pattern following api-authentication-authorization patterns
- [ ] Configure all required settings for API Key Pattern
- [ ] Register route/middleware/service for API Key Pattern
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Hash lookup costs: one indexed query per request (negligible).
- [ ] Redis caching of key-to-service mappings reduces DB load for repeated keys.
- [ ] Key generation is a one-time cost â€” negligible.
- [ ] For high-throughput M2M APIs, use HMAC signed requests instead of static API keys.

---

# Security Checklist

- [ ] Plain-text key storage in database is the most common critical vulnerability. Always hash.
- [ ] Low-entropy keys (`str_random(16)`) can be brute-forced. Use `Str::random(64)` minimum.
- [ ] URL query parameter transmission exposes keys in server logs and referrer headers. Use `Authorization: Bearer` or `X-API-Key` header.
- [ ] Keys embedded in mobile app binaries can be extracted. Never embed secrets in client apps.
- [ ] Orphaned keys from departed developers create persistent attack surfaces. Implement automatic expiration tied to account status.
- [ ] Hardcoded keys in source code are a version control leak risk. Use environment variables or a secrets manager.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of API Key Pattern
- [ ] Write feature tests for validation failure of API Key Pattern
- [ ] Write feature tests for authentication failure of API Key Pattern
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Use Dedicated api_keys Table
- Generate With 256-Bit Entropy Minimum
- Hash With SHA-256, Never Store Plain Text
- Use Prefix for Efficient Lookup
- Transmit in Header Only, Never URL
- Scope Keys by Environment
- Display Plain-Text Key Once Only
- ## Category
- Support Concurrent Key Versions During Rotation
- Dedicated Middleware Placed Before Rate Limiting
- Use Custom Guard for API Key Auth
- Rate Limit by API Key for Service-Level Throttling

### Decisions
- Dedicated api_keys Table vs Sanctum personal_access_tokens
- SHA-256 vs bcrypt for Key Hashing
- Header vs URL Parameter for Key Transmission

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



