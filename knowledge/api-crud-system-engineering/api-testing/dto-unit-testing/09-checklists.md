# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** DTO Unit Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] DTO Unit Testing implementation follows api-testing patterns
- [ ] All edge cases handled for DTO Unit Testing
- [ ] Full test coverage for DTO Unit Testing
- [ ] Security review completed for DTO Unit Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for DTO Unit Testing

---

# Architecture Checklist

- [ ] DTOs are the contract definition between API layers â€” test them in isolation (no framework, no database).
- [ ] The decision to use DTOs (vs raw arrays) is architectural: DTOs provide type safety and documentation but add boilerplate.
- [ ] Unit tests make DTO boilerplate maintainable by catching regressions.
- [ ] PHP 8.2 `readonly` classes are ideal for DTOs â€” immutability by default.

---

# Implementation Checklist

- [ ] Construction tested from each input type
- [ ] Default values for optional fields verified
- [ ] Type enforcement tested (wrong types throw `TypeError`)
- [ ] Serialization (`toArray`, `toJson`) matches expected structure
- [ ] Immutability verified (no setters, no modification after construction)
- [ ] Nested DTOs tested recursively
- [ ] Zero mocking used â€” all tests use direct instantiation
- [ ] Implement DTO Unit Testing following api-testing patterns
- [ ] Configure all required settings for DTO Unit Testing
- [ ] Register route/middleware/service for DTO Unit Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] DTO unit tests are essentially free â€” no dependencies, no database, no framework.
- [ ] Run on every file save â€” a DTO test suite for 50 DTOs completes in <100ms.
- [ ] No special CI configuration needed; include in the pre-commit hook.

---

# Security Checklist

- [ ] DTOs that carry data from untrusted sources should have validation integrated (via Spatie\LaravelData or manual asserts).
- [ ] Immutability prevents accidental data corruption after construction.
- [ ] Serialization tests ensure no unexpected data leaks via `toArray()`.
- [ ] Ensure `fromRequest()` doesn't map hidden/guarded fields from user input.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every DTO has tests for construction from each input type
- [ ] Default values for optional fields are verified
- [ ] Type enforcement is tested (wrong types throw `TypeError`)
- [ ] Serialization (`toArray`, `toJson`) matches expected structure
- [ ] Immutability is verified (no setters, no modification after construction)
- [ ] Nested DTOs are tested recursively
- [ ] Write feature tests for happy path of DTO Unit Testing
- [ ] Write feature tests for validation failure of DTO Unit Testing
- [ ] Write feature tests for authentication failure of DTO Unit Testing
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
- Test Construction From Each Input Type
- Test Default Values For Optional Fields
- Test Type Enforcement
- Test Serialization
- Test Immutability
- Test Nested DTOs Recursively

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



