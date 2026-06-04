# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.17 Migration order dependencies (foreign keys, referenced tables)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Create tables → Add columns → Add constraints applied
- [ ] Deferred FK validation applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Creating FK in the same migration as the table**: `Schema::create('orders', fn($table) => $table->foreignId('user_id')->constrained())` — the `users` table must be created in an earlier migration. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All table creation migrations are ordered by FK dependency
- [ ] FK constraints are added after both tables exist
- [ ] Circular dependencies are resolved cleanly

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Create tables → Add columns → Add constraints applied
- [ ] Deferred FK validation applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] List all tables and their FK dependencies completed
- [ ] Order table creation: tables with no FK dependencies first, then tables that reference them completed
- [ ] For each FK constraint, create it in a separate migration AFTER both tables exist completed
- [ ] For circular dependencies (A references B, B references A): create both tables without FKs first, then add both FKs in a subsequent migration completed
- [ ] For PostgreSQL, use `NOT VALID` constraints to defer validation: `ALTER TABLE ... ADD CONSTRAINT ... NOT VALID` — validates later completed

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

- [ ] Creating FK in the same migration as the table**: `Schema::create('orders', fn($table) => $table->foreignId('user_id')->constrained())` — the `users` table must be created in an earlier migration. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All FK-referenced tables are created before referencing tables
- [ ] FK constraints are added as separate migrations after table creation
- [ ] Circular dependencies are resolved with deferred FK addition
- [ ] Migration order is verified with `migrate:status`
- [ ] PostgreSQL uses NOT VALID for zero-lock FK validation on large tables
- [ ] All table creation migrations are ordered by FK dependency
- [ ] FK constraints are added after both tables exist
- [ ] Circular dependencies are resolved cleanly
- [ ] PostgreSQL uses NOT VALID for large-table validation
- [ ] `migrate:status` shows correct execution order

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
- [ ] ### Creating FK in the same migration as the table prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Creating FK in the same migration as the table**: `Schema::create('orders', fn($table) => $table->foreignId('user_id')->constrained())` — the `users` table must be created in an earlier migration. prevented

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
