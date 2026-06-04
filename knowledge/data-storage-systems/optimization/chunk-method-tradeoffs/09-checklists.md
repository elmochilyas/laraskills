# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.19 chunk vs chunkById vs cursor vs lazy vs lazyById tradeoffs
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] chunkById for production backfills applied
- [ ] cursor for memory-safe exports applied
- [ ] lazy for collection pipelines applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] chunk on tables with modifications**: Rows shift due to OFFSET. Use chunkById. prevented
- [ ] cursor in long-running queue jobs**: Holds connection for entire iteration. Use chunkById for queued processing. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Chunk method appropriate for data stability profile
- [ ] No memory exhaustion during processing
- [ ] No connection timeout or pool exhaustion

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] chunkById for production backfills applied
- [ ] cursor for memory-safe exports applied
- [ ] lazy for collection pipelines applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Assess dataset size and mutation frequency during processing completed
- [ ] If table has concurrent writes: use `chunkById` or `lazyById` (key-based, stable) completed
- [ ] If table is read-only during processing: `chunk` is acceptable completed
- [ ] If memory is the primary constraint: use `cursor` or `lazy` (one row at a time) completed
- [ ] If connection pool is limited: use `chunkById` (releases connection between chunks) completed

---

# Performance Checklist

- [ ] Performance: EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table q...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] chunk on tables with modifications**: Rows shift due to OFFSET. Use chunkById. prevented
- [ ] cursor in long-running queue jobs**: Holds connection for entire iteration. Use chunkById for queued processing. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Chunk method chosen matches data stability requirements
- [ ] No `chunk` on tables with concurrent modifications
- [ ] No `cursor` for long-running queue jobs (holds connection)
- [ ] Memory usage within PHP limits for chosen method
- [ ] Chunk method appropriate for data stability profile
- [ ] No memory exhaustion during processing
- [ ] No connection timeout or pool exhaustion
- [ ] No skipped or duplicated rows in production backfills

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always EXPLAIN Before Optimizing prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Skipping Validation Steps prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] chunk on tables with modifications**: Rows shift due to OFFSET. Use chunkById. prevented
- [ ] cursor in long-running queue jobs**: Holds connection for entire iteration. Use chunkById for queued processing. prevented

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
