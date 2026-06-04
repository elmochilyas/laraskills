# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.4 Foreign key definition (constrained, onDelete, onUpdate, cascade/restrict/set null)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] CASCADE for ownership applied
- [ ] RESTRICT for financial data applied
- [ ] SET NULL for optional relationships applied
- [ ] constrained() as default applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Missing constrained() — manual FK without index**: `$table->unsignedBigInteger('user_id'); $table->foreign('user_id')->references('id')->on('users');` — this adds the constraint but NOT the index, causing full table scans on joins. prevented
- [ ] unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. If the referenced PK uses `increments()` (signed integer), the FK constraint fails. prevented
- [ ] Circular cascade**: Two tables with CASCADE in both directions create infinite loops. The database detects and blocks these. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All FK constraints use `foreignId()->constrained()` pattern
- [ ] Referential actions match relationship semantics
- [ ] FK columns are indexed for join performance

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] CASCADE for ownership applied
- [ ] RESTRICT for financial data applied
- [ ] SET NULL for optional relationships applied
- [ ] constrained() as default applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Use `$table->foreignId('user_id')` to create the FK column with correct unsigned type completed
- [ ] Chain `->constrained()` to automatically infer the referenced table and column, adding both the constraint and the index completed
- [ ] Choose `->cascadeOnDelete()` for owned child records (post belongs to user) completed
- [ ] Choose `->restrictOnDelete()` for financial or audit data where automatic deletion is prohibited completed
- [ ] Choose `->nullOnDelete()` for optional relationships where children remain valid without a parent completed

---

# Performance Checklist

- [ ] Performance: - FK constraints add a read check on the parent table for every INSERT/UPDATE to the child table. High-throughput child tables incur a measurable l...
- [ ] Performance: - CASCADE operations are not free — deleting a parent with 10,000 children generates 10,001 delete operations (all in one transaction).
- [ ] Performance: - Index on the referencing column is required for FK performance — without it, every FK check triggers a full table scan on the child table.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Missing constrained() — manual FK without index**: `$table->unsignedBigInteger('user_id'); $table->foreign('user_id')->references('id')->on('users');` — this adds the constraint but NOT the index, causing full table scans on joins. prevented
- [ ] unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. If the referenced PK uses `increments()` (signed integer), the FK constraint fails. prevented
- [ ] Circular cascade**: Two tables with CASCADE in both directions create infinite loops. The database detects and blocks these. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `foreignId()` matches the parent's PK type (unsignedBigInteger for bigIncrements)
- [ ] `constrained()` is used instead of manual FK definition
- [ ] `onDelete` action chosen based on relationship semantics
- [ ] FK column has an index (automatic with constrained())
- [ ] Parent table migration runs before the FK migration
- [ ] All FK constraints use `foreignId()->constrained()` pattern
- [ ] Referential actions match relationship semantics
- [ ] FK columns are indexed for join performance
- [ ] No type mismatches between FK and PK columns
- [ ] Migration ordering ensures parent table exists before FK

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
- [ ] ### Missing index on FK column prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Missing constrained() — manual FK without index**: `$table->unsignedBigInteger('user_id'); $table->foreign('user_id')->references('id')->on('users');` — this adds the constraint but NOT the index, causing full table scans on joins. prevented
- [ ] unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. If the referenced PK uses `increments()` (signed integer), the FK constraint fails. prevented
- [ ] Circular cascade**: Two tables with CASCADE in both directions create infinite loops. The database detects and blocks these. prevented

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
