# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Idempotency Key Error Handling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Idempotency Key Error Handling implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Idempotency Key Error Handling
- [ ] Full test coverage for Idempotency Key Error Handling
- [ ] Security review completed for Idempotency Key Error Handling
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Idempotency Key Error Handling

---

# Architecture Checklist

- [ ] Custom exception classes per idempotency error type with render() returning structured JSON.
- [ ] Error format: `{ "error": { "code": "IDEMPOTENCY_CONFLICT", "message": "...", "resolution": "..." } }`.
- [ ] Circuit breaker for store unavailable: return 503 with retry guidance; fall back to process-without-idempotency with warning log.
- [ ] Soft-delete store consulted on expired key lookups to provide better error messages.

---

# Implementation Checklist

- [ ] Unique error codes per idempotency failure scenario
- [ ] Semantic HTTP status codes (409 conflict, 422 invalid, 503 store down)
- [ ] Retry-After header on CONCURRENT_REQUEST_LOCK responses
- [ ] No stored payload leaked in conflict responses
- [ ] Resolution field in every error response
- [ ] Only key prefixes logged, never full keys
- [ ] Warning header for near-expiry keys
- [ ] Implement Idempotency Key Error Handling following api-lifecycle-governance patterns
- [ ] Configure all required settings for Idempotency Key Error Handling
- [ ] Register route/middleware/service for Idempotency Key Error Handling
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Error response generation adds no measurable overhead.
- [ ] Concurrent lock handling requires Redis lock check â€” ~2ms per request.
- [ ] Warning header injection on near-expiry keys requires TTL check â€” O(1).

---

# Security Checklist

- [ ] Never include stored request payload in conflict error responses (PII/sensitive data leak).
- [ ] Key prefixes logged, not full keys, for PII reasons.
- [ ] Error messages must not reveal internal implementation details or store topology.
- [ ] Rate limit idempotency error responses to prevent abuse-driven log flooding.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Idempotency Key Error Handling
- [ ] Write feature tests for validation failure of Idempotency Key Error Handling
- [ ] Write feature tests for authentication failure of Idempotency Key Error Handling
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
- Rule 1: Return Unique Error Codes Per Idempotency Scenario
- Rule 2: Use HTTP 409 for Payload Conflicts, 422 for Validation Errors
- Rule 3: Include Retry-After Header on Concurrent Lock Responses
- Rule 4: Never Include Stored Payload in Conflict Error Responses
- Rule 5: Provide Resolution Steps in Every Error Response
- Rule 6: Log Key Prefixes, Not Full Keys
- Rule 7: Add Warning Header for Near-Expiry Keys

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



