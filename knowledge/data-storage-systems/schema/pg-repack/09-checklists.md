# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.15 pg_repack (bloat/index reorganization without ACCESS EXCLUSIVE lock)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Schedule regular pg_repack applied
- [ ] Monitor bloat levels applied
- [ ] Combine with autovacuum tuning applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running on a table without sufficient free space**: pg_repack fails mid-operation because disk space is exhausted. prevented
- [ ] Not rescheduling**: A one-time repack is insufficient for high-write tables — bloat returns. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Table bloat is reduced below 10% after repack
- [ ] Query performance improves measurably
- [ ] No application downtime during repack

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Schedule regular pg_repack applied
- [ ] Monitor bloat levels applied
- [ ] Combine with autovacuum tuning applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Measure bloat using `pgstattuple` or bloat estimation queries completed
- [ ] If bloat > 20%, schedule a pg_repack during low-traffic window completed
- [ ] Run `pg_repack --table public.orders` to start the repack completed
- [ ] Monitor progress and trigger activity completed
- [ ] After completion, verify reduced table size and improved query performance completed

---

# Performance Checklist

- [ ] Performance: - pg_repack requires free disk space approximately equal to the target table's size.
- [ ] Performance: - During repack, write performance degrades due to trigger overhead and IO competition.
- [ ] Performance: - After repack, query performance improves due to compacted storage and reduced index depth.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Running on a table without sufficient free space**: pg_repack fails mid-operation because disk space is exhausted. prevented
- [ ] Not rescheduling**: A one-time repack is insufficient for high-write tables — bloat returns. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Bloat measured and exceeds 20% threshold
- [ ] Free disk space exceeds target table size
- [ ] No conflicting triggers on the target table
- [ ] No long-running queries that could block the final swap
- [ ] After repack, table size is verified reduced
- [ ] Table bloat is reduced below 10% after repack
- [ ] Query performance improves measurably
- [ ] No application downtime during repack
- [ ] Regular schedule prevents bloat re-accumulation
- [ ] Failed repacks leave clean state for retry

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
- [ ] ### Disk space exhaustion prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running on a table without sufficient free space**: pg_repack fails mid-operation because disk space is exhausted. prevented
- [ ] Not rescheduling**: A one-time repack is insufficient for high-write tables — bloat returns. prevented

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
