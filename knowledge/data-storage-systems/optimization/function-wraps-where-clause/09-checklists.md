# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.10 function wraps in WHERE clause (LOWER, CAST: index bypass)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Functional index in PostgreSQL applied
- [ ] Cast input, not column applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] orderByRaw with function**: `orderByRaw('LOWER(name)')` causes filesort. Use functional index or case-insensitive collation. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Function wraps identified and removed where possible
- [ ] Functional indexes created for unavoidable cases
- [ ] EXPLAIN confirms index usage after fix

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Functional index in PostgreSQL applied
- [ ] Cast input, not column applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify indexed columns in WHERE clauses completed
- [ ] Check for function wrapping: `LOWER(col)`, `UPPER(col)`, `YEAR(col)`, `DATE(col)`, `TRIM(col)`, `CAST(col)` completed
- [ ] Rewrite: move function to the value side: `LOWER(col) = ?` → `col = LOWER(?)` completed
- [ ] If function on column is unavoidable: create a functional/expression index completed
- [ ] Verify with EXPLAIN that index scan replaces full table scan completed

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

- [ ] orderByRaw with function**: `orderByRaw('LOWER(name)')` causes filesort. Use functional index or case-insensitive collation. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No function wrapping on indexed columns in WHERE
- [ ] Functional indexes created for unavoidable function wraps
- [ ] `orderByRaw` does not use functions on indexed columns (causes filesort)
- [ ] EXPLAIN confirms index usage
- [ ] Function wraps identified and removed where possible
- [ ] Functional indexes created for unavoidable cases
- [ ] EXPLAIN confirms index usage after fix

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
- [ ] orderByRaw with function**: `orderByRaw('LOWER(name)')` causes filesort. Use functional index or case-insensitive collation. prevented

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
