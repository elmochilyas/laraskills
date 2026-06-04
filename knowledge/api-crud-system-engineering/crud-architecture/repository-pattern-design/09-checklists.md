# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Repository Pattern Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Repository Pattern Design implementation follows crud-architecture patterns
- [ ] All edge cases handled for Repository Pattern Design
- [ ] Full test coverage for Repository Pattern Design
- [ ] Security review completed for Repository Pattern Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Repository Pattern Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Repositories contain: query logic, filtering/sorting/pagination, eager loading, caching, raw database operations
- [ ] Repositories do NOT contain: business rules, validation, event dispatching, cross-entity orchestration
- [ ] Repository-level caching uses the decorator pattern â€” wrap the real repository with a caching layer
- [ ] Multi-tenant scoping is applied at the repository level using a decorator or base repository
- [ ] Consider CQRS-light separation (read vs write interfaces) for applications with different query and command optimization needs

---

# Implementation Checklist

- [ ] Repository methods do not return QueryBuilders
- [ ] Repository does not contain business rules or event dispatching
- [ ] Repository interface exists when multiple implementations needed
- [ ] Binding registered in service provider
- [ ] Criteria objects used instead of too-fine query methods
- [ ] Repository tested against real database
- [ ] Service tests mock the repository interface
- [ ] Implement Repository Pattern Design following crud-architecture patterns
- [ ] Configure all required settings for Repository Pattern Design
- [ ] Register route/middleware/service for Repository Pattern Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Repository method call adds ~0.001ms overhead; interface resolution adds ~0.005ms
- [ ] Compared to database queries (1-50ms), overhead is irrelevant
- [ ] Repository-level caching can dramatically reduce database load for read-heavy workloads
- [ ] Decorator pattern adds no measurable overhead beyond the inner repository call

---

# Security Checklist

- [ ] Repository returning QueryBuilders allows callers to add un-scoped queries, breaking tenant isolation â€” never expose QueryBuilders
- [ ] Repository caching must respect data authorization â€” scope cache keys by user/tenant to prevent cross-user data leaks
- [ ] Write repositories should not expose soft-deleted records unless explicitly intended
- [ ] Multi-tenant scoping at the repository level ensures tenant isolation is always applied

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Repository methods do not return QueryBuilders
- [ ] Repository does not contain business rules or event dispatching
- [ ] Repository interface exists when multiple implementations are needed
- [ ] Binding is registered in a service provider
- [ ] Criteria objects are used instead of too-fine query methods
- [ ] Repository is tested against a real database
- [ ] Service tests mock the repository interface
- [ ] No Eloquent leakage from repository methods
- [ ] Write feature tests for happy path of Repository Pattern Design
- [ ] Write feature tests for validation failure of Repository Pattern Design
- [ ] Write feature tests for authentication failure of Repository Pattern Design
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

- [ ] Avoid: Ceremony Without Benefit
- [ ] Avoid: Repository Leakage
- [ ] Avoid: Anemic Repository
- [ ] Avoid: Repository Performing Business Logic
- [ ] Avoid: Repository Method Explosion
- [ ] Avoid: Repository Returning QueryBuilder

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
- Rule 1: Never Return QueryBuilders from Repository Methods
- Rule 2: Use Criteria Objects Instead of Too-Fine Repository Methods
- Rule 3: Only Add Interfaces When Polymorphism Is Needed
- Rule 4: Keep Repositories Pure Data Access â€” No Business Logic
- Rule 5: Test Repository Implementations Against a Real Database
- Rule 6: Mock Repository Interfaces in Service Tests

### Anti-Patterns
- Ceremony Without Benefit
- Repository Leakage
- Anemic Repository
- Repository Performing Business Logic
- Repository Method Explosion
- Repository Returning QueryBuilder



