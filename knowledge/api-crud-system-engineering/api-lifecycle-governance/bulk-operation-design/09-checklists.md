# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Bulk Operation Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Bulk Operation Design implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Bulk Operation Design
- [ ] Full test coverage for Bulk Operation Design
- [ ] Security review completed for Bulk Operation Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Bulk Operation Design

---

# Architecture Checklist

- [ ] Endpoint pattern: `POST /resources/bulk` for mixed or `POST /resources/bulk-create` for single-operation batches.
- [ ] Response order must match request order so consumers can correlate results.
- [ ] Bulk calls count as 1 request against rate limit, not N operations.
- [ ] Async bulk for batches > 500 with callback/webhook for result delivery.
- [ ] Validation of batch envelope (size limit, format) before processing any operations.
- [ ] Evaluate: Atomicity Level â€” Per-Operation vs Full-Batch Transaction
- [ ] Evaluate: Synchronous vs Async Bulk Processing

---

# Implementation Checklist

- [ ] Response order matches request order
- [ ] Batch size limit enforced (max 500)
- [ ] Per-operation transactions (non-atomic by default)
- [ ] Per-operation validation and authorization
- [ ] Bulk request counted as single rate limit hit
- [ ] Per-operation correlation IDs in request and response
- [ ] Internal chunked processing (50 per chunk, max 10 threads)
- [ ] Per-operation error details in response
- [ ] Implement Bulk Operation Design following api-lifecycle-governance patterns
- [ ] Configure all required settings for Bulk Operation Design
- [ ] Register route/middleware/service for Bulk Operation Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Parallel processing limited to 10 threads max to avoid resource exhaustion.
- [ ] Large batches (500+) use chunked processing (50 per chunk internally).
- [ ] Memory usage grows linearly with batch size â€” monitor and enforce limits.
- [ ] Database connections pooled per batch; operations share same connection pool.

---

# Security Checklist

- [ ] Validate batch size against consumer tier to prevent DoS via large batches.
- [ ] Each operation validated independently â€” one malicious operation should not affect others.
- [ ] Per-operation authorization checked for each item, not just batch-level.
- [ ] Rate limit bulk requests as single requests to prevent abuse.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Bulk Operation Design
- [ ] Write feature tests for validation failure of Bulk Operation Design
- [ ] Write feature tests for authentication failure of Bulk Operation Design
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
- Rule 1: Preserve Request Order in Response
- Rule 2: Limit Batch Size to 500 Operations
- Rule 3: Use Per-Operation Transactions (Non-Atomic by Default)
- Rule 4: Validate Each Operation Independently
- Rule 5: Count Bulk Requests as Single Rate Limit Unit
- Rule 6: Provide Per-Operation Correlation Identifiers
- Rule 7: Use Chunked Internal Processing for Large Batches

### Decisions
- Atomicity Level â€” Per-Operation vs Full-Batch Transaction
- Synchronous vs Async Bulk Processing

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



