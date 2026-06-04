# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** When to Skip Layers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] When to Skip Layers implementation follows crud-architecture patterns
- [ ] All edge cases handled for When to Skip Layers
- [ ] Full test coverage for When to Skip Layers
- [ ] Security review completed for When to Skip Layers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for When to Skip Layers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Formal skip decision: (1) operation has no current business rules, (2) unlikely to ever have them, (3) is a read (not write), (4) has a single call site, (5) team agrees the layer would be pure ceremony
- [ ] If any team member objects to the skip, do not formalize it â€” the cost of one extra file is lower than team disagreement
- [ ] The "Rule of Three": if a skip pattern appears 3+ times, the layer should be removed or justified properly for that category
- [ ] A skip must not leak beyond its bounded scope â€” the exception class is the skip boundary

---

# Implementation Checklist

- [ ] Layer skip documented with `@layer-skip` annotation
- [ ] Skip registered in project exception registry
- [ ] Quarterly review scheduled for active exceptions
- [ ] Writes never skip layers
- [ ] Undocumented skips treated as bugs
- [ ] Two Questions test passes for every skip
- [ ] Team consensus exists for every skip
- [ ] Implement When to Skip Layers following crud-architecture patterns
- [ ] Configure all required settings for When to Skip Layers
- [ ] Register route/middleware/service for When to Skip Layers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each architectural layer adds ~2-5ms overhead for the full chain (controller â†’ service â†’ repository â†’ Eloquent)
- [ ] Invisible for single lookups but significant in loops, batch operations, or high-throughput endpoints
- [ ] Cache first, optimize queries second, skip layers last â€” performance-driven skipping is the highest-risk category
- [ ] Profile before optimizing by skipping layers â€” often the bottleneck is the database query, not the layer indirection
- [ ] A skip justified by performance becomes permanent architectural debt even after the performance concern is resolved

---

# Security Checklist

- [ ] Skipping layers bypasses authorization checks, query scoping, and business rule enforcement in the skipped layer
- [ ] The propagation problem: when a business rule changes, the skipped path silently returns incorrect results
- [ ] Writes that skip layers miss validation, scoping, and event dispatching â€” creating data integrity and security gaps
- [ ] An exception registry prevents skipped paths from becoming security blind spots

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Layer skip exceptions are documented with `@layer-skip` annotations
- [ ] Skip exceptions are registered in the project's exception registry
- [ ] Quarterly review is scheduled for all active exceptions
- [ ] Writes never skip layers â€” the full stack is always followed
- [ ] Undocumented skips are treated as bugs, not accepted patterns
- [ ] The "Two Questions" test passes for every skip exception
- [ ] Exception creep is monitored â€” if a pattern appears 3+ times, the layer should be re-evaluated
- [ ] Team consensus exists for every skip exception
- [ ] Write feature tests for happy path of When to Skip Layers
- [ ] Write feature tests for validation failure of When to Skip Layers
- [ ] Write feature tests for authentication failure of When to Skip Layers
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

- [ ] Avoid: The Slippery Slope
- [ ] Avoid: Architecture Collapse
- [ ] Avoid: Silent Skip in Controller
- [ ] Avoid: Skip as Default for New Features
- [ ] Avoid: Skipping Writes

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
- Rule 1: Never Skip Layers for Write Operations
- Rule 2: Document Every Skip with @layer-skip Annotation
- Rule 3: Pass the "Two Questions" Test for Every Skip
- Rule 4: Maintain an Exception Registry and Review Quarterly
- Rule 5: The Rule of Three â€” If a Skip Pattern Appears 3+ Times, Re-evaluate
- Rule 6: Require Team Consensus for Every Skip

### Anti-Patterns
- The Slippery Slope
- Architecture Collapse
- Silent Skip in Controller
- Skip as Default for New Features
- Skipping Writes



