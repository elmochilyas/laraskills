# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Form Request Unit Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Form Request Unit Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Form Request Unit Testing
- [ ] Full test coverage for Form Request Unit Testing
- [ ] Security review completed for Form Request Unit Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Form Request Unit Testing

---

# Architecture Checklist

- [ ] Unit testing form requests prioritizes test speed and isolation over feature-level coverage.
- [ ] Many teams adopt both: unit tests for rule correctness and feature tests for route-level wiring.
- [ ] The container and redirector must be set up before calling `$request->validator()`.

---

# Implementation Checklist

- [ ] `rules()` return value asserted for each input state
- [ ] Conditional rules tested via datasets
- [ ] `authorize()` tested with both permitted and forbidden user states
- [ ] `prepareForValidation()` transformations tested explicitly
- [ ] Both `passes()` and `fails()` tested for rule boundaries
- [ ] Custom error messages verified
- [ ] At least one feature-level test verifies form request is wired to correct route
- [ ] Implement Form Request Unit Testing following api-testing patterns
- [ ] Configure all required settings for Form Request Unit Testing
- [ ] Register route/middleware/service for Form Request Unit Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Form request unit tests are among the fastest â€” <5ms even with 50 rules.
- [ ] Run in pre-CI stage to fail fast on validation rule errors.
- [ ] Use PestPHP datasets to exhaustively cover all conditional rule combinations without performance impact.

---

# Security Checklist

- [ ] Test `authorize()` with all relevant user roles/permissions â€” gaps in authorization logic can expose endpoints.
- [ ] Ensure validation rules don't leak internal information in error messages.
- [ ] Test that `prepareForValidation()` doesn't override security-critical fields (e.g., `is_admin`).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every form request with custom `rules()` has a unit test for rule correctness
- [ ] `authorize()` is tested with both authorized and unauthorized user states
- [ ] `prepareForValidation()` transformations are tested explicitly
- [ ] Custom error messages are verified
- [ ] At least one feature-level test verifies the form request is wired to the correct route
- [ ] Write feature tests for happy path of Form Request Unit Testing
- [ ] Write feature tests for validation failure of Form Request Unit Testing
- [ ] Write feature tests for authentication failure of Form Request Unit Testing
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
- Test Rules Return Value
- Test Dynamic Rules With Data Providers
- Test Authorize With Different User States
- Test PrepareForValidation Transformations
- Test Validation Persistence

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



