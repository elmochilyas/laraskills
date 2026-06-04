# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.6 Expand-contract pattern (add, backfill, switch readers, remove old)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Column rename applied
- [ ] Table migration applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Skipping dual-write phase**: Direct switch from old to new without dual-write = rollback requires data backfill. Dangerous. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Each phase is independently deployable and rollback-safe
- [ ] Dual-write maintains data consistency between old and new
- [ ] Backfill verification confirms correctness before switch

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Column rename applied
- [ ] Table migration applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] **Phase 1 — Expand**: Deploy new column/table and app code that writes to both old and new structures. Old is still source of truth for reads. completed
- [ ] **Phase 2 — Backfill**: Run batch job to populate new structures with existing data. Not a deploy step — runs asynchronously. completed
- [ ] **Phase 3 — Switch**: Deploy app code that reads from the new structure. Both old and new are still written to for fallback safety. completed
- [ ] **Phase 4 — Contract**: Deploy app code removing old-structure writes. Drop old column/table in a subsequent migration. This is the only destructiv... completed

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

- [ ] Skipping dual-write phase**: Direct switch from old to new without dual-write = rollback requires data backfill. Dangerous. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Each phase is a separate, independently deployable change
- [ ] Dual-write writes the same value to both structures
- [ ] Backfill is verified for completeness and correctness
- [ ] Rollback from any phase is tested and documented
- [ ] Contract phase only after verified zero old-structure references
- [ ] Each phase is independently deployable and rollback-safe
- [ ] Dual-write maintains data consistency between old and new
- [ ] Backfill verification confirms correctness before switch
- [ ] Contract phase happens only after zero old-structure references
- [ ] No data loss occurs at any phase

---

# Maintainability Checklist

- [ ] Column rename applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Skipping dual-write phase prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Skipping dual-write phase**: Direct switch from old to new without dual-write = rollback requires data backfill. Dangerous. prevented

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
