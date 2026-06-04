# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** Response Schema Documentation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Schema Documentation implementation follows api-documentation patterns
- [ ] All edge cases handled for Response Schema Documentation
- [ ] Full test coverage for Response Schema Documentation
- [ ] Security review completed for Response Schema Documentation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Schema Documentation

---

# Architecture Checklist

- [ ] Version response schemas: when response structure changes, create new Resource schemas. Old schemas remain in old API version docs.
- [ ] Auto-generate from API Resources (Scramble) for drift-free documentation.
- [ ] Document wrapper/unwrapped pattern explicitly: `{ data: { ... } }` vs bare resource.
- [ ] Evaluate: Response Structure â€” Wrapped vs Unwrapped
- [ ] Evaluate: Response Schema Source â€” Auto-Generated vs Manually Defined

---

# Implementation Checklist

- [ ] Every response field documented including server-generated ones
- [ ] `readOnly: true` on id, created_at, updated_at, deleted_at
- [ ] `nullable: true` with conditions on nullable properties
- [ ] Reusable PaginationMeta schema for all paginated responses
- [ ] Response examples per status code
- [ ] Conditional field availability documented in descriptions
- [ ] Contract tests verify schemas match actual responses
- [ ] Implement Response Schema Documentation following api-documentation patterns
- [ ] Configure all required settings for Response Schema Documentation
- [ ] Register route/middleware/service for Response Schema Documentation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Response schemas form largest portion of OpenAPI spec. 30 resources with nested relationships can add 15,000-20,000 lines.
- [ ] Use `$ref` aggressively to reduce duplication in spec files.

---

# Security Checklist

- [ ] Review response schemas for accidental exposure of internal fields (password hashes, pivot data, internal IDs).
- [ ] Document conditional field availability based on permissions/roles.
- [ ] Do not include production data in example values.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Response Schema Documentation
- [ ] Write feature tests for validation failure of Response Schema Documentation
- [ ] Write feature tests for authentication failure of Response Schema Documentation
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
- Document Every Response Field Including Server-Generated Ones
- Mark Nullable Fields Explicitly With Conditions
- Mark Read-Only Properties With readOnly: true
- Define A Reusable Pagination Schema
- Validate Response Schemas Against Actual Responses In CI
- Document Conditional Field Availability

### Decisions
- Response Structure â€” Wrapped vs Unwrapped
- Response Schema Source â€” Auto-Generated vs Manually Defined

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



