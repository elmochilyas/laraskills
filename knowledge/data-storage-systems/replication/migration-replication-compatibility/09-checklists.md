# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.20 Migration replication compatibility (DDL impact on replicas)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Migration window for DDL applied
- [ ] pt-online-schema-change applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] ALTER TABLE during peak hours**: Locks tables, blocks replication apply. Replicas fall behind. User-facing queries hit lagged replicas. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] DDL completed without replica lag exceeding threshold
- [ ] Schema identical on all nodes post-migration
- [ ] Zero application errors during migration

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Migration window for DDL applied
- [ ] pt-online-schema-change applied
- [ ] Always Monitor Replica Lag followed
- [ ] Check current replication lag — must be near zero before starting completed
- [ ] Review DDL statement: choose `ALGORITHM=INSTANT` (add column, set default) or `ALGORITHM=INPLACE` (add index, rename column) if possible completed
- [ ] If `ALGORITHM=COPY` is required (change column type, drop primary key): completed
- [ ] For Laravel migrations: use `Schema::create()`/`Schema::table()` with explicit algorithm: completed
- [ ] Monitor replica lag during DDL execution — if lag exceeds threshold, pause or cancel completed

---

# Performance Checklist

- [ ] Performance: Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] ALTER TABLE during peak hours**: Locks tables, blocks replication apply. Replicas fall behind. User-facing queries hit lagged replicas. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] DDL executed using safest algorithm (INSTANT > INPLACE > COPY)
- [ ] Replica lag remained below threshold during DDL
- [ ] Schema is identical on primary and all replicas after DDL
- [ ] No application errors related to schema mismatch during DDL
- [ ] Rollback plan documented (commented-out DDL for revert)
- [ ] DDL completed without replica lag exceeding threshold
- [ ] Schema identical on all nodes post-migration
- [ ] Zero application errors during migration
- [ ] Zero data loss from schema changes
- [ ] Schema change completed without application downtime

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] `ALGORITHM=COPY` locks tables on primary, blocks writes, and delays replication prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] ALTER TABLE during peak hours**: Locks tables, blocks replication apply. Replicas fall behind. User-facing queries hit lagged replicas. prevented

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
