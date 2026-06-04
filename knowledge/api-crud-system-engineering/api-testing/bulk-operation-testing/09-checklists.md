# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Bulk Operation Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Bulk Operation Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Bulk Operation Testing
- [ ] Full test coverage for Bulk Operation Testing
- [ ] Security review completed for Bulk Operation Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Bulk Operation Testing
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Transactional (all-or-nothing) is simpler but fails entire batch for one bad item.
- [ ] Batch (partial success) is more user-friendly â€” fix one bad item, resubmit.
- [ ] Most production APIs use batch processing with partial success for mutating operations.
- [ ] Use transactional processing for operations that cannot be partially applied (e.g., financial transfers).
- [ ] Always enforce strict batch size limits (100-500 items max depending on complexity).

---

# Implementation Checklist

- [ ] All-succeed batch returns data for all items, no errors
- [ ] All-fail batch returns errors for all items, no data
- [ ] Partial success returns correct success/error counts with per-item indexing
- [ ] Batch size limits enforced (min and max)
- [ ] Empty batch rejected
- [ ] Transactional rollback verified (no partial persistence)
- [ ] Per-item error structure matches input array indices
- [ ] Concurrent request handling tested if applicable
- [ ] Implement Bulk Operation Testing following api-testing patterns
- [ ] Configure all required settings for Bulk Operation Testing
- [ ] Register route/middleware/service for Bulk Operation Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Bulk endpoints are sensitive to payload size â€” 100 items = 100x memory of single item.
- [ ] Test with maximum batch size to identify memory issues.
- [ ] Create large payloads using factories: `factory()->count(100)->raw()`.
- [ ] Measure response time per item count â€” may need paginated batch processing.
- [ ] Use `DB::beginTransaction()` + chunked processing within transaction for bounded memory.

---

# Security Checklist

- [ ] Bulk operations can generate 100x the load of normal requests â€” rate limit separately.
- [ ] Validate that users can only operate on resources they own (authorization per item).
- [ ] Avoid SQL injection via batch payloads â€” use parameter binding, not string concatenation.
- [ ] Log per-item failures for audit trails.
- [ ] Implement idempotency for bulk endpoints (one idempotency key for the entire batch).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All-succeed batch returns data for all items, no errors
- [ ] All-fail batch returns errors for all items, no data
- [ ] Partial success returns correct success/error counts with per-item indexing
- [ ] Batch size limits are enforced (min and max)
- [ ] Empty batch is rejected
- [ ] Transactional rollback is verified (no partial persistence on failure)
- [ ] Per-item error structure matches input array indices
- [ ] Write feature tests for happy path of Bulk Operation Testing
- [ ] Write feature tests for validation failure of Bulk Operation Testing
- [ ] Write feature tests for authentication failure of Bulk Operation Testing
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

- [ ] Avoid: No Partial Success Testing
- [ ] Avoid: Server-Side Sorting With Index Mismatch
- [ ] Avoid: Unlimited Batch Size
- [ ] Avoid: Silent Partial Failures
- [ ] Avoid: Transactional Without Rollback Test

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
- Test Partial Success Scenario
- Test Batch Size Limits
- Assert Per-Item Error Structure
- Test Transactional Rollback
- Test Concurrent Request Handling

### Anti-Patterns
- No Partial Success Testing
- Server-Side Sorting With Index Mismatch
- Unlimited Batch Size
- Silent Partial Failures
- Transactional Without Rollback Test

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



