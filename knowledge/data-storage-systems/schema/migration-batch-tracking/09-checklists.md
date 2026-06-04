# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.7 Migration batch tracking and the migrations table
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use --step for production applied
- [ ] migrate:fresh for local development only applied
- [ ] Monitor migration status in CI applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Ignoring batch numbers in deploy scripts**: Deploy scripts that run `migrate` without accounting for partial failure leave the database in an inconsistent state. prevented
- [ ] Using migrate:fresh on shared staging**: Destroys test data entered by QA team. Recovery requires reseeding. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Production migrations use `--step` for per-migration batches
- [ ] Migration state is verified before and after deployment
- [ ] Rollback is safe, predictable, and reversible

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use --step for production applied
- [ ] migrate:fresh for local development only applied
- [ ] Monitor migration status in CI applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Before deployment, run `php artisan migrate:status` to verify the current migration state matches expectations completed
- [ ] For production, use `php artisan migrate --step --force` to assign each migration its own batch for granular rollback completed
- [ ] After deployment, verify all new migrations are recorded with the correct batch numbers completed
- [ ] If a migration fails, assess whether to roll back the failed batch or create a corrective migration completed
- [ ] For local development, use `migrate:fresh` to drop all tables and re-run from scratch completed

---

# Performance Checklist

- [ ] Performance: Batch tracking has negligible overhead — the `migrations` table is small and queried only during `migrate` and `migrate:rollback` commands. However...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Ignoring batch numbers in deploy scripts**: Deploy scripts that run `migrate` without accounting for partial failure leave the database in an inconsistent state. prevented
- [ ] Using migrate:fresh on shared staging**: Destroys test data entered by QA team. Recovery requires reseeding. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `migrate:status` shows expected state before running
- [ ] Production migrations use `--step` for per-migration batches
- [ ] After deploy, all new migrations show correct batch numbers
- [ ] `down()` methods exist and are tested for all migrations
- [ ] Failed migration state is verified before recovery action
- [ ] Production migrations use `--step` for per-migration batches
- [ ] Migration state is verified before and after deployment
- [ ] Rollback is safe, predictable, and reversible
- [ ] Failed migrations are handled without data loss

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
- [ ] ### Batch rollback undoes too much prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Ignoring batch numbers in deploy scripts**: Deploy scripts that run `migrate` without accounting for partial failure leave the database in an inconsistent state. prevented
- [ ] Using migrate:fresh on shared staging**: Destroys test data entered by QA team. Recovery requires reseeding. prevented

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
