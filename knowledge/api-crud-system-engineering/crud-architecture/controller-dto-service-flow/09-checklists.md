# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Controller-DTO-Service Flow
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller-DTO-Service Flow implementation follows crud-architecture patterns
- [ ] All edge cases handled for Controller-DTO-Service Flow
- [ ] Full test coverage for Controller-DTO-Service Flow
- [ ] Security review completed for Controller-DTO-Service Flow
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller-DTO-Service Flow
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] A service constructor with 5+ dependencies is a warning signal; 8+ requires immediate refactoring
- [ ] Services can delegate to action classes internally â€” the action classes remain independently testable
- [ ] Interface bindings are needed only when polymorphism is required; concrete service classes resolve automatically
- [ ] Stateless services can safely be bound as singletons, paying resolution cost once per process lifetime

---

# Implementation Checklist

- [ ] Service is stateless (no per-request mutable properties)
- [ ] Service constructor has <5 dependencies
- [ ] Service has <8 public methods
- [ ] Service does not import HTTP-related classes
- [ ] Service methods accept DTOs, not `$request`
- [ ] Service is testable without HTTP scaffolding
- [ ] Service methods are cohesive (same domain capability)
- [ ] Implement Controller-DTO-Service Flow following crud-architecture patterns
- [ ] Configure all required settings for Controller-DTO-Service Flow
- [ ] Register route/middleware/service for Controller-DTO-Service Flow
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Service resolution cost is proportional to dependency depth: 4 dependencies Ã— their deps â‰ˆ 8 resolutions at ~0.01ms each
- [ ] Stateless services bound as singletons pay this cost once per process lifetime
- [ ] Compared to database query time (1-50ms), service resolution overhead is irrelevant

---

# Security Checklist

- [ ] Never inject `Request` or `Response` into a service â€” this creates HTTP coupling and bypasses request validation
- [ ] Authorization checks should happen in the controller or be passed as an authorized actor parameter
- [ ] Services should not implicitly trust DTO data â€” business rule validation belongs in the service method

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
- [ ] Service has fewer than 8 public methods
- [ ] Service does not import HTTP-related classes
- [ ] Service methods accept DTOs, not `$request`
- [ ] Service is testable without HTTP scaffolding
- [ ] Service methods are cohesive (all relate to the same domain capability)
- [ ] Write feature tests for happy path of Controller-DTO-Service Flow
- [ ] Write feature tests for validation failure of Controller-DTO-Service Flow
- [ ] Write feature tests for authentication failure of Controller-DTO-Service Flow
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

- [ ] Avoid: Service as Dumping Ground
- [ ] Avoid: Service Circular Dependencies
- [ ] Avoid: Stateful Service
- [ ] Avoid: Empty CRUD Service
- [ ] Avoid: Service with HTTP Dependencies

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
- Rule 1: Keep Service Public Methods to 6-8 Maximum
- Rule 2: Limit Constructor Dependencies to 5
- Rule 3: Never Inject Request or Response into Services
- Rule 4: Keep Services Stateless
- Rule 5: Construct DTOs Before Calling Service
- Rule 6: Test Services Directly Without HTTP

### Anti-Patterns
- Service as Dumping Ground
- Service Circular Dependencies
- Stateful Service
- Empty CRUD Service
- Service with HTTP Dependencies



