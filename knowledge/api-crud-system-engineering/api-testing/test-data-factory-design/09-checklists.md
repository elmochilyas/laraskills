# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Test Data Factory Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Test Data Factory Design implementation follows api-testing patterns
- [ ] All edge cases handled for Test Data Factory Design
- [ ] Full test coverage for Test Data Factory Design
- [ ] Security review completed for Test Data Factory Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Test Data Factory Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Laravel's factory system couples test data to Eloquent models â€” each factory maps to one model.
- [ ] This is a deliberate tradeoff: easy data creation but coupling to model schema.
- [ ] For API tests, model-level factories are the standard because tests need persisted data for endpoint assertions.
- [ ] Keep factories in `database/factories/` and maintain them alongside migrations and models.

---

# Implementation Checklist

- [ ] Every Eloquent model has a corresponding factory
- [ ] Factory states defined for all significant model states
- [ ] Factory relationships defined using `has()` / `for()` methods
- [ ] Edge-case states (null, empty, boundary) are factory-producible
- [ ] No circular factory relationships
- [ ] Factories use `fake()` for unique fields with `->unique()`
- [ ] `raw()` available for request body generation in feature tests
- [ ] Implement Test Data Factory Design following api-testing patterns
- [ ] Configure all required settings for Test Data Factory Design
- [ ] Register route/middleware/service for Test Data Factory Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Factory `create()` calls are database writes â€” each call adds overhead.
- [ ] Use `make()` instead of `create()` when you only need the model instance attributes.
- [ ] Use `factory()->count(N)->create()` to batch-insert N records in a single chunk.
- [ ] Use `afterCreating()` sparingly â€” callbacks run for each created record, adding O(N) overhead.
- [ ] For test data that doesn't change between test methods, create in `beforeAll()` or `setUpBeforeClass()`.

---

# Security Checklist

- [ ] Factory definitions should match production model schema exactly â€” invalid data produces misleading test results.
- [ ] Never use factory data in production (`php artisan db:seed` in production is a real risk).
- [ ] Factory `fake()` data should be locale-aware for internationalized applications.
- [ ] Ensure factories don't generate data that violates security constraints (e.g., passwords that don't meet requirements).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every Eloquent model has a corresponding factory
- [ ] Factory states are defined for all significant model states (published, draft, archived, etc.)
- [ ] Factory relationships are defined using `has()` / `for()` methods
- [ ] Edge case states (null, empty, boundary) are factory-producible
- [ ] No circular factory relationships exist
- [ ] Factories use `fake()` for unique fields (email, slug) with `->unique()`
- [ ] `raw()` is available for request body generation in feature tests
- [ ] Write feature tests for happy path of Test Data Factory Design
- [ ] Write feature tests for validation failure of Test Data Factory Design
- [ ] Write feature tests for authentication failure of Test Data Factory Design
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

- [ ] Avoid: Inlined Overrides Everywhere
- [ ] Avoid: Factory-as-Seeder
- [ ] Avoid: No Edge Case States
- [ ] Avoid: Circular Relationship Definitions
- [ ] Avoid: Overuse of `create()`

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
- Use Explicit States Over Inline Overrides
- Use Raw For Request Bodies
- Use Sequences For Distinct Records
- Define All Relationship Factories
- Use Make Over Create When Persistence Is Unnecessary
- Define Edge-Case States

### Anti-Patterns
- Inlined Overrides Everywhere
- Factory-as-Seeder
- No Edge Case States
- Circular Relationship Definitions
- Overuse of `create()`

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



