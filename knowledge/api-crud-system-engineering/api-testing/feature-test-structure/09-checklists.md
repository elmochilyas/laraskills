# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Feature Test Structure
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Feature Test Structure implementation follows api-testing patterns
- [ ] All edge cases handled for Feature Test Structure
- [ ] Full test coverage for Feature Test Structure
- [ ] Security review completed for Feature Test Structure
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Feature Test Structure

---

# Architecture Checklist

- [ ] Feature tests are kernel-bootstrapped integration tests â€” they couple to the framework intentionally.
- [ ] Run feature tests with `php artisan test --parallel` for speed.
- [ ] Exclude slow tests (external HTTP calls) into a separate PHPUnit suite with `@group external`.
- [ ] Use `.env.testing` for environment-specific configuration.

---

# Implementation Checklist

- [ ] Test file per resource organized
- [ ] DatabaseTransactions or RefreshDatabase applied
- [ ] Shared setup in setUp/beforeEach
- [ ] Test methods named by scenario
- [ ] Tests grouped by HTTP method
- [ ] Happy/error/edge case tests separated
- [ ] Data providers for repeated scenarios
- [ ] @group annotations for targeted runs
- [ ] Database strategy matches test needs
- [ ] Tests independent â€” no shared mutable state
- [ ] Implement Feature Test Structure following api-testing patterns
- [ ] Configure all required settings for Feature Test Structure
- [ ] Register route/middleware/service for Feature Test Structure
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each test bootstraps the framework kernel. Use `RefreshDatabase` with SQLite in-memory or transactional rollbacks.
- [ ] PestPHP `uses()` with `RefreshDatabase` per file (not per class) reduces overhead.
- [ ] Grouping related assertions in a single test reduces kernel boots.

---

# Security Checklist

- [ ] Feature tests can access the application container â€” don't expose sensitive credentials in test setup.
- [ ] Use `withoutMiddleware()` carefully â€” only for non-auth tests.
- [ ] Reset authenticated user state between tests to prevent session leakage.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Feature Test Structure
- [ ] Write feature tests for validation failure of Feature Test Structure
- [ ] Write feature tests for authentication failure of Feature Test Structure
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
- One Class Per Controller
- AAA Separation
- Use RefreshDatabase
- One Behavior Per Test
- WithoutExceptionHandling For Debugging Only
- Directory Mirrors API Surface
- Helper Methods For Common Setup
- Separate Happy Path From Failure

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



