# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.24 Join optimization (join type selection, join order, index requirements for joins)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always index FK columns applied
- [ ] INNER JOIN for mandatory relationships applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] JOIN without index on FK column**: The most common join performance mistake. Full table scan on the joined table for every row in the driving table. prevented
- [ ] LEFT JOIN when INNER JOIN suffices**: LEFT JOIN returns more rows (including NULLs for non-matching). INNER JOIN is faster if the NULL case is never needed. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] All JOIN columns indexed
- [ ] Correct join type chosen (INNER vs LEFT)
- [ ] EXPLAIN confirms efficient join execution

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always index FK columns applied
- [ ] INNER JOIN for mandatory relationships applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify all JOINs and their ON clause columns completed
- [ ] Ensure the joined table's ON column is indexed (always index FK columns) completed
- [ ] Verify INNER JOIN vs LEFT JOIN choice — prefer INNER when NULL rows aren't needed completed
- [ ] Run EXPLAIN and check for full table scans on joined tables completed
- [ ] If optimizer chooses poor join order, consider query restructuring completed

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

- [ ] JOIN without index on FK column**: The most common join performance mistake. Full table scan on the joined table for every row in the driving table. prevented
- [ ] LEFT JOIN when INNER JOIN suffices**: LEFT JOIN returns more rows (including NULLs for non-matching). INNER JOIN is faster if the NULL case is never needed. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All FK columns on joined tables are indexed
- [ ] INNER JOIN used when the relationship is mandatory
- [ ] No full table scan on joined tables in EXPLAIN
- [ ] `type` shows `ref` or `eq_ref` for JOIN operations
- [ ] All JOIN columns indexed
- [ ] Correct join type chosen (INNER vs LEFT)
- [ ] EXPLAIN confirms efficient join execution

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
- [ ] JOIN without index on FK column**: The most common join performance mistake. Full table scan on the joined table for every row in the driving table. prevented
- [ ] LEFT JOIN when INNER JOIN suffices**: LEFT JOIN returns more rows (including NULLs for non-matching). INNER JOIN is faster if the NULL case is never needed. prevented

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
