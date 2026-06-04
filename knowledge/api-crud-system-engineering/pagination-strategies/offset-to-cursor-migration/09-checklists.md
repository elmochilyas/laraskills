# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Offset-to-Cursor Migration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Offset-to-Cursor Migration implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Offset-to-Cursor Migration
- [ ] Full test coverage for Offset-to-Cursor Migration
- [ ] Security review completed for Offset-to-Cursor Migration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Offset-to-Cursor Migration
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Implement a dual-controller pattern that detects `cursor` vs `page` parameters and dispatches to the appropriate pagination logic.
- [ ] Normalize both response structures where possible to minimize client changes.
- [ ] Keep offset pagination code available but disabled after migration; re-enable as rollback plan.
- [ ] Monitor the ratio of `page` vs `cursor` requests to track migration progress.
- [ ] Include a migration guide endpoint that documents the parameter changes and sunset date.
- [ ] Evaluate: Migration Strategy Selection
- [ ] Evaluate: Rollout Strategy Decision

---

# Implementation Checklist

- [ ] Cursor pagination works when `cursor` parameter is provided
- [ ] Offset pagination continues to work when `page` is provided
- [ ] Both paginations can coexist on the same endpoint
- [ ] Response includes both offset meta and cursor fields during transition
- [ ] Deprecation header (`Sunset`) is present on offset responses
- [ ] Client usage is monitored to track migration progress
- [ ] Migration timeline is documented and communicated
- [ ] Major version removes offset parameters entirely
- [ ] Implement Offset-to-Cursor Migration following pagination-strategies patterns
- [ ] Configure all required settings for Offset-to-Cursor Migration
- [ ] Register route/middleware/service for Offset-to-Cursor Migration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] During coexistence, only one query type executes per request â€” no dual-query penalty.
- [ ] Before enabling cursor pagination, ensure the required composite indexes exist and are verified with EXPLAIN.
- [ ] Monitor cursor query performance after enabling â€” cursor pagination without proper indexes will be slower than offset.
- [ ] The dual-controller pattern adds negligible overhead (a single parameter check).

---

# Security Checklist

- [ ] Cursor tokens must be opaque and tamper-proof; offset parameters (`page`) do not have this requirement.
- [ ] Ensure cursor pagination validates cursor format and returns 400 for malformed tokens.
- [ ] During migration, maintain the same authorization checks for both pagination methods.
- [ ] Log cursor decode failures separately from offset parameter validation errors.
- [ ] If providing estimated totals in cursor responses, clearly label them as estimates.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Required composite indexes exist and are verified with EXPLAIN before cursor deployment
- [ ] Dual-controller pattern implemented: both `cursor` and `page` parameters accepted
- [ ] `Deprecation: true` and `Sunset` headers are added to all offset pagination responses
- [ ] Migration documentation endpoint is available for clients
- [ ] Feature flag for gradual rollout is implemented and tested
- [ ] LTS endpoint strategy is defined for legacy clients that cannot migrate
- [ ] Client communication plan is executed (email, changelog, blog post)
- [ ] Rollback plan exists: offset pagination code is restorable with a configuration toggle
- [ ] Response format is normalized across both pagination strategies where possible
- [ ] Monitoring is in place to track cursor vs offset usage ratio and query performance
- [ ] Write feature tests for happy path of Offset-to-Cursor Migration
- [ ] Write feature tests for validation failure of Offset-to-Cursor Migration
- [ ] Write feature tests for authentication failure of Offset-to-Cursor Migration
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

- [ ] Avoid: Big Bang Switch Without Warning
- [ ] Avoid: Silent Deprecation
- [ ] Avoid: Inconsistent Response Formats
- [ ] Avoid: Not Providing Migration Guides
- [ ] Avoid: No Rollback Plan

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
- Support Both Pagination Methods During a 6-12 Month Transition
- Use Deprecation and Sunset HTTP Headers
- Verify Cursor Indexes Exist Before Enabling Cursor Pagination
- Feature-Flag Rollout Starting at Low Traffic Percentage
- Normalize Response Structures Across Both Methods
- Monitor Page vs Cursor Request Ratio
- Keep Offset Code Available for Rollback After Migration
- Contact Known API Consumers Directly Before Sunsetting
- Provide a Sandbox Endpoint for Testing
- Never Remove Offset Support Without a Sunset Header Grace Period

### Decisions
- Migration Strategy Selection
- Rollout Strategy Decision

### Anti-Patterns
- Big Bang Switch Without Warning
- Silent Deprecation
- Inconsistent Response Formats
- Not Providing Migration Guides
- No Rollback Plan

## Related Knowledge
- Offset Pagination Design â€” The strategy being migrated from
- Cursor Pagination Design â€” The strategy being migrated to
- Pagination Strategy Selection â€” Why the migration is needed
- API Versioning Strategies â€” Versioning approaches for breaking changes
- Deprecation and Sunset Policies â€” Communication and timeline management



