# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** When to Create New Version
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] When to Create New Version implementation follows api-versioning patterns
- [ ] All edge cases handled for When to Create New Version
- [ ] Full test coverage for When to Create New Version
- [ ] Security review completed for When to Create New Version
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for When to Create New Version
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Conservative approach: create new versions only for breaking changes.
- [ ] Accumulation trigger: when conditionals affect >30% of the codebase, consider a new version.
- [ ] The best version is the one you don't create â€” each version is a maintenance burden for years.
- [ ] When creating a new version, allocate 20% of its expected lifecycle cost to migration tooling.

---

# Implementation Checklist

- [ ] Version creation decision framework documented and followed
- [ ] Every new version has ADR with rationale and cost estimate
- [ ] Backward-compatible options exhausted before new version
- [ ] Migration plan exists for every new version
- [ ] Version proliferation monitored (max 3 active versions)
- [ ] 20% of lifecycle cost allocated to migration tooling
- [ ] Implement When to Create New Version following api-versioning patterns
- [ ] Configure all required settings for When to Create New Version
- [ ] Register route/middleware/service for When to Create New Version
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] No direct performance impact from the decision-making process.
- [ ] Creating a new version adds ~1-2 KB to route cache â€” negligible.
- [ ] Accumulated conditionals in a single version can create if-else chains that slow response time.

---

# Security Checklist

- [ ] A new version is an opportunity to fix security debt in the old version's implementation.
- [ ] Ensure the new version doesn't introduce security regressions compared to the old version.
- [ ] Old versions must continue receiving security patches until fully deprecated.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Version creation decision framework documented and followed
- [ ] Every new version has an ADR with rationale and cost estimate
- [ ] Backward-compatible options exhausted before new version
- [ ] Migration plan exists for every new version
- [ ] Version proliferation is monitored (recommended max: 3 active versions)
- [ ] Write feature tests for happy path of When to Create New Version
- [ ] Write feature tests for validation failure of When to Create New Version
- [ ] Write feature tests for authentication failure of When to Create New Version
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

- [ ] Avoid: Version Avoidance
- [ ] Avoid: Unnecessary Cost
- [ ] Avoid: Wrong Trigger
- [ ] Avoid: Accumulated Conditionals
- [ ] Avoid: Premature Versioning

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
- Exhaust Backward-Compatible Options First
- Use A Decision Tree Service For Version Evaluation
- Document Every New Version With An ADR
- Create New Version Only When You Can Maintain It
- Monitor Version Proliferation â€” Max 3 Active Versions
- Consider Beta Flags Before Committing To New Version
- Allocate 20% Of Lifecycle Cost To Migration Tooling

### Anti-Patterns
- Version Avoidance
- Unnecessary Cost
- Wrong Trigger
- Accumulated Conditionals
- Premature Versioning

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



