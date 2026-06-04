# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Search Query Patterns
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Search Query Patterns implementation follows rest-api-design patterns
- [ ] All edge cases handled for Search Query Patterns
- [ ] Full test coverage for Search Query Patterns
- [ ] Security review completed for Search Query Patterns
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Search Query Patterns

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Search Query Patterns
- [ ] Document architectural decisions (ADR) for Search Query Patterns
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with rest-api-design standards

---

# Implementation Checklist

- [ ] Search approach chosen (Scout or full-text index)
- [ ] Search indexes configured
- [ ] `q` or `search` query parameter accepted
- [ ] Searchable fields whitelist defined
- [ ] Special characters escaped for search engine
- [ ] Relevance scoring and sorting implemented
- [ ] Combined with filters and pagination
- [ ] Minimum query length enforced
- [ ] Empty/short query returns empty results or full list
- [ ] Search queries logged (anonymized)
- [ ] Implement Search Query Patterns following rest-api-design patterns
- [ ] Configure all required settings for Search Query Patterns
- [ ] Register route/middleware/service for Search Query Patterns
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

- [ ] Write feature tests for happy path of Search Query Patterns
- [ ] Write feature tests for validation failure of Search Query Patterns
- [ ] Write feature tests for authentication failure of Search Query Patterns
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



