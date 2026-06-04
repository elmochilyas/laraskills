# 8-14 Partition Level Backup Restore

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-14 |
| Knowledge Unit Title | Partition Level Backup Restore |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 8.6 Partition management | 8.15 Partition switching |
| Last Updated | 2026-06-02 |

## Overview

Partition-level backup backs up individual partitions instead of the entire table. Faster backup/restore for large tables. `mysqldump` with `--where` clause to dump a specific partition. PostgreSQL can detach a partition into a standalone table and back it up. Enables granular archival and compliance-driven restore (single partition recovery).

---

## Core Concepts

- **MySQL partition dump**: `mysqldump --where="1=1 AND PARTITION(p2024)"` — dumps data for specific partition. Or select from partition: `SELECT * FROM orders PARTITION (p2024)`.
- **PostgreSQL partition backup**: Detach partition: `ALTER TABLE orders DETACH PARTITION orders_2024`. Back up the standalone table. Re-attach if needed.
- **Partial restore**: Restore a single partition's data without affecting other partitions.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Archival backup**: Before `DROP PARTITION`, take a mysqldump or pg_dump of that partition. Store in cold storage (Glacier, S3 Glacier). Compliance record.
- **Granular restore**: User requests data from 3 years ago. Restore the partition backup for that date range. No need to restore entire table.


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
| 1 | Backing up entire partitioned table weekly**: 90% of data is static. Only active partitions change. Back up active partitions daily, archived partitions once. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

