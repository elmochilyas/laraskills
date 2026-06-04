# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Bare Body Response Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Bare Body Response Design implementation follows response-structures patterns
- [ ] All edge cases handled for Bare Body Response Design
- [ ] Full test coverage for Bare Body Response Design
- [ ] Security review completed for Bare Body Response Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Bare Body Response Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `Resource::withoutWrapping()` on individual resource classes, not globally (Laravel has no global toggle).
- [ ] For collections, return a top-level array or use a minimal wrapper like `{ "items": [...] }` if metadata is needed.
- [ ] In microservice architectures, use bare-body internally and transform to envelope at the API gateway.
- [ ] For error responses, return a consistent JSON structure documented in the API spec.
- [ ] Version bare-body responses via URL prefix or header since the body cannot carry version info.
- [ ] Evaluate: Bare Body vs Envelope Selection
- [ ] Evaluate: Pagination Strategy for Bare-Body Collections
- [ ] Evaluate: Error Response Shape Standardization

---

# Implementation Checklist

- [ ] No `data`/`meta`/`errors` wrapper keys
- [ ] Data returned directly as JSON body
- [ ] Status codes indicate success/failure
- [ ] Content-Type header present
- [ ] 4xx/5xx include error body
- [ ] Bare format documented
- [ ] Consumers configured for bare format
- [ ] Implement Bare Body Response Design following response-structures patterns
- [ ] Configure all required settings for Bare Body Response Design
- [ ] Register route/middleware/service for Bare Body Response Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Bare-body responses are 15-30% smaller than envelope responses due to omitted wrapper keys.
- [ ] Serialization is faster â€” fewer array merges and key additions.
- [ ] Top-level arrays serialize and decompress efficiently on the wire.
- [ ] The size savings are most significant for mobile APIs on metered data plans.

---

# Security Checklist

- [ ] Top-level JSON arrays can be exploited in JSON hijacking attacks on older browsers. Mitigate with proper CORS and `X-Content-Type-Options: nosniff`.
- [ ] Without an envelope, sensitive data leaked in a response field has no structural barrier â€” ensure field-level filtering is robust.
- [ ] Custom headers exposed via `Access-Control-Expose-Headers` must be reviewed for information disclosure.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Single resources return JSON objects at the top level, not arrays.
- [ ] Collections return JSON arrays, not wrapped objects.
- [ ] Paginated responses include `Link` header with `first`, `prev`, `next`, `last` relations.
- [ ] Error responses follow the documented consistent schema across all endpoints.
- [ ] Integration tests verify response structure matches OpenAPI schema exactly.
- [ ] Write feature tests for happy path of Bare Body Response Design
- [ ] Write feature tests for validation failure of Bare Body Response Design
- [ ] Write feature tests for authentication failure of Bare Body Response Design
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

- [ ] Avoid: Inconsistent Response Structure
- [ ] Avoid: Data Nesting Inconsistency
- [ ] Avoid: Missing HTTP Status Code Semantics
- [ ] Avoid: No Error Response Format
- [ ] Avoid: Bare Body Without Content-Type Negotiation

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
- Rule 1: Prefer Bare-Body Only for Known Consumers
- Rule 2: Always Include Pagination Headers on Bare-Body Collections
- Rule 3: Return Objects for Singles, Arrays for Collections
- Design
- Rule 4: Enforce a Consistent Error Schema Across All Endpoints
- Rule 5: Define OpenAPI Schema for Every Bare-Body Resource
- Rule 6: Never Mix Bare-Body and Envelope Endpoints
- Rule 7: Protect Top-Level Arrays Against JSON Hijacking
- Rule 8: Apply `withoutWrapping()` at the Resource Class Level

### Decisions
- Bare Body vs Envelope Selection
- Pagination Strategy for Bare-Body Collections
- Error Response Shape Standardization

### Anti-Patterns
- Inconsistent Response Structure
- Data Nesting Inconsistency
- Missing HTTP Status Code Semantics
- No Error Response Format
- Bare Body Without Content-Type Negotiation

## Related Knowledge
- Prerequisites
- Related
- Advanced



