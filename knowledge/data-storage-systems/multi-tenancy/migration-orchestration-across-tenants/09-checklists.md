# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.9 Migration orchestration across tenants (single DB, per-schema, per-DB)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Central migration tracker applied
- [ ] Batch size control applied
- [ ] Rollback strategy applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Synchronous full-tenant migration**: Running migrations for all 2000 tenants sequentially in one request. Use batched background jobs. prevented
- [ ] No migration version tracking per tenant**: Can't tell which tenants are behind. Always store `tenant_id + migration_batch` in a central log. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Zero failed tenant migrations across deployment
- [ ] Rollback restores only affected tenants within SLA
- [ ] Schema version ledger is always consistent with actual schema state

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Central migration tracker applied
- [ ] Batch size control applied
- [ ] Rollback strategy applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Read tenant list and their current schema versions from central ledger completed
- [ ] Sort tenants by migration canary ring: canary (5%) → low-usage (20%) → medium (30%) → enterprise (45%) completed
- [ ] For each batch of 20 tenants, loop and apply migrations completed
- [ ] Between batches, verify lag, errors, and performance completed
- [ ] On failure in any batch, halt subsequent rings and rollback affected tenants completed

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

- [ ] Synchronous full-tenant migration**: Running migrations for all 2000 tenants sequentially in one request. Use batched background jobs. prevented
- [ ] No migration version tracking per tenant**: Can't tell which tenants are behind. Always store `tenant_id + migration_batch` in a central log. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All tenants at target migration version
- [ ] Schema version ledger consistent with actual schema state
- [ ] Rollback tested on a canary tenant
- [ ] No data loss or corruption from migration
- [ ] Pipeline detects pending migrations correctly
- [ ] Zero failed tenant migrations across deployment
- [ ] Rollback restores only affected tenants within SLA
- [ ] Schema version ledger is always consistent with actual schema state
- [ ] Pipeline completes all tenant migrations within deployment window
- [ ] Zero manual intervention required for successful migrations

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
- [ ] Migration fails on one tenant but ledger marks it as complete prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Synchronous full-tenant migration**: Running migrations for all 2000 tenants sequentially in one request. Use batched background jobs. prevented
- [ ] No migration version tracking per tenant**: Can't tell which tenants are behind. Always store `tenant_id + migration_batch` in a central log. prevented

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
