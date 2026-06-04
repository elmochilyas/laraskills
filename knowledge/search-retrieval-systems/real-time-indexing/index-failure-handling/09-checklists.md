# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 12-real-time-indexing
**Knowledge Unit:** Index Failure Handling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Index Failure Handling implementation follows 12-real-time-indexing patterns
- [ ] All edge cases handled for Index Failure Handling
- [ ] Full test coverage for Index Failure Handling
- [ ] Security review completed for Index Failure Handling
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Index Failure Handling

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
- [ ] Implement Index Failure Handling following 12-real-time-indexing patterns
- [ ] Configure all required settings for Index Failure Handling
- [ ] Register route/middleware/service for Index Failure Handling
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

- [ ] Queue retry configured
- [ ] Failed job monitoring in place
- [ ] Health checks for search engine
- [ ] Fallback to database on engine failure
- [ ] Alerting on indexing failure thresholds
- [ ] Periodic consistency checks scheduled
- [ ] Dead letter queue for persistent failures
- [ ] Write feature tests for happy path of Index Failure Handling
- [ ] Write feature tests for validation failure of Index Failure Handling
- [ ] Write feature tests for authentication failure of Index Failure Handling
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
- K004 (Queue indexing)
- K009 (scout:import)
- K017 (Soft delete handling)



