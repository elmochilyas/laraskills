# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.18 Expand-contract pattern (add column, dual-write, backfill, dual-read, remove old)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Backward-compatible add applied
- [ ] Dual-write with same value applied
- [ ] Remove with delay applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Short compatibility window**: Dropping the old column 1 hour after switching reads. A queue job that was delayed 2 hours fails when it tries to write to the dropped column. prevented
- [ ] Backfill in the same deploy as column addition**: The column addition migration runs; the backfill starts; it takes 4 hours. The production deploy pipeline blocks on backfill completion. Always run backfill as a separate background process. prevented
- [ ] Not verifying dual-read correctness**: Switching reads to the new column without verifying the data matches. If the dual-write had a bug, the new column has incorrect data and users see wrong results. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Each phase is independently deployable and rollback-safe
- [ ] Dual-write maintains data consistency between old and new
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

- [ ] Backward-compatible add applied
- [ ] Dual-write with same value applied
- [ ] Remove with delay applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] **Phase 1 — Add**: Deploy migration adding the new column (nullable) or table. No app code changes. completed
- [ ] **Phase 2 — Dual-write**: Deploy app code writing the same value to both old and new. Reads still use old. completed
- [ ] **Phase 3 — Backfill**: Queue chunked jobs to populate existing rows. Verify correctness. completed
- [ ] **Phase 4 — Switch reads**: Deploy code reading from new. Continue dual-write for rollback. completed
- [ ] **Phase 5 — Contract**: After 24-48h, deploy migration dropping old column. This is the only destructive step. completed

---

# Performance Checklist

- [ ] Performance: - Dual-write doubles write throughput to the affected tables temporarily. Monitor database write IOPS during this phase.
- [ ] Performance: - Backfill should be throttled — use chunked processing with configurable sleep intervals between chunks.
- [ ] Performance: - Read path has constant-time overhead (ternary operator or feature flag check).

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Short compatibility window**: Dropping the old column 1 hour after switching reads. A queue job that was delayed 2 hours fails when it tries to write to the dropped column. prevented
- [ ] Backfill in the same deploy as column addition**: The column addition migration runs; the backfill starts; it takes 4 hours. The production deploy pipeline blocks on backfill completion. Always run backfill as a separate background process. prevented
- [ ] Not verifying dual-read correctness**: Switching reads to the new column without verifying the data matches. If the dual-write had a bug, the new column has incorrect data and users see wrong results. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Add phase creates backward-compatible schema (nullable or default)
- [ ] Dual-write writes identical values to old and new
- [ ] Backfill is idempotent and runs asynchronously
- [ ] Read switch is feature-flagged for safe rollback
- [ ] Contract phase delayed 24-48h after switch
- [ ] Each phase is independently deployable and rollback-safe
- [ ] Dual-write maintains data consistency between old and new
- [ ] Backfill completes without blocking production traffic
- [ ] Contract phase happens only after verified zero old-structure references
- [ ] No data loss occurs at any phase

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
- [ ] ### Short compatibility window prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Short compatibility window**: Dropping the old column 1 hour after switching reads. A queue job that was delayed 2 hours fails when it tries to write to the dropped column. prevented
- [ ] Backfill in the same deploy as column addition**: The column addition migration runs; the backfill starts; it takes 4 hours. The production deploy pipeline blocks on backfill completion. Always run backfill as a separate background process. prevented
- [ ] Not verifying dual-read correctness**: Switching reads to the new column without verifying the data matches. If the dual-write had a bug, the new column has incorrect data and users see wrong results. prevented

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
