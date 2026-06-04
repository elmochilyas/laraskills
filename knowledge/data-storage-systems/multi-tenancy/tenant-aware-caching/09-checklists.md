# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.30 Tenant-aware caching (cache prefix isolation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dynamic cache prefix in middleware applied
- [ ] Per-tenant Redis database applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No cache key isolation**: One tenant's cached data served to another tenant. Data leak via cache. Always prefix keys with tenant ID. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Zero cache key collisions between tenants
- [ ] Tenant-specific cache flush works correctly
- [ ] Global cache accessible across all tenants

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Dynamic cache prefix in middleware applied
- [ ] Per-tenant Redis database applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Choose isolation approach: completed
- [ ] For prefix approach, configure cache prefix in middleware after tenant resolution completed
- [ ] For tags approach, always include tenant tag when caching and retrieving completed
- [ ] Flush cache on tenant data changes: `Cache::tags(['tenant:'.$tenantId])->flush()` completed
- [ ] For global cache (shared across tenants), use a separate cache store or no prefix completed

---

# Performance Checklist

- [ ] Performance: Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] No cache key isolation**: One tenant's cached data served to another tenant. Data leak via cache. Always prefix keys with tenant ID. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Cache keys scoped per tenant
- [ ] Tenant A cannot retrieve Tenant B's cached data
- [ ] Cache flush works per tenant (doesn't affect other tenants)
- [ ] Global cache still accessible across tenants
- [ ] Cache prefix set before any cache operation
- [ ] Zero cache key collisions between tenants
- [ ] Tenant-specific cache flush works correctly
- [ ] Global cache accessible across all tenants
- [ ] Cache isolation verified with tests
- [ ] All cache keys automatically scoped per tenant

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Never Trust Tenant ID From Request prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Cache prefix not set before cache is accessed in request lifecycle prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No cache key isolation**: One tenant's cached data served to another tenant. Data leak via cache. Always prefix keys with tenant ID. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
