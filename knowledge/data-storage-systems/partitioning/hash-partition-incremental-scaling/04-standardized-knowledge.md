# 8-12 Hash Partition Incremental Scaling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-12 |
| Knowledge Unit Title | Hash Partition Incremental Scaling |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 8.3 Hash partitioning | 8.14 Partition backup/restore |
| Last Updated | 2026-06-02 |

## Overview

Hash partition count must be chosen carefully — changing it later requires rebuilding the table. Choose a power of 2 (16, 32, 64) to enable future merging/splitting. Pre-partition for maximum expected growth. Incremental scaling: start with 16 partitions, merge pairs when table grows, or split when hot.

---

## Core Concepts

- **Power of 2 count**: 2, 4, 8, 16, 32, 64, 128. Enables easy partition rebalancing: merge 2 into 1, split 1 into 2.
- **Pre-partition for growth**: If you expect 100M rows, choose partition count so each partition stays under 10M rows. 16 partitions → 6.25M each. Adequate.
- **Changing partition count**: MySQL: `ALTER TABLE ... PARTITION BY HASH (key) PARTITIONS N` — rebuilds entire table. Plan for no changes.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Conservative hash count**: Start with 16 partitions for most tables. Increase only if monitoring shows individual partition size is problematic.
- **Partition merging**: `ALTER TABLE ... REORGANIZE PARTITION p0,p1 INTO (PARTITION p0 VALUES ...)` — merges two partitions into one.


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
| 1 | Too few hash partitions**: 2 partitions for a table that grows to 50M rows. Each partition becomes too large. Pre-partition with growth margin. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

