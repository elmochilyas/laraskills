# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.14 Schema version tracking across multiple database connections
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Migration batch per tenant applied
- [ ] Central migration tracker applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running migration once assuming all connections are synchronized**: Each connection has its own `migrations` table. Running `migrate` once only updates the default connection. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All database connections are migrated to the target schema version
- [ ] Central ledger accurately reflects each connection's state
- [ ] Reconciliation detects and reports drift

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Migration batch per tenant applied
- [ ] Central migration tracker applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] For each database connection, iterate and run `php artisan migrate --database=connection_name --force` completed
- [ ] After each connection's migration, update the central `tenant_schema_versions(tenant_id, migration_name, batch, applied_at)` table completed
- [ ] Use a loop or queue to fan out migrations across connections completed
- [ ] Before migrating a connection, check its current schema version from the central table completed
- [ ] Run periodic reconciliation: compare central ledger entries with each connection's `SELECT * FROM migrations` completed

---

# Performance Checklist

- [ ] Performance: Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Running migration once assuming all connections are synchronized**: Each connection has its own `migrations` table. Running `migrate` once only updates the default connection. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Each connection has its own `migrations` table
- [ ] Central `tenant_schema_versions` table tracks per-connection state
- [ ] Migration fan-out iterates over all connections
- [ ] Central ledger updated atomically per connection
- [ ] Reconciliation detects drift between ledger and connection state
- [ ] All database connections are migrated to the target schema version
- [ ] Central ledger accurately reflects each connection's state
- [ ] Reconciliation detects and reports drift
- [ ] Migration fan-out handles 100+ connections with retry
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
- [ ] ### Running migration once assuming all connections sync prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running migration once assuming all connections are synchronized**: Each connection has its own `migrations` table. Running `migrate` once only updates the default connection. prevented

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
