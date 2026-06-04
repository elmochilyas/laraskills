# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Data Wrapping Configuration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Data Wrapping Configuration implementation follows response-structures patterns
- [ ] All edge cases handled for Data Wrapping Configuration
- [ ] Full test coverage for Data Wrapping Configuration
- [ ] Security review completed for Data Wrapping Configuration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Data Wrapping Configuration
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] All resource classes should either wrap consistently or all not wrap â€” mixing creates the worst client experience.
- [ ] For JSON:API compliance, `$wrap` must always be `'data'` â€” custom wrapper keys violate the spec.
- [ ] Collection wrapping and single-resource wrapping can be configured independently â€” decide both.
- [ ] When migrating from wrapped to unwrapped (or vice versa), use version-specific resource classes to avoid breaking existing clients.
- [ ] Evaluate: Wrapper Key Strategy
- [ ] Evaluate: Collection vs Single-Resource Wrapping Consistency
- [ ] Evaluate: Wrapping Inheritance and Override Management

---

# Implementation Checklist

- [ ] Wrapper key strategy decided (data, null, or custom)
- [ ] Global wrapper set in AppServiceProvider or per-resource
- [ ] `withoutWrapping()` applied where needed
- [ ] Wrapper consistent across all resources
- [ ] Collections wrapped correctly via `::collection()`
- [ ] Paginated responses wrapped correctly
- [ ] Single resources wrapped correctly
- [ ] Empty collections wrapped in envelope format
- [ ] Wrapper behavior tested for all resource types
- [ ] Wrapper key stable within version
- [ ] Implement Data Wrapping Configuration following response-structures patterns
- [ ] Configure all required settings for Data Wrapping Configuration
- [ ] Register route/middleware/service for Data Wrapping Configuration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Wrapping operation is a single `array_merge` â€” performance impact is negligible.
- [ ] For collections of 1000+ items, the wrapping step loops to nest under the key.
- [ ] Serialization pipeline cost is dominated by `toArray()`, not the wrapping step.

---

# Security Checklist

- [ ] No direct security impact. However, inconsistent wrapping can mask response structure issues during security review.
- [ ] If wrapper key names match resource names, they leak model naming conventions to clients.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every resource class either explicitly declares `$wrap` or inherits from a base class that does.
- [ ] All endpoints in the same API version return the same wrapping structure.
- [ ] Integration tests verify wrapping key presence/absence for every resource endpoint.
- [ ] `withoutWrapping()` and `withoutWrappingCollection()` are not called conditionally in response to request state.
- [ ] Write feature tests for happy path of Data Wrapping Configuration
- [ ] Write feature tests for validation failure of Data Wrapping Configuration
- [ ] Write feature tests for authentication failure of Data Wrapping Configuration
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

- [ ] Avoid: Inconsistent Data Wrapping
- [ ] Avoid: Always Wrapping Single Resources
- [ ] Avoid: No Wrapping Strategy Documentation
- [ ] Avoid: Wrapping Without Standard Envelope
- [ ] Avoid: Client-Conflicting Wrapping Changes

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
- Rule 1: Declare `$wrap` as Public Static
- Rule 2: Use a Base Resource Class for Consistent Wrapping
- Rule 3: Never Call `withoutWrapping()` Conditionally
- Rule 4: Configure Collection Wrapping Independently
- Rule 5: Never Override `$wrap` in Child Classes Without Explicit Intent
- Rule 6: Test Wrapping Behavior Exhaustively in a Single Test

### Decisions
- Wrapper Key Strategy
- Collection vs Single-Resource Wrapping Consistency
- Wrapping Inheritance and Override Management

### Anti-Patterns
- Inconsistent Data Wrapping
- Always Wrapping Single Resources
- No Wrapping Strategy Documentation
- Wrapping Without Standard Envelope
- Client-Conflicting Wrapping Changes

## Related Knowledge
- Prerequisites
- Related
- Advanced



