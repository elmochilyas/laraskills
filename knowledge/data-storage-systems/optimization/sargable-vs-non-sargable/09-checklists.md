# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.7 Sargable vs. non-sargable query patterns
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replace function wrap with range applied
- [ ] Use case-insensitive collation applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] whereDate/whereMonth/whereYear**: Eloquent's date helper methods wrap columns in functions. Always use range queries. prevented
- [ ] OrderBy with function**: `orderByRaw('LOWER(name)')` — causes filesort. Use functional index or case-insensitive collation. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Non-sargable patterns identified and rewritten
- [ ] WHERE clauses allow index usage after rewrite
- [ ] EXPLAIN confirms index scan instead of full table scan

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Replace function wrap with range applied
- [ ] Use case-insensitive collation applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify all WHERE clauses referencing indexed columns completed
- [ ] Check if the column is wrapped in a function (LOWER, DATE, YEAR, CAST, TRIM, etc.) completed
- [ ] If wrapped: rewrite to make the column standalone completed
- [ ] Verify with EXPLAIN that the access type improves completed

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

- [ ] whereDate/whereMonth/whereYear**: Eloquent's date helper methods wrap columns in functions. Always use range queries. prevented
- [ ] OrderBy with function**: `orderByRaw('LOWER(name)')` — causes filesort. Use functional index or case-insensitive collation. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No indexed column wrapped in a function in WHERE
- [ ] Range queries used instead of date functions: `WHERE date >= ? AND date < ?` not `WHERE YEAR(date) = ?`
- [ ] Case-insensitive collation used instead of `LOWER()`
- [ ] EXPLAIN shows index usage after rewrite
- [ ] Non-sargable patterns identified and rewritten
- [ ] WHERE clauses allow index usage after rewrite
- [ ] EXPLAIN confirms index scan instead of full table scan

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
- [ ] whereDate/whereMonth/whereYear**: Eloquent's date helper methods wrap columns in functions. Always use range queries. prevented
- [ ] OrderBy with function**: `orderByRaw('LOWER(name)')` — causes filesort. Use functional index or case-insensitive collation. prevented

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
