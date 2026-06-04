# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.1 Laravel migration file structure (class, up/down, shouldRun)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Single-responsibility migrations applied
- [ ] Idempotent down() applied
- [ ] Conditional migrations with shouldRun applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Editing deployed migrations**: The `migrations` table has the filename recorded. Re-editing the class doesn't re-run it — the change silently never happens. Always create a new migration. prevented
- [ ] Incomplete down()**: `up()` adds `->unique()` but `down()` only calls `dropColumn()` without `dropIndex()` first. This fails on rollback because the index still exists. prevented
- [ ] Class name collisions in older Laravel**: Two developers create migrations with the same class name on the same day. Since Laravel 9, anonymous classes solve this. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Migration files are immutable after deployment
- [ ] `up()` and `down()` are exact inverses of each other
- [ ] Anonymous class syntax prevents class collisions

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Single-responsibility migrations applied
- [ ] Idempotent down() applied
- [ ] Conditional migrations with shouldRun applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Run `php artisan make:migration create_posts_table` to generate the file completed
- [ ] Open the generated file and replace the class with `return new class extends Migration` completed
- [ ] Define `$connection` if using a non-default database connection completed
- [ ] Implement `up()` with `Schema::create()` or `Schema::table()` using the Blueprint completed
- [ ] Implement `down()` with the exact inverse — `Schema::dropIfExists()` or `Schema::table()` with `dropColumn()` completed

---

# Performance Checklist

- [ ] Performance: - Each migration runs in its own transaction (where supported). DDL operations on large tables may exceed transaction timeout.
- [ ] Performance: - Schema dump (`schema:dump`) bypasses hundreds of small migration files for fresh installs, reducing initial migration time from minutes to seconds.
- [ ] Performance: - The `migrations` table itself is tiny and incurs negligible overhead.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Editing deployed migrations**: The `migrations` table has the filename recorded. Re-editing the class doesn't re-run it — the change silently never happens. Always create a new migration. prevented
- [ ] Incomplete down()**: `up()` adds `->unique()` but `down()` only calls `dropColumn()` without `dropIndex()` first. This fails on rollback because the index still exists. prevented
- [ ] Class name collisions in older Laravel**: Two developers create migrations with the same class name on the same day. Since Laravel 9, anonymous classes solve this. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Migration uses anonymous class syntax (`return new class extends Migration`)
- [ ] `$connection` explicitly set for non-default database connections
- [ ] `up()` method contains the forward schema change
- [ ] `down()` method contains the exact inverse operation
- [ ] Filename timestamp sorts correctly relative to dependent migrations
- [ ] Migration files are immutable after deployment
- [ ] `up()` and `down()` are exact inverses of each other
- [ ] Anonymous class syntax prevents class collisions
- [ ] Filename timestamps enforce correct ordering
- [ ] Conditional execution via `shouldRun()` works as expected

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
- [ ] ### Missing down() method prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Editing deployed migrations**: The `migrations` table has the filename recorded. Re-editing the class doesn't re-run it — the change silently never happens. Always create a new migration. prevented
- [ ] Incomplete down()**: `up()` adds `->unique()` but `down()` only calls `dropColumn()` without `dropIndex()` first. This fails on rollback because the index still exists. prevented
- [ ] Class name collisions in older Laravel**: Two developers create migrations with the same class name on the same day. Since Laravel 9, anonymous classes solve this. prevented

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
