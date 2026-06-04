# 4-30 Production Optimization Workflow

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-30 |
| Knowledge Unit Title | Production Optimization Workflow |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.1 EXPLAIN output interpretation | 4.5 MySQL slow query log | 4.6 PostgreSQL slow query configuration | 4.27 Profiling tools | 4.28 Endpoint query governance |
| Last Updated | 2026-06-02 |

## Overview

Systematic query optimization follows a closed-loop workflow: **Profile** the production workload, **Identify** the bottleneck queries, **Measure** their impact and baseline, **Fix** the root cause (index, query rewrite, schema change), **Verify** the improvement via A/B comparison, and **Monitor** for regression. Skipping any step produces guesswork optimization — fixing the wrong query, optimizing a 2ms query while a 2s query is ignored, or deploying a fix without verifying it works under production load.

---

## Core Concepts

- **Profile**: Collect raw performance data from production — slow query log, pg_stat_statements, performance_schema, APM traces.
- **Identify**: Rank queries by total impact (frequency × average duration). Fix the queries that cost the most aggregate database time, not the single slowest query.
- **Measure**: Establish baseline metrics (p50/p95/p99 duration, rows examined, call frequency) before making changes.
- **Fix**: Apply the appropriate optimization — index addition, query rewrite, eager loading fix, schema change.
- **Verify**: Compare post-fix metrics against baseline. Confirm improvement under production-like concurrency, not just single-user dev.
- **Monitor**: Track the fix over time to detect regression from data growth or query pattern changes.
- ```
- Total Query Cost = Frequency × Average Duration
- Query A: 10ms × 1,000,000/day = 10,000,000 ms/day (10,000s)
- Query B: 2,000ms × 100/day = 200,000 ms/day (200s)
- Fix Query A first — it costs 50x more total database time.
- ```


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Triage by total cost**: Most optimization value comes from fixing the top 5 queries by total execution time. Ignore queries with low total cost, even if individual instances are slow.
- ```
- Rank | Query Shape              | Frequency | Avg Time | Total/Day | Action
- 1    | SELECT * FROM orders ... | 500,000   | 45ms     | 22,500s   | Add covering index
- 2    | SELECT FROM users ...    | 1,000,000 | 8ms      | 8,000s    | Already good, skip
- 3    | INSERT INTO logs ...     | 200,000   | 30ms     | 6,000s    | Batch inserts
- 4    | Dashboard report         | 50        | 60,000ms | 3,000s    | Materialized view
- ```
- **EXPLAIN before and after**: For every query you optimize, capture the EXPLAIN plan before and after. Store these in a query plan repository for regression comparison.
- ```bash

## Architecture Guidelines

- | Phase | Tool | When |
- |-------|------|------|
- | Profile | pg_stat_statements / performance_schema | PostgreSQL / MySQL production |
- | Profile | Laravel Pulse / Telescope | Development and staging |
- | Identify | pt-query-digest / mysqldumpslow | Analyzing slow query log dumps |
- | Measure | Custom structured logging + metrics dashboard | When tracking improvement over time |
- | Fix | Migration for index/schema change | Most common query fix |
- | Verify | EXPLAIN ANALYZE plan comparison | Always before deploying |
- | Monitor | Alert on p95/p99 increase per query shape | Continuous production monitoring |


## Performance Considerations

- - Profiling adds overhead. pg_stat_statements has negligible overhead (~2-5% on most workloads). MySQL performance_schema adds more overhead (10-15%) — enable it on replicas or during specific profiling windows.
- - Slow query log at 200ms threshold captures problematic queries without filling disk. Adjust up to 500ms for high-throughput OLTP systems.
- - pt-query-digest aggregates slow queries by fingerprint (normalized query shape). Use it to find the most expensive query patterns.
- - Storing EXPLAIN plans: `FORMAT=JSON` (MySQL) stores plans in a parseable format. PostgreSQL's `auto_explain` module can log plans automatically.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Optimizing the wrong query**: A query running 100ms at 100 req/s costs 10s/s. A query running 5000ms at 1 req/s costs 5s/s. The 100ms query is the bigger problem. Always calculate total cost first. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | No baseline before fix**: Without a baseline, you can't prove the fix worked. A query that "feels faster" might be the same speed or even slower under production concurrency. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Optimizing in development only**: A query running 2ms on a dev database with 10k rows performs differently on production with 10M rows. Always test fixes on production-sized data. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | Skipping verification**: Adding an index without verifying that the query plan changed is guessing. Always run EXPLAIN before and after. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | ```sql | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | -- Before: full table scan (type: ALL) | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 7 | EXPLAIN SELECT * FROM orders WHERE status = 'pending';       -- type: ALL, rows: 1,000,000 | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 8 | -- After adding index: ref access | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 9 | EXPLAIN SELECT * FROM orders WHERE status = 'pending';       -- type: ref, rows: 50,000 | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 10 | ``` | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 11 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Worsened performance from wrong index**: Adding a composite index with column ordering that doesn't match query patterns adds write overhead without read benefit. Always test with the actual query.
- - **Query plan regression**: A fix that works today may regress as data grows. An index that supports 10k rows efficiently may not support 10M rows if additional filtering predicates change.
- - **Optimization fatigue**: Teams that skip the workflow and "fix" queries arbitrarily burn time without measurable improvement. This erodes confidence in the optimization process.
- - **Over-optimization**: Spending 4 hours optimizing a query that runs once per week for 2 seconds. The opportunity cost of not optimizing the 100ms query that runs 100,000 times daily is significant.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

