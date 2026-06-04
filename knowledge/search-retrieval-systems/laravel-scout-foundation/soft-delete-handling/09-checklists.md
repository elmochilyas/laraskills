# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 01-laravel-scout-foundation
**Knowledge Unit:** Soft Delete Handling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Soft Delete Handling implementation follows 01-laravel-scout-foundation patterns
- [ ] All edge cases handled for Soft Delete Handling
- [ ] Full test coverage for Soft Delete Handling
- [ ] Security review completed for Soft Delete Handling
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Soft Delete Handling

---

# Architecture Checklist

- [ ] Add `SoftDeletes` trait to model: Scout handles the rest automatically.
- [ ] The `__soft_deleted` attribute is automatically included in `toSearchableArray()`.
- [ ] For custom soft delete implementations, manually manage the `__soft_deleted` attribute.
- [ ] Filter by `__soft_deleted` in search queries if you need to include soft-deleted records.
- [ ] Evaluate: Searchable Trait Implementation Strategy
- [ ] Evaluate: Indexing Strategy Selection
- [ ] Evaluate: Queue vs Synchronous Indexing Mode

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Soft Delete Handling following 01-laravel-scout-foundation patterns
- [ ] Configure all required settings for Soft Delete Handling
- [ ] Register route/middleware/service for Soft Delete Handling
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Soft delete operations trigger a search engine update API call (same as any model save).
- [ ] Batch soft deleting many records at once should use `withoutSyncingToSearch()` + batch re-index.
- [ ] Each soft delete/restore results in one index update operation.

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

- [ ] SoftDeletes trait on model with Searchable
- [ ] Soft-deleted records excluded from search results
- [ ] Restored records reappear in search
- [ ] forceDelete removes from index
- [ ] __soft_deleted attribute present in index
- [ ] Write feature tests for happy path of Soft Delete Handling
- [ ] Write feature tests for validation failure of Soft Delete Handling
- [ ] Write feature tests for authentication failure of Soft Delete Handling
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
- Use SoftDeletes Trait for Automatic Scout Handling
- Test Soft Delete/Force Delete Index Behavior
- Use forceDelete for Complete Index Removal

### Decisions
- Searchable Trait Implementation Strategy
- Indexing Strategy Selection
- Queue vs Synchronous Indexing Mode

## Related Knowledge
- K001 (Searchable trait)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)
- K009 (scout:import / scout:flush)



