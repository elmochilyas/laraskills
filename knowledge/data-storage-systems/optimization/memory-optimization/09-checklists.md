# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.20 Memory optimization for large result sets
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use query builder for reporting applied
- [ ] Narrow columns applied
- [ ] cursor() for memory-safe streaming applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Reporting through Eloquent**: `Order::all()->groupBy('status')->map->count()` — hydrates all orders, then groups/counts in PHP. Use query builder aggregation. prevented
- [ ] Loading full models for API responses**: `User::all()` returns 50K users for an admin dropdown. Use `User::pluck('name', 'id')`. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Memory usage reduced to within acceptable limits
- [ ] Large datasets processed without memory exhaustion
- [ ] Appropriate tool chosen (Eloquent vs query builder vs cursor)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use query builder for reporting applied
- [ ] Narrow columns applied
- [ ] cursor() for memory-safe streaming applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Measure memory usage of current approach: `memory_get_peak_usage(true)` completed
- [ ] If reporting or aggregation: switch to query builder `DB::table()` — 10x less memory completed
- [ ] If model methods needed: narrow columns with `->select('id', 'name')` completed
- [ ] If processing many rows: use `cursor()` for streaming one row at a time completed
- [ ] For dropdowns: use `pluck()` instead of loading full models completed

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

- [ ] Reporting through Eloquent**: `Order::all()->groupBy('status')->map->count()` — hydrates all orders, then groups/counts in PHP. Use query builder aggregation. prevented
- [ ] Loading full models for API responses**: `User::all()` returns 50K users for an admin dropdown. Use `User::pluck('name', 'id')`. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No full model hydration for reporting/aggregation queries
- [ ] Narrow column selection on large queries
- [ ] `pluck()` used for key-value lookups instead of full model loading
- [ ] Memory peak usage within 50% of `memory_limit`
- [ ] Memory usage reduced to within acceptable limits
- [ ] Large datasets processed without memory exhaustion
- [ ] Appropriate tool chosen (Eloquent vs query builder vs cursor)

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
- [ ] Reporting through Eloquent**: `Order::all()->groupBy('status')->map->count()` — hydrates all orders, then groups/counts in PHP. Use query builder aggregation. prevented
- [ ] Loading full models for API responses**: `User::all()` returns 50K users for an admin dropdown. Use `User::pluck('name', 'id')`. prevented

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
