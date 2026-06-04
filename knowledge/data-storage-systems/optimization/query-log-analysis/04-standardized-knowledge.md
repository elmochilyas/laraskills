# 4-26 Query Log Analysis

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-26 |
| Knowledge Unit Title | Query Log Analysis |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.5 EXPLAIN/EXPLAIN ANALYZE | 4.27 Profiling tools |
| Last Updated | 2026-06-02 |

## Overview

Production query log analysis identifies which queries consume the most database time: total time × frequency. A query taking 2ms but running 10,000 times/second is worse than a query taking 200ms running once/second. Log all queries with duration, group by query shape (normalized query), and rank by total time.

---

## Core Concepts

- **Slow query log**: MySQL/MariaDB `long_query_time`, PostgreSQL `log_min_duration_statement`. Captures queries exceeding duration threshold. First line of defense.
- **Normalized query**: `SELECT * FROM posts WHERE id = ?`. Grouping by normalized form aggregates identical queries with different parameters.
- **Total time = avg time × frequency**: The query with the highest total database time is the most impactful candidate for optimization.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Laravel query log**: `DB::enableQueryLog()`, `DB::getQueryLog()` in middleware or telescope. Capture duration per query.
- **Percona Toolkit / pt-query-digest**: Analyze MySQL slow query log, group by normalized query, output ranked by total time.
- **PostgreSQL auto_explain**: Logs execution plans for slow queries. Helps identify full table scans, missing indexes.


## Architecture Guidelines

- Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Performance Considerations

- EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Fixing the slowest individual query**: A 5-second query running 5x/day is less impactful than a 50ms query running 100,000x/day. Always prioritize by total time. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not normalizing query shapes**: `SELECT * FROM posts WHERE id = 1` and `SELECT * FROM posts WHERE id = 2` are the same query shape. Group them. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

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

