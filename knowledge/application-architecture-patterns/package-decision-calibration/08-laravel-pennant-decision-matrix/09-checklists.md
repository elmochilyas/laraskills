# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Laravel Pennant Decision Matrix
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Pennant used for feature gating, not as primary entitlement store
- [ ] Plan entitlements defined separately from Pennant flags

---

# Architecture Checklist

- [ ] Feature flags use feature classes (`app/Features/`), not closures in service providers
- [ ] Pennant reads plan data — plan data is the source of truth, not Pennant
- [ ] Every flag has a removal plan or expiration comment
- [ ] Pennant is not used as a substitute for authorization (Gates/Policies)

---

# Implementation Checklist

- [ ] Workflow step completed: Feature class directory created (`app/Features/`) with one class per flag
- [ ] Workflow step completed: Plan entitlements defined in config/database separately from Pennant flags
- [ ] Workflow step completed: Removal date comment added to every flag definition
- [ ] Workflow step completed: `Feature::for($user)` used with explicit scope (not implicit auth user)
- [ ] Workflow step completed: Authorization checks (Gates/Policies) exist alongside feature flags
- [ ] Workflow step completed: Cache flush mechanism exists (`Feature::flushCache()`)
- [ ] Workflow step completed: Kill switches use non-database fallback for immediate toggle

---

# Performance Checklist

- [ ] Cache TTL configured (5-15 minutes) for balance of performance and responsiveness
- [ ] Flags preloaded in middleware for high-traffic pages (not resolved in Blade templates)
- [ ] Flag count monitored — 50+ flags per request degrades performance
- [ ] Database cache monitored for `features` table growth

---

# Security Checklist

- [ ] Feature flags checked alongside authorization — never used as sole access control
- [ ] Sensitive data not stored in flag values (cached in database, visible in debug output)
- [ ] Kill switches have non-database bypass for immediate toggling during outages
- [ ] Flag values not exposed to client-side unless explicitly intended

---

# Reliability Checklist

- [ ] Failure addressed: Using Pennant across multiple services:
- [ ] Failure addressed: Treating Pennant as primary entitlement store:
- [ ] Failure addressed: Never cleaning up stale flags:
- [ ] Failure addressed: Using Pennant for emergency kill switches with cache delay:
- [ ] Failure addressed: Feature flags as substitute for authorization:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Pennant is used for feature gating, not as primary entitlement store
- [ ] Plan entitlements are defined separately from Pennant flags
- [ ] Feature flags use feature classes, not closures in service providers
- [ ] Every flag has a removal plan or expiration comment
- [ ] Kill switches have a non-database fallback mechanism
- [ ] Pennant is not used for cross-service feature flags
- [ ] Pennant is not used as a substitute for authorization (Gates/Policies)
- [ ] Tests cover both flag-on and flag-off states
- [ ] Flag cleanup process is established (quarterly review)
- [ ] Cache TTL is configured (5-15 minutes) and flush mechanism exists

### Success Criteria
- [ ] Both flag states (on and off) tested for every feature
- [ ] Flag-off path tested as thoroughly as flag-on path
- [ ] Cache flush verified (flag changes take effect within TTL window)
- [ ] Stale flags removed within 60 days of 100% rollout

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Pennant as authorization (using Feature::active instead of Gates)
- [ ] Anti-pattern prevented: Flag-driven architecture (every code path wrapped in if-feature-active)
- [ ] Anti-pattern prevented: Database as kill switch (no non-cache fallback)
- [ ] Anti-pattern prevented: Feature flags for configuration (using flags instead of config)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Kill switch needed during outage but cache delays toggle:
- [ ] Failure scenario handled: Cross-service flag needed but Pennant is single-app:
- [ ] Failure scenario handled: Flag resolution fails (database down, cache miss):

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
