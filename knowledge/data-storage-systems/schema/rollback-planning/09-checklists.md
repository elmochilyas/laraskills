# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.11 Rollback planning (reversible migrations, data preservation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Pre-destructive-operation snapshot applied
- [ ] `down()` method for every migration applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No down() method**: "We'll never roll back" — but you will. Always write a `down()` method, even if it's just `Schema::dropIfExists()`. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Every migration has a tested rollback plan
- [ ] Additive migrations roll back immediately and safely
- [ ] Destructive migrations have backups and compatibility windows

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Pre-destructive-operation snapshot applied
- [ ] `down()` method for every migration applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Classify the migration as additive, destructive, or rename completed
- [ ] For additive (CREATE, ADD COLUMN): rollback is safe immediately — test with `migrate:rollback --step=1` completed
- [ ] For destructive (DROP TABLE, DROP COLUMN): take a pre-migration backup or snapshot first completed
- [ ] For destructive: deploy code that stops referencing old structures, wait 24-48h, then drop completed
- [ ] Always test rollback in staging with production-like data completed

---

# Performance Checklist

- [ ] Performance: Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] No down() method**: "We'll never roll back" — but you will. Always write a `down()` method, even if it's just `Schema::dropIfExists()`. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Migration type classified correctly
- [ ] Additive rollback tested via migrate:rollback --step
- [ ] Pre-destructive-operation backup exists
- [ ] Rollback tested in staging environment
- [ ] Deployment script includes automated rollback
- [ ] Every migration has a tested rollback plan
- [ ] Additive migrations roll back immediately and safely
- [ ] Destructive migrations have backups and compatibility windows
- [ ] Deployment scripts include automated rollback steps
- [ ] Rollback is tested in staging with production-like data

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
- [ ] ### No down() method prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No down() method**: "We'll never roll back" — but you will. Always write a `down()` method, even if it's just `Schema::dropIfExists()`. prevented

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
