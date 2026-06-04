# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.6 Migration ordering and naming conventions (YYYY_MM_DD_HHmmss)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Reference tables before referencing tables applied
- [ ] Verb prefix convention applied
- [ ] Aggressive timestamps applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Duplicate timestamp**: Two migrations with the same timestamp cause unpredictable ordering. Always run `migrate:status` after creating migrations in a team setting. prevented
- [ ] Poor naming**: `2026_06_02_000000_some_changes.php` — the name doesn't communicate what changes are made. This becomes unmanageable at scale. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All FK-referenced tables have migrations with earlier timestamps
- [ ] Filenames communicate migration intent through verb prefixes
- [ ] No timestamp collisions in the migration directory

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Reference tables before referencing tables applied
- [ ] Verb prefix convention applied
- [ ] Aggressive timestamps applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Run `php artisan make:migration create_authors_table` to generate the file with a timestamp completed
- [ ] Run `php artisan make:migration create_books_table` — verify the timestamp sorts after create_authors_table if books references authors completed
- [ ] If ordering is incorrect, manually prepend an earlier timestamp to the dependent migration's filename completed
- [ ] Follow verb prefix conventions: `create_` for new tables, `add_` for new columns, `drop_` for removals, `change_` for modifications completed
- [ ] Verify ordering with `php artisan migrate:status` completed

---

# Performance Checklist

- [ ] Performance: Not applicable directly — naming and ordering don't affect query performance. However, incorrect ordering that causes FK failures in CI wastes deve...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Duplicate timestamp**: Two migrations with the same timestamp cause unpredictable ordering. Always run `migrate:status` after creating migrations in a team setting. prevented
- [ ] Poor naming**: `2026_06_02_000000_some_changes.php` — the name doesn't communicate what changes are made. This becomes unmanageable at scale. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Filename uses `YYYY_MM_DD_HHmmss` timestamp prefix
- [ ] Descriptive name uses verb prefix convention
- [ ] FK-referenced tables have earlier timestamps
- [ ] No duplicate timestamps across migration files
- [ ] `migrate:status` shows expected execution order
- [ ] All FK-referenced tables have migrations with earlier timestamps
- [ ] Filenames communicate migration intent through verb prefixes
- [ ] No timestamp collisions in the migration directory
- [ ] `migrate:status` shows the expected execution order

---

# Maintainability Checklist

- [ ] Verb prefix convention applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### FK constraint failure prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Duplicate timestamp**: Two migrations with the same timestamp cause unpredictable ordering. Always run `migrate:status` after creating migrations in a team setting. prevented
- [ ] Poor naming**: `2026_06_02_000000_some_changes.php` — the name doesn't communicate what changes are made. This becomes unmanageable at scale. prevented

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
