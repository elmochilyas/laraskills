# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Api Response Metadata
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Api Response Metadata implementation follows response-structures patterns
- [ ] All edge cases handled for Api Response Metadata
- [ ] Full test coverage for Api Response Metadata
- [ ] Security review completed for Api Response Metadata
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Api Response Metadata

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Api Response Metadata
- [ ] Document architectural decisions (ADR) for Api Response Metadata
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with response-structures standards

---

# Implementation Checklist

- [ ] `request_id` present in all response envelopes
- [ ] `timestamp` in ISO 8601 UTC format in all response envelopes
- [ ] `api_version` present in all response envelopes
- [ ] Pagination fields in `meta` for paginated responses
- [ ] Request-level meta injected via middleware
- [ ] Resource-specific meta via `additional()` method
- [ ] Timestamp is ISO 8601 UTC, never local time
- [ ] Request_id is UUID v4 format
- [ ] Internal meta excluded from envelope (in headers/logs)
- [ ] Meta structure stable â€” no breaking changes within version
- [ ] Implement Api Response Metadata following response-structures patterns
- [ ] Configure all required settings for Api Response Metadata
- [ ] Register route/middleware/service for Api Response Metadata
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

- [ ] Write feature tests for happy path of Api Response Metadata
- [ ] Write feature tests for validation failure of Api Response Metadata
- [ ] Write feature tests for authentication failure of Api Response Metadata
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



