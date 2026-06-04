# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 04-cache-layer-optimization
**Knowledge Unit:** Cache Prefix & TTL Strategy
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Every cache:put() call has explicit TTL
- [ ] Cache tags used for related key groups
- [ ] Staggered TTL implemented for high-traffic keys
- [ ] No production code uses `php artisan cache:clear`
- [ ] Prefix convention documented and enforced
- [ ] Set TTL on every key applied
- [ ] Use Laravel cache tags applied
- [ ] Stagger TTL by +/-10% applied
- [ ] Mass flush on deploy prevented
- [ ] No TTL on any key prevented
- [ ] No TTL on cache entries prevented
- [ ] Flushing entire cache in deployment prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Redis cache tags instead of manual prefix invalidation when possible
- [ ] Architecture guideline: Standard prefix format
- [ ] Architecture guideline: TTL hierarchy
- [ ] Architecture guideline: Never flush entire Redis DB in production; use targeted tag or prefix invalidation

---

# Implementation Checklist

- [ ] Best practice applied: Set TTL on every key
- [ ] Best practice applied: Use Laravel cache tags
- [ ] Best practice applied: Stagger TTL by +/-10%
- [ ] Best practice applied: Prefix queues by environment
- [ ] Workflow step completed: Inventory current Cache Prefix Ttl Strategy resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Tag-based invalidation uses Redis SET operations; O(n) for tag membership
- [ ] Prefix scanning (KEYS command) is O(n) and blocks Redis; avoid in production
- [ ] Staggered TTL reduces stampede probability by 90%+ with minimal complexity
- [ ] Soft TTL + background refresh adds ~10ms overhead per cache check but prevents synchronous recomputation

---

# Security Checklist

- [ ] Include environment in prefix to prevent cross-environment data leakage
- [ ] Never cache sensitive user data (PII, tokens) without encryption
- [ ] Tag names should not contain user-controlled input (prevents injection via tag manipulation)
- [ ] Separate DBs for cache (1), sessions (2), queues (0) prevents cross-contamination

---

# Reliability Checklist

- [ ] Mistake prevented: No TTL on cache entries
- [ ] Mistake prevented: Flushing entire cache in deployment
- [ ] Mistake prevented: Short TTL on all data

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Every cache:put() call has explicit TTL
- [ ] Cache tags used for related key groups
- [ ] Staggered TTL implemented for high-traffic keys
- [ ] No production code uses `php artisan cache:clear`
- [ ] Prefix convention documented and enforced

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Cache Prefix Ttl Strategy configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Mass flush on deploy
- [ ] Anti-pattern prevented: No TTL on any key
- [ ] Anti-pattern prevented: Same TTL for hot and cold data
- [ ] Common mistake prevented: No TTL on cache entries
- [ ] Common mistake prevented: Flushing entire cache in deployment
- [ ] Common mistake prevented: Short TTL on all data

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Every cache:put() call has explicit TTL
- [ ] Verification passed: Cache tags used for related key groups
- [ ] Verification passed: Staggered TTL implemented for high-traffic keys

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
