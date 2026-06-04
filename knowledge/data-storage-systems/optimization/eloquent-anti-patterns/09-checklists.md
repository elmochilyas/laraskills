# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.22 Eloquent anti-patterns: nested whereHas chains, broad orWhereHas, sorting by related columns, polymorphic filters, repeated aggregate subqueries
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replace deep whereHas with JOIN applied
- [ ] Index polymorphic columns applied
- [ ] Consolidate aggregates applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Sorting by related column**: `Post::orderBy('author.name')` — requires JOIN or subquery. Add a denormalized column if this is a hot query. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Anti-patterns identified and refactored
- [ ] Query count and complexity reduced
- [ ] EXPLAIN confirms efficient execution

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Replace deep whereHas with JOIN applied
- [ ] Index polymorphic columns applied
- [ ] Consolidate aggregates applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Review `whereHas` depth — chains over 2 levels deep need simplification completed
- [ ] Check for repeated `withCount` calls — consolidate into `addSelect` subqueries completed
- [ ] Identify `orderBy` on related columns — requires JOIN or denormalization completed
- [ ] Check polymorphic queries for missing composite indexes completed
- [ ] Refactor anti-patterns and verify with EXPLAIN completed

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

- [ ] Sorting by related column**: `Post::orderBy('author.name')` — requires JOIN or subquery. Add a denormalized column if this is a hot query. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `whereHas` chains limited to 2 levels
- [ ] Repeated `withCount` consolidated where possible
- [ ] Sorting by related columns uses proper JOIN or denormalization
- [ ] Polymorphic columns have composite index on `(type, id)`
- [ ] Anti-patterns identified and refactored
- [ ] Query count and complexity reduced
- [ ] EXPLAIN confirms efficient execution

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
- [ ] Sorting by related column**: `Post::orderBy('author.name')` — requires JOIN or subquery. Add a denormalized column if this is a hot query. prevented

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
