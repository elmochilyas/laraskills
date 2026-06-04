# 8-5 Partition Pruning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-5 |
| Knowledge Unit Title | Partition Pruning |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 4.5 EXPLAIN |
| Last Updated | 2026-06-02 |

## Overview

Partition pruning is the optimizer's ability to scan only relevant partitions for a query. `WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'` on a range-partitioned table scans 1 partition instead of all 12. Pruning requires the WHERE clause to reference the partition key with simple comparisons (>, <, BETWEEN, IN, =).

---

## Core Concepts

- **Static pruning**: Constant expression in WHERE: `created_at = '2024-01-15'` — optimizer knows exact partition at query plan time.
- **Dynamic pruning**: `WHERE user_id = ?` with parameter — pruning happens at execution time.
- **Conditions that prevent pruning**: Functions on the partition key (`YEAR(created_at)` in MySQL RANGE COLUMNS prevents pruning), OR conditions, subqueries.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Verify pruning via EXPLAIN**: `EXPLAIN SELECT ...` shows `partitions` column. Should list only relevant partitions (not `ALL`).
- **Partition key in WHERE**: Always include the partition key in WHERE for queries targeting a subset of data. Without it, all partitions scan.


## Architecture Guidelines

- RANGE for time-series. LIST for discrete categories. HASH for even distribution. KEY for auto-hash on PK.

## Performance Considerations

- Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Function wrapping partition key**: `WHERE YEAR(created_at) = 2024` — MySQL cannot prune with function wrapper. Use range comparison: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Partition pruning fails when queries don't include the partition key. Excessive partitions cause metadata overhead. Hash partition data skew from poor hash function.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Table Partitioning Data Lifecycle
- **Closely Related**: Other KUs within Table Partitioning Data Lifecycle
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

