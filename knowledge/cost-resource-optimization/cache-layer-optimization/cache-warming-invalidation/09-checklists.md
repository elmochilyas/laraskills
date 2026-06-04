# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 04-cache-layer-optimization
**Knowledge Unit:** Cache Warming & Invalidation
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Cache stampede prevention implemented for all expensive computations
- [ ] Tag-based invalidation for all related key groups
- [ ] Deploy script includes selective cache warm (not full flush)
- [ ] Versioned prefix or similar deploy-safe invalidation in place
- [ ] Model observers handle cache invalidation on write
- [ ] Use Laravel cache tags for invalidation applied
- [ ] Implement stampede prevention applied
- [ ] Warm after deploy applied
- [ ] Cache-everything-on-deploy prevented
- [ ] No invalidation strategy prevented
- [ ] Full cache flush on deploy prevented
- [ ] No stampede protection prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Invalidation > expiration
- [ ] Architecture guideline: Event-driven invalidation
- [ ] Architecture guideline: For high-traffic endpoints (1000+ req/s)
- [ ] Architecture guideline: Avoid full-cache flush in production; use tag-based or key-prefix versioning

---

# Implementation Checklist

- [ ] Best practice applied: Use Laravel cache tags for invalidation
- [ ] Best practice applied: Implement stampede prevention
- [ ] Best practice applied: Warm after deploy
- [ ] Best practice applied: Versioned cache keys
- [ ] Workflow step completed: Inventory current Cache Warming Invalidation resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Tag invalidation is O(1) for Redis; O(n) for file/database cache
- [ ] Cache warm overhead
- [ ] Lock-based stampede prevention adds 1-5ms for uncontested locks, 50-200ms contested
- [ ] Versioned prefix approach has zero overhead (key lookup is same cost)

---

# Security Checklist

- [ ] Never warm cache with user-specific data (privacy violation risk)
- [ ] Cache invalidation should not be triggerable by unauthenticated users
- [ ] Lock keys should be namespaced to prevent collision with data keys
- [ ] Monitor cache invalidation rate as a signal for potential cache poisoning attempts

---

# Reliability Checklist

- [ ] Mistake prevented: Full cache flush on deploy
- [ ] Mistake prevented: No stampede protection
- [ ] Mistake prevented: Over-warming on deploy

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Cache stampede prevention implemented for all expensive computations
- [ ] Tag-based invalidation for all related key groups
- [ ] Deploy script includes selective cache warm (not full flush)
- [ ] Versioned prefix or similar deploy-safe invalidation in place
- [ ] Model observers handle cache invalidation on write

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Cache Warming Invalidation configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Cache-everything-on-deploy
- [ ] Anti-pattern prevented: No invalidation strategy
- [ ] Anti-pattern prevented: Sync invalidation in web requests
- [ ] Common mistake prevented: Full cache flush on deploy
- [ ] Common mistake prevented: No stampede protection
- [ ] Common mistake prevented: Over-warming on deploy

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Cache stampede prevention implemented for all expensive computations
- [ ] Verification passed: Tag-based invalidation for all related key groups
- [ ] Verification passed: Deploy script includes selective cache warm (not full flush)

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
