# 8-3 Hash Partitioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-3 |
| Knowledge Unit Title | Hash Partitioning |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.2 List partitioning | 8.4 Composite partitioning |
| Last Updated | 2026-06-02 |

## Overview

Hash partitioning distributes rows across partitions via a hash function on the partition key. `PARTITION BY HASH (id) PARTITIONS 8`. Provides even distribution without ranges. Useful when the partition key has high cardinality but no natural range. No partition pruning for range queries on the hash key.

---

## Core Concepts

- **Even distribution**: `MOD(hash(key), N)` assigns rows to N partitions. Without natural skew, each partition gets ~1/N of rows.
- **No pruning for range**: `WHERE id BETWEEN 100 AND 200` cannot prune — must scan all partitions. Hash partitioning is not suitable for range-heavy queries.
- **MySQL BY KEY**: Uses MD5 hash. Similar to HASH but handles NULL values consistently.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Hash partition for write scaling**: Distribute write load across partitions. Each partition acts like a smaller table for writes/inserts.
- **Hash + range composite**: Hash partition by `user_id` (16 partitions) for write distribution. Range subpartition by `created_at` for archiving.


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
| 1 | Adding/removing hash partitions**: Changing `PARTITIONS N` requires rebuilding all data. Choose partition count carefully. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

