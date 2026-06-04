# 8-16 Data Retention Partitioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-16 |
| Knowledge Unit Title | Data Retention Partitioning |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 8.6 Partition management | 8.14 Partition backup/restore |
| Last Updated | 2026-06-02 |

## Overview

Partitioning enables automated data retention: define retention period (e.g., 12 months), create a scheduled job that drops partitions older than retention. `DROP PARTITION` is instant. No DELETE, no VACUUM, no table bloat. The data literally disappears at the filesystem level.

---

## Core Concepts

- **Retention period**: Legal/regulatory requirement (GDPR: delete after N months). Business requirement (keep order history for 12 months).
- **Drop vs DELETE**: `DROP PARTITION` removes the partition filesystem directory. `DELETE` marks rows as deleted but doesn't reclaim space.
- **Scheduled execution**: MySQL EVENT or cron job runs monthly. `CALL drop_old_partitions('orders', 12)`. Stored procedure handles partition enumeration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Retention schedule**: Monthly cron: for each partitioned table, list partitions, calculate age from partition range, drop those older than retention.
- **Graceful retention**: Don't drop immediately on the day — add a 7-day grace period. Archive to cold storage before dropping.


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
| 1 | DELETE for data retention on large tables**: `DELETE FROM orders WHERE created_at < NOW() - INTERVAL 12 MONTH` — huge DELETE, table bloat, slow. Always use partition DROP. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

