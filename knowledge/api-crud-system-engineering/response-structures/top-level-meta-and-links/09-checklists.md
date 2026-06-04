# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Top Level Meta And Links
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Top Level Meta And Links implementation follows response-structures patterns
- [ ] All edge cases handled for Top Level Meta And Links
- [ ] Full test coverage for Top Level Meta And Links
- [ ] Security review completed for Top Level Meta And Links
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Top Level Meta And Links
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Decide whether meta is flat (`meta.generated_at`) or nested (`meta.timing.generated_at`) â€” flat is easier for clients.
- [ ] Standardize link relations using IANA-registered names (`self`, `next`, `prev`) rather than custom names.
- [ ] Pagination links are auto-injected by `PaginatedResourceResponse`. Do not manually override `links` in `additional()`.
- [ ] For non-paginated collections, add links manually via `with()` if navigation context is needed.
- [ ] Separate dynamic meta (request ID, server time) from stable meta (pagination counts) to improve cacheability.
- [ ] Evaluate: Meta Field Selection
- [ ] Evaluate: Link Generation and Management
- [ ] Evaluate: Meta Injection Method: `with()` vs `additional()`

---

# Implementation Checklist

- [ ] `data` key wraps the primary resource (object or array)
- [ ] `meta` key is present on all responses (empty object if no metadata)
- [ ] `links` key is present with at least `self` link
- [ ] Paginated responses include pagination meta and pagination links
- [ ] Error responses use `error`/`errors` key with consistent shape
- [ ] `Location` header is set for 201 responses
- [ ] Envelope structure is identical across all endpoints
- [ ] API Resources generate the envelope consistently
- [ ] `data` is `null` for 204 responses (no content)
- [ ] `meta` uses snake_case keys for consistency with JSON conventions
- [ ] Implement Top Level Meta And Links following response-structures patterns
- [ ] Configure all required settings for Top Level Meta And Links
- [ ] Register route/middleware/service for Top Level Meta And Links
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Adding 10 meta fields adds negligible serialization time (~0.01ms).
- [ ] Permission checks for `meta.can.*` add cost â€” cache at the user-role level.
- [ ] Absolute URL generation for `links` requires scheme/host resolution â€” use `url()` helper or named routes.
- [ ] Dynamic meta (request ID, server time) prevents response caching â€” separate from cacheable meta.

---

# Security Checklist

- [ ] Never include session tokens, internal IDs, or debugging output in `meta`.
- [ ] Permission meta fields (`can.update`, `can.delete`) must match server-side authorization policies.
- [ ] Exposing feature flags in `meta` reveals internal state â€” ensure flags don't leak sensitive information.
- [ ] `additional()` can overwrite any response key â€” audit uses to prevent accidental data exposure.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every resource response includes a `self` link in `links`.
- [ ] `with()` returns only plain arrays â€” no objects, resources, or non-serializable values.
- [ ] Paginated collections have `first`, `prev`, `next`, `last` links.
- [ ] No `data` key is returned from `additional()` on any resource.
- [ ] Integration tests verify meta field presence and correct link URL generation behind proxies.
- [ ] Write feature tests for happy path of Top Level Meta And Links
- [ ] Write feature tests for validation failure of Top Level Meta And Links
- [ ] Write feature tests for authentication failure of Top Level Meta And Links
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

- [ ] Avoid: Missing Top-Level Links
- [ ] Avoid: Inconsistent Link Relations
- [ ] Avoid: Including Redundant Links
- [ ] Avoid: Missing Meta Fields
- [ ] Avoid: Meta Data Duplication

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
- Rule 1: Always Include a Request ID in `meta`
- Rule 2: Use `with()` for Meta, Never `additional()`
- Rule 3: Always Include a `self` Link in Every Resource
- Rule 4: Never Override Pagination `links` via `additional()`
- Rule 5: Keep `meta` Fields Stable and Additive
- Rule 6: Never Throw Exceptions Inside `with()`
- Rule 7: Separate Dynamic Meta from Cacheable Meta

### Decisions
- Meta Field Selection
- Link Generation and Management
- Meta Injection Method: `with()` vs `additional()`

### Anti-Patterns
- Missing Top-Level Links
- Inconsistent Link Relations
- Including Redundant Links
- Missing Meta Fields
- Meta Data Duplication

## Related Knowledge
- Prerequisites
- Related
- Advanced



