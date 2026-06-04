# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Authorization Failure Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Authorization Failure Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Authorization Failure Testing
- [ ] Full test coverage for Authorization Failure Testing
- [ ] Security review completed for Authorization Failure Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Authorization Failure Testing

---

# Architecture Checklist

- [ ] Separate auth-failure (401) from auth-failure (403) testing â€” they test different concerns.
- [ ] Feature-level authZ tests verify controller-to-policy routing, not just policy logic.
- [ ] Every policy method must be tested for denial. Enforce via architecture tests.
- [ ] Never expose why authorization failed (which gate denied) in 403 response.

---

# Implementation Checklist

- [ ] Two-user positive-negative pattern for each authorization scenario
- [ ] Every policy method tested for denial (view, create, update, delete, restore, forceDelete)
- [ ] Database state asserted unchanged on denied mutations
- [ ] Ownership tests: User A cannot modify User B's resource
- [ ] Non-admin users used for denial tests (no Gate::before bypass)
- [ ] 403 error body does not expose denied permission details
- [ ] Implement Authorization Failure Testing following api-testing patterns
- [ ] Configure all required settings for Authorization Failure Testing
- [ ] Register route/middleware/service for Authorization Failure Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] AuthZ tests require multiple database records (two users, resources owned by each).
- [ ] Use `beforeEach` to create user + resource once per class; avoid recreating in every method.
- [ ] Use PestPHP higher-order message for shared setups.

---

# Security Checklist

- [ ] 403 responses must never reveal which specific permission was missing.
- [ ] Log authZ failures at warning level â€” often indicate probing or permission misconfiguration.
- [ ] Global `Gate::before` bypasses all specific policies for admin â€” test with non-admin users.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Authorization Failure Testing
- [ ] Write feature tests for validation failure of Authorization Failure Testing
- [ ] Write feature tests for authentication failure of Authorization Failure Testing
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
- Use Two-User Positive-Negative Pattern
- Test Every Policy Method Individually
- Assert Database State Unchanged On Denied Mutations
- Test With Non-Admin Users Only
- Test Ownership Explicitly

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



