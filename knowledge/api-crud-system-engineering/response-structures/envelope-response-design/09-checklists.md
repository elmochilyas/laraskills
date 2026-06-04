# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Envelope Response Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Envelope Response Design implementation follows response-structures patterns
- [ ] All edge cases handled for Envelope Response Design
- [ ] Full test coverage for Envelope Response Design
- [ ] Security review completed for Envelope Response Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Envelope Response Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Wrap all responses at the same architectural layer â€” middleware or a base response class â€” not per-controller.
- [ ] Paginated collections automatically get `meta` and `links`. Ensure non-paginated collections also have consistent structure.
- [ ] For 204 No Content, omit the envelope body entirely (correct HTTP semantics) rather than returning `{data: null}`.
- [ ] When using `withoutWrapping()`, verify it does not silently disable the envelope for some endpoints while leaving it for others.
- [ ] Envelope versioning via Accept header or URL prefix enables evolving the outer contract without breaking existing clients.
- [ ] Evaluate: Envelope vs Bare-Body Selection
- [ ] Evaluate: Envelope Application Layer
- [ ] Evaluate: Envelope Stability and Versioning

---

# Implementation Checklist

- [ ] All 200/201 responses have top-level `data` key (or chosen wrapper)
- [ ] All 4xx/5xx responses have `errors` key with consistent structure
- [ ] Paginated collections include both `meta` and `links`
- [ ] No raw arrays returned from controllers
- [ ] DELETE responses are 204 No Content without body
- [ ] Envelope applied at centralized layer (not per-controller)
- [ ] `additional()` used only for resource-specific data
- [ ] No sensitive data in `meta` fields
- [ ] Integration tests assert envelope shape
- [ ] Implement Envelope Response Design following response-structures patterns
- [ ] Configure all required settings for Envelope Response Design
- [ ] Register route/middleware/service for Envelope Response Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Envelope assembly adds negligible CPU overhead per request.
- [ ] Wrapper keys add 15-30% payload size overhead vs bare-body responses.
- [ ] Pagination metadata computation (especially `total` and `last_page`) dominates envelope response time â€” use cursor pagination when count queries are expensive.
- [ ] Cache granularity is coarser with envelopes â€” any envelope change invalidates the entire cached response.

---

# Security Checklist

- [ ] Never include sensitive data (tokens, internal IDs, debug output) in `meta`. Meta fields are serialized to clients.
- [ ] Ensure error envelopes never include stack traces, SQL queries, or file paths in production.
- [ ] `meta` fields like `can.update`, `can.delete` expose authorization state â€” ensure they match actual server-side policy.
- [ ] Request IDs in `meta` enable log correlation without exposing internal identifiers.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every 200/201 response has a top-level `data` key (or the chosen wrapper key).
- [ ] Every 4xx/5xx response has an `errors` key with the same top-level structure.
- [ ] Paginated collections include both `meta` (pagination data) and `links` (navigation URLs).
- [ ] No raw array is returned from any controller (verify with middleware that inspects response structure).
- [ ] Integration tests assert the envelope shape, not just the HTTP status code.
- [ ] Write feature tests for happy path of Envelope Response Design
- [ ] Write feature tests for validation failure of Envelope Response Design
- [ ] Write feature tests for authentication failure of Envelope Response Design
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

- [ ] Avoid: Inconsistent Envelope Structure
- [ ] Avoid: Envelope Without Error Differentiation
- [ ] Avoid: Nested Envelope Overhead
- [ ] Avoid: Envelope with Redundant Information
- [ ] Avoid: Mixed Envelope and Bare Responses

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
- Rule 1: Always Wrap Errors Under the `errors` Key
- Rule 2: Never Return Raw Arrays from Controllers
- Rule 3: Keep the Envelope Shape Stable Across Versions
- Rule 4: Apply Envelope at a Centralized Layer
- Rule 5: Never Include Sensitive Data in `meta`
- Rule 6: Enforce 204 No Content Without an Envelope Body
- Rule 7: Use `additional()` for Resource-Specific Data Only

### Decisions
- Envelope vs Bare-Body Selection
- Envelope Application Layer
- Envelope Stability and Versioning

### Anti-Patterns
- Inconsistent Envelope Structure
- Envelope Without Error Differentiation
- Nested Envelope Overhead
- Envelope with Redundant Information
- Mixed Envelope and Bare Responses

## Related Knowledge
- Prerequisites
- Related
- Advanced



