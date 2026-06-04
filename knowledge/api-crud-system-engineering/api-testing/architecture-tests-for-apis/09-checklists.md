# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Architecture Tests for APIs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Architecture Tests for APIs implementation follows api-testing patterns
- [ ] All edge cases handled for Architecture Tests for APIs
- [ ] Full test coverage for Architecture Tests for APIs
- [ ] Security review completed for Architecture Tests for APIs
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Architecture Tests for APIs

---

# Architecture Checklist

- [ ] Architecture tests codify decisions made during project setup â€” directory structure, naming, class hierarchies.
- [ ] Rules are checked in CI; a violation is a hard failure.
- [ ] The granularity of arch rules (namespace-level vs file-level vs class-level) depends on team size and convention strictness.
- [ ] Keep arch rules broad enough to survive refactoring but specific enough to catch violations.

---

# Implementation Checklist

- [ ] All API controllers extend the correct base controller
- [ ] All form requests extend the correct base form request
- [ ] API routes isolated in `routes/api.php` with no web routes
- [ ] No `dd()` / `dump()` calls in production code
- [ ] Each API controller has a corresponding test file
- [ ] Form requests only use allowed dependencies (validation rules, not Eloquent)
- [ ] Services do not use HTTP concerns
- [ ] Arch tests run in CI as a pre-filter before feature tests
- [ ] Implement Architecture Tests for APIs following api-testing patterns
- [ ] Configure all required settings for Architecture Tests for APIs
- [ ] Register route/middleware/service for Architecture Tests for APIs
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Architecture tests are the fastest tests â€” they don't boot the framework or hit the database.
- [ ] Typically complete in <100ms for the entire rule set.
- [ ] Run them first in CI as a pre-filter: if arch tests fail, feature tests will structurally fail too.

---

# Security Checklist

- [ ] Use arch tests to enforce: no `dd()` or `dump()` calls in production code (using `->toNotUse()`).
- [ ] Enforce that all public methods have return types (prevents accidental type leaks).
- [ ] Ensure no raw `DB::` calls exist outside repository/service classes.
- [ ] Prevent controllers from directly accessing request input without going through form requests.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All API controllers extend the correct base controller
- [ ] All form requests extend the correct base form request
- [ ] API routes are isolated in `routes/api.php` with no web routes
- [ ] No `dd()` / `dump()` calls exist in production code
- [ ] Each API controller has a corresponding test file
- [ ] Arch tests run in CI as a pre-filter before feature tests
- [ ] Write feature tests for happy path of Architecture Tests for APIs
- [ ] Write feature tests for validation failure of Architecture Tests for APIs
- [ ] Write feature tests for authentication failure of Architecture Tests for APIs
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
- Enforce Namespace Conventions
- Enforce Test Coverage Per Controller
- Isolate API Routes From Web Routes
- Forbid DD And Dump Calls In Production Code
- Enforce Dependency Rules Between Layers
- Run Arch Tests First In CI

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



