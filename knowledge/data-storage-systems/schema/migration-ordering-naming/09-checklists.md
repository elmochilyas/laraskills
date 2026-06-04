# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.6 Migration ordering and naming (YYYY_MM_DD_HHmmss)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dependency-first naming applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Same-second timestamp collision**: Two developers run `make:migration` at the same second, producing identical timestamps. The PHP sort by full string is deterministic but arbitrary between the two files. Run `php artisan migrate:status` to verify the intended order. prevented
- [ ] ```bash prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All FK-referenced tables have migrations with earlier timestamps
- [ ] Filenames clearly communicate migration intent
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

- [ ] Dependency-first naming applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Run `php artisan make:migration create_users_table` — generates a file with a `YYYY_MM_DD_HHmmss` prefix completed
- [ ] Run `php artisan make:migration create_posts_table` — verify the timestamp sorts after create_users_table if posts references users completed
- [ ] If FK ordering is violated, manually prepend a slightly earlier timestamp to the dependent migration's filename completed
- [ ] Use verb prefixes: `create_` for tables, `add_xxx_to_yyy` for new columns, `change_xxx_on_yyy` for modifications completed
- [ ] Run `php artisan migrate:status` to verify the expected execution order before deployment completed

---

# Performance Checklist

- [ ] Performance: Not applicable to migration ordering directly. However, migration execution time matters for deployment duration. Ordering migrations so that slow ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Same-second timestamp collision**: Two developers run `make:migration` at the same second, producing identical timestamps. The PHP sort by full string is deterministic but arbitrary between the two files. Run `php artisan migrate:status` to verify the intended order. prevented
- [ ] ```bash prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Timestamp prefix determines execution order
- [ ] FK-referenced tables have earlier timestamps than referencing tables
- [ ] Verb prefix conventions are followed for naming
- [ ] No duplicate timestamps exist in the migration directory
- [ ] `migrate:status` shows correct order
- [ ] All FK-referenced tables have migrations with earlier timestamps
- [ ] Filenames clearly communicate migration intent
- [ ] No timestamp collisions in the migration directory
- [ ] `migrate:status` shows the expected execution order

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
- [ ] ### FK dependency failure prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Same-second timestamp collision**: Two developers run `make:migration` at the same second, producing identical timestamps. The PHP sort by full string is deterministic but arbitrary between the two files. Run `php artisan migrate:status` to verify the intended order. prevented
- [ ] ```bash prevented

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
