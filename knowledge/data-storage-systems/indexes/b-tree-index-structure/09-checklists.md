# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.1 B-Tree index structure and when it applies (equality, range, sort)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] B-Tree for most indexes applied
- [ ] Index for ORDER BY applied
- [ ] Prefix matching applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Indexing low-cardinality columns alone**: An index on `status` (with only 3 distinct values) is rarely used by the optimizer — scanning 33% of a table is cheaper than the index. prevented
- [ ] Assuming B-Tree for text search**: `LIKE '%value%'` cannot use B-Tree range scan. It falls back to full table scan. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] B-Tree indexes serve the intended query patterns
- [ ] Low-cardinality columns combined with selective columns in composites
- [ ] EXPLAIN confirms index usage

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] B-Tree for most indexes applied
- [ ] Index for ORDER BY applied
- [ ] Prefix matching applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify the query pattern: equality, range, sort, or prefix completed
- [ ] Confirm B-Tree supports the pattern (yes for all except LIKE '%suffix') completed
- [ ] For composite indexes: place equality columns first, range/sort columns after completed
- [ ] Create index: `$table->index(['tenant_id', 'created_at'])` in migration completed
- [ ] Verify with EXPLAIN that the index is used completed

---

# Performance Checklist

- [ ] Performance: B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index ad...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Indexing low-cardinality columns alone**: An index on `status` (with only 3 distinct values) is rarely used by the optimizer — scanning 33% of a table is cheaper than the index. prevented
- [ ] Assuming B-Tree for text search**: `LIKE '%value%'` cannot use B-Tree range scan. It falls back to full table scan. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Low-cardinality columns are not indexed alone (composite with selective column)
- [ ] B-Tree index is appropriate for the query pattern
- [ ] LIKE '%suffix' queries don't expect B-Tree index usage
- [ ] Composite index follows leftmost prefix rule
- [ ] B-Tree indexes serve the intended query patterns
- [ ] Low-cardinality columns combined with selective columns in composites
- [ ] EXPLAIN confirms index usage
- [ ] Index maintenance planned for bloat management

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Indexing low-cardinality columns alone prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Indexing low-cardinality columns alone**: An index on `status` (with only 3 distinct values) is rarely used by the optimizer — scanning 33% of a table is cheaper than the index. prevented
- [ ] Assuming B-Tree for text search**: `LIKE '%value%'` cannot use B-Tree range scan. It falls back to full table scan. prevented

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
