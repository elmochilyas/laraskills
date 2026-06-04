# 6-18 Shard Level Backups Monitoring

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-18 |
| Knowledge Unit Title | Shard Level Backups Monitoring |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.10 Shard rebalancing | 6.17 Read replica per shard |
| Last Updated | 2026-06-02 |

## Overview

Each shard is an independent database that needs independent backup, monitoring, and observability. Per-shard backup schedules, per-shard metrics (CPU, IOPS, connections, query latency), and per-shard alerting. Dashboard aggregates shard-level metrics into a cluster view.

---

## Core Concepts

- **Per-shard backup**: Each shard's database backed up independently. Restore per shard without affecting other shards.
- **Per-shard monitoring**: Track shard-specific metrics: query latency P50/P95/P99, connection count, replication lag, storage usage.
- **Cluster dashboard**: Aggregate view: shard count, total data size, per-shard utilization heatmap, hot shard alerts.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Backup scheduling per shard tier**: Write-heavy shards: hourly snapshots. Archive shards: daily snapshots. Consistent with shard importance.
- **Shard health check**: Automated probe queries on each shard. Fail if query doesn't return within threshold. Alert on shard failure.


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
| 1 | Monitoring shards as a single entity**: Average latency looks fine but one hot shard has 5s P99. Monitor per-shard metrics. Aggregate for cluster view. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

