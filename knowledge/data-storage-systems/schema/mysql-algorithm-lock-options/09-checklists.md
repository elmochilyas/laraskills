# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.26 MySQL ALGORITHM options (INPLACE, COPY, INSTANT) and LOCK options (NONE, SHARED, EXCLUSIVE, DEFAULT)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Prefer INSTANT applied
- [ ] INPLACE with LOCK=NONE for indexes applied
- [ ] COPY for complex ALTER applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming INPLACE is always concurrent**: Some INPLACE operations (e.g., adding a FULLTEXT index) require a read lock during index building. Check the MySQL documentation for each operation type. prevented
- [ ] Not specifying ALGORITHM/LOCK**: Letting MySQL choose DEFAULT may result in an unexpected table copy that blocks writes for minutes. prevented
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

- [ ] Prefer INSTANT applied
- [ ] INPLACE with LOCK=NONE for indexes applied
- [ ] COPY for complex ALTER applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Identify the DDL operation and check which ALGORITHM options it supports in the MySQL documentation completed
- [ ] For column additions on MySQL 8.0.12+, use `ALGORITHM=INSTANT, LOCK=NONE` completed
- [ ] For index additions/drops, use `ALGORITHM=INPLACE, LOCK=NONE` — allows concurrent DML during the rebuild completed
- [ ] Always specify both ALGORITHM and LOCK explicitly — never rely on DEFAULT completed
- [ ] If the operation doesn't support the specified ALGORITHM, MySQL raises an error rather than silently falling back to COPY completed

---

# Performance Checklist

- [ ] Performance: - INPLACE operations rebuild the entire table — they read all data, sort indexes, and write the new table. Total IO is approximately 2x the table s...
- [ ] Performance: - INSTANT operations have negligible performance impact.
- [ ] Performance: - COPY operations require disk space for the full table copy (temporary table exists alongside original).

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Assuming INPLACE is always concurrent**: Some INPLACE operations (e.g., adding a FULLTEXT index) require a read lock during index building. Check the MySQL documentation for each operation type. prevented
- [ ] Not specifying ALGORITHM/LOCK**: Letting MySQL choose DEFAULT may result in an unexpected table copy that blocks writes for minutes. prevented
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
- [ ] INPLACE with LOCK=NONE for index operations
- [ ] COPY operations are scheduled during maintenance windows
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
- [ ] Assuming INPLACE is always concurrent**: Some INPLACE operations (e.g., adding a FULLTEXT index) require a read lock during index building. Check the MySQL documentation for each operation type. prevented
- [ ] Not specifying ALGORITHM/LOCK**: Letting MySQL choose DEFAULT may result in an unexpected table copy that blocks writes for minutes. prevented

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
