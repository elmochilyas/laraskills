# 3-22 Index Size Estimation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-22 |
| Knowledge Unit Title | Index Size Estimation |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.19 Index maintenance | 3.23 Over-indexing risks |
| Last Updated | 2026-06-02 |

## Overview

Index size affects buffer pool efficiency, storage cost, and backup time. Monitor index-to-table size ratio. PostgreSQL: `pg_indexes_size()`, `pg_stat_user_indexes`. MySQL: `INFORMATION_SCHEMA.INNODB_INDEXES`, `performance_schema`.

---

## Core Concepts

- **Index-to-data ratio**: Typical ratio: 0.5-2x for B-Tree indexes. Higher ratios indicate over-indexing.
- **Buffer pool fit**: Indexes must fit in memory for optimal performance. Monitor buffer pool hit rate.
- **Unused indexes**: `pg_stat_user_indexes` (idx_scan = 0) or MySQL `sys.schema_unused_indexes` identifies indexes never used.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Estimate before creating**: Calculate approximate index size: indexed columns width * row count * fillfactor overhead.
- **Cleanup unused indexes quarterly**: Drop indexes with zero scans over 30 days. Re-evaluate if queries later need them.


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
| 1 | Ignoring index size on memory-constrained systems**: Large indexes that don't fit in buffer pool cause constant page swapping, degrading performance. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

