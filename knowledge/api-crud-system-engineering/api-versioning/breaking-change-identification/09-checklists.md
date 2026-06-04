# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Breaking Change Identification
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Breaking Change Identification implementation follows api-versioning patterns
- [ ] All edge cases handled for Breaking Change Identification
- [ ] Full test coverage for Breaking Change Identification
- [ ] Security review completed for Breaking Change Identification
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Breaking Change Identification
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] The most common breaking change is subtle: a behavioral change in a conditional code path that only manifests for specific inputs.
- [ ] Automated detection + manual review are both necessary â€” neither alone is sufficient.
- [ ] Use OpenAPI spec as the single source of truth for contract comparison.
- [ ] Breaking classification feeds into semantic versioning: breaking â†’ MAJOR, additions â†’ MINOR, fixes â†’ PATCH.

---

# Implementation Checklist

- [ ] Automated OpenAPI spec diff runs in CI for every PR
- [ ] Breaking change checklist reviewed for every API change
- [ ] Snapshot tests exist for critical API responses
- [ ] Field semantics verified â€” not just structure
- [ ] Auth/header changes classified as breaking
- [ ] Breaking changes logged in registry with rationale and migration path
- [ ] Implement Breaking Change Identification following api-versioning patterns
- [ ] Configure all required settings for Breaking Change Identification
- [ ] Register route/middleware/service for Breaking Change Identification
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Automated diff runs in CI, not at runtime â€” zero production impact.
- [ ] Snapshot tests add ~50ms per endpoint in the test suite.
- [ ] Response comparison tools run during staging deployment, ~100ms per comparison.

---

# Security Checklist

- [ ] Authentication/authorization changes are breaking â€” test that security policies don't change unintentionally.
- [ ] Breaking changes that affect error responses can hide security-related errors from consumers.
- [ ] Ensure breaking change detection includes audit log and security header changes.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Automated OpenAPI spec diff runs in CI for every PR
- [ ] Breaking change checklist reviewed for every API change
- [ ] Snapshot tests exist for critical API responses
- [ ] Breaking changes are categorized and logged in changelog
- [ ] Breaking change registry maintained with rationale and migration path
- [ ] Post-release monitoring in place to detect unexpected consumer breakage
- [ ] Write feature tests for happy path of Breaking Change Identification
- [ ] Write feature tests for validation failure of Breaking Change Identification
- [ ] Write feature tests for authentication failure of Breaking Change Identification
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

- [ ] Avoid: No Automated Detection
- [ ] Avoid: False Positive Fatigue
- [ ] Avoid: Semantic Blindness
- [ ] Avoid: Ignoring Behavior Changes
- [ ] Avoid: No Pre-Release Gate

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
- Run Automated OpenAPI Spec Diff In CI
- Categorize Breaking Changes In Changelog
- Changed
- Check Field Semantics Not Just Structure
- Snapshot Test Every Public API Response
- Treat Auth/Header Changes As Breaking
- Use `oasdiff` Or Equivalent In CI Pipeline
- Maintain A Breaking Change Registry

### Anti-Patterns
- No Automated Detection
- False Positive Fatigue
- Semantic Blindness
- Ignoring Behavior Changes
- No Pre-Release Gate

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



