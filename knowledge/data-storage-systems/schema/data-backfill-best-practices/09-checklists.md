# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.9 Data backfill best practices (batch size, rate limiting, progress tracking)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] ID-based batch backfill applied
- [ ] Rate-limited backfill command applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No progress tracking**: Backfill fails at 70%. Restart from beginning. Hours wasted. Always checkpoint progress. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All rows are backfilled with correct values
- [ ] Backfill is idempotent and can be retried safely
- [ ] No replication lag or performance degradation

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] ID-based batch backfill applied
- [ ] Rate-limited backfill command applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Design idempotent backfill query: `SET target = value WHERE target IS NULL` or `ON CONFLICT DO NOTHING` completed
- [ ] Choose batch size: 500-1000 rows for general use completed
- [ ] Implement progress tracking storing `last_processed_id` in a `backfill_progress` table completed
- [ ] Use ID-based batch iteration: `WHERE id > $lastId ORDER BY id LIMIT $batchSize` completed
- [ ] Add throttling: `usleep(100000)` between batches completed

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

- [ ] No progress tracking**: Backfill fails at 70%. Restart from beginning. Hours wasted. Always checkpoint progress. prevented
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
- [ ] ID-based batch iteration (not offset-based)
- [ ] Progress tracking saves the last processed ID
- [ ] Rate limiting prevents replication lag
- [ ] Queue jobs use a dedicated queue
- [ ] All rows are backfilled with correct values
- [ ] Backfill is idempotent and can be retried safely
- [ ] No replication lag or performance degradation
- [ ] Progress tracking enables resume after failure
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
- [ ] ### No progress tracking prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No progress tracking**: Backfill fails at 70%. Restart from beginning. Hours wasted. Always checkpoint progress. prevented

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
