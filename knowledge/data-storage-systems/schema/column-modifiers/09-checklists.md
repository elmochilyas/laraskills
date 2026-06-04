# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.3 Column modifiers (nullable, default, after, comment, charset, collation, autoIncrement, unsigned, virtual/stored generated)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] NOT NULL with default for required columns applied
- [ ] DEFAULT for migration safety applied
- [ ] virtualAs for JSON indexing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Omitting modifiers during ->change()**: `$table->string('name')->nullable()->change();` — if the original column had `default('')`, the default is dropped because it wasn't included in the change call. All existing modifiers must be re-specified. prevented
- [ ] NOT NULL on add without default**: Adding a `NOT NULL` column to a table with existing rows fails immediately because existing rows have no value. Use `nullable()` or `default()` and backfill later. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Zero-downtime column additions use nullable() or default()
- [ ] JSON path indexes use virtualAs() generated columns
- [ ] change() operations preserve all existing modifiers

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] NOT NULL with default for required columns applied
- [ ] DEFAULT for migration safety applied
- [ ] virtualAs for JSON indexing applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Determine nullability: use `nullable()` for optional columns, omit for required columns completed
- [ ] Set default value: use `default($value)` for database-level defaults on INSERT completed
- [ ] For zero-downtime column additions, add as `nullable()` or with `default()` to prevent NOT NULL violations on existing rows completed
- [ ] For MySQL table layout, use `after('column')` to position the new column completed
- [ ] For querying JSON fields, use `virtualAs('data->>"$.field"')->index()` to enable indexed access completed

---

# Performance Checklist

- [ ] Performance: - `nullable` columns have a per-row NULL bitmap overhead in MySQL (1 bit per nullable column, rounded to nearest byte).
- [ ] Performance: - `storedAs()` generated columns add write cost — the expression is evaluated and stored on every INSERT/UPDATE.
- [ ] Performance: - `virtualAs()` generated columns add read cost — the expression is evaluated on every SELECT that references the column.
- [ ] Performance: - `after()` does not affect query performance; it only changes physical layout in MySQL for tools that read INFORMATION_SCHEMA.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Omitting modifiers during ->change()**: `$table->string('name')->nullable()->change();` — if the original column had `default('')`, the default is dropped because it wasn't included in the change call. All existing modifiers must be re-specified. prevented
- [ ] NOT NULL on add without default**: Adding a `NOT NULL` column to a table with existing rows fails immediately because existing rows have no value. Use `nullable()` or `default()` and backfill later. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Nullable columns use `nullable()` explicitly
- [ ] New columns on existing tables are nullable or have a default
- [ ] `->change()` calls include all existing modifiers
- [ ] Generated columns use the correct `virtualAs()` vs `storedAs()` based on read/write ratio
- [ ] Charset and collation are specified only when overriding table defaults
- [ ] Zero-downtime column additions use nullable() or default()
- [ ] JSON path indexes use virtualAs() generated columns
- [ ] change() operations preserve all existing modifiers
- [ ] NOT NULL enforcement is deferred until after backfill
- [ ] Generated columns use virtualAs for indexing, storedAs for frequent reads

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
- [ ] ### Modifiers dropped during change() prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Omitting modifiers during ->change()**: `$table->string('name')->nullable()->change();` — if the original column had `default('')`, the default is dropped because it wasn't included in the change call. All existing modifiers must be re-specified. prevented
- [ ] NOT NULL on add without default**: Adding a `NOT NULL` column to a table with existing rows fails immediately because existing rows have no value. Use `nullable()` or `default()` and backfill later. prevented

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
