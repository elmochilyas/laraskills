# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.10 Zero-downtime migration patterns (expand-contract, shadow-table)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Add column nullable then enforce NOT NULL later applied
- [ ] Add column with DEFAULT in PostgreSQL 11+ applied
- [ ] Rename column via add + backfill + drop (never ALTER RENAME) applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Dropping old column before all code is updated**: A queue job that was delayed runs after the column is dropped. It references the old column and fails. Compatibility window must account for all running code paths. prevented
- [ ] Backfill in the same deploy as column addition**: The backfill may take hours on a large table, holding a transaction open. Use separate queued jobs with chunked processing. prevented
- [ ] Assuming INSTANT DDL is always available**: MySQL's ALGORITHM=INSTANT has a 64-version limit — after 64 INSTANT changes to a table, it must use INPLACE or COPY. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema changes applied with zero application downtime
- [ ] Each phase is independently deployable and rollback-safe
- [ ] Backfill completes without blocking production traffic

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Add column nullable then enforce NOT NULL later applied
- [ ] Add column with DEFAULT in PostgreSQL 11+ applied
- [ ] Rename column via add + backfill + drop (never ALTER RENAME) applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] **Phase 1 — Add**: Deploy migration that adds the new column as nullable. No application code changes needed yet. completed
- [ ] **Phase 2 — Dual-write**: Deploy application code that writes the same value to both old and new columns. Old reads still use old column. completed
- [ ] **Phase 3 — Backfill**: Run chunked queued jobs to populate existing rows. Verify consistency between old and new columns. completed
- [ ] **Phase 4 — Switch reads**: Deploy code that reads from the new column. Keep dual-write for rollback safety. completed
- [ ] **Phase 5 — Remove**: Wait 24-48 hours for all code paths (including delayed queue jobs) to migrate. Deploy migration to drop the old column. completed

---

# Performance Checklist

- [ ] Performance: - Dual-write phase doubles INSERT/UPDATE throughput to the affected tables. Monitor database write capacity.
- [ ] Performance: - Backfill operations should be throttled to avoid replication lag and resource contention. Use chunked processing with rate limiting.
- [ ] Performance: - Shadow-table operations double storage temporarily (the shadow table exists alongside the original).
- [ ] Performance: - gh-ost/throttle mechanisms monitor replication lag, thread count, and load to self-regulate.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Dropping old column before all code is updated**: A queue job that was delayed runs after the column is dropped. It references the old column and fails. Compatibility window must account for all running code paths. prevented
- [ ] Backfill in the same deploy as column addition**: The backfill may take hours on a large table, holding a transaction open. Use separate queued jobs with chunked processing. prevented
- [ ] Assuming INSTANT DDL is always available**: MySQL's ALGORITHM=INSTANT has a 64-version limit — after 64 INSTANT changes to a table, it must use INPLACE or COPY. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Each phase is a separate deployable unit
- [ ] Dual-write writes the same value to both columns
- [ ] Backfill is idempotent and runs asynchronously via queue
- [ ] Backfill verification confirms old and new data match
- [ ] Compatibility window between switch and remove is 24-48 hours
- [ ] Schema changes applied with zero application downtime
- [ ] Each phase is independently deployable and rollback-safe
- [ ] Backfill completes without blocking production traffic
- [ ] Compatibility window prevents delayed-job failures
- [ ] Old structures are removed only after all references cease

---

# Maintainability Checklist

- [ ] Rename column via add + backfill + drop (never ALTER RENAME) applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Short compatibility window prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Dropping old column before all code is updated**: A queue job that was delayed runs after the column is dropped. It references the old column and fails. Compatibility window must account for all running code paths. prevented
- [ ] Backfill in the same deploy as column addition**: The backfill may take hours on a large table, holding a transaction open. Use separate queued jobs with chunked processing. prevented
- [ ] Assuming INSTANT DDL is always available**: MySQL's ALGORITHM=INSTANT has a 64-version limit — after 64 INSTANT changes to a table, it must use INPLACE or COPY. prevented

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
