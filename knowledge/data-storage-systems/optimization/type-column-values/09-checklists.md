# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.3 Type column values: system, const, eq_ref, ref, range, index, ALL
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Target const or eq_ref for PK lookups applied
- [ ] Accept range for filtered list queries applied
- [ ] Investigate index or ALL applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Accepting ALL on small tables**: "The table only has 1000 rows." On a table that will grow to 1M, the ALL scan becomes a problem. Add indexes preemptively based on query patterns. prevented
- [ ] Confusing ref with eq_ref**: `ref` means multiple rows may match. If the query expects one row but gets ref, the column lacks a unique index or the query has a range condition. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Access type correctly identified and classified
- [ ] Missing indexes identified from `ALL` or `index` types
- [ ] Verification that PK/FK lookups use optimal access types

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Target const or eq_ref for PK lookups applied
- [ ] Accept range for filtered list queries applied
- [ ] Investigate index or ALL applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Locate the `type` column in EXPLAIN output completed
- [ ] Classify: const/eq_ref (optimal), ref (good), range (acceptable), index (poor), ALL (worst) completed
- [ ] For const/eq_ref: verify unique index or PK is used completed
- [ ] For ref: verify the referenced column is indexed completed
- [ ] For range: check if the range is narrow relative to table size completed

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

- [ ] Accepting ALL on small tables**: "The table only has 1000 rows." On a table that will grow to 1M, the ALL scan becomes a problem. Add indexes preemptively based on query patterns. prevented
- [ ] Confusing ref with eq_ref**: `ref` means multiple rows may match. If the query expects one row but gets ref, the column lacks a unique index or the query has a range condition. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] PK lookups show `const` or `eq_ref`
- [ ] FK joins show `ref` or `eq_ref`
- [ ] Range queries show `range` (not ALL)
- [ ] No `ALL` scans on tables with >1000 rows
- [ ] Access type correctly identified and classified
- [ ] Missing indexes identified from `ALL` or `index` types
- [ ] Verification that PK/FK lookups use optimal access types

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
- [ ] Accepting ALL on small tables**: "The table only has 1000 rows." On a table that will grow to 1M, the ALL scan becomes a problem. Add indexes preemptively based on query patterns. prevented
- [ ] Confusing ref with eq_ref**: `ref` means multiple rows may match. If the query expects one row but gets ref, the column lacks a unique index or the query has a range condition. prevented

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
