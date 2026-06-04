# 4-21 Query Shape Discipline

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-21 |
| Knowledge Unit Title | Query Shape Discipline |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.27 API resource classes | 4.14 Eager loading depth governance |
| Last Updated | 2026-06-02 |

## Overview

List views (index, search results) and detail views (show page) have fundamentally different data requirements. List views need minimal columns and few relationships. Detail views need full data and deeper relationships. Both should be explicitly defined and never served by the same query. Query shape discipline is defining exactly what data each endpoint needs and writing queries to match.

---

## Core Concepts

- **List view**: 10-20 items, 1-3 columns per item, 1 eager loaded relationship, no large text fields.
- **Detail view**: 1 item, all columns, multiple relationships, computed attributes.
- **Anti-pattern**: Reusing a `Post::with('comments', 'author', 'tags', 'likes', 'metadata')` for both list and detail endpoints.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Separate scopes**: `scopeForList($q)` with minimal selects and narrow eager loads. `scopeForDetail($q)` with full data.
- **API Resource per view**: `PostListResource` (sparse) and `PostDetailResource` (full).


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
| 1 | - **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | - **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | - **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | - **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | - **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | - **Missing index maintenance**: Over time, heavily written indexes fragment and lose performance. Schedule regular index rebuilds for tables with high write volume. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

