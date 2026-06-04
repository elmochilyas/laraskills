# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.1 Shared-table (single DB, tenant_id column with global scope)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Default isolation strategy applied
- [ ] Tenant ID as partition key applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Missing index on tenant_id**: Without it, every tenant query performs a full table scan. As tenant count grows, performance degrades linearly. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] All tenant queries include `WHERE tenant_id = ?` automatically
- [ ] Cross-tenant data access is impossible through normal application paths
- [ ] Index strategy supports tenant-scoped queries at < 10ms for 1M rows per tenant

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Default isolation strategy applied
- [ ] Tenant ID as partition key applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Add `tenant_id` column to all tenant-scoped tables completed
- [ ] Create a `TenantScoped` trait that applies `addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))` completed
- [ ] Apply the trait to all tenant-scoped models completed
- [ ] Create composite indexes with `tenant_id` as the leading column on all scoped queries completed
- [ ] Implement middleware to resolve current tenant and set it in the service container completed

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

- [ ] Missing index on tenant_id**: Without it, every tenant query performs a full table scan. As tenant count grows, performance degrades linearly. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Every tenant-scoped model has `tenant_id` column and global scope
- [ ] Composite indexes have `tenant_id` as leading column
- [ ] Isolation tests pass for all endpoints
- [ ] `withoutGlobalScope` calls are reviewed and documented
- [ ] All models have tenant isolation (verified per model)
- [ ] All tenant queries include `WHERE tenant_id = ?` automatically
- [ ] Cross-tenant data access is impossible through normal application paths
- [ ] Index strategy supports tenant-scoped queries at < 10ms for 1M rows per tenant
- [ ] Zero isolation gaps found across all models and endpoints
- [ ] All `withoutGlobalScope()` calls have documented justification

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
- [ ] Missing global scope on a new model exposes all tenants' data prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Missing index on tenant_id**: Without it, every tenant query performs a full table scan. As tenant count grows, performance degrades linearly. prevented

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
