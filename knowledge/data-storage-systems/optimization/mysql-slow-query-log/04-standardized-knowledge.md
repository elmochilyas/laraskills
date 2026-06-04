# 4-5 Mysql Slow Query Log

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-5 |
| Knowledge Unit Title | Mysql Slow Query Log |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 4.30 Production optimization workflow |
| Last Updated | 2026-06-02 |

## Overview

The MySQL Slow Query Log records queries exceeding a time threshold. Combined with `mysqldumpslow` (aggregation) and `pt-query-digest` (detailed analysis), it provides the definitive production dataset for identifying optimization targets.

---

## Core Concepts

- **Configuration**: `slow_query_log = 1`, `long_query_time = 0.5` (seconds), `log_queries_not_using_indexes = 1`.
- **mysqldumpslow**: Summarizes slow log by query pattern. `-s t` sorts by total time, `-t 10` shows top 10.
- **pt-query-digest**: Percona's comprehensive analyzer. Groups queries by fingerprint, shows histogram, query times, index usage.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Start with long_query_time = 0.5**: Capture moderately slow queries without overwhelming the log with sub-millisecond queries.
- **Use pt-query-digest weekly**: Generate a report of the top 10 slowest queries by total execution time. Focus optimization efforts there.
- **Log queries not using indexes**: This catches missing index issues even on fast queries.


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
| 1 | long_query_time too high**: Setting to 5 seconds captures only the worst offenders. Misses the 200ms queries that run 1000 times/second. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | analyzing slow log without aggregation**: Reading individual entries is overwhelming. Always use pt-query-digest for aggregated analysis. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
- **Closely Related**: 4.6 PostgreSQL slow query config
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

