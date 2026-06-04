# 4-29 Database Statistics

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-29 |
| Knowledge Unit Title | Database Statistics |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.9 Query optimizer internals | 4.28 EXPLAIN output interpretation |
| Last Updated | 2026-06-02 |

## Overview

The query optimizer relies on table statistics (row count, cardinality, data distribution) to choose execution plans. Stale or inaccurate statistics cause poor plan selection: full table scans when an index would be faster, nested loops when hash join is better. Regular `ANALYZE` (MySQL) or `ANALYZE` (PostgreSQL) keeps statistics fresh.

---

## Core Concepts

- **Cardinality**: Number of distinct values in a column. High cardinality (e.g., id) makes range scans efficient. Low cardinality (e.g., status) may not benefit from an index.
- **Histograms**: PostgreSQL and MySQL 8.0 create histograms for non-uniform data distributions. Enables better estimates for range predicates.
- **ANALYZE vs optimize**: ANALYZE updates statistics only. OPTIMIZE TABLE rebuilds the table + updates stats. ANALYZE is sufficient for most optimizer issues.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **After bulk data changes**: Run `ANALYZE TABLE` (MySQL) or `ANALYZE` (PostgreSQL) after bulk inserts, deletes, or updates. Prevents stale stats.
- **Auto-analyze tuning**: PostgreSQL auto-analyze triggers after `autovacuum_analyze_threshold` + `autovacuum_analyze_scale_factor × rows` changes. For frequently updated tables, lower the threshold.
- **MySQL auto-recompute**: MySQL automatically recalculates statistics when >10% of rows change. Manual analyze still useful for edge cases.


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
| 1 | Assuming ANALYZE is unnecessary**: "My query was fast yesterday, slow today" — statistics may have changed. Run ANALYZE. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Skipping ANALYZE after import**: Freshly imported tables have default statistics. Run ANALYZE immediately. Without it, the optimizer may produce poor plans. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

