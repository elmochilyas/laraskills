# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** API Version Behavior Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] API Version Behavior Testing implementation follows api-testing patterns
- [ ] All edge cases handled for API Version Behavior Testing
- [ ] Full test coverage for API Version Behavior Testing
- [ ] Security review completed for API Version Behavior Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for API Version Behavior Testing

---

# Architecture Checklist

- [ ] URL-prefix versioning makes version testing explicit â€” tests directly target `/api/v1/...`.
- [ ] The test directory structure should mirror the version directory structure, making it visually obvious which version each test belongs to.
- [ ] Shared behavior (error format, pagination) should be tested in a shared base class, not duplicated in each version.
- [ ] When removing a version, delete all version tests and the route group â€” never leave dead test code.

---

# Implementation Checklist

- [ ] Each active API version has corresponding test directory and test class
- [ ] Shared behavior (error shape, pagination) tested in shared base class
- [ ] `describe()` + `beforeEach` used for version base URL prefix
- [ ] Deprecated versions return `Deprecation` and `Sunset` headers
- [ ] Unsupported versions return 404
- [ ] Version-specific response shapes asserted per version
- [ ] Version leakage prevented (v2 tests don't hit v1 routes)
- [ ] Implement API Version Behavior Testing following api-testing patterns
- [ ] Configure all required settings for API Version Behavior Testing
- [ ] Register route/middleware/service for API Version Behavior Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Per-version test suites duplicate assertion logic â€” use shared traits to avoid code duplication.
- [ ] Use PestPHP `describe()` with `beforeEach` to set the version base URL and reduce repetition.
- [ ] Maintain a `BaseApiTest` class with shared endpoint tests that both versions extend.

---

# Security Checklist

- [ ] Deprecated versions may have known security vulnerabilities â€” test that they still maintain auth/authorization standards.
- [ ] Ensure old versions don't expose deprecated security practices (e.g., weak password hashing, old encryption).
- [ ] Unsolicited version migration (redirecting v1 to v2) may break clients expecting v1 behavior.
- [ ] Test that deprecated versions return proper deprecation headers â€” don't silently remove security patches from old versions.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each active API version has a corresponding test directory and test class
- [ ] Shared behavior (error shape, pagination) is tested in a shared base class
- [ ] Deprecated versions return `Deprecation` and `Sunset` headers
- [ ] Unsupported versions return 404 or appropriate error
- [ ] Version-specific response shapes are asserted per version
- [ ] OpenAPI specs are versioned and contract-tested per version
- [ ] Write feature tests for happy path of API Version Behavior Testing
- [ ] Write feature tests for validation failure of API Version Behavior Testing
- [ ] Write feature tests for authentication failure of API Version Behavior Testing
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
- Mirror Version Directory Structure In Tests
- Share Common Assertions Via Base Test Class
- Test Deprecation Headers On Deprecated Versions
- Test Unsupported Version Returns 404
- Use PestPHP Describe With Version Prefix
- Version Per-Endpoint Response Shape Separately

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



