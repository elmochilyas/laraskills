# 8-4 Composite Partitioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-4 |
| Knowledge Unit Title | Composite Partitioning |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.3 Hash partitioning | 8.6 Partition management |
| Last Updated | 2026-06-02 |

## Overview

Composite (sub)partitioning uses two levels: the table is partitioned by one strategy, and each partition is further subpartitioned. `PARTITION BY RANGE (YEAR(created_at)) SUBPARTITION BY HASH (user_id) SUBPARTITIONS 4`. Combines benefits: range for lifecycle management, hash for even write distribution.

---

## Core Concepts

- **Level 1**: Primary partition strategy (typically range by date). Handles lifecycle (archival of old ranges).
- **Level 2**: Subpartition strategy (typically hash or list). Distributes writes within the current range partition.
- **Partition maintenance**: Operations apply at the primary partition level. `DROP PARTITION p2020` drops all subpartitions for that range.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Range-hash composite**: Range by month (12 per year), hash by user_id (4 per month). Even write distribution across 48 subpartitions. Drop old months as one operation.
- **Range-list composite**: Range by year, list by status. Year partition contains active and archive subpartitions.


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
| 1 | Excessive subpartitions**: N primary × M sub = N×M total. MySQL max 8192 total. 12 primary × 4 sub = 48. Manageable. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

