# 8-6 Partition Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-6 |
| Knowledge Unit Title | Partition Management |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.15 Partition switching |
| Last Updated | 2026-06-02 |

## Overview

Partition management operations: `ADD PARTITION` (add new range), `DROP PARTITION` (remove partition + data instantly), `TRUNCATE PARTITION` (delete data, keep partition), `REORGANIZE PARTITION` (split/merge partitions), `REBUILD/REPAIR PARTITION`. These operations are metadata-only (no data copy) for `DROP` and `TRUNCATE`. `REORGANIZE` copies data.

---

## Core Concepts

- **DROP PARTITION**: Instant metadata operation. Removes partition and its data. No DELETE overhead. Best for data archival.
- **TRUNCATE PARTITION**: Removes data within partition. Partition structure remains.
- **REORGANIZE PARTITION**: Splits one partition into two or merges two into one. `ALTER TABLE ... REORGANIZE PARTITION p2023 INTO (PARTITION p2023a ..., PARTITION p2023b ...)`. Copies data between partitions.
- **ADD PARTITION**: Adds new partition at the end (range) or adds new partition.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Partition rotation**: Monthly: `ALTER TABLE orders ADD PARTITION (PARTITION p202405 VALUES LESS THAN (TO_DAYS('2024-06-01')))`. Automate via scheduled event.
- **Archive and drop**: After N months, `ALTER TABLE orders DROP PARTITION p202301`. Instant. Data gone.


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
| 1 | ADD PARTITION for non-range partitions**: Cannot ADD PARTITION to hash-partitioned tables without REORGANIZE. Pre-plan hash partition count. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

