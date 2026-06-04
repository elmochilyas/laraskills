# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.30 Production optimization workflow: profile -> identify -> measure -> fix -> verify -> monitor
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Triage by total cost applied
- [ ] EXPLAIN before and after applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Optimizing the wrong query**: A query running 100ms at 100 req/s costs 10s/s. A query running 5000ms at 1 req/s costs 5s/s. The 100ms query is the bigger problem. Always calculate total cost first. prevented
- [ ] No baseline before fix**: Without a baseline, you can't prove the fix worked. A query that "feels faster" might be the same speed or even slower under production concurrency. prevented
- [ ] Optimizing in development only**: A query running 2ms on a dev database with 10k rows performs differently on production with 10M rows. Always test fixes on production-sized data. prevented
- [ ] Skipping verification**: Adding an index without verifying that the query plan changed is guessing. Always run EXPLAIN before and after. prevented
- [ ] ```sql prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Closed-loop workflow executed for each optimization target
- [ ] Measurable reduction in total query time for fixed queries
- [ ] Regression monitoring in place to detect future degradation

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Triage by total cost applied
- [ ] EXPLAIN before and after applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] **Profile**: Collect raw performance data from production completed
- [ ] **Identify**: Rank queries by total cost (frequency × avg duration) — fix highest total cost first completed
- [ ] **Measure**: Capture baseline p50/p95/p99 duration, rows examined, call frequency completed
- [ ] **Fix**: Apply optimization (index, query rewrite, schema change, eager loading) completed
- [ ] **Verify**: Compare post-fix metrics against baseline under production-like concurrency completed

---

# Performance Checklist

- [ ] Performance: - Profiling adds overhead. pg_stat_statements has negligible overhead (~2-5% on most workloads). MySQL performance_schema adds more overhead (10-15...
- [ ] Performance: - Slow query log at 200ms threshold captures problematic queries without filling disk. Adjust up to 500ms for high-throughput OLTP systems.
- [ ] Performance: - pt-query-digest aggregates slow queries by fingerprint (normalized query shape). Use it to find the most expensive query patterns.
- [ ] Performance: - Storing EXPLAIN plans: `FORMAT=JSON` (MySQL) stores plans in a parseable format. PostgreSQL's `auto_explain` module can log plans automatically.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Optimizing the wrong query**: A query running 100ms at 100 req/s costs 10s/s. A query running 5000ms at 1 req/s costs 5s/s. The 100ms query is the bigger problem. Always calculate total cost first. prevented
- [ ] No baseline before fix**: Without a baseline, you can't prove the fix worked. A query that "feels faster" might be the same speed or even slower under production concurrency. prevented
- [ ] Optimizing in development only**: A query running 2ms on a dev database with 10k rows performs differently on production with 10M rows. Always test fixes on production-sized data. prevented
- [ ] Skipping verification**: Adding an index without verifying that the query plan changed is guessing. Always run EXPLAIN before and after. prevented
- [ ] ```sql prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Queries ranked by total time, not individual duration
- [ ] Baseline metrics captured before optimization
- [ ] EXPLAIN plan stored before and after
- [ ] Post-fix metrics show improvement under load
- [ ] Monitoring alerts configured for regression detection
- [ ] Closed-loop workflow executed for each optimization target
- [ ] Measurable reduction in total query time for fixed queries
- [ ] Regression monitoring in place to detect future degradation
- [ ] Before/after plans documented for team reference

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
- [ ] Optimizing the wrong query**: A query running 100ms at 100 req/s costs 10s/s. A query running 5000ms at 1 req/s costs 5s/s. The 100ms query is the bigger problem. Always calculate total cost first. prevented
- [ ] No baseline before fix**: Without a baseline, you can't prove the fix worked. A query that "feels faster" might be the same speed or even slower under production concurrency. prevented
- [ ] Optimizing in development only**: A query running 2ms on a dev database with 10k rows performs differently on production with 10M rows. Always test fixes on production-sized data. prevented
- [ ] Skipping verification**: Adding an index without verifying that the query plan changed is guessing. Always run EXPLAIN before and after. prevented
- [ ] ```sql prevented
- [ ] -- Before: full table scan (type: ALL) prevented
- [ ] EXPLAIN SELECT * FROM orders WHERE status = 'pending';       -- type: ALL, rows: 1,000,000 prevented
- [ ] -- After adding index: ref access prevented
- [ ] EXPLAIN SELECT * FROM orders WHERE status = 'pending';       -- type: ref, rows: 50,000 prevented
- [ ] ``` prevented

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
