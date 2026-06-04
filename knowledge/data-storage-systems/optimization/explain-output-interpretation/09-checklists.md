# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.1 EXPLAIN output interpretation (type, possible_keys, key, rows, Extra, filtered)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Identify full table scans applied
- [ ] Detect missing composite index applied
- [ ] Verify index choice applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running EXPLAIN without ANALYZE**: EXPLAIN shows estimates, not actuals. Use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN ANALYZE` (MySQL 8.0.18+) for actual execution data. For MySQL pre-8.0.18, use `EXPLAIN` for estimates and `SHOW PROFILE` for actuals. prevented
- [ ] Ignoring filtered column**: MySQL's `filtered` shows percentage of rows kept after WHERE. Low filtered = many rows examined but few returned = missing or poorly designed index. prevented
- [ ] Not comparing before/after**: Run EXPLAIN before and after adding an index. The type, rows, and Extra changes prove the index is effective. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Query plan is read and understood
- [ ] Bottleneck operation is identified
- [ ] Before/after plans show clear improvement after optimization

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Identify full table scans applied
- [ ] Detect missing composite index applied
- [ ] Verify index choice applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Run `EXPLAIN` or `EXPLAIN ANALYZE` on the target query completed
- [ ] Identify the `type` column (const > eq_ref > ref > range > index > ALL) completed
- [ ] Check `possible_keys` vs `key` (index chosen vs candidates) completed
- [ ] Examine `rows` for estimated scan size completed
- [ ] Read `Extra` flags (Using index, Using filesort, Using temporary, Using where) completed

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

- [ ] Running EXPLAIN without ANALYZE**: EXPLAIN shows estimates, not actuals. Use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN ANALYZE` (MySQL 8.0.18+) for actual execution data. For MySQL pre-8.0.18, use `EXPLAIN` for estimates and `SHOW PROFILE` for actuals. prevented
- [ ] Ignoring filtered column**: MySQL's `filtered` shows percentage of rows kept after WHERE. Low filtered = many rows examined but few returned = missing or poorly designed index. prevented
- [ ] Not comparing before/after**: Run EXPLAIN before and after adding an index. The type, rows, and Extra changes prove the index is effective. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `type` is not `ALL` for large tables (>10K rows)
- [ ] `key` shows an index being used
- [ ] `rows` is proportional to expected result size
- [ ] No `Using filesort` on large result sets
- [ ] No `Using temporary` on high-cardinality GROUP BY
- [ ] Query plan is read and understood
- [ ] Bottleneck operation is identified
- [ ] Before/after plans show clear improvement after optimization

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
- [ ] Running EXPLAIN without ANALYZE**: EXPLAIN shows estimates, not actuals. Use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN ANALYZE` (MySQL 8.0.18+) for actual execution data. For MySQL pre-8.0.18, use `EXPLAIN` for estimates and `SHOW PROFILE` for actuals. prevented
- [ ] Ignoring filtered column**: MySQL's `filtered` shows percentage of rows kept after WHERE. Low filtered = many rows examined but few returned = missing or poorly designed index. prevented
- [ ] Not comparing before/after**: Run EXPLAIN before and after adding an index. The type, rows, and Extra changes prove the index is effective. prevented

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
