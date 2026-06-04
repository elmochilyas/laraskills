# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Controller-Service-Repository Flow
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller-Service-Repository Flow implementation follows crud-architecture patterns
- [ ] All edge cases handled for Controller-Service-Repository Flow
- [ ] Full test coverage for Controller-Service-Repository Flow
- [ ] Security review completed for Controller-Service-Repository Flow
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller-Service-Repository Flow
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Repositories contain: query logic, filtering/sorting/pagination, eager loading, caching, raw database operations
- [ ] Repositories do NOT contain: business rules, validation, event dispatching, cross-entity orchestration
- [ ] Service layer handles business rules; repository handles data access
- [ ] Interface binding in service provider: `$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`
- [ ] Consider read/write repository separation (CQRS-light) for applications with different query and command optimization needs

---

# Implementation Checklist

- [ ] Controllers never call Eloquent models directly
- [ ] Services never run raw queries or call Eloquent directly
- [ ] All data access mediated through repository interfaces
- [ ] Repository methods do not return QueryBuilders
- [ ] Repository interfaces registered in service provider
- [ ] Each layer has single, clear responsibility
- [ ] Ceremony justified by application complexity
- [ ] Implement Controller-Service-Repository Flow following crud-architecture patterns
- [ ] Configure all required settings for Controller-Service-Repository Flow
- [ ] Register route/middleware/service for Controller-Service-Repository Flow
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Repository layer adds ~0.001ms per data operation (method call overhead)
- [ ] Interface resolution adds ~0.005ms container lookup cost per resolution
- [ ] Compared to database query time (1-50ms), the overhead is irrelevant
- [ ] Caching at the repository level can dramatically reduce database load
- [ ] Decorator-based caching (CachedUserRepository wrapping real repository) adds no measurable overhead

---

# Security Checklist

- [ ] Repository-level query scoping is critical for multi-tenant data isolation â€” never let raw Eloquenmt bypass this
- [ ] Returning QueryBuilders from repositories allows callers to add un-scoped queries, breaking tenant isolation
- [ ] Repository caching must respect authorization â€” never cache data that should be user-scoped without proper cache key namespacing
- [ ] Write repositories should not expose soft-deleted records unless explicitly intended

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Controllers never call Eloquent models directly
- [ ] Services never run raw queries or call Eloquent directly
- [ ] All data access is mediated through repository interfaces
- [ ] Repository methods do not return QueryBuilders
- [ ] Repository interfaces exist for every repository
- [ ] Interface bindings are registered in a service provider
- [ ] Each layer has a single, clear responsibility
- [ ] Ceremony is justified by application complexity
- [ ] Write feature tests for happy path of Controller-Service-Repository Flow
- [ ] Write feature tests for validation failure of Controller-Service-Repository Flow
- [ ] Write feature tests for authentication failure of Controller-Service-Repository Flow
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
- [ ] Avoid: Anemic Service with Complete Repository
- [ ] Avoid: Leaking Eloquent Through Repository
- [ ] Avoid: Repository Without Interface

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
- Rule 1: Controllers Must Never Bypass the Service Layer
- Rule 2: Repository Methods Must Not Return QueryBuilders
- Rule 3: Services Must Never Call Eloquent Directly When Repositories Exist
- Rule 4: Register Repository Interface Bindings in a Service Provider
- Rule 5: Repositories Must Not Contain Business Logic
- Rule 6: Add Repository Abstractions Only Where They Add Value
- Rule 7: Use Criteria Objects Instead of Too-Fine Repository Methods

### Anti-Patterns
- Ceremony Without Benefit
- Repository Leakage
- Anemic Service with Complete Repository
- Leaking Eloquent Through Repository
- Repository Without Interface



