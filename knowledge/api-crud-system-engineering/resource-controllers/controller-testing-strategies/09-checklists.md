# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Testing Strategies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Testing Strategies implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Testing Strategies
- [ ] Full test coverage for Controller Testing Strategies
- [ ] Security review completed for Controller Testing Strategies
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Testing Strategies
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] One test class per resource controller: `PhotoControllerTest` for `PhotoController`.
- [ ] Group tests by action: `can_list_photos`, `can_create_a_photo`, `can_show_a_photo`, `can_update_a_photo`, `can_delete_a_photo`.
- [ ] Add authorization tests: `guests_cannot_create_photos`, `non_owners_cannot_update_photos`.
- [ ] Add validation tests: `store_validates_required_fields`, `store_validates_unique_constraint`.
- [ ] Use `RefreshDatabase` for test isolation when schema is unchanged; `DatabaseTransactions` when it is.
- [ ] Mark slow controller test groups with `@group controller` for selective execution.
- [ ] Evaluate: Test Coverage Strategy

---

# Implementation Checklist

- [ ] Every action has a happy-path test
- [ ] Every action has at least one failure test (403, 404, 422)
- [ ] AuthZ tests exist for role/permission-based access per action
- [ ] Store assertions include database state changes
- [ ] Destroy assertions confirm deletion (or soft-delete)
- [ ] Show asserts the full resource JSON structure
- [ ] Index asserts pagination envelope and data shape
- [ ] Tests use factories, not hard-coded IDs
- [ ] Edge cases: empty index, not-found show, invalid update, delete of non-existent
- [ ] Implement Controller Testing Strategies following resource-controllers patterns
- [ ] Configure all required settings for Controller Testing Strategies
- [ ] Register route/middleware/service for Controller Testing Strategies
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] HTTP tests are 10-50x slower than unit tests due to full-stack execution and database round-trips.
- [ ] Use in-memory SQLite (`DB_CONNECTION=sqlite DB_DATABASE=:memory:`) for faster test runs.
- [ ] Use `DatabaseTransactions` over `RefreshDatabase` when tests don't modify schema (avoids re-migrating).
- [ ] Use parallel testing (`php artisan test --parallel`) in CI for significant speedups.
- [ ] Group slow tests and run them separately from fast unit tests in CI.

---

# Security Checklist

- [ ] Never test with production credentials or real API keys â€” use environment-specific `.env.testing`.
- [ ] Ensure authorization tests cover the correct role/permission boundaries.
- [ ] Test that soft-deleted resources return 404 (not accessible via show/update/destroy).
- [ ] Test that users cannot access resources belonging to other users (cross-tenant isolation).
- [ ] Verify that validation errors don't leak sensitive schema information.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every controller action has at least one happy-path HTTP test
- [ ] Every protected action has authorization failure tests (unauthenticated + unauthorized)
- [ ] Mutating actions include `assertDatabaseHas()` or `assertDatabaseMissing()` assertions
- [ ] `assertJsonStructure()` used for shape validation (not `assertJson` with hardcoded IDs)
- [ ] `RefreshDatabase` or `DatabaseTransactions` trait applied for test isolation
- [ ] Tests are independent â€” each creates its own data, no shared state
- [ ] Write feature tests for happy path of Controller Testing Strategies
- [ ] Write feature tests for validation failure of Controller Testing Strategies
- [ ] Write feature tests for authentication failure of Controller Testing Strategies
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

- [ ] Avoid: Testing Through HTTP Only
- [ ] Avoid: No Controller-Specific Test Suite
- [ ] Avoid: Testing Laravel Framework Behavior
- [ ] Avoid: Missing Error Response Tests
- [ ] Avoid: Testing Implementation Details

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
- Write HTTP Tests For Controllers, Not Unit Tests
- Always Test Failure Paths Per Action
- Use assertJsonStructure For Shape Validation
- Assert Database State For Mutating Actions
- Keep Tests Independent
- Use RefreshDatabase Or DatabaseTransactions

### Decisions
- Test Coverage Strategy

### Anti-Patterns
- Testing Through HTTP Only
- No Controller-Specific Test Suite
- Testing Laravel Framework Behavior
- Missing Error Response Tests
- Testing Implementation Details

## Related Knowledge
- Controller Form Request Integration â€” Testing form request validation independently
- Controller Response Selection â€” Asserting correct response types and shapes
- Thin Controller Enforcement â€” Architecture tests ensuring controller structure
- API Integration Testing â€” Broader testing beyond individual controllers



