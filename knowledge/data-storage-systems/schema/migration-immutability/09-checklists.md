# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.20 Migration immutability (no editing deployed migrations)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Corrective migration applied
- [ ] Rollback + re-run for local only applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] The most common Laravel migration mistake**: Editing a deployed migration to fix a typo in column name. The edit is silently ignored in all environments where the migration has already run. Developers think the fix is applied, but it's not. prevented
- [ ] Editing to add a missing index**: Adding `->index()` to a migration that already ran. The index is never created. The developer wonders why queries are slow. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] No deployed migration files are ever edited
- [ ] All fixes use corrective migrations with proper ordering
- [ ] Local development uses rollback + edit for unpushed changes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Corrective migration applied
- [ ] Rollback + re-run for local only applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Identify the deployed migration with the error or missing change completed
- [ ] If the migration hasn't been pushed to any shared branch: rollback (`migrate:rollback`), edit the file, re-run completed
- [ ] If the migration has been pushed (deployed to any shared environment): leave it unchanged completed
- [ ] Create a new migration: `php artisan make:migration fix_column_name_on_posts_table` completed
- [ ] Write the corrective action in the new migration's `up()` method completed

---

# Performance Checklist

- [ ] Performance: Migration immutability itself has no direct performance cost — the `migrations` table lookup is a simple filename comparison. However, the correcti...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] The most common Laravel migration mistake**: Editing a deployed migration to fix a typo in column name. The edit is silently ignored in all environments where the migration has already run. Developers think the fix is applied, but it's not. prevented
- [ ] Editing to add a missing index**: Adding `->index()` to a migration that already ran. The index is never created. The developer wonders why queries are slow. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No deployed migration files have been edited
- [ ] Corrective migrations exist for all deployed migration mistakes
- [ ] New migration timestamps sort correctly after the original
- [ ] Original migration's `down()` method is NOT modified
- [ ] No deployed migration files are ever edited
- [ ] All fixes use corrective migrations with proper ordering
- [ ] Local development uses rollback + edit for unpushed changes
- [ ] Team convention prevents migration file modifications post-deployment

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
- [ ] ### Editing a deployed migration prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] The most common Laravel migration mistake**: Editing a deployed migration to fix a typo in column name. The edit is silently ignored in all environments where the migration has already run. Developers think the fix is applied, but it's not. prevented
- [ ] Editing to add a missing index**: Adding `->index()` to a migration that already ran. The index is never created. The developer wonders why queries are slow. prevented

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
