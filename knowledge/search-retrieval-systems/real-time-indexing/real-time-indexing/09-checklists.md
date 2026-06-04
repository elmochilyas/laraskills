# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 12-real-time-indexing
**Knowledge Unit:** Real Time Indexing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Real Time Indexing implementation follows 12-real-time-indexing patterns
- [ ] All edge cases handled for Real Time Indexing
- [ ] Full test coverage for Real Time Indexing
- [ ] Security review completed for Real Time Indexing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Real Time Indexing

---

# Architecture Checklist

- [ ] Pair observer-based sync with queue-based async processing in production
- [ ] Gate expensive model relationships with `searchIndexShouldBeUpdated()`
- [ ] Use `withoutSyncingToSearch()` for bulk Eloquent operations
- [ ] Avoid bypassing observers with direct database modifications
- [ ] Evaluate: Real-Time Indexing Strategy
- [ ] Evaluate: Model Observer vs Queue Job Indexing
- [ ] Evaluate: Index Failure Recovery Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Real Time Indexing following 12-real-time-indexing patterns
- [ ] Configure all required settings for Real Time Indexing
- [ ] Register route/middleware/service for Real Time Indexing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Synchronous indexing adds search engine latency (20-200ms) to HTTP response time
- [ ] Queued indexing adds ~1-5ms for job dispatch but defers actual index operation
- [ ] Frequently updated models (view counters) waste resources if indexed on every change

---

# Security Checklist

- [ ] Observer sync respects model authorization boundaries
- [ ] Soft-deleted models remain in index until force-deleted
- [ ] Ensure observer logic doesn't expose data that should be excluded from search

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Real Time Indexing
- [ ] Write feature tests for validation failure of Real Time Indexing
- [ ] Write feature tests for authentication failure of Real Time Indexing
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
- K004 (Scout queue integration)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)
- K009 (scout:import / scout:flush)



