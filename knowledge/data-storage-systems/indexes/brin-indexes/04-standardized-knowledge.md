# 3-5 Brin Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-5 |
| Knowledge Unit Title | Brin Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.1 B-Tree | 3.19 Index maintenance | 8.1 Range partitioning | 8.7 Time-based partitioning |
| Last Updated | 2026-06-02 |

## Overview

BRIN (Block Range INdex) stores min/max value summaries for contiguous physical block ranges. Designed for append-only tables where data is inserted in roughly sorted order (time-series, event logs, audit trails). BRIN indexes are 100-1000x smaller than B-Tree indexes and perform well on range queries over correlated data.

---

## Core Concepts

- **Block range summary**: Each index entry covers a range of physical blocks (default 128 blocks, ~1MB). Stores min and max value for the indexed column.
- **Correlation requirement**: BRIN is effective only when data insertion order correlates with indexed column value (time-series, monotonically increasing IDs).
- **Size advantage**: For a 1TB table, a B-Tree on a timestamp column might be 30GB. A BRIN index might be 10-50MB.
- **Range query performance**: Excellent for `WHERE timestamp > '2026-01-01' AND timestamp < '2026-02-01'`. Poor for point lookups.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Time-series data**: Event logs, metrics, audit trails inserted in chronological order. BRIN on timestamp enables fast date-range queries.
- **append-only tables**: Tables where UPDATE/DELETE are rare. Heavy UPDATE/DELETE degrades BRIN effectiveness.
- **Monitoring and observability**: pg_stat_statements data, request logs, background job history.


## Architecture Guidelines

- Index types: B-Tree for equality/range/sort. GIN for JSONB and full-text. GiST for geospatial and ranges. BRIN for large ordered tables. Hash for equality-only in PostgreSQL.

## Performance Considerations

- B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index adds write amplification. BRIN indexes are efficient for large ordered datasets.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | BRIN on randomly distributed data**: UUID primary key inserted randomly across the table. Each block range covers almost the entire value range. Every query scans all blocks. Use B-Tree instead. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not choosing optimal pages_per_range**: Default (128) is a starting point. Lower values (32) = more precise but larger index. Higher (256) = smaller index but coarser filtering. Tune based on query patterns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Query planner ignores indexes when column types mismatch query parameter types. Implicit type conversion prevents index usage. Index bloat from heavy UPDATE/DELETE workloads degrades performance. Missing indexes on FK columns cause full table scans on JOIN queries.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Indexing Strategy Physical Design
- **Closely Related**: Other KUs within Indexing Strategy Physical Design
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

