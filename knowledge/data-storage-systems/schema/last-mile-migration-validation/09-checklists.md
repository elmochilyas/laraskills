# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.18 Last-mile migration validation (pre-deployment checklist)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Pre-migration checklist script applied
- [ ] Maintenance window applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Skipping validation before production migration**: "It worked in staging" — staging data differs from production. Always run validation against production (read-only checks). prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Pre-deployment validation catches disk space, blocking queries, and backup issues
- [ ] Automated `migrate:check` blocks deployment on failure
- [ ] Staging tests with production-like data validate migration behavior

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Pre-migration checklist script applied
- [ ] Maintenance window applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Check database storage space: `SELECT SUM(data_length + index_length) FROM information_schema.tables WHERE table_schema = 'production'` — ensure en... completed
- [ ] Check for long-running queries: `SHOW FULL PROCESSLIST` or `SELECT * FROM pg_stat_activity` — kill blocking queries completed
- [ ] Confirm recent backup exists and is restorable completed
- [ ] Verify CI migration tests passed (syntax, forward, rollback) completed
- [ ] Confirm migration was tested on staging with production-like data volume completed

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

- [ ] Skipping validation before production migration**: "It worked in staging" — staging data differs from production. Always run validation against production (read-only checks). prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Disk space sufficient for the operation (shadow table, rebuild)
- [ ] No long-running queries that could block DDL
- [ ] Recent backup exists and restore was verified
- [ ] CI migration tests passed
- [ ] Migration tested on staging with production-like data
- [ ] Pre-deployment validation catches disk space, blocking queries, and backup issues
- [ ] Automated `migrate:check` blocks deployment on failure
- [ ] Staging tests with production-like data validate migration behavior
- [ ] Rollback plan is confirmed tested
- [ ] Maintenance window compliance is verified

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
- [ ] ### Skipping validation before production migration prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Skipping validation before production migration**: "It worked in staging" — staging data differs from production. Always run validation against production (read-only checks). prevented

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
