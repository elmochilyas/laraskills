# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.28 Database-specific execution plan analysis (EXPLAIN output interpretation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] MySQL single-column index check applied
- [ ] PostgreSQL actual vs estimated applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] EXPLAIN without ANALYZE on PostgreSQL**: Shows only estimates (costs, rows). Not useful for identifying actual performance issues. Always use `EXPLAIN (ANALYZE, BUFFERS)`. prevented
- [ ] Ignoring filter selectivity**: `rows` in MySQL EXPLAIN shows estimated examined rows. If estimated rows is 1M but actual is 10, the optimizer may choose a bad plan. Update statistics. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Red flags correctly identified for both MySQL and PostgreSQL
- [ ] Missing indexes identified from plan analysis
- [ ] Statistics freshness validated and addressed

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] MySQL single-column index check applied
- [ ] PostgreSQL actual vs estimated applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify the database platform (MySQL vs PostgreSQL) completed
- [ ] MySQL: check `type` (ALL=bad), `Extra` (filesort/temporary), `rows` vs `filtered` completed
- [ ] PostgreSQL: check node type (Seq Scan=bad on large tables), `cost`, actual vs estimated rows completed
- [ ] Check for red flags: completed
- [ ] Check for row count mismatch (actual >> estimated) — stale statistics completed

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

- [ ] EXPLAIN without ANALYZE on PostgreSQL**: Shows only estimates (costs, rows). Not useful for identifying actual performance issues. Always use `EXPLAIN (ANALYZE, BUFFERS)`. prevented
- [ ] Ignoring filter selectivity**: `rows` in MySQL EXPLAIN shows estimated examined rows. If estimated rows is 1M but actual is 10, the optimizer may choose a bad plan. Update statistics. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] MySQL: `type` not `ALL` for large tables
- [ ] MySQL: no `Using filesort` on large sorts
- [ ] PostgreSQL: no `Seq Scan` on tables >10K rows
- [ ] PostgreSQL: actual vs estimated rows match within 10x
- [ ] No `Sort Method: external merge Disk` (exceeded work_mem)
- [ ] Red flags correctly identified for both MySQL and PostgreSQL
- [ ] Missing indexes identified from plan analysis
- [ ] Statistics freshness validated and addressed

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
- [ ] EXPLAIN without ANALYZE on PostgreSQL**: Shows only estimates (costs, rows). Not useful for identifying actual performance issues. Always use `EXPLAIN (ANALYZE, BUFFERS)`. prevented
- [ ] Ignoring filter selectivity**: `rows` in MySQL EXPLAIN shows estimated examined rows. If estimated rows is 1M but actual is 10, the optimizer may choose a bad plan. Update statistics. prevented

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
