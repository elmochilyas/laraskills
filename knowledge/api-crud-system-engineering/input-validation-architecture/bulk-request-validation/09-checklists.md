# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Bulk Request Validation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Bulk Request Validation implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Bulk Request Validation
- [ ] Full test coverage for Bulk Request Validation
- [ ] Security review completed for Bulk Request Validation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Bulk Request Validation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define bulk requests as separate FormRequests (`BulkStorePostsRequest`).
- [ ] Use wildcard rules for per-item validation.
- [ ] Use `after()` hook for cross-item uniqueness checks.
- [ ] Transform error responses to include per-item pointers.
- [ ] For service-layer bulk validation, iterate with `Validator::make()` per item.
- [ ] Use `BulkResult` return type with `valid` and `failed` arrays.
- [ ] Set `max` based on expected row size and processing capacity.

---

# Implementation Checklist

- [ ] Outer array is validated for min/max size
- [ ] Each row uses `*.*` dot-notation for field rules
- [ ] Bulk update unique rules use per-row ID as ignore value
- [ ] Bulk create unique rules have no ignore value
- [ ] Error messages include row index for debugging
- [ ] Required rules apply to each row independently
- [ ] Nested array validation handles nullable/missing rows gracefully
- [ ] Implement Bulk Request Validation following input-validation-architecture patterns
- [ ] Configure all required settings for Bulk Request Validation
- [ ] Register route/middleware/service for Bulk Request Validation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Set `max` on bulk array size to bound computation (50-500 depending on resource).
- [ ] Cross-item uniqueness checks are O(n) â€” fine for n < 1000.
- [ ] Wildcard `exists` rules execute one query per unique value â€” batch with `whereIn`.
- [ ] Per-item loop validation is O(n) with O(n) total validation cost.
- [ ] Memory: cross-item checks store all values for comparison â€” consider streaming for very large batches.

---

# Security Checklist

- [ ] Enforce hard `max` limit on bulk array size to prevent resource exhaustion.
- [ ] Cross-item uniqueness checks prevent duplicate injection across batch.
- [ ] Per-item error reporting must not leak data about other items.
- [ ] Bulk endpoints often bypass normal rate limits â€” apply appropriate throttling.
- [ ] Log bulk operation anomalies for abuse detection.
- [ ] Ensure authorization is checked for the batch operation, not just per-item.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All bulk arrays have `min` and `max` constraints
- [ ] Wildcard rules cover all per-item validation
- [ ] Cross-item validation exists in `after()` hook
- [ ] Error responses include per-item pointers
- [ ] Partial success returns 200/201 with meta.failed
- [ ] Batch size limits are documented in API contract
- [ ] Integration tests verify both all-valid and partial-failure scenarios
- [ ] Write feature tests for happy path of Bulk Request Validation
- [ ] Write feature tests for validation failure of Bulk Request Validation
- [ ] Write feature tests for authentication failure of Bulk Request Validation
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

- [ ] Avoid: All-or-Nothing Rejection
- [ ] Avoid: No Per-Item Error Reporting
- [ ] Avoid: No max on Bulk Array
- [ ] Avoid: Same Rate Limit as Single Endpoints
- [ ] Avoid: Async Processing With No Validation

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
- Always Enforce Hard max on Bulk Arrays
- Use Wildcard Rules for Per-Item Validation
- Use after() Hook for Cross-Item Uniqueness, Not distinct
- Return Per-Item Errors with Proper Pointers
- Return Partial Success, Not All-or-Nothing
- Use Separate FormRequests for Bulk Operations
- Consider Async for Batches Larger Than 100 Items

### Anti-Patterns
- All-or-Nothing Rejection
- No Per-Item Error Reporting
- No max on Bulk Array
- Same Rate Limit as Single Endpoints
- Async Processing With No Validation

## Related Knowledge
- Form Request Design for APIs (base request structure)
- Validation Rule Array Design (wildcard and array validation basics)
- Custom Validation Rules (custom rules for cross-item checks)
- Manual Validator Creation (per-item validation in service layer)
- Bulk Operation Design (broader bulk operation architecture)



