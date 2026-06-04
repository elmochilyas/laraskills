# 6-21 Time Based Sharding

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-21 |
| Knowledge Unit Title | Time Based Sharding |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Table partitioning | 6.1 Shard key | 6.22 Shard vs partition distinction |
| Last Updated | 2026-06-02 |

## Overview

Time-based sharding partitions data by time ranges: one shard per month, quarter, or year. Natural fit for time-series data, logs, events. Old shards can be archived, compressed, or dropped. Hot shard is always the current time period. Writes are not evenly distributed — current shard gets all writes.

---

## Core Concepts

- **Time range per shard**: `shard_2024_q1`, `shard_2024_q2`, etc. Each shard holds data for a time interval.
- **Hot current shard**: All writes go to the current shard. Other shards are read-only (historical data).
- **Archival lifecycle**: After N months, move old shard to cold storage. After N years, drop.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Time + hash hybrid**: Shard by `(year_month, hash(user_id) % 4)`. Distributes writes within the current month across 4 shards. Hot shard is a group of shards.
- **Pre-creation of future shards**: Create shards for the next 6 months in advance. Automated provisioning.


## Architecture Guidelines

- Hash sharding for even distribution (full remap on N change). Range sharding for efficient range scans (range splitting needed). Directory sharding for flexible routing (simple remap).

## Performance Considerations

- Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must account for total connections across shards.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Single shard per month for write-heavy workloads**: Current month's shard handles 100% of writes. If write volume is high, add hash-based sub-sharding. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Database Sharding & Horizontal Scaling
- **Closely Related**: Other KUs within Database Sharding & Horizontal Scaling
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

