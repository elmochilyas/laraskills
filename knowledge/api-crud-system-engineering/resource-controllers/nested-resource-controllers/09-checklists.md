# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Nested Resource Controllers
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Nested Resource Controllers implementation follows resource-controllers patterns
- [ ] All edge cases handled for Nested Resource Controllers
- [ ] Full test coverage for Nested Resource Controllers
- [ ] Security review completed for Nested Resource Controllers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Nested Resource Controllers

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Nested Resource Controllers
- [ ] Document architectural decisions (ADR) for Nested Resource Controllers
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with resource-controllers standards

---

# Implementation Checklist

- [ ] Nested routes registered with `apiResource()` dotted syntax
- [ ] Scoped bindings used to authorize parent-child relationship
- [ ] Nesting depth â‰¤ 2 levels
- [ ] Shallow routes used for 3-level nesting where justified
- [ ] Controller methods receive scoped models when applicable
- [ ] Index queries filtered to parent scope
- [ ] Authorization enforced via scoped binding (child not found if wrong parent)
- [ ] `only()`/`except()` restricts non-standard nested CRUD
- [ ] API doc describes nested resource relationship
- [ ] Integration tests verify parent-child authorization
- [ ] Implement Nested Resource Controllers following resource-controllers patterns
- [ ] Configure all required settings for Nested Resource Controllers
- [ ] Register route/middleware/service for Nested Resource Controllers
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

- [ ] Write feature tests for happy path of Nested Resource Controllers
- [ ] Write feature tests for validation failure of Nested Resource Controllers
- [ ] Write feature tests for authentication failure of Nested Resource Controllers
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



