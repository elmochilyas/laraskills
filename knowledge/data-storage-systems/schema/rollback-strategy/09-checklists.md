# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.25 Rollback strategy per migration type (additive safe, destructive requires compatibility window)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Immediate rollback for additive applied
- [ ] Delayed rollback for destructive applied
- [ ] Rollback planning in deploy scripts applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Rolling back a destructive migration immediately**: The migration drops a column. The rollback re-adds it. But queue jobs that ran during the rollback window tried to insert into the dropped column and failed. The data is lost. prevented
- [ ] Assuming rollback is always possible without data loss**: Dropping a table and rolling back requires restoring from backup. Rollback is not a substitute for backup. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Additive migrations are rolled back immediately and safely
- [ ] Destructive migrations have documented compatibility windows
- [ ] All rollback paths are tested in staging

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Immediate rollback for additive applied
- [ ] Delayed rollback for destructive applied
- [ ] Rollback planning in deploy scripts applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Classify the migration: additive (CREATE, ADD COLUMN, ADD INDEX), destructive (DROP, ALTER TYPE), or rename completed
- [ ] For additive operations: rollback is safe immediately — no data loss, no code breakage completed
- [ ] For destructive operations: never roll back immediately. First deploy code that stops referencing the old structure. Wait 24-48 hours. Then roll back. completed
- [ ] For rename operations: use expand-contract with dual-write. Rollback = stop writing to new, revert to old. completed
- [ ] Always test the rollback path in staging before deploying to production completed

---

# Performance Checklist

- [ ] Performance: Rollback performance depends on the operation type. Additive rollbacks (DROP COLUMN, DROP INDEX) complete in milliseconds to seconds since they onl...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Rolling back a destructive migration immediately**: The migration drops a column. The rollback re-adds it. But queue jobs that ran during the rollback window tried to insert into the dropped column and failed. The data is lost. prevented
- [ ] Assuming rollback is always possible without data loss**: Dropping a table and rolling back requires restoring from backup. Rollback is not a substitute for backup. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Migration type classified as additive or destructive
- [ ] Additive rollback tested and confirmed safe
- [ ] Destructive rollback has compatibility window defined
- [ ] Queue jobs and long-running processes accounted for
- [ ] Deployment script includes rollback step
- [ ] Additive migrations are rolled back immediately and safely
- [ ] Destructive migrations have documented compatibility windows
- [ ] All rollback paths are tested in staging
- [ ] Pre-migration backups exist for destructive operations
- [ ] Deployment scripts include automated rollback steps

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
- [ ] ### Rolling back a destructive migration immediately prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Rolling back a destructive migration immediately**: The migration drops a column. The rollback re-adds it. But queue jobs that ran during the rollback window tried to insert into the dropped column and failed. The data is lost. prevented
- [ ] Assuming rollback is always possible without data loss**: Dropping a table and rolling back requires restoring from backup. Rollback is not a substitute for backup. prevented

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
