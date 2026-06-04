# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Resource Controller Methods
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Resource Controller Methods implementation follows resource-controllers patterns
- [ ] All edge cases handled for Resource Controller Methods
- [ ] Full test coverage for Resource Controller Methods
- [ ] Security review completed for Resource Controller Methods
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Resource Controller Methods

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Resource Controller Methods
- [ ] Document architectural decisions (ADR) for Resource Controller Methods
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with resource-controllers standards

---

# Implementation Checklist

- [ ] `index` returns `Resource::collection(Model::paginate())`
- [ ] `store` returns `new Resource($model)` with 201
- [ ] `show` returns `new Resource($model)` with 200
- [ ] `update` returns `new Resource($model)` with 200
- [ ] `destroy` returns 204 No Content
- [ ] Model parameters type-hinted for route model binding
- [ ] Specific Form Requests injected for store/update
- [ ] `$this->authorize()` called before business logic
- [ ] Correct HTTP status codes per method
- [ ] Methods under 10 lines â€” business logic delegated
- [ ] Implement Resource Controller Methods following resource-controllers patterns
- [ ] Configure all required settings for Resource Controller Methods
- [ ] Register route/middleware/service for Resource Controller Methods
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Measure response time before and after implementation
- [ ] Add query count monitoring - N+1 detection
- [ ] Use eager loading for all relationships
- [ ] Add caching where appropriate for read-heavy endpoints
- [ ] Profile memory usage for large payloads

---

# Security Checklist

- [ ] Validate all input - never trust client data
- [ ] Apply authorization checks for every operation
- [ ] Sanitize output to prevent injection attacks
- [ ] Rate limit exposed endpoints
- [ ] Log security-relevant events

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Resource Controller Methods
- [ ] Write feature tests for validation failure of Resource Controller Methods
- [ ] Write feature tests for authentication failure of Resource Controller Methods
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



