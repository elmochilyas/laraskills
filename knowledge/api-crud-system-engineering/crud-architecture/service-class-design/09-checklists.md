# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Service Class Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Service Class Design implementation follows crud-architecture patterns
- [ ] All edge cases handled for Service Class Design
- [ ] Full test coverage for Service Class Design
- [ ] Security review completed for Service Class Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Service Class Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Entity-oriented services are the default for CRUD-heavy domains
- [ ] Capability-oriented services are preferred for cross-cutting processes (checkout, export, authentication)
- [ ] Services may call sub-actions internally â€” the actions remain independently testable
- [ ] Services must NOT import HTTP-related classes (Request, Response)
- [ ] Singleton registration is safe only if the service is stateless
- [ ] Framework does not enforce service conventions â€” discipline must come from team rules

---

# Implementation Checklist

- [ ] Service class per domain
- [ ] Stateless â€” all state via parameters
- [ ] Constructor injection
- [ ] Typed public methods
- [ ] DTOs for complex parameters
- [ ] Domain exceptions for failures
- [ ] Registered in container
- [ ] Independently testable
- [ ] Single domain responsibility
- [ ] Implement Service Class Design following crud-architecture patterns
- [ ] Configure all required settings for Service Class Design
- [ ] Register route/middleware/service for Service Class Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Container resolution cost is proportional to dependency depth â€” 4 direct dependencies with transitive deps adds ~0.05ms
- [ ] Singletons eliminate resolution cost after first resolution
- [ ] Stateless services registered as singletons pay resolution cost once per process lifetime

---

# Security Checklist

- [ ] Never inject `Request` into a service â€” pass request-specific data as method parameters
- [ ] Authorization checks should happen in the controller or be passed as an authorized actor parameter
- [ ] Services should not implicitly trust DTO data â€” business rule validation belongs in the service method
- [ ] Stateless services prevent cross-request data leaks under Octane

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Service is stateless (no per-request mutable properties)
- [ ] Service constructor has fewer than 5 dependencies
- [ ] Service has fewer than 10 public methods
- [ ] Service does not import HTTP-related classes
- [ ] Service methods accept DTOs, not `$request`
- [ ] Service is testable without HTTP scaffolding
- [ ] Service methods are cohesive (share 50%+ of dependencies)
- [ ] Service is in `app/Services/`, not under `app/Http/`
- [ ] Write feature tests for happy path of Service Class Design
- [ ] Write feature tests for validation failure of Service Class Design
- [ ] Write feature tests for authentication failure of Service Class Design
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

- [ ] Avoid: God Service
- [ ] Avoid: Constructor Explosion
- [ ] Avoid: Hidden State Leaks
- [ ] Avoid: Service Under Http/
- [ ] Avoid: Empty Forwarding Service

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
- Rule 1: Keep Constructor Dependencies Below 5
- Rule 2: Keep Public Methods Below 10
- Rule 3: Enforce Statelessness â€” No Mutable Properties
- Rule 4: Never Import HTTP Classes in Services
- Rule 5: Use the Cohesion Check â€” 50% Dependency Sharing
- Rule 6: Place Services in app/Services/, Not Under app/Http/

### Anti-Patterns
- God Service
- Constructor Explosion
- Hidden State Leaks
- Service Under Http/
- Empty Forwarding Service



