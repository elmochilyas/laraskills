# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Breaking Change Process
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Breaking Change Process implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Breaking Change Process
- [ ] Full test coverage for Breaking Change Process
- [ ] Security review completed for Breaking Change Process
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Breaking Change Process

---

# Architecture Checklist

- [ ] RFC template with standard sections: Context, Proposal, Impact Analysis, Migration Plan, Timeline.
- [ ] Versioned coexistence: old and new behavior under different versions during migration window.
- [ ] Progressive rollout: 1% -> 5% -> 25% -> 100% of consumers over weeks.
- [ ] Feature flag for emergency rollback: keep old behavior available for 30 days post-cutoff.
- [ ] Evaluate: RFC Approval Process â€” CAB Review vs Lightweight Team Review
- [ ] Evaluate: Rollout Strategy â€” Big-Bang vs Progressive Rollout

---

# Implementation Checklist

- [ ] RFC written with quantitative impact analysis
- [ ] CAB approval obtained before implementation
- [ ] Breaking change deployed behind feature flag
- [ ] Migration guide created with tested code examples
- [ ] Progressive rollout with monitoring gates (1%â†’5%â†’25%â†’100%)
- [ ] Old behavior retained for 30 days post-cutoff
- [ ] Individual consumer outreach completed
- [ ] Post-migration monitoring active for 30 days
- [ ] Implement Breaking Change Process following api-lifecycle-governance patterns
- [ ] Configure all required settings for Breaking Change Process
- [ ] Register route/middleware/service for Breaking Change Process
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Breaking change RFC process is human-driven â€” no significant performance impact.
- [ ] Impact analysis queries consumer registry and request logs â€” should be async and cached.
- [ ] Dark launch feature flags add minimal overhead (single boolean check per request).

---

# Security Checklist

- [ ] Security breaking changes may bypass standard CAB process via exception.
- [ ] Migration guides must not expose vulnerability details before patch is deployed.
- [ ] Emergency exceptions require VP-level approval and post-incident review.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Breaking Change Process
- [ ] Write feature tests for validation failure of Breaking Change Process
- [ ] Write feature tests for authentication failure of Breaking Change Process
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
- Rule 1: Require RFC with Impact Analysis Before Implementation
- RFC-042: User Field Rename
- Rule 2: Obtain CAB Approval Before Implementation
- Rule 3: Dark Launch Breaking Changes Behind Feature Flags
- Rule 4: Create Tested Migration Guide Before Rollout
- Rule 5: Progressive Rollout with Monitoring Gates
- Rule 6: Maintain Old Behavior for 30 Days Post-Migration
- Rule 7: Conduct Individual Consumer Outreach

### Decisions
- RFC Approval Process â€” CAB Review vs Lightweight Team Review
- Rollout Strategy â€” Big-Bang vs Progressive Rollout

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



