# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Sanctum Token Auth
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sanctum Token Auth implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Sanctum Token Auth
- [ ] Full test coverage for Sanctum Token Auth
- [ ] Security review completed for Sanctum Token Auth
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sanctum Token Auth

---

# Architecture Checklist

- [ ] Sanctum is pre-installed in Laravel 11+. No additional installation needed.
- [ ] The `personal_access_tokens` table needs indexes on `tokenable_id`, `tokenable_type`, and `token`.
- [ ] For millions of tokens, consider partitioning by `tokenable_type`.
- [ ] Sanctum's `ID|secret` format enables efficient lookup â€” do not modify the storage format.
- [ ] Token abilities are checked via `$user->tokenCan('ability')` or the `abilities` middleware.
- [ ] Evaluate: Token Ability Granularity â€” Scope-Based vs Resource-Based
- [ ] Evaluate: Token Expiration Strategy â€” Short-Lived vs Long-Lived
- [ ] Evaluate: Per-User Token Limits â€” Enforce vs Allow Unlimited

---

# Implementation Checklist

- [ ] `HasApiTokens` trait added to User model
- [ ] API guard configured for Sanctum in `config/auth.php`
- [ ] Login endpoint generates and returns token
- [ ] Protected routes use `auth:sanctum` middleware
- [ ] Token ability middleware applied for scoped access
- [ ] Logout endpoint revokes current token
- [ ] Tests use `Sanctum::actingAs()` for auth simulation
- [ ] Token expiration configured
- [ ] Token names used for identification, not authorization
- [ ] Plaintext token returned once on creation
- [ ] Implement Sanctum Token Auth following api-authentication-authorization patterns
- [ ] Configure all required settings for Sanctum Token Auth
- [ ] Register route/middleware/service for Sanctum Token Auth
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Token lookup by ID is an integer primary key query â€” O(1), very fast.
- [ ] `in_array()` ability check on a small JSON array is sub-millisecond.
- [ ] `last_used_at` updates on every request. For high-traffic APIs, debounce to every Nth request.
- [ ] Token cleanup via `sanctum:prune-expired` prevents table bloat.

---

# Security Checklist

- [ ] **Token in logs**: A single debug log of headers can leak the plain-text token. Implement log scrubbing for `Authorization` headers.
- [ ] **Token limits**: Unbounded token creation enables credential stuffing. Enforce per-user limits.
- [ ] **Revoke on breach**: Provide `/api/revoke-all-tokens` endpoint for users to invalidate all sessions.
- [ ] **No built-in expiration**: Sanctum does not check `expires_at`. Implement custom middleware for TTL enforcement.
- [ ] **`tokenCan()` returns false for no abilities**: Always assign at least one ability to avoid confusing 403 responses.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Sanctum Token Auth
- [ ] Write feature tests for validation failure of Sanctum Token Auth
- [ ] Write feature tests for authentication failure of Sanctum Token Auth
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
- Display Plain-Text Token Exactly Once at Creation
- Always Assign at Least One Ability on Token Creation
- Enforce Per-User Token Limits
- Schedule sanctum:prune-expired for Regular Cleanup
- Implement Custom Expiration Checking Middleware
- Log Scrubbing for Authorization Headers
- Issue Separate Tokens Per Device
- Provide Revocation UI for Users
- Use Meaningful Token Names for Audit
- Debounce last_used_at Updates for High-Traffic APIs

### Decisions
- Token Ability Granularity â€” Scope-Based vs Resource-Based
- Token Expiration Strategy â€” Short-Lived vs Long-Lived
- Per-User Token Limits â€” Enforce vs Allow Unlimited

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



