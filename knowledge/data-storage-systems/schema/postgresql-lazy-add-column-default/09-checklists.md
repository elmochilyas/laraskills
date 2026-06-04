# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.17 PostgreSQL lazy ADD COLUMN DEFAULT (PostgreSQL 11+)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Add nullable column first, then set NOT NULL applied
- [ ] Add non-nullable column with default applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Adding column with volatile default**: `ALTER TABLE ADD COLUMN random_id uuid DEFAULT gen_random_uuid()` — this is a volatile default and will rewrite the entire table. prevented
- [ ] Assuming add-column is always instant**: Adding without DEFAULT or with NULL is instant. Adding any column with any default was NOT instant in PostgreSQL < 11. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Column additions complete in milliseconds regardless of table size
- [ ] Non-volatile defaults enable metadata-only operation
- [ ] NOT NULL constraints use NOT VALID for zero-downtime

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Add nullable column first, then set NOT NULL applied
- [ ] Add non-nullable column with default applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Determine the default value expression — must be non-volatile for metadata-only addition completed
- [ ] Execute: `ALTER TABLE orders ADD COLUMN status INT NOT NULL DEFAULT 0;` — instant in PG 11+ completed
- [ ] Verify the column exists and existing rows return the default value on read completed
- [ ] If the column must enforce NOT NULL, add as nullable first, then use `NOT VALID` + `VALIDATE` for zero-lock constraint addition completed
- [ ] For volatile defaults (gen_random_uuid), add the column as nullable with no default, then backfill, then set default completed

---

# Performance Checklist

- [ ] Performance: - Read performance for existing rows fetching the new column is slightly slower (catalog lookup), but the overhead is negligible.
- [ ] Performance: - After enough UPDATE operations rewrite all rows, the catalog default is no longer needed (the value is physically stored).
- [ ] Performance: - The initial addition is O(1) regardless of table size.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Adding column with volatile default**: `ALTER TABLE ADD COLUMN random_id uuid DEFAULT gen_random_uuid()` — this is a volatile default and will rewrite the entire table. prevented
- [ ] Assuming add-column is always instant**: Adding without DEFAULT or with NULL is instant. Adding any column with any default was NOT instant in PostgreSQL < 11. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] PostgreSQL version is 11+
- [ ] Default expression is non-volatile
- [ ] DDL completes in milliseconds regardless of table size
- [ ] Existing rows return the default value correctly
- [ ] NOT NULL validation uses NOT VALID + VALIDATE pattern if needed
- [ ] Column additions complete in milliseconds regardless of table size
- [ ] Non-volatile defaults enable metadata-only operation
- [ ] NOT NULL constraints use NOT VALID for zero-downtime
- [ ] Existing physical standbys are PG 11+ compatible

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
- [ ] Adding column with volatile default**: `ALTER TABLE ADD COLUMN random_id uuid DEFAULT gen_random_uuid()` — this is a volatile default and will rewrite the entire table. prevented
- [ ] Assuming add-column is always instant**: Adding without DEFAULT or with NULL is instant. Adding any column with any default was NOT instant in PostgreSQL < 11. prevented

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
