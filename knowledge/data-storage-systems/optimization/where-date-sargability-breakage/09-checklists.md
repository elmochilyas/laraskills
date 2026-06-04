# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.8 whereDate/whereMonth/whereYear/whereDay/whereTime sargability breakage
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Carbon range applied
- [ ] Microsecond-safety applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] whereDate inside a scope**: A local scope that calls `whereDate` silently breaks index on every invocation. Always use range queries in scopes. prevented
- [ ] Using whereDate for JOIN conditions**: `join('posts', fn($j) => $j->whereDate(...))` — double index bypass on the joined table. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] All date helper methods replaced with range queries
- [ ] EXPLAIN confirms index range scan
- [ ] No regressions in query results (boundary conditions verified)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Carbon range applied
- [ ] Microsecond-safety applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify `whereDate()`, `whereMonth()`, `whereYear()`, `whereDay()`, `whereTime()` calls completed
- [ ] Replace with range comparisons using Carbon: completed
- [ ] Verify with EXPLAIN that `type` is `range` instead of `ALL` completed

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

- [ ] whereDate inside a scope**: A local scope that calls `whereDate` silently breaks index on every invocation. Always use range queries in scopes. prevented
- [ ] Using whereDate for JOIN conditions**: `join('posts', fn($j) => $j->whereDate(...))` — double index bypass on the joined table. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No `whereDate`/`whereMonth`/`whereYear`/`whereDay`/`whereTime` on indexed columns
- [ ] Range queries use half-open intervals `[start, end)` with `startOfNextDay()` for microsecond safety
- [ ] EXPLAIN shows range scan instead of full table scan
- [ ] All date helper methods replaced with range queries
- [ ] EXPLAIN confirms index range scan
- [ ] No regressions in query results (boundary conditions verified)

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
- [ ] whereDate inside a scope**: A local scope that calls `whereDate` silently breaks index on every invocation. Always use range queries in scopes. prevented
- [ ] Using whereDate for JOIN conditions**: `join('posts', fn($j) => $j->whereDate(...))` — double index bypass on the joined table. prevented

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
