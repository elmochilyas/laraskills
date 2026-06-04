# 3-25 Index Usage Statistics

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-25 |
| Knowledge Unit Title | Index Usage Statistics |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.22 Index size estimation | 3.23 Over-indexing risks |
| Last Updated | 2026-06-02 |

## Overview

Index usage statistics reveal which indexes are used, which are unused, and how often they're scanned. PostgreSQL: `pg_stat_user_indexes` (idx_scan, idx_tup_read, idx_tup_fetch). MySQL: `performance_schema.table_io_waits_summary_by_index_usage`, `sys.schema_unused_indexes`.

---

## Core Concepts

- **idx_scan**: Number of index scans. 0 = unused index.
- **idx_tup_read / idx_tup_fetch**: Rows read from index vs fetched from heap. High fetch ratio suggests covering index improvement opportunity.
- **sys.schema_unused_indexes (MySQL)**: Identifies indexes never used since last server restart or stats reset.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Quarterly index audit**: Query unused indexes, validate they're still needed, drop confirmed unused.
- **Covering index opportunity**: If idx_tup_fetch is high compared to idx_tup_read, consider adding INCLUDE columns.


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
| 1 | Resetting stats without analysis**: `pg_stat_reset()` or MySQL stats reset clears usage data. Only reset after collecting and documenting findings. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

