# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Pagination Strategy Selection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination Strategy Selection implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Pagination Strategy Selection
- [ ] Full test coverage for Pagination Strategy Selection
- [ ] Security review completed for Pagination Strategy Selection
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination Strategy Selection
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define pagination strategy per resource based on its characteristics (e.g., posts feed â†’ cursor, users list â†’ offset).
- [ ] Implement a `PaginationStrategy` enum or config that maps resources to their chosen strategy.
- [ ] For hybrid endpoints, use an automatic switch: offset for pages < 100, cursor for pages >= 100.
- [ ] Document the strategy selection rationale in the API design document.
- [ ] Test pagination performance for each chosen strategy with realistic (production-scale) data.
- [ ] Evaluate: Offset vs Cursor vs Keyset Selection
- [ ] Evaluate: Hybrid Strategy Decision

---

# Implementation Checklist

- [ ] Implement Pagination Strategy Selection following pagination-strategies patterns
- [ ] Configure all required settings for Pagination Strategy Selection
- [ ] Register route/middleware/service for Pagination Strategy Selection
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] At 1K rows, all strategies perform similarly (2-5ms).
- [ ] At 100K rows, offset degrades (5-200ms depending on depth); cursor/keyset remain at 2-5ms.
- [ ] At 10M rows, offset often times out; cursor/keyset stay at 2-10ms.
- [ ] At 1B rows, only cursor/keyset are viable (5-20ms).
- [ ] Maintenance overhead: offset (lowest), cursor (low), keyset (medium â€” manual WHERE clause).

---

# Security Checklist

- [ ] Offset pagination exposes record count via `total` â€” may leak business information.
- [ ] Cursor pagination's opaque tokens prevent enumeration but must be tamper-proof.
- [ ] Keyset pagination exposes sort column values â€” avoid for sensitive ordering.
- [ ] All strategies must enforce authorization boundaries regardless of pagination method.
- [ ] Rate limiting should account for the selected strategy's access pattern (sequential vs random).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Pagination strategy is explicitly chosen per resource, not defaulted
- [ ] Decision matrix documented for each paginated endpoint
- [ ] Strategy matches data characteristics (write concurrency, size, access patterns)
- [ ] Dataset growth trajectory is considered in strategy selection
- [ ] Hybrid strategy has clear rules for when each method is used
- [ ] Migration plan exists for endpoints that may outgrow their current strategy
- [ ] Pagination behavior is documented in API reference
- [ ] Performance testing conducted with production-scale data for the chosen strategy
- [ ] Write feature tests for happy path of Pagination Strategy Selection
- [ ] Write feature tests for validation failure of Pagination Strategy Selection
- [ ] Write feature tests for authentication failure of Pagination Strategy Selection
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

- [ ] Avoid: One-Size-Fits-All Pagination
- [ ] Avoid: Offset for Unbounded Datasets
- [ ] Avoid: Strategy by Developer Preference
- [ ] Avoid: No Documentation of Pagination Behavior
- [ ] Avoid: No Growth Trajectory Consideration

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
- Default to Cursor Pagination for New Endpoints
- Choose Strategy Per Resource, Not Per Developer Preference
- Reserve Offset for Bounded Datasets With Random Access Requirements
- Consider Dataset Growth Trajectory, Not Just Current Size
- Document Pagination Strategy Per Endpoint
- Use Hybrid Strategy for Migration Periods
- Never Use One Strategy for All Endpoints
- Performance Test the Chosen Strategy With Production-Scale Data
- Enforce Authorization Boundaries Regardless of Strategy
- Avoid Over-Engineering Pagination for Small Stable Datasets

### Decisions
- Offset vs Cursor vs Keyset Selection
- Hybrid Strategy Decision

### Anti-Patterns
- One-Size-Fits-All Pagination
- Offset for Unbounded Datasets
- Strategy by Developer Preference
- No Documentation of Pagination Behavior
- No Growth Trajectory Consideration

## Related Knowledge
- Offset Pagination Design â€” Baseline understanding
- Cursor Pagination Design â€” Alternative strategy
- Keyset Pagination Design â€” Alternative strategy
- Total Count Performance â€” When to include total metadata
- Offset-to-Cursor Migration â€” Practical migration guide
- Per-Page Parameter Design â€” Limit/per_page defaults and maximums



