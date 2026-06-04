# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Signed Request Pattern
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Signed Request Pattern implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Signed Request Pattern
- [ ] Full test coverage for Signed Request Pattern
- [ ] Security review completed for Signed Request Pattern
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Signed Request Pattern

---

# Architecture Checklist

- [ ] Validation runs as middleware before the controller.
- [ ] Store shared secrets encrypted at rest. Use a secrets manager (Vault, AWS Secrets Manager) for production.
- [ ] Key versioning in signature: include key ID in headers so receiver knows which secret to use.
- [ ] For high-volume systems, use Bloom filter for efficient nonce deduplication.
- [ ] Laravel's `URL::signedRoute()` uses this pattern â€” reference implementation for one-time URLs.
- [ ] Evaluate: HMAC vs Bearer Token for M2M Authentication
- [ ] Evaluate: Timestamp Window Size for Replay Protection
- [ ] Evaluate: Nonce Storage Strategy â€” Redis vs Database

---

# Implementation Checklist

- [ ] HMAC-SHA256 used for signature generation
- [ ] `hash_equals()` for constant-time comparison
- [ ] Expiration timestamp in signed URL
- [ ] Nonce for one-time use URLs where needed
- [ ] Laravel `signedRoute()` used or custom implementation
- [ ] Invalid signature returns 403
- [ ] Expired URL returns 410
- [ ] Replayed nonce returns 409
- [ ] Invalid signature attempts logged
- [ ] Tests verify valid, invalid, expired, and replayed scenarios
- [ ] Implement Signed Request Pattern following api-authentication-authorization patterns
- [ ] Configure all required settings for Signed Request Pattern
- [ ] Register route/middleware/service for Signed Request Pattern
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] HMAC computation is microseconds. No database lookup for token validation.
- [ ] Nonce deduplication requires one Redis call per request. Use pipelining for batch operations.
- [ ] SHA-256 of large payloads (1MB+) is CPU-bound. For very large payloads, sign only specific fields.
- [ ] Constant-time comparison adds no measurable overhead.

---

# Security Checklist

- [ ] **Non-constant-time comparison** (`==` instead of `hash_equals()`): Vulnerable to timing attacks. Always use `hash_equals()`.
- [ ] **Missing body hash**: Attacker can modify body without changing signature.
- [ ] **Missing method in canonical string**: Attacker changes GET to DELETE.
- [ ] **Nonce reuse**: Defeats replay protection entirely.
- [ ] **Timestamp window too large** (>15 minutes): Allows replay attacks within that window.
- [ ] **Clock skew**: Sender/receiver clocks must be NTP-synced. 5-minute tolerance handles most skew.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Signed Request Pattern
- [ ] Write feature tests for validation failure of Signed Request Pattern
- [ ] Write feature tests for authentication failure of Signed Request Pattern
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
- Always Use hash_equals() for Signature Comparison
- Include Method, URI, Body Hash, Timestamp, and Nonce in Signature
- Enforce a 5-Minute Maximum Timestamp Window
- Implement Nonce Deduplication with Redis TTL
- Accept Two Active Secrets During Rotation
- Return Signature Error Headers for Debugging
- Never Use Signed Requests for Browser-Based Clients
- Canonicalize the Body Before Signing
- Use hash_hmac(), Never Custom HMAC Implementation
- Run Signature Validation Before Controller Logic

### Decisions
- HMAC vs Bearer Token for M2M Authentication
- Timestamp Window Size for Replay Protection
- Nonce Storage Strategy â€” Redis vs Database

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



