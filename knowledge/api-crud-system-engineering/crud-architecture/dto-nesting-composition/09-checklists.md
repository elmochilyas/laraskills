# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** DTO Nesting and Composition
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] DTO Nesting and Composition implementation follows crud-architecture patterns
- [ ] All edge cases handled for DTO Nesting and Composition
- [ ] Full test coverage for DTO Nesting and Composition
- [ ] Security review completed for DTO Nesting and Composition
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for DTO Nesting and Composition
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Nest when data has a natural hierarchical relationship (Order has Items)
- [ ] Flatten when relationship is incidental â€” DTOs matching Eloquent relationships are natural and predictable
- [ ] Each child DTO is responsible for its own construction â€” the parent only orchestrates
- [ ] DTOs that mirror Eloquent relationships are easier to understand than DTOs with different structures
- [ ] For deeply nested API responses, consider API resources instead of DTOs for the output side

---

# Implementation Checklist

- [ ] No circular DTO references (children reference parents by ID)
- [ ] Nesting depth is 3-4 levels or fewer
- [ ] Each child DTO is independently constructable
- [ ] Recursive construction tested for failure cases
- [ ] Nullable child DTOs used for optional nested data
- [ ] Nesting orientation consistent (entity hierarchy preferred)
- [ ] Serialization works without infinite recursion
- [ ] Implement DTO Nesting and Composition following crud-architecture patterns
- [ ] Configure all required settings for DTO Nesting and Composition
- [ ] Register route/middleware/service for DTO Nesting and Composition
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Nested DTO construction cost is O(n) where n is total data nodes
- [ ] For a typical order with 10 items: ~12 DTO constructions at ~0.005ms each = ~0.06ms â€” negligible
- [ ] Deeply nested DTOs with 4+ levels produce larger JSON payloads â€” each level adds serialization overhead

---

# Security Checklist

- [ ] Circular DTO references cause infinite recursion during serialization â€” always prevent via code review
- [ ] Child DTOs should not carry sensitive parent data â€” use ID references instead of object references
- [ ] Validation cascade: a single missing field in a deeply nested child causes top-level failure â€” ensure error messages are clear

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] No circular DTO references (children reference parents by ID, not by object)
- [ ] Nesting depth is 3-4 levels or fewer
- [ ] Each child DTO is independently constructable
- [ ] Recursive construction is tested for failure cases
- [ ] Nullable child DTOs are used for optional nested data
- [ ] Nesting orientation is consistent (entity hierarchy or API structure, not mixed)
- [ ] Serialization works without infinite recursion
- [ ] Write feature tests for happy path of DTO Nesting and Composition
- [ ] Write feature tests for validation failure of DTO Nesting and Composition
- [ ] Write feature tests for authentication failure of DTO Nesting and Composition
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

- [ ] Avoid: Infinite Serialization Loop
- [ ] Avoid: Construction Cascade Failure
- [ ] Avoid: DTO as ORM Mirror
- [ ] Avoid: Deep Nesting Beyond Reason
- [ ] Avoid: Circular DTO References
- [ ] Avoid: Construction Cascade Failure Without Clear Errors

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
- Rule 1: Limit Nesting Depth to 3-4 Levels
- Rule 2: Never Create Circular DTO References
- Rule 3: Each Child DTO Must Be Independently Constructable
- Rule 4: Use Nullable Types for Optional Nested Data
- Rule 5: Prefer Entity Hierarchy Over API Structure for Nesting Orientation

### Anti-Patterns
- Infinite Serialization Loop
- Construction Cascade Failure
- DTO as ORM Mirror
- Deep Nesting Beyond Reason
- Circular DTO References
- Construction Cascade Failure Without Clear Errors



