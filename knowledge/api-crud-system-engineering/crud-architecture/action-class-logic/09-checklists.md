# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Action Class Logic
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Action Class Logic implementation follows crud-architecture patterns
- [ ] All edge cases handled for Action Class Logic
- [ ] Full test coverage for Action Class Logic
- [ ] Security review completed for Action Class Logic
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Action Class Logic

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Action Class Logic
- [ ] Document architectural decisions (ADR) for Action Class Logic
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with crud-architecture standards

---

# Implementation Checklist

- [ ] Action class created per single responsibility
- [ ] `__invoke()` method used for invokable pattern
- [ ] Constructor injection for dependencies
- [ ] Typed parameters (DTO or individual params)
- [ ] Typed return values
- [ ] Domain events fired within action
- [ ] Multi-step operations wrapped in DB::transaction()
- [ ] Action is stateless â€” all state via parameters
- [ ] Action registered in container
- [ ] Domain exceptions thrown for business failures
- [ ] Implement Action Class Logic following crud-architecture patterns
- [ ] Configure all required settings for Action Class Logic
- [ ] Register route/middleware/service for Action Class Logic
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

- [ ] Write feature tests for happy path of Action Class Logic
- [ ] Write feature tests for validation failure of Action Class Logic
- [ ] Write feature tests for authentication failure of Action Class Logic
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



