# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** CORS Configuration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] CORS Configuration implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for CORS Configuration
- [ ] Full test coverage for CORS Configuration
- [ ] Security review completed for CORS Configuration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for CORS Configuration

---

# Architecture Checklist

- [ ] Place `HandleCors` middleware early in the global stack, before authentication middleware.
- [ ] Use `config/cors.php` for standard setups. For per-route CORS policies, apply different middleware groups.
- [ ] For Sanctum SPA mode: set `supports_credentials: true`, explicit origins matching `SANCTUM_STATEFUL_DOMAINS`, and include `X-CSRF-TOKEN` in allowed headers.
- [ ] Set `Vary: Origin` header (Laravel's CORS middleware includes this automatically).
- [ ] Evaluate: Origin Strategy â€” Explicit Whitelist vs Dynamic Origin Matching
- [ ] Evaluate: CORS Layer â€” Laravel Middleware vs Reverse Proxy
- [ ] Evaluate: Credentialed vs Non-Credentialed CORS Mode
- [ ] Evaluate: Preflight Max-Age Duration

---

# Implementation Checklist

- [ ] Specific origins configured â€” not `*`
- [ ] GET, POST, PUT, PATCH, DELETE, OPTIONS allowed
- [ ] Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN in allowed headers
- [ ] X-RateLimit-Remaining, X-Api-Version, Link in exposed headers
- [ ] `supports_credentials: true` configured
- [ ] Preflight max age set to 86400
- [ ] CORS middleware applied to API group
- [ ] OPTIONS responses return correct headers per origin
- [ ] All responses include CORS headers (Access-Control-Allow-Origin)
- [ ] Environment-specific CORS configuration (stricter in production)
- [ ] Implement CORS Configuration following api-authentication-authorization patterns
- [ ] Configure all required settings for CORS Configuration
- [ ] Register route/middleware/service for CORS Configuration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] OPTIONS preflight requests do not reach controllers â€” Laravel's CORS middleware returns early.
- [ ] Preflight caching at 24 hours means one OPTIONS request per origin per day.
- [ ] Dynamic origin matching adds overhead. Pre-compute and cache allowed origins if using closures.
- [ ] No database queries in CORS middleware. Keep origin matching efficient.

---

# Security Checklist

- [ ] `Access-Control-Allow-Origin: *` + credentials = browser rejects the request. Always use explicit origins with credentials.
- [ ] `Access-Control-Allow-Origin: null` is disallowed by browsers. Use the exact origin.
- [ ] Trailing slash in origins (`https://app.example.com/`) is invalid. Origins do not include paths.
- [ ] CORS does not protect the API from malicious requests â€” it only restricts browser-based access.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of CORS Configuration
- [ ] Write feature tests for validation failure of CORS Configuration
- [ ] Write feature tests for authentication failure of CORS Configuration
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
- Never Use Wildcard Origin with Credentials
- Whitelist Explicit Origins in Production
- Include Authorization and Content-Type in Allowed Headers
- Include OPTIONS in Allowed Methods
- Set Access-Control-Max-Age to 86400 in Production
- Expose Rate Limit Headers via CORS
- Handle CORS in One Layer Only
- Set Vary: Origin Header
- Never Use Trailing Slash in Origins

### Decisions
- Origin Strategy â€” Explicit Whitelist vs Dynamic Origin Matching
- CORS Layer â€” Laravel Middleware vs Reverse Proxy
- Credentialed vs Non-Credentialed CORS Mode
- Preflight Max-Age Duration

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



