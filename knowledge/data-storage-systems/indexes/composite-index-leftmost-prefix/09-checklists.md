# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.8 Composite/compound indexes: leftmost prefix rule, column ordering
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Equality first, range after applied
- [ ] High cardinality first applied
- [ ] Covering index applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Wrong column order**: Index `(status, created_at)` but the query filters by `created_at` first. The index is not used. Place the most selective equality column first. prevented
- [ ] Indexing all queryable columns in one index**: A 6-column composite index where only the first 2 columns serve the query. Remaining columns add maintenance cost without benefit. prevented
- [ ] Not verifying index usage**: Adding a composite index without running EXPLAIN. The optimizer may not use it as expected. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Composite index columns ordered by query pattern (equality → range → sort)
- [ ] EXPLAIN shows index usage for the intended queries
- [ ] No redundant composite indexes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Equality first, range after applied
- [ ] High cardinality first applied
- [ ] Covering index applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] List all columns in the query: WHERE conditions, ORDER BY, SELECT completed
- [ ] Classify each column: equality (=), range (>, <, BETWEEN), sort (ORDER BY) completed
- [ ] Order columns: equality first, range second, sort last completed
- [ ] Create composite index: `$table->index(['tenant_id', 'status', 'created_at'])` completed
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

- [ ] Wrong column order**: Index `(status, created_at)` but the query filters by `created_at` first. The index is not used. Place the most selective equality column first. prevented
- [ ] Indexing all queryable columns in one index**: A 6-column composite index where only the first 2 columns serve the query. Remaining columns add maintenance cost without benefit. prevented
- [ ] Not verifying index usage**: Adding a composite index without running EXPLAIN. The optimizer may not use it as expected. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Leading column is referenced in the query's WHERE clause
- [ ] Equality columns before range columns
- [ ] Sort columns last in the index
- [ ] Index not redundant with existing indexes (check leftmost prefix)
- [ ] Composite index columns ordered by query pattern (equality → range → sort)
- [ ] EXPLAIN shows index usage for the intended queries
- [ ] No redundant composite indexes
- [ ] Leftmost prefix rule satisfied for all target queries

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
- [ ] ### Wrong column order prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Wrong column order**: Index `(status, created_at)` but the query filters by `created_at` first. The index is not used. Place the most selective equality column first. prevented
- [ ] Indexing all queryable columns in one index**: A 6-column composite index where only the first 2 columns serve the query. Remaining columns add maintenance cost without benefit. prevented
- [ ] Not verifying index usage**: Adding a composite index without running EXPLAIN. The optimizer may not use it as expected. prevented

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
