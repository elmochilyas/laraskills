# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.4 Extra column flags: Using index (covering), Using filesort, Using temporary, Using where, Using index condition
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Eliminate filesort applied
- [ ] Eliminate temporary applied
- [ ] Achieve Using index (covering) applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] filesort on small result sets**: If the query returns 10 rows, the filesort is negligible. Only optimize filesort when the result set is large. prevented
- [ ] temporary for small GROUP BY**: `GROUP BY status` on a table with 3 distinct status values creates a small temp table. Acceptable. Temporary on high-cardinality GROUP BY is problematic. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Extra flags correctly interpreted
- [ ] Filesort eliminated for large sorts
- [ ] Covering indexes identified and created for hot queries

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Eliminate filesort applied
- [ ] Eliminate temporary applied
- [ ] Achieve Using index (covering) applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Locate the `Extra` column in EXPLAIN output completed
- [ ] Check for `Using index` — confirms covering index (all columns in index) completed
- [ ] Check for `Using filesort` — indicates sort not using index completed
- [ ] Check for `Using temporary` — indicates temp table for GROUP BY/DISTINCT completed
- [ ] Check for `Using where` — post-filter applied (index didn't fully cover WHERE) completed

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

- [ ] filesort on small result sets**: If the query returns 10 rows, the filesort is negligible. Only optimize filesort when the result set is large. prevented
- [ ] temporary for small GROUP BY**: `GROUP BY status` on a table with 3 distinct status values creates a small temp table. Acceptable. Temporary on high-cardinality GROUP BY is problematic. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No `Using filesort` on large result sets
- [ ] No `Using temporary` on high-cardinality GROUP BY
- [ ] `Using index` (covering) achieved for frequent queries
- [ ] `Using index condition` present when beneficial
- [ ] Extra flags correctly interpreted
- [ ] Filesort eliminated for large sorts
- [ ] Covering indexes identified and created for hot queries

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
- [ ] filesort on small result sets**: If the query returns 10 rows, the filesort is negligible. Only optimize filesort when the result set is large. prevented
- [ ] temporary for small GROUP BY**: `GROUP BY status` on a table with 3 distinct status values creates a small temp table. Acceptable. Temporary on high-cardinality GROUP BY is problematic. prevented

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
