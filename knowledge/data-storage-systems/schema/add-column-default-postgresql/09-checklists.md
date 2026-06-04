# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.7 ADD COLUMN with default in PostgreSQL (no lock, metadata-only)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Add column with default in production applied
- [ ] Add NOT NULL in steps applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Volatile default**: `ALTER TABLE ... ADD COLUMN ... DEFAULT random()` — PostgreSQL 11+ still rewrites the table for volatile defaults. Use stable default. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Column additions complete in milliseconds regardless of table size
- [ ] Non-volatile defaults enable metadata-only operation
- [ ] NOT NULL constraints use NOT VALID + VALIDATE

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Add column with default in production applied
- [ ] Add NOT NULL in steps applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Determine default volatility — must be non-volatile for metadata-only addition completed
- [ ] For additive columns: `ALTER TABLE orders ADD COLUMN status INT NOT NULL DEFAULT 0` — instant completed
- [ ] For adding NOT NULL to existing column: `ALTER TABLE orders ADD CONSTRAINT status_not_null CHECK (status IS NOT NULL) NOT VALID` completed
- [ ] Then: `ALTER TABLE orders VALIDATE CONSTRAINT status_not_null` — scans table without blocking writes completed
- [ ] Finally: `ALTER TABLE orders ALTER COLUMN status SET NOT NULL` — metadata-only after constraint validation completed

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

- [ ] Volatile default**: `ALTER TABLE ... ADD COLUMN ... DEFAULT random()` — PostgreSQL 11+ still rewrites the table for volatile defaults. Use stable default. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Default expression is non-volatile (constant, immutable function)
- [ ] Column addition completes in milliseconds
- [ ] NOT NULL uses NOT VALID + VALIDATE pattern
- [ ] Existing rows return the default value correctly on read
- [ ] No table rewrite occurred
- [ ] Column additions complete in milliseconds regardless of table size
- [ ] Non-volatile defaults enable metadata-only operation
- [ ] NOT NULL constraints use NOT VALID + VALIDATE
- [ ] No table rewrites or lock contention during migration

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
- [ ] ### Volatile default triggers rewrite prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Volatile default**: `ALTER TABLE ... ADD COLUMN ... DEFAULT random()` — PostgreSQL 11+ still rewrites the table for volatile defaults. Use stable default. prevented

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
