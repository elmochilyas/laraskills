# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.30 Performance budget enforcement in CI (query count, duration thresholds)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Test with DB::enableQueryLog applied
- [ ] PHPUnit @group slow applied
- [ ] Baseline comparison applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No query count assertions in tests**: Without them, a new relationship added to a view can silently add 50+ queries. Every endpoint test should assert query count. prevented
- [ ] False negatives from connection differences**: SQLite in tests may execute different query patterns than MySQL/PostgreSQL. Run performance tests against the production-alike database. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Query count assertions prevent N+1 regressions from reaching production
- [ ] Baseline comparison detects performance changes in CI
- [ ] Developers get fast feedback on query performance impact

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Test with DB::enableQueryLog applied
- [ ] PHPUnit @group slow applied
- [ ] Baseline comparison applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Enable `Model::preventLazyLoading()` in tests (catches N+1) completed
- [ ] Add query count assertions to endpoint tests: completed
- [ ] Add duration assertions for slow endpoints completed
- [ ] Store baseline query counts in JSON for CI comparison completed
- [ ] Tag performance tests with `@group performance` for optional CI runs completed

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

- [ ] No query count assertions in tests**: Without them, a new relationship added to a view can silently add 50+ queries. Every endpoint test should assert query count. prevented
- [ ] False negatives from connection differences**: SQLite in tests may execute different query patterns than MySQL/PostgreSQL. Run performance tests against the production-alike database. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `Model::preventLazyLoading()` enabled in test environment
- [ ] Query count assertions on critical endpoints
- [ ] Baseline comparison mechanism in CI
- [ ] Performance tests tagged and runnable in CI
- [ ] Query count assertions prevent N+1 regressions from reaching production
- [ ] Baseline comparison detects performance changes in CI
- [ ] Developers get fast feedback on query performance impact

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
- [ ] No query count assertions in tests**: Without them, a new relationship added to a view can silently add 50+ queries. Every endpoint test should assert query count. prevented
- [ ] False negatives from connection differences**: SQLite in tests may execute different query patterns than MySQL/PostgreSQL. Run performance tests against the production-alike database. prevented

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
