# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.19 Schema version ledger per tenant
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Migration tracking in provisioning applied
- [ ] Drift detection applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming all tenants are at the same schema version**: After partial rollouts, rollbacks, or failed migrations, tenants diverge. Always check the ledger before assuming schema state. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Ledger provides accurate schema version for every tenant
- [ ] Differential migration applies only pending changes
- [ ] Audit queries run in < 100ms for 10000 tenants

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Migration tracking in provisioning applied
- [ ] Drift detection applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create `tenant_schema_versions` table: `tenant_id`, `batch`, `migration_name`, `applied_at`, `status` completed
- [ ] On migration for a specific tenant, record applied migration in ledger completed
- [ ] Before migration, compare tenant's latest batch against current target completed
- [ ] For differential migration: apply only migrations not yet recorded for that tenant completed
- [ ] On rollback, update ledger to reflect previous state completed

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

- [ ] Assuming all tenants are at the same schema version**: After partial rollouts, rollbacks, or failed migrations, tenants diverge. Always check the ledger before assuming schema state. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Every tenant migration records in the ledger
- [ ] Ledger accurately reflects actual schema state
- [ ] Differential migration applies only pending changes
- [ ] Rollback updates ledger correctly
- [ ] Canary group defined and migrations applied
- [ ] Ledger provides accurate schema version for every tenant
- [ ] Differential migration applies only pending changes
- [ ] Audit queries run in < 100ms for 10000 tenants
- [ ] Canary detection prevents rollback for 100% of tenants
- [ ] Rollback is tested and verified for each migration

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
- [ ] Ledger records migration but schema change fails (inconsistent state) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming all tenants are at the same schema version**: After partial rollouts, rollbacks, or failed migrations, tenants diverge. Always check the ledger before assuming schema state. prevented

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
