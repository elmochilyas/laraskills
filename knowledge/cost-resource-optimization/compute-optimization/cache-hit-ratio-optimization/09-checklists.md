# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Cache Hit Ratio Optimization
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] CHR measured per endpoint/data type
- [ ] Multi-level cache implemented (memo + Redis)
- [ ] Working set < 80% of Redis maxmemory
- [ ] evicted_keys = 0 (no evictions)
- [ ] Cache warming implemented after deploy
- [ ] Measure CHR per cache key pattern applied
- [ ] Implement multi-level caching applied
- [ ] Set TTL based on access pattern applied
- [ ] Cache-flush-on-deploy prevented
- [ ] Random eviction reliance prevented
- [ ] Not measuring CHR prevented
- [ ] Short TTL on everything prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Set CHR targets
- [ ] Architecture guideline: Monitor CHR per endpoint using Laravel cache events or Redis `INFO commandstats`
- [ ] Architecture guideline: Use different Redis DBs for different cache types (DB0 = data cache, DB1 = fragment cache, DB2 = config)
- [ ] Architecture guideline: Right-size Redis based on working set + 20% headroom (not total available data)
- [ ] Architecture guideline: Implement cache warming in deployment pipeline (post-deploy script)
- [ ] Architecture guideline: Use Redis `maxmemory-policy allkeys-lru` for general cache (evicts least recently used when full)

---

# Implementation Checklist

- [ ] Best practice applied: Measure CHR per cache key pattern
- [ ] Best practice applied: Implement multi-level caching
- [ ] Best practice applied: Set TTL based on access pattern
- [ ] Best practice applied: Warm cache after deploy
- [ ] Best practice applied: Monitor cache eviction rate
- [ ] Best practice applied: Use sticky cache key prefixes
- [ ] Workflow step completed: Inventory current Cache Hit Ratio Optimization resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] L1 cache (memo)
- [ ] L2 cache (Redis)
- [ ] L3 (database)
- [ ] Each Redis eviction causes a cache miss and database query (adds 5-50ms to response)
- [ ] Cache miss penalty

---

# Security Checklist

- [ ] Cache invalidation should be triggered only by authorized operations (data owners)
- [ ] Monitor CHR drops as potential security incident (cache flush could be attack)
- [ ] Do not cache user-specific data that other users shouldn't see (cache poisoning risk)
- [ ] Cache keys should not contain sensitive data (PII in key names)

---

# Reliability Checklist

- [ ] Mistake prevented: Not measuring CHR
- [ ] Mistake prevented: Short TTL on everything
- [ ] Mistake prevented: Working set larger than Redis memory

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] CHR measured per endpoint/data type
- [ ] Multi-level cache implemented (memo + Redis)
- [ ] Working set < 80% of Redis maxmemory
- [ ] evicted_keys = 0 (no evictions)
- [ ] Cache warming implemented after deploy
- [ ] TTL aligned with access frequency
- [ ] CHR targets defined: static > 99%, fragments > 95%, API > 90%

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Cache Hit Ratio Optimization configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Cache-flush-on-deploy
- [ ] Anti-pattern prevented: Random eviction reliance
- [ ] Anti-pattern prevented: Same TTL for all cache entries
- [ ] Common mistake prevented: Not measuring CHR
- [ ] Common mistake prevented: Short TTL on everything
- [ ] Common mistake prevented: Working set larger than Redis memory

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: CHR measured per endpoint/data type
- [ ] Verification passed: Multi-level cache implemented (memo + Redis)
- [ ] Verification passed: Working set < 80% of Redis maxmemory

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
