# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.5 pgroll (PostgreSQL zero-downtime migration tool)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] pgroll for production applied
- [ ] pgroll for NOT NULL addition applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] pgroll requires dual application awareness**: Application must be compatible with both V1 and V2 schemas during migration. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema changes applied with zero application downtime
- [ ] Migration is fully reversible at any phase
- [ ] NOT NULL constraints added without full table scan

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] pgroll for production applied
- [ ] pgroll for NOT NULL addition applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Start pgroll in `--mode=read-write` — applies migration in dual-write mode completed
- [ ] Application writes to both old and new schema; reads from old schema completed
- [ ] Monitor for errors, performance issues, and data consistency completed
- [ ] Switch to `--mode=read-write-new` — reads from new schema, writes to both completed
- [ ] Monitor again for regressions completed

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

- [ ] pgroll requires dual application awareness**: Application must be compatible with both V1 and V2 schemas during migration. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] PostgreSQL 14+ with required extensions
- [ ] Application handles both schema versions
- [ ] Dual-write verified for correctness
- [ ] Read switch tested on staging
- [ ] Rollback path confirmed working
- [ ] Schema changes applied with zero application downtime
- [ ] Migration is fully reversible at any phase
- [ ] NOT NULL constraints added without full table scan
- [ ] View-based approach does not degrade query performance
- [ ] Application code is compatible throughout migration phases

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
- [ ] ### Application incompatible with both schemas prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] pgroll requires dual application awareness**: Application must be compatible with both V1 and V2 schemas during migration. prevented

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
