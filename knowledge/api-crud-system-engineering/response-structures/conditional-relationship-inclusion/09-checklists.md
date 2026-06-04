# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Conditional Relationship Inclusion
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Conditional Relationship Inclusion implementation follows response-structures patterns
- [ ] All edge cases handled for Conditional Relationship Inclusion
- [ ] Full test coverage for Conditional Relationship Inclusion
- [ ] Security review completed for Conditional Relationship Inclusion
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Conditional Relationship Inclusion
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Establish whether `whenLoaded()` omission is silent (production) or throws (development) for missing required relations.
- [ ] Use Laravel's lazy loading prevention (`Model::preventLazyLoading()`) in development to catch missing loads that `whenLoaded()` silently hides.
- [ ] For JSON:API-style include parameters, map `include` query params to controller eager loads; `whenLoaded()` handles serialization.
- [ ] Set a maximum nesting depth for included relationships to prevent circular references and deep response objects.
- [ ] Evaluate: Relationship Serialization Gating Strategy
- [ ] Evaluate: Count vs Full Relationship Inclusion
- [ ] Evaluate: Nested Conditional Resolution Strategy

---

# Implementation Checklist

- [ ] `whenLoaded()` for optional relationships
- [ ] Not-loaded relations return null, not error
- [ ] Nested resources use `whenLoaded()`
- [ ] Combined with include parameter
- [ ] Tested with and without loaded relations
- [ ] Documented conditional relationships
- [ ] Implement Conditional Relationship Inclusion following response-structures patterns
- [ ] Configure all required settings for Conditional Relationship Inclusion
- [ ] Register route/middleware/service for Conditional Relationship Inclusion
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Zero cost when relation is not loaded â€” just a property check on the relations array.
- [ ] When loaded, serialization cost includes the entire nested resource's `toArray()`.
- [ ] For HasMany with thousands of models, `whenLoaded()` doesn't prevent the cost â€” the controller shouldn't load that many.
- [ ] Cache fragmentation increases with each loaded-relation variant â€” each combination creates a distinct cache entry.

---

# Security Checklist

- [ ] `whenLoaded()` does not authorize access to the related data â€” the controller must ensure the user is authorized to see loaded relations.
- [ ] Silent omission can mask bugs where a relation is accidentally not loaded â€” the field simply disappears from the response.
- [ ] Nested resource serialization inside `whenLoaded()` uses the related resource's own authorization logic.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every relationship field in `toArray()` is wrapped in `whenLoaded()` or `whenCounted()`.
- [ ] Responses without eager loading never trigger database queries during serialization.
- [ ] `whenCounted()` is used for all aggregate/calculated relationship fields.
- [ ] Pivot data is gated by `whenLoaded()` for the parent relation.
- [ ] Integration tests verify response validity with and without each relationship loaded.
- [ ] Write feature tests for happy path of Conditional Relationship Inclusion
- [ ] Write feature tests for validation failure of Conditional Relationship Inclusion
- [ ] Write feature tests for authentication failure of Conditional Relationship Inclusion
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

- [ ] Avoid: N+1 from Conditional Includes
- [ ] Avoid: Always Loading All Relationships
- [ ] Avoid: No Include Parameter Support
- [ ] Avoid: Unauthorized Relationship Exposure
- [ ] Avoid: Circular Relationship Includes

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
- Rule 1: Always Wrap Relationship Serialization in `whenLoaded()`
- Rule 2: Use `whenCounted()` for Counts, Not `whenLoaded()`
- Rule 3: Prevent Lazy Loading in Development to Catch Missing Loads
- Rule 4: Gate Pivot Data with `whenLoaded()`
- Rule 5: Never Nest `whenLoaded()` Inside Sub-Arrays Without Explicit Handling
- Rule 6: Document Relationship Loading Contracts Between Controller and Resource
- Rule 7: Test Resource Serialization with Zero Relationships Loaded

### Decisions
- Relationship Serialization Gating Strategy
- Count vs Full Relationship Inclusion
- Nested Conditional Resolution Strategy

### Anti-Patterns
- N+1 from Conditional Includes
- Always Loading All Relationships
- No Include Parameter Support
- Unauthorized Relationship Exposure
- Circular Relationship Includes

## Related Knowledge
- Prerequisites
- Related
- Advanced



