# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.15 SQL-side aggregation (withCount, raw aggregates) vs. collection-side
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always use withCount for counts applied
- [ ] DB::raw for complex aggregation applied
- [ ] Mass assignment aggregation applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Collection count in a loop**: `foreach ($posts as $post) { $count = $post->comments->count(); }` — loads all comments for every post. Use `withCount('comments')` once. prevented
- [ ] Loading relationships just for aggregation**: Loading full related models when only the aggregated value is needed. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] All aggregation moved to SQL side
- [ ] No unnecessary relationship loading for aggregation
- [ ] Memory usage reduced by avoiding collection hydration

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always use withCount for counts applied
- [ ] DB::raw for complex aggregation applied
- [ ] Mass assignment aggregation applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify `$model->relation->count()` or `$model->relation->sum('col')` patterns completed
- [ ] Replace with `Model::withCount('relation')` or `Model::withSum('relation', 'col')` completed
- [ ] For custom aggregations, use `selectRaw()` or subqueries completed
- [ ] For mass assignment aggregation, use query builder `groupBy()` + `selectRaw()` completed
- [ ] Verify query count dropped with `DB::getQueryLog()` completed

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

- [ ] Collection count in a loop**: `foreach ($posts as $post) { $count = $post->comments->count(); }` — loads all comments for every post. Use `withCount('comments')` once. prevented
- [ ] Loading relationships just for aggregation**: Loading full related models when only the aggregated value is needed. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No `->relation->count()` in loops — use `withCount()`
- [ ] No loading relationships solely for aggregation
- [ ] `selectRaw` used for complex GROUP BY aggregations
- [ ] Query count reduced after refactoring
- [ ] All aggregation moved to SQL side
- [ ] No unnecessary relationship loading for aggregation
- [ ] Memory usage reduced by avoiding collection hydration

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
- [ ] Collection count in a loop**: `foreach ($posts as $post) { $count = $post->comments->count(); }` — loads all comments for every post. Use `withCount('comments')` once. prevented
- [ ] Loading relationships just for aggregation**: Loading full related models when only the aggregated value is needed. prevented

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
