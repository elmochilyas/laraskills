# 4-6 Postgresql Slow Query Config

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-6 |
| Knowledge Unit Title | Postgresql Slow Query Config |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 4.5 MySQL Slow Query Log | 4.30 Production optimization workflow |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL's `log_min_duration_statement` logs queries exceeding a duration threshold. The `auto_explain` extension logs EXPLAIN plans for slow queries, enabling post-hoc analysis without reproducing the slow query.

---

## Core Concepts

- **log_min_duration_statement**: Set to 500 (ms). Logs SQL text and duration. `0` logs all queries.
- **auto_explain**: Extension that logs EXPLAIN plans for queries above a threshold. `auto_explain.log_min_duration = 500`.
- **pg_stat_statements**: Tracks execution statistics per normalized query. Total time, mean time, calls, rows, block hits/reads.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use auto_explain for plan capture**: When a query is slow at 3am, auto_explain captures the plan so you can analyze it the next morning.
- **pg_stat_statements for top-N analysis**: Identify the most time-consuming queries overall, not just slow individual queries.


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
| 1 | Not installing auto_explain**: Without it, you have the slow query text but no plan. Reproducing the exact plan later is difficult. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

