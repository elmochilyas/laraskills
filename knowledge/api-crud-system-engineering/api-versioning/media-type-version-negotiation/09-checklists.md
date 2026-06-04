# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Media Type Version Negotiation
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Media Type Version Negotiation implementation follows api-versioning patterns
- [ ] All edge cases handled for Media Type Version Negotiation
- [ ] Full test coverage for Media Type Version Negotiation
- [ ] Security review completed for Media Type Version Negotiation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Media Type Version Negotiation

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Media Type Version Negotiation
- [ ] Document architectural decisions (ADR) for Media Type Version Negotiation
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with api-versioning standards

---

# Implementation Checklist

- [ ] Middleware parses Accept header per RFC 2295
- [ ] Version resolved from Accept parameter, not URL
- [ ] Version attached to request attributes
- [ ] Response Content-Type matches negotiated version
- [ ] Wildcard fallback resolves to latest stable version
- [ ] 406 Not Acceptable returned for unsupported media types
- [ ] 406 response includes `available` link header
- [ ] Tests cover Accept strings for all supported versions
- [ ] Tests cover 406 case for unsupported Accept
- [ ] Implement Media Type Version Negotiation following api-versioning patterns
- [ ] Configure all required settings for Media Type Version Negotiation
- [ ] Register route/middleware/service for Media Type Version Negotiation
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

- [ ] Write feature tests for happy path of Media Type Version Negotiation
- [ ] Write feature tests for validation failure of Media Type Version Negotiation
- [ ] Write feature tests for authentication failure of Media Type Version Negotiation
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



