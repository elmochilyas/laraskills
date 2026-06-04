# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Layer Isolation in Tests
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Layer Isolation in Tests implementation follows api-testing patterns
- [ ] All edge cases handled for Layer Isolation in Tests
- [ ] Full test coverage for Layer Isolation in Tests
- [ ] Security review completed for Layer Isolation in Tests
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Layer Isolation in Tests

---

# Architecture Checklist

- [ ] Layer isolation is an intentional deviation from Laravel's default feature-test-only approach.
- [ ] Benefits scale with team size: small teams benefit from feature-test simplicity; larger teams benefit from isolated test debugging speed.
- [ ] Use architecture tests to enforce dependency rules: services cannot call controllers, DTOs cannot call services.
- [ ] Dependency injection is required for mocking â€” if controllers call `new Service()`, mocking is impossible.

---

# Implementation Checklist

- [ ] Each architectural layer has at least one dedicated test type
- [ ] Repository boundaries mocked, not Eloquent internals
- [ ] DTO tests require zero mocking and zero database
- [ ] Bus/Event/Notification/Mail fakes used for side-effect assertions
- [ ] Action/service tests mock repository boundaries, not internals
- [ ] Integration tests verify mocked boundaries work with real implementations
- [ ] 70/30 split between feature-level and isolated unit tests
- [ ] Eloquent, Query Builder, and third-party SDKs not mocked
- [ ] Implement Layer Isolation in Tests following api-testing patterns
- [ ] Configure all required settings for Layer Isolation in Tests
- [ ] Register route/middleware/service for Layer Isolation in Tests
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Isolated unit tests are 10-100x faster than feature tests.
- [ ] Run unit tests in a pre-CI stage before feature tests to fail fast on logic errors.
- [ ] Mock-heavy suites don't boot the framework â€” extremely fast execution.
- [ ] Use `RefreshDatabase` only for integration tests; unit tests of DTOs, form requests, and plain PHP actions don't need the database.

---

# Security Checklist

- [ ] Layer isolation prevents security-sensitive code (authorization logic) from being tested only at the feature level â€” unit-test authorization in form requests and services.
- [ ] Ensure mocked security boundaries (auth checks, permissions) are covered by integration tests too, since mocks may differ from real behavior.
- [ ] Security-critical validations should have both isolated unit tests and integration tests.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each architectural layer has at least one dedicated test type
- [ ] DTO tests require zero mocking and zero database
- [ ] Action/service tests mock repository boundaries, not internals
- [ ] Integration tests verify that mocked boundaries work with real implementations
- [ ] Feature tests cover the full HTTP stack for critical paths
- [ ] Write feature tests for happy path of Layer Isolation in Tests
- [ ] Write feature tests for validation failure of Layer Isolation in Tests
- [ ] Write feature tests for authentication failure of Layer Isolation in Tests
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
- Mock Repository Boundaries, Not Internals
- Use Bus And Event Fakes For Side Effects
- DTOs Need Zero Mocking
- Follow The 70/30 Split
- Avoid Over-Mocking

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



