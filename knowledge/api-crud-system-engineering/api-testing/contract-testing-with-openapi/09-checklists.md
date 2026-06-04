# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Contract Testing with OpenAPI
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Contract Testing with OpenAPI implementation follows api-testing patterns
- [ ] All edge cases handled for Contract Testing with OpenAPI
- [ ] Full test coverage for Contract Testing with OpenAPI
- [ ] Security review completed for Contract Testing with OpenAPI
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Contract Testing with OpenAPI

---

# Architecture Checklist

- [ ] The OpenAPI spec is the single source of truth â€” if the spec and implementation diverge, fix whichever is wrong.
- [ ] Treat spec validation failures as CI blocking errors.
- [ ] Never deploy an API version without a corresponding OpenAPI spec.
- [ ] Consider runtime schema validation for incoming requests in production using `league/openapi-psr7-validator` middleware.

---

# Implementation Checklist

- [ ] Every public endpoint has schema validation coverage
- [ ] Both 2xx success and 4xx error responses are validated
- [ ] Schema validation is triggered as a CI check on every push
- [ ] Validation library supports DRY references ($ref) for reusable schemas
- [ ] Response headers are validated where specified (Content-Type, pagination links)
- [ ] Breaking schema changes are reviewed and version-bumped before merging
- [ ] schema validation tests are grouped in a separate test suite from value assertions
- [ ] Implement Contract Testing with OpenAPI following api-testing patterns
- [ ] Configure all required settings for Contract Testing with OpenAPI
- [ ] Register route/middleware/service for Contract Testing with OpenAPI
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Schema validation on every response adds 5-50ms overhead per assertion.
- [ ] Run contract validation as a separate CI pipeline stage, not in the fast-feedback unit/feature stage.
- [ ] Cache the parsed OpenAPI file in memory â€” parsing YAML on every request is expensive.
- [ ] Validate only on a subset of representative tests for quick feedback.

---

# Security Checklist

- [ ] Ensure OpenAPI spec files don't contain hardcoded secrets, API keys, or example credentials.
- [ ] Validate that error response schemas don't expose internal implementation details.
- [ ] If performing runtime schema validation in production, ensure it doesn't leak spec structure to unauthorized users.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every API endpoint's response is validated against its OpenAPI schema
- [ ] Spec file is validated for structural correctness in CI
- [ ] Contract validation failures block CI pipeline
- [ ] Per-version spec files are maintained and tested separately
- [ ] Schema changes are validated for backward compatibility
- [ ] Write feature tests for happy path of Contract Testing with OpenAPI
- [ ] Write feature tests for validation failure of Contract Testing with OpenAPI
- [ ] Write feature tests for authentication failure of Contract Testing with OpenAPI
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
- Validate Every Response Against OpenAPI Spec
- Validate The Spec File Itself
- Use Per-Version Spec Files
- Cache Parsed Spec In Memory
- Run Contract Validation As Separate CI Stage
- Treat Spec Validation Failures As CI Blocking

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



