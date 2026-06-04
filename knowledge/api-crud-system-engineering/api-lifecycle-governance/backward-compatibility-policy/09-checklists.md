# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Backward Compatibility Policy
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Backward Compatibility Policy implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Backward Compatibility Policy
- [ ] Full test coverage for Backward Compatibility Policy
- [ ] Security review completed for Backward Compatibility Policy
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Backward Compatibility Policy

---

# Architecture Checklist

- [ ] Breaking changes require MAJOR version bump + deprecation window.
- [ ] Contract tests run existing consumer request/response fixtures against new spec.
- [ ] Maintain previous OpenAPI spec as reference for at least 2 versions.
- [ ] Deprecate old field + add new field rather than renaming (renaming breaks deserialization).
- [ ] Enum additions are non-breaking if server handles unknown values gracefully.
- [ ] Evaluate: Change Classification â€” Additive vs Breaking vs Evolutive

---

# Implementation Checklist

- [ ] Breaking vs non-breaking defined
- [ ] Additive-only within major version
- [ ] Major version for breaking changes
- [ ] Deprecation before removal
- [ ] Compatibility reviewed before release
- [ ] Policy documented
- [ ] Implement Backward Compatibility Policy following api-lifecycle-governance patterns
- [ ] Configure all required settings for Backward Compatibility Policy
- [ ] Register route/middleware/service for Backward Compatibility Policy
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] OpenAPI diffing in CI adds 5-15 seconds per run.
- [ ] Contract tests running fixtures add 30-60 seconds â€” cache fixture data.
- [ ] Tolerant deserialization has zero runtime cost in most JSON parsers.

---

# Security Checklist

- [ ] Security fixes that break compatibility may bypass standard deprecation window.
- [ ] Semantic breakage of security-related fields (e.g., changing auth response format) is especially dangerous.
- [ ] Log when consumer sends request that would break under newer spec for proactive alerting.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Backward Compatibility Policy
- [ ] Write feature tests for validation failure of Backward Compatibility Policy
- [ ] Write feature tests for authentication failure of Backward Compatibility Policy
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
- Rule 1: Never Add Required Fields to Existing Endpoints
- Rule 2: Never Change Default Values
- Rule 3: Always Deprecate Before Removing Fields or Endpoints
- Rule 4: Run Automated OpenAPI Diffing in CI
- Rule 5: Never Rename Fields â€” Add New and Deprecate Old
- Rule 6: Tolerant Reader â€” Ignore Unknown Fields
- Rule 7: Enforce Semantic Versioning for MAJOR Changes

### Decisions
- Change Classification â€” Additive vs Breaking vs Evolutive

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



