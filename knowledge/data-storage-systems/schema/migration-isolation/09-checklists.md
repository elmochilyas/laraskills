# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.9 Migration isolation (isolated option, cache lock)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always use --isolated in deploy scripts applied
- [ ] Combine with horizon:terminate applied
- [ ] Monitor lock acquisition applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not using --isolated in multi-server deployments**: Two servers run the same migration simultaneously. The second server encounters "table already exists" or "duplicate column" errors, failing the deployment. prevented
- [ ] Lock timeout too short**: A migration takes 45 seconds but the lock timeout is 30. The lock expires, a second server acquires it, and both run the migration concurrently. prevented
- [ ] Assuming single-server safety**: Even on a single server, manual `php artisan migrate` from two terminal sessions can cause the same race. --isolated prevents this. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Only one server acquires the migration lock per deployment
- [ ] Lock timeout exceeds the longest migration duration
- [ ] Servers without the lock exit successfully without error

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always use --isolated in deploy scripts applied
- [ ] Combine with horizon:terminate applied
- [ ] Monitor lock acquisition applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Configure a shared cache driver (Redis) accessible by all application servers completed
- [ ] Update the deployment script to run `php artisan migrate --isolated --force` instead of plain `migrate` completed
- [ ] Set `MIGRATION_LOCK_TIMEOUT` in `.env` to a value exceeding the longest expected migration (default 30s) completed
- [ ] Verify that the lock acquisition works: run `migrate --isolated` on two servers simultaneously — only one should apply migrations completed
- [ ] After migration completes, optionally terminate Horizon workers: `php artisan horizon:terminate` completed

---

# Performance Checklist

- [ ] Performance: - Cache lock overhead is negligible (< 5ms).
- [ ] Performance: - Migration time is unchanged — only one server runs migrations anyway.
- [ ] Performance: - Lock timeout should exceed the expected longest migration time. Default 30 seconds may be too short for large data backfill migrations.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not using --isolated in multi-server deployments**: Two servers run the same migration simultaneously. The second server encounters "table already exists" or "duplicate column" errors, failing the deployment. prevented
- [ ] Lock timeout too short**: A migration takes 45 seconds but the lock timeout is 30. The lock expires, a second server acquires it, and both run the migration concurrently. prevented
- [ ] Assuming single-server safety**: Even on a single server, manual `php artisan migrate` from two terminal sessions can cause the same race. --isolated prevents this. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Cache driver supports atomic locks (Redis recommended)
- [ ] All app servers point to the same cache backend
- [ ] `MIGRATION_LOCK_TIMEOUT` exceeds the longest migration
- [ ] Deployment script uses `--isolated --force`
- [ ] Servers that don't acquire the lock exit with code 0 (not failure)
- [ ] Only one server acquires the migration lock per deployment
- [ ] Lock timeout exceeds the longest migration duration
- [ ] Servers without the lock exit successfully without error
- [ ] Cache backend is shared and supports atomic locks
- [ ] Horizon workers terminate after migration to refresh schema cache

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
- [ ] ### Lock timeout too short prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not using --isolated in multi-server deployments**: Two servers run the same migration simultaneously. The second server encounters "table already exists" or "duplicate column" errors, failing the deployment. prevented
- [ ] Lock timeout too short**: A migration takes 45 seconds but the lock timeout is 30. The lock expires, a second server acquires it, and both run the migration concurrently. prevented
- [ ] Assuming single-server safety**: Even on a single server, manual `php artisan migrate` from two terminal sessions can cause the same race. --isolated prevents this. prevented

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
