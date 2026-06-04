# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Token Expiration & Rotation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Token Expiration & Rotation implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Token Expiration & Rotation
- [ ] Full test coverage for Token Expiration & Rotation
- [ ] Security review completed for Token Expiration & Rotation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Token Expiration & Rotation

---

# Architecture Checklist

- [ ] Sanctum's database schema includes `expires_at` but it's unchecked by default. Implement checking middleware.
- [ ] For refresh: create new token â†’ revoke old token â†’ return new plainTextToken. Atomic transaction recommended.
- [ ] Allow old and new tokens to coexist for 5-minute handover period to prevent race conditions.
- [ ] Log token creation and revocation for audit trail.
- [ ] Document TTL per token type in API reference.
- [ ] Evaluate: Token TTL by Ability Sensitivity â€” Short vs Long
- [ ] Evaluate: Rotation Strategy on Sensitive Actions
- [ ] Evaluate: Grace Period During Token Rotation

---

# Implementation Checklist

- [ ] Default token expiration set in config
- [ ] Long-lived tokens created without expiration
- [ ] Short-lived tokens with expires_at parameter
- [ ] Token rotation on password change implemented
- [ ] Token rotation on sensitive actions implemented
- [ ] Refresh endpoint implemented or not needed
- [ ] `sanctum:prune-expired` scheduled in Kernel
- [ ] Token creation and revocation logged
- [ ] User notified on suspicious token activity
- [ ] Tests verify token expiry and rotation behavior
- [ ] Implement Token Expiration & Rotation following api-authentication-authorization patterns
- [ ] Configure all required settings for Token Expiration & Rotation
- [ ] Register route/middleware/service for Token Expiration & Rotation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Checking `expires_at` is one column comparison â€” negligible.
- [ ] Token rotation creates one DB record + deletes one â€” lightweight.
- [ ] Frequent rotation increases `personal_access_tokens` table size â€” batch cleanup essential.
- [ ] `last_used_at` updates on every request. Debounce to every Nth request for high-traffic APIs.

---

# Security Checklist

- [ ] **Sanctum ignores `expires_at`**: The column exists but is not checked. Implementation is on you.
- [ ] **Rotation without old token revocation**: Both tokens valid, creating double the exposure.
- [ ] **Clock skew**: Server A issues token with `expires_at=T+3600`. Server B (5 min ahead) rejects early. Use 30-second tolerance.
- [ ] **Refresh endpoint not rate-limited**: Attacker with valid token can hammer refresh.
- [ ] **Emergency revocation**: Provide endpoint/command to immediately expire all tokens for a user or globally.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Token Expiration & Rotation
- [ ] Write feature tests for validation failure of Token Expiration & Rotation
- [ ] Write feature tests for authentication failure of Token Expiration & Rotation
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
- Implement Custom Expiration Middleware for Sanctum
- Set Shorter TTL for Sensitive Abilities
- Always Revoke Old Token During Rotation
- Implement Grace Period for Token Handover
- Rate Limit the Token Refresh Endpoint
- Provide Emergency Token Revocation Endpoint
- Use Atomic Operations for Concurrent Refresh Requests
- Prune Expired Tokens Regularly
- Implement Clock Skew Tolerance of 30 Seconds
- Never Log plainTextToken During Rotation
- Document Token TTLs in API Reference

### Decisions
- Token TTL by Ability Sensitivity â€” Short vs Long
- Rotation Strategy on Sensitive Actions
- Grace Period During Token Rotation

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



