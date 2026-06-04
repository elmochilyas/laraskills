# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Code Taxonomy
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Error Code Taxonomy implementation follows error-handling-design patterns
- [ ] All edge cases handled for Error Code Taxonomy
- [ ] Full test coverage for Error Code Taxonomy
- [ ] Security review completed for Error Code Taxonomy
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Code Taxonomy

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Error Code Taxonomy
- [ ] Document architectural decisions (ADR) for Error Code Taxonomy
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with error-handling-design standards

---

# Implementation Checklist

- [ ] Error code format defined: `CATEGORY_CODE`
- [ ] Categories defined for all error types
- [ ] Each error type has unique code
- [ ] Validation, auth, authorization, not-found, conflict, rate-limit, server categories covered
- [ ] Codes sequential within categories
- [ ] Error codes returned in error envelope
- [ ] Error code taxonomy documented with descriptions
- [ ] Codes never reused â€” deprecated when removed
- [ ] Client can differentiate error types by code prefix
- [ ] Tests verify correct error code per scenario
- [ ] Implement Error Code Taxonomy following error-handling-design patterns
- [ ] Configure all required settings for Error Code Taxonomy
- [ ] Register route/middleware/service for Error Code Taxonomy
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

- [ ] Write feature tests for happy path of Error Code Taxonomy
- [ ] Write feature tests for validation failure of Error Code Taxonomy
- [ ] Write feature tests for authentication failure of Error Code Taxonomy
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



