# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 04-cache-layer-optimization
**Knowledge Unit:** Cache Tier Selection
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Cache driver configured with appropriate tier (Redis/Memcached/memo)
- [ ] Graviton node type selected
- [ ] Multi-AZ enabled for production
- [ ] Memo driver configured (Laravel 13.x+)
- [ ] used_memory/maxmemory ratio < 80%
- [ ] Always use Graviton nodes applied
- [ ] Right-size by monitoring applied
- [ ] Enable memo driver applied
- [ ] Single-node production Redis prevented
- [ ] Cache-everything mentality prevented
- [ ] Over-provisioning memory prevented
- [ ] Using x86 when Graviton available prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Redis for production, Memcached only for simple cache with no persistence needs
- [ ] Architecture guideline: Start with cache.t4g.small ($12/month) for low-traffic apps, scale up as needed
- [ ] Architecture guideline: For apps under 1M requests/day
- [ ] Architecture guideline: For apps over 10M requests/day
- [ ] Architecture guideline: Never run Memcached for cache+queue; use Redis for multi-purpose

---

# Implementation Checklist

- [ ] Best practice applied: Always use Graviton nodes
- [ ] Best practice applied: Right-size by monitoring
- [ ] Best practice applied: Enable memo driver
- [ ] Best practice applied: Multi-purpose Redis
- [ ] Workflow step completed: Inventory current Cache Tier Selection resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Redis sub-ms latency for hot keys (<1ms); Memcached similar but no data structure overhead
- [ ] Memo driver eliminates network round-trip for repeated lookups (0ms vs 1-5ms Redis)
- [ ] Cluster mode adds ~1ms overhead for multi-key operations across shards
- [ ] Network throughput scales with node size; larger nodes get better bandwidth per GB

---

# Security Checklist

- [ ] Enable encryption in-transit (TLS) for Redis/Memcached; disable in same-VPC-only
- [ ] Use IAM authentication for ElastiCache (Redis 7+); avoid password-only auth
- [ ] ElastiCache must be in private subnets; never expose to internet
- [ ] Separate Redis clusters per environment (dev/staging/prod) to prevent cross-environment data leakage

---

# Reliability Checklist

- [ ] Mistake prevented: Over-provisioning memory
- [ ] Mistake prevented: Using x86 when Graviton available
- [ ] Mistake prevented: Not enabling memo driver

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Cache driver configured with appropriate tier (Redis/Memcached/memo)
- [ ] Graviton node type selected
- [ ] Multi-AZ enabled for production
- [ ] Memo driver configured (Laravel 13.x+)
- [ ] used_memory/maxmemory ratio < 80%

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Cache Tier Selection configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Single-node production Redis
- [ ] Anti-pattern prevented: Cache-everything mentality
- [ ] Anti-pattern prevented: Mixing cache tiers incorrectly
- [ ] Common mistake prevented: Over-provisioning memory
- [ ] Common mistake prevented: Using x86 when Graviton available
- [ ] Common mistake prevented: Not enabling memo driver

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Cache driver configured with appropriate tier (Redis/Memcached/memo)
- [ ] Verification passed: Graviton node type selected
- [ ] Verification passed: Multi-AZ enabled for production

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
