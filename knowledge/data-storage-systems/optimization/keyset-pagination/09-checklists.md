# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.18 Keyset pagination (efficient for large datasets, stable sort required)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Sort by created_at with id tiebreaker applied
- [ ] Sort by category + created_at applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No tiebreaker column**: Sorting by `created_at` alone — if 10 rows have the same timestamp, pagination misses or duplicates rows. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Keyset pagination stable across pages (no duplicates/misses)
- [ ] Response time constant regardless of position
- [ ] Composite index created matching sort columns

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Sort by created_at with id tiebreaker applied
- [ ] Sort by category + created_at applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify the sort columns and direction completed
- [ ] Add a unique tiebreaker column (typically PK) as the last sort column completed
- [ ] Create composite index matching the ORDER BY columns completed
- [ ] Replace offset with: `WHERE (sort_col, id) < ($lastSortVal, $lastId) ORDER BY sort_col DESC, id DESC LIMIT 20` completed
- [ ] Pass last row's values as pagination cursor completed

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

- [ ] No tiebreaker column**: Sorting by `created_at` alone — if 10 rows have the same timestamp, pagination misses or duplicates rows. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tiebreaker column included in sort for stability
- [ ] Composite index matches sort column order
- [ ] EXPLAIN shows index range scan
- [ ] No skipped or duplicated rows between pages
- [ ] Keyset pagination stable across pages (no duplicates/misses)
- [ ] Response time constant regardless of position
- [ ] Composite index created matching sort columns

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
- [ ] No tiebreaker column**: Sorting by `created_at` alone — if 10 rows have the same timestamp, pagination misses or duplicates rows. prevented

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
