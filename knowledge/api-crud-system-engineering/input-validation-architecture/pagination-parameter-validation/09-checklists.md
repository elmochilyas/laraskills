# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Pagination Parameter Validation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination Parameter Validation implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Pagination Parameter Validation
- [ ] Full test coverage for Pagination Parameter Validation
- [ ] Security review completed for Pagination Parameter Validation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination Parameter Validation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Create a `HasPaginationValidation` trait with `paginationRules()` and `preparePagination()`.
- [ ] Override `maxPerPage()` per request for resource-specific limits.
- [ ] Inject default values for `page`, `per_page`, and `direction` in `prepareForValidation()`.
- [ ] Validate cursor format with a custom closure or rule class.
- [ ] Validate sort parameters against an allowlist to prevent SQL injection.
- [ ] Apply role-based `per_page` limits for admin vs regular users.
- [ ] Monitor `per_page` distribution to detect clients requesting max excessively.

---

# Implementation Checklist

- [ ] `per_page` has integer validation with explicit min/max
- [ ] `page` is integer and minimum 1 (offset pagination only)
- [ ] `cursor` format is validated (base64-encoded or custom format checks)
- [ ] `sort` is validated against an allowed-column whitelist
- [ ] `direction` is validated as exactly `asc` or `desc`
- [ ] Default values are applied when parameters are absent
- [ ] Error messages tell the client the allowed bounds/values
- [ ] Offset and cursor pagination have separate Form Requests (different rules)
- [ ] Implement Pagination Parameter Validation following input-validation-architecture patterns
- [ ] Configure all required settings for Pagination Parameter Validation
- [ ] Register route/middleware/service for Pagination Parameter Validation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Enforce `per_page` max to bound query result sets and memory usage.
- [ ] Deep `page` values (>10000) cause OFFSET performance issues â€” consider cursor pagination.
- [ ] Validating cursor format adds trivial overhead.
- [ ] Default `per_page` should match expected page size for the resource type.
- [ ] For high-traffic endpoints, cap `per_page` lower to reduce database load.

---

# Security Checklist

- [ ] Validate `page` and `per_page` as integers to prevent SQL injection via string parameters.
- [ ] Validate `cursor` format to prevent tampering and injection.
- [ ] Validate `sort` against an allowlist â€” never pass user input directly to `orderBy()`.
- [ ] Set `per_page` max to prevent memory exhaustion attacks.
- [ ] Log pagination anomalies (page > 10000, per_page at max) for abuse detection.
- [ ] Apply rate limiting to paginated endpoints to prevent deep traversal attacks.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All index endpoints validate pagination parameters
- [ ] `per_page` has a hard max enforced (per-resource)
- [ ] Default values are injected in `prepareForValidation()`
- [ ] `page` and `per_page` are validated as integers
- [ ] `sort` parameter is validated against an allowlist
- [ ] `cursor` parameter (if used) has format validation
- [ ] Pagination trait is used across all index endpoints for consistency
- [ ] Write feature tests for happy path of Pagination Parameter Validation
- [ ] Write feature tests for validation failure of Pagination Parameter Validation
- [ ] Write feature tests for authentication failure of Pagination Parameter Validation
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

- [ ] Avoid: No Pagination Validation at All
- [ ] Avoid: Hardcoded per_page in Controller
- [ ] Avoid: Same max for All User Tiers
- [ ] Avoid: Cursor Without Format Validation
- [ ] Avoid: Allowing per_page=0

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
- Always Enforce a Hard per_page Maximum
- Inject Defaults in prepareForValidation()
- Validate page as Integer with min:1
- Validate sort Against an Allowlist
- Use a Reusable Pagination Trait
- Use Per-Resource per_page Max Values
- Validate Cursor Format for Cursor Pagination

### Anti-Patterns
- No Pagination Validation at All
- Hardcoded per_page in Controller
- Same max for All User Tiers
- Cursor Without Format Validation
- Allowing per_page=0

## Related Knowledge
- Form Request Design for APIs (the request class design pattern)
- Pagination Strategies (broader pagination architecture)
- Input Preparation (default injection for pagination params)
- Validation Rule Array Design (sorting and filtering array validation)
- Rate Limiting by Authentication Tier (role-based per_page limits)



