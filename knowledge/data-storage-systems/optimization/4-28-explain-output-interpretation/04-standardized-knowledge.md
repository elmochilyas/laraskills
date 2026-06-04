# 4-28 Explain Output Interpretation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-28 |
| Knowledge Unit Title | Explain Output Interpretation |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.5 EXPLAIN/EXPLAIN ANALYZE | 3.10 Index types |
| Last Updated | 2026-06-02 |

## Overview

EXPLAIN output differs significantly between MySQL/MariaDB and PostgreSQL. MySQL shows join type, key, rows examined, and Extra. PostgreSQL shows node type, startup cost, total cost, rows, width, and actual timing with ANALYZE. Understanding both is essential for cross-platform optimization.

---

## Core Concepts

- **MySQL EXPLAIN columns**: `select_type`, `table`, `type` (const/ref/range/index/ALL), `possible_keys`, `key`, `ref`, `rows`, `Extra` (Using index, Using where, Using filesort, Using temporary).
- **PostgreSQL EXPLAIN**: `Seq Scan` vs `Index Scan` vs `Index Only Scan`, `cost=startup..total`, estimated rows, `width`. With `ANALYZE`, shows actual rows and timing.
- **Red flags in MySQL**: `type=ALL` (full table scan), `Extra=Using filesort` (no sort index), `Extra=Using temporary` (temp table for GROUP BY), `rows >> actual` (bad cardinality estimate).
- **Red flags in PostgreSQL**: `Seq Scan` on large table, `Sort Method: external merge Disk` (sort exceeds work_mem), large row count mismatch between estimate and actual.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **MySQL single-column index check**: `EXPLAIN SELECT * FROM orders WHERE user_id = 1`. Check `type=ref` and `key` uses the index. If `type=ALL`, index is missing.
- **PostgreSQL actual vs estimated**: `EXPLAIN (ANALYZE, BUFFERS) SELECT ...`. Large discrepancy indicates stale statistics. Run `ANALYZE`.


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
| 1 | EXPLAIN without ANALYZE on PostgreSQL**: Shows only estimates (costs, rows). Not useful for identifying actual performance issues. Always use `EXPLAIN (ANALYZE, BUFFERS)`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Ignoring filter selectivity**: `rows` in MySQL EXPLAIN shows estimated examined rows. If estimated rows is 1M but actual is 10, the optimizer may choose a bad plan. Update statistics. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

