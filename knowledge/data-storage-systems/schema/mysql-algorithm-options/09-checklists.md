# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.8 MySQL ALGORITHM options (INSTANT, INPLACE, COPY) and LOCK options (NONE, SHARED, EXCLUSIVE)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] INSTANT for column additions applied
- [ ] INPLACE for index creation applied
- [ ] Avoid COPY in production applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Adding column in non-append position**: MySQL INSTANT only supports append (adding column at end). Adding a column in the middle of column order requires INPLACE or COPY. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Every production ALTER TABLE specifies explicit ALGORITHM and LOCK
- [ ] No silent fallback to COPY blocks application traffic
- [ ] INSTANT used for column additions on MySQL 8.0.12+

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] INSTANT for column additions applied
- [ ] INPLACE for index creation applied
- [ ] Avoid COPY in production applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Identify the DDL operation and determine supported algorithms completed
- [ ] For column additions (append): use `ALTER TABLE t ADD COLUMN c INT, ALGORITHM=INSTANT, LOCK=NONE` completed
- [ ] For index creation: use `ALTER TABLE t ADD INDEX i (c), ALGORITHM=INPLACE, LOCK=NONE` completed
- [ ] For operations requiring COPY: schedule during a maintenance window completed
- [ ] Always specify both ALGORITHM and LOCK explicitly — never rely on DEFAULT completed

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

- [ ] Adding column in non-append position**: MySQL INSTANT only supports append (adding column at end). Adding a column in the middle of column order requires INPLACE or COPY. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] ALGORITHM and LOCK are both specified explicitly
- [ ] INSTANT preferred for supported operations on MySQL 8.0.12+
- [ ] INPLACE with LOCK=NONE for index and column drop operations
- [ ] COPY operations scheduled during maintenance windows
- [ ] Tested on staging before production
- [ ] Every production ALTER TABLE specifies explicit ALGORITHM and LOCK
- [ ] No silent fallback to COPY blocks application traffic
- [ ] INSTANT used for column additions on MySQL 8.0.12+
- [ ] INPLACE with LOCK=NONE used for index operations
- [ ] COPY operations are rare and scheduled during maintenance windows

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
- [ ] ### Silent fallback to COPY prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Adding column in non-append position**: MySQL INSTANT only supports append (adding column at end). Adding a column in the middle of column order requires INPLACE or COPY. prevented

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
