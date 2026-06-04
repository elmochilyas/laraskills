# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.21 Multi-tenant migration orchestration (per-tenant DB, sequential/parallel, queued)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Queued migration per tenant applied
- [ ] Canary tenants applied
- [ ] Tenant migration version ledger applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running all tenant migrations in one transaction**: A single failure rolls back the entire batch, undoing successfully migrated tenants. Wrap each tenant migration in its own transaction. prevented
- [ ] Not testing on a subset first**: A migration that works on a small tenant database with 10K rows may time out on a large tenant with 100M rows. prevented
- [ ] Ignoring tenant database versions**: Not all tenants may be at the same schema version. The orchestrator must handle tenants with pending migrations correctly. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All tenant databases are migrated to the target schema version
- [ ] Migration failures are isolated to individual tenants
- [ ] Canary rollout catches issues before full deployment

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Queued migration per tenant applied
- [ ] Canary tenants applied
- [ ] Tenant migration version ledger applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Identify target schema version and required migrations completed
- [ ] For canary rollout: dispatch migration jobs to 1-5% of tenants first completed
- [ ] Monitor canary tenants for errors, performance, and data integrity completed
- [ ] If canary passes, dispatch to remaining tenants in batches (e.g., 10-50 at a time) completed
- [ ] Each tenant migration runs as an isolated queue job with its own connection completed

---

# Performance Checklist

- [ ] Performance: - Each tenant migration creates its own database connection. With parallel approaches, connection count = concurrency * connections_per_migration.
- [ ] Performance: - Large tenants take longer to migrate (more rows to scan for DDL validation). Sequential ordering can put large tenants first to avoid blocking sm...
- [ ] Performance: - PostgreSQL's concurrent DDL operations (CREATE INDEX CONCURRENTLY) should be used per-tenant for large indexes.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Running all tenant migrations in one transaction**: A single failure rolls back the entire batch, undoing successfully migrated tenants. Wrap each tenant migration in its own transaction. prevented
- [ ] Not testing on a subset first**: A migration that works on a small tenant database with 10K rows may time out on a large tenant with 100M rows. prevented
- [ ] Ignoring tenant database versions**: Not all tenants may be at the same schema version. The orchestrator must handle tenants with pending migrations correctly. prevented
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
- [ ] Canary tenants are selected and monitored first
- [ ] Migration jobs are isolated per tenant
- [ ] Central ledger tracks each tenant's migration state
- [ ] Concurrency is limited to prevent connection pool exhaustion
- [ ] Failed tenants are isolated without blocking others
- [ ] All tenant databases are migrated to the target schema version
- [ ] Migration failures are isolated to individual tenants
- [ ] Canary rollout catches issues before full deployment
- [ ] Central ledger accurately tracks each tenant's schema version
- [ ] Connection pool limits are respected during parallel execution

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
- [ ] ### Connection pool exhaustion prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running all tenant migrations in one transaction**: A single failure rolls back the entire batch, undoing successfully migrated tenants. Wrap each tenant migration in its own transaction. prevented
- [ ] Not testing on a subset first**: A migration that works on a small tenant database with 10K rows may time out on a large tenant with 100M rows. prevented
- [ ] Ignoring tenant database versions**: Not all tenants may be at the same schema version. The orchestrator must handle tenants with pending migrations correctly. prevented

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
