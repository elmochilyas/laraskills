# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.16 MySQL instant DDL (ALGORITHM=INSTANT, 64-version limit)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Prefer INSTANT for column additions applied
- [ ] Track INSTANT version count applied
- [ ] Use INPLACE for column drops applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming INSTANT works for all DDL**: Many operations (column drop, index change, column type change) cannot use INSTANT. prevented
- [ ] Hitting the 64-version limit**: A frequently-migrated table hits the limit. Subsequent migrations that assume INSTANT fail and fall back to INPLACE (which may hold locks). prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Column additions complete in milliseconds regardless of table size
- [ ] INSTANT version count is tracked and stays below 64
- [ ] Explicit ALGORITHM=INSTANT prevents silent fallback to COPY

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Prefer INSTANT for column additions applied
- [ ] Track INSTANT version count applied
- [ ] Use INPLACE for column drops applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Verify MySQL version supports INSTANT for the desired operation completed
- [ ] Check the table's INSTANT version count: `SELECT TOTAL_ROW_VERSIONS FROM INFORMATION_SCHEMA.INNODB_TABLES WHERE NAME = 'db/table'` completed
- [ ] If count < 60 (leaving buffer), proceed with INSTANT completed
- [ ] Execute: `ALTER TABLE orders ADD COLUMN status INT ALGORITHM=INSTANT` completed
- [ ] Verify the operation completed without falling back to INPLACE completed

---

# Performance Checklist

- [ ] Performance: - INSTANT operations are effectively free (metadata-only).
- [ ] Performance: - Rows with mixed versions may have slightly higher read overhead.
- [ ] Performance: - After 64 INSTANT operations, a physical rebuild is forced. Plan for this by scheduling periodic rebuilds.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Assuming INSTANT works for all DDL**: Many operations (column drop, index change, column type change) cannot use INSTANT. prevented
- [ ] Hitting the 64-version limit**: A frequently-migrated table hits the limit. Subsequent migrations that assume INSTANT fail and fall back to INPLACE (which may hold locks). prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] MySQL version supports INSTANT for the specific operation
- [ ] INSTANT version count < 60 before the operation
- [ ] ALTER TABLE explicitly specifies ALGORITHM=INSTANT
- [ ] Operation completes in milliseconds
- [ ] No fallback to INPLACE or COPY
- [ ] Column additions complete in milliseconds regardless of table size
- [ ] INSTANT version count is tracked and stays below 64
- [ ] Explicit ALGORITHM=INSTANT prevents silent fallback to COPY
- [ ] Periodic rebuilds reset the INSTANT counter
- [ ] Replicas run compatible MySQL versions

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
- [ ] ### 64-version limit exceeded prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming INSTANT works for all DDL**: Many operations (column drop, index change, column type change) cannot use INSTANT. prevented
- [ ] Hitting the 64-version limit**: A frequently-migrated table hits the limit. Subsequent migrations that assume INSTANT fail and fall back to INPLACE (which may hold locks). prevented

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
