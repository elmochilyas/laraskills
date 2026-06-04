# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.22 Migration version ledger per tenant (schema_version tracking)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Pre-migration check applied
- [ ] Post-migration verification applied
- [ ] Staggered rollout applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not tracking schema versions per tenant**: After 6 months, no one knows which tenants are on which schema version. Schema drift becomes unrecoverable. prevented
- [ ] Updating ledger before migration succeeds**: If the ledger is updated and the migration fails, the ledger says "migrated" but the tenant database disagrees. Update the ledger only after successful migration. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Central ledger accurately reflects each tenant's schema version
- [ ] Pre-migration checks prevent redundant migration execution
- [ ] Drift detection identifies and reports inconsistencies

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Pre-migration check applied
- [ ] Post-migration verification applied
- [ ] Staggered rollout applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create `tenant_schema_versions(tenant_id, migration_name, batch, applied_at, status)` in the central database completed
- [ ] Index the ledger on `(tenant_id, batch)` for efficient queries completed
- [ ] Before migrating a tenant, check the ledger for the tenant's current schema version completed
- [ ] After each tenant migration succeeds, insert a ledger entry with status 'applied' completed
- [ ] For canary rollouts, mark canary tenants in the ledger and verify their migration status first completed

---

# Performance Checklist

- [ ] Performance: - The central ledger table is a hot path — every tenant migration reads and writes to it. For 1000+ tenant deployments, index the ledger on `(tenan...
- [ ] Performance: - Querying the ledger for "tenants at version X but not Y" runs as a range scan. For 10K+ tenants, this query can take seconds. Consider materializ...
- [ ] Performance: - The ledger update itself is a single row UPSERT — negligible overhead per tenant. The total migration time is dominated by DDL execution, not led...
- [ ] Performance: - Use a dedicated database connection for ledger operations to avoid competing with application queries for connection pool resources.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not tracking schema versions per tenant**: After 6 months, no one knows which tenants are on which schema version. Schema drift becomes unrecoverable. prevented
- [ ] Updating ledger before migration succeeds**: If the ledger is updated and the migration fails, the ledger says "migrated" but the tenant database disagrees. Update the ledger only after successful migration. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Never Trust Tenant ID From Request followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Central ledger table exists with proper indexes
- [ ] Ledger is updated atomically after each successful tenant migration
- [ ] Pre-migration check reads the ledger before applying
- [ ] Drift detection compares ledger with tenant migrations tables
- [ ] Ledger supports canary/phased rollout tracking
- [ ] Central ledger accurately reflects each tenant's schema version
- [ ] Pre-migration checks prevent redundant migration execution
- [ ] Drift detection identifies and reports inconsistencies
- [ ] Canary rollouts are tracked and verified in the ledger
- [ ] Version pinning enables selective tenant migration skipping

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Updating ledger before migration succeeds prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not tracking schema versions per tenant**: After 6 months, no one knows which tenants are on which schema version. Schema drift becomes unrecoverable. prevented
- [ ] Updating ledger before migration succeeds**: If the ledger is updated and the migration fails, the ledger says "migrated" but the tenant database disagrees. Update the ledger only after successful migration. prevented

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
