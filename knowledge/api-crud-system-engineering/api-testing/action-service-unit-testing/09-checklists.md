# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Action / Service Unit Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Action / Service Unit Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Action / Service Unit Testing
- [ ] Full test coverage for Action / Service Unit Testing
- [ ] Security review completed for Action / Service Unit Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Action / Service Unit Testing

---

# Architecture Checklist

- [ ] The action/service pattern separates business logic from HTTP concerns and persistence concerns.
- [ ] This separation makes the logic testable â€” a controller test requires HTTP kernel, an action test requires only PHPUnit.
- [ ] Mock at the boundary you own (repository interfaces, event system) and use real implementations for value objects (DTOs).
- [ ] When a service has 8+ constructor parameters, it has too many responsibilities â€” refactor.

---

# Implementation Checklist

- [ ] Every action/service class has unit tests for all return paths
- [ ] Mock dependencies at boundary interface level, not implementation
- [ ] Event and job dispatch verified via fakes
- [ ] Exception scenarios tested (repository failures, validation errors)
- [ ] Datasets used for rule variants with multiple combinations
- [ ] Integration tests exist for database-bound services
- [ ] Value objects not mocked â€” real instances used
- [ ] Implement Action / Service Unit Testing following api-testing patterns
- [ ] Configure all required settings for Action / Service Unit Testing
- [ ] Register route/middleware/service for Action / Service Unit Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Action/service unit tests (with mocked repositories) are fast â€” <10ms per test.
- [ ] They should form the largest layer in the test pyramid.
- [ ] Run unit action tests with `--group=unit` in CI pre-stage; run integration tests with `--group=integration` in full suite.
- [ ] Use mutation testing (`infection` tool) to validate test quality â€” if mutations kill mocks but not business logic, tests are too mock-centric.

---

# Security Checklist

- [ ] The action/service layer is the most critical for production correctness â€” bugs here mean incorrect business logic.
- [ ] Ensure authorization checks in services are tested with both permitted and forbidden states.
- [ ] Test that sensitive data is not logged or exposed in error paths within service methods.
- [ ] Security-critical validations should have both isolated unit tests and integration tests to catch mock/reality mismatches.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every action/service class has unit tests for all return paths
- [ ] Mock dependencies at the boundary interface level, not implementation
- [ ] Event and job dispatch is verified via fakes
- [ ] Exception scenarios are tested (repository failures, validation errors)
- [ ] Integration tests exist for services with real database connection
- [ ] Services with excessive dependencies (>5) are identified for refactoring
- [ ] Write feature tests for happy path of Action / Service Unit Testing
- [ ] Write feature tests for validation failure of Action / Service Unit Testing
- [ ] Write feature tests for authentication failure of Action / Service Unit Testing
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
- Mock Repository Boundaries, Not Domain Logic
- Test All Return Paths
- Test Event And Job Dispatch Via Fakes
- Test Exception Scenarios
- Use Data Providers For Rule Variants
- Use Integration Tests For Database-Bound Services

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



