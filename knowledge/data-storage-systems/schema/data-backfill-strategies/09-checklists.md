# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.19 Data backfill strategies (chunked, queued, low-priority, throttled)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Idempotent updates applied
- [ ] Progress tracking applied
- [ ] Read replica backfill applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not using chunkById**: Using regular `chunk()` (offset-based) on a table where rows are being modified. Rows can be skipped or duplicated between chunks. prevented
- [ ] Backfill inside a migration**: Running a single UPDATE in the migration's `up()` method on a table with millions of rows. This blocks the migration, holds a transaction, and may time out. prevented
- [ ] Non-idempotent backfill**: Running the backfill again produces different results (e.g., appending instead of setting). This makes retry unsafe. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All rows are backfilled with correct values
- [ ] Backfill is idempotent and can be retried safely
- [ ] No replication lag or performance degradation during backfill

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Idempotent updates applied
- [ ] Progress tracking applied
- [ ] Read replica backfill applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Design the backfill query: idempotent — `SET target = value WHERE target IS NULL` or `ON CONFLICT DO NOTHING` completed
- [ ] Choose chunk size: 500-1000 rows for general use, smaller for write-heavy tables completed
- [ ] Implement progress tracking: store last processed ID in a `backfill_progress` table or cache key completed
- [ ] Use `chunkById` for stable cursor-based iteration that doesn't skip rows completed
- [ ] Add throttling: `usleep(100000)` (100ms) between chunks to control load completed

---

# Performance Checklist

- [ ] Performance: - Each chunk iteration issues its own query. Chunk size determines query count: smaller chunks = more queries but less per-query impact.
- [ ] Performance: - Without throttling, chunked UPDATE sequences can cause replication lag spikes.
- [ ] Performance: - Queue workers processing backfill jobs compete with application workers for database connections.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not using chunkById**: Using regular `chunk()` (offset-based) on a table where rows are being modified. Rows can be skipped or duplicated between chunks. prevented
- [ ] Backfill inside a migration**: Running a single UPDATE in the migration's `up()` method on a table with millions of rows. This blocks the migration, holds a transaction, and may time out. prevented
- [ ] Non-idempotent backfill**: Running the backfill again produces different results (e.g., appending instead of setting). This makes retry unsafe. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Backfill query is idempotent and safe to retry
- [ ] `chunkById` is used instead of offset-based chunking
- [ ] Progress tracking saves the last processed key
- [ ] Chunk size and throttle interval prevent replication lag
- [ ] Queue jobs use a dedicated queue to avoid starving app workers
- [ ] All rows are backfilled with correct values
- [ ] Backfill is idempotent and can be retried safely
- [ ] No replication lag or performance degradation during backfill
- [ ] Progress tracking enables resume after interruption
- [ ] Verification confirms 100% completion

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
- [ ] ### Not using chunkById prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not using chunkById**: Using regular `chunk()` (offset-based) on a table where rows are being modified. Rows can be skipped or duplicated between chunks. prevented
- [ ] Backfill inside a migration**: Running a single UPDATE in the migration's `up()` method on a table with millions of rows. This blocks the migration, holds a transaction, and may time out. prevented
- [ ] Non-idempotent backfill**: Running the backfill again produces different results (e.g., appending instead of setting). This makes retry unsafe. prevented

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
