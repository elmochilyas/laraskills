# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Idempotency Key Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Idempotency Key Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Idempotency Key Testing
- [ ] Full test coverage for Idempotency Key Testing
- [ ] Security review completed for Idempotency Key Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Idempotency Key Testing

---

# Architecture Checklist

- [ ] Idempotency implementation can be middleware-based (transparent to controllers) or controller-based (explicit checking).
- [ ] Middleware-based is preferred â€” all idempotent endpoints automatically get the behavior, tests validate through HTTP.
- [ ] Cache TTL is a business decision: too short (minutes) defeats retry purposes, too long (days) fills the cache.
- [ ] For race condition protection, consider database-backed idempotency with unique constraints (stronger than cache locks).

---

# Implementation Checklist

- [ ] First request processes and returns
- [ ] Second request returns cached response
- [ ] Idempotent-Replayed header on replay
- [ ] Concurrent request returns 409
- [ ] Invalid key format returns 422
- [ ] Missing key processes normally
- [ ] Expired key creates new processing
- [ ] Implement Idempotency Key Testing following api-testing patterns
- [ ] Configure all required settings for Idempotency Key Testing
- [ ] Register route/middleware/service for Idempotency Key Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Idempotency tests, like rate-limit tests, require sequential requests sharing state.
- [ ] Use `Cache::store('file')->flush()` between tests.
- [ ] Tests with TTL expiry need clock manipulation (`Carbon::setTestNow()`).
- [ ] Batch idempotency scenarios (first request, retry, different key) into one test method to minimize kernel boots.

---

# Security Checklist

- [ ] Idempotency keys prevent duplicate financial transactions â€” this is correctness-critical.
- [ ] Idempotency keys must be logged without exposing PII (avoid logging user email or ID in key).
- [ ] Implement cleanup jobs for expired keys to prevent cache bloat.
- [ ] Test that idempotency middleware doesn't bypass authentication/authorization checks.
- [ ] Ensure stored responses don't contain sensitive data that shouldn't be cached.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] First request with idempotency key executes and stores response
- [ ] Retry with same key returns cached response without duplicate operation
- [ ] Different key with same payload creates a second record
- [ ] Expired keys are treated as new requests
- [ ] Missing key executes normally (no idempotency applied)
- [ ] Invalid key format returns validation error
- [ ] Database has exactly one record after idempotent retry (deduplication verified)
- [ ] Write feature tests for happy path of Idempotency Key Testing
- [ ] Write feature tests for validation failure of Idempotency Key Testing
- [ ] Write feature tests for authentication failure of Idempotency Key Testing
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
- Test First Request Then Identical Retry
- Verify No Duplicate Operation On Retry
- Test Different Key For Different Operation
- Test Missing And Invalid Key Formats
- Use Persistent Cache Driver

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



