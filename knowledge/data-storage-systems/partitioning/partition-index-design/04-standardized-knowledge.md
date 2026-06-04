# 8-8 Partition Index Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-8 |
| Knowledge Unit Title | Partition Index Design |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.5 Partition pruning | 3.10 Index types |
| Last Updated | 2026-06-02 |

## Overview

MySQL partitioned tables have only local indexes (index per partition, each index covers only the partition's data). PostgreSQL supports both local and global indexes. Local indexes are partitioned in tandem with the table. Global indexes span all partitions. MySQL has no global index support for partitioned tables (the index itself is partitioned).

---

## Core Concepts

- **Local index (MySQL/PostgreSQL)**: Index exists independently per partition. Query must prune to benefit from index — if all partitions are scanned, all indexes are probed.
- **Global index (PostgreSQL only)**: Single index across all partitions. Supports efficient queries without partition pruning. Maintenance cost: every insert/update touches the global index.
- **MySQL limitation**: All indexes on a partitioned table are effectively local. The partition key must be part of every unique index (MySQL requirement).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Local index for pruned queries**: If queries always filter by partition key (e.g., `WHERE created_at >= ? AND user_id = ?`), local indexes (one per partition) are efficient.
- **Global index for unpruned lookups**: PostgreSQL-only. `WHERE user_id = ?` without partition key. Global B-tree enables fast lookup.


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
| 1 | MySQL unique index without partition key**: MySQL requires that every unique index on a partitioned table includes all partition key columns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

