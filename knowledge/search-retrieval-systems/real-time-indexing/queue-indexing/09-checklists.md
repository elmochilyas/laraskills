# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 12-real-time-indexing
**Knowledge Unit:** Queue Indexing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Queue Indexing implementation follows 12-real-time-indexing patterns
- [ ] All edge cases handled for Queue Indexing
- [ ] Full test coverage for Queue Indexing
- [ ] Security review completed for Queue Indexing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Queue Indexing

---

# Architecture Checklist

- [ ] Evaluate: Real-Time Indexing Strategy
- [ ] Evaluate: Model Observer vs Queue Job Indexing
- [ ] Evaluate: Index Failure Recovery Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Queue Indexing following 12-real-time-indexing patterns
- [ ] Configure all required settings for Queue Indexing
- [ ] Register route/middleware/service for Queue Indexing
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

- [ ] queue = true in config/scout.php
- [ ] Queue connection configured (Redis/database/SQS)
- [ ] Failed job monitoring in place
- [ ] Timeout configured for index jobs
- [ ] Dev environment has queue disabled
- [ ] Write feature tests for happy path of Queue Indexing
- [ ] Write feature tests for validation failure of Queue Indexing
- [ ] Write feature tests for authentication failure of Queue Indexing
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

### Rules
- Rule Name

### Decisions
- Real-Time Indexing Strategy
- Model Observer vs Queue Job Indexing
- Index Failure Recovery Strategy

## Related Knowledge
- K001 (Searchable trait)
- K009 (scout:import / scout:flush)
- K002 (Indexing strategies)



