# 6-10 Shard Rebalancing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-10 |
| Knowledge Unit Title | Shard Rebalancing |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.11 Shard splitting | 6.12 Adding new shards | 6.20 Consistent hashing |
| Last Updated | 2026-06-02 |

## Overview

Shard rebalancing moves data between shards when the cluster is unbalanced (one shard has 40% of data) or when shards are added/removed. Approaches: offline (downtime, simpler), online (no downtime, complex). Online rebalancing uses double-write + backfill + cutover or consistent hashing with virtual bucket migration.

---

## Core Concepts

- **Offline rebalancing**: Stop writes, dump all data, reload with new shard config. Simple but requires downtime proportional to data volume.
- **Online rebalancing (double-write)**: Write new data to both old and new shard. Backfill existing data. Atomic cutover via shard map update. No downtime.
- **Virtual bucket migration**: Move buckets (not individual keys) between physical shards. Less granular but simpler than per-key migration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Online rebalance workflow**: (1) Add new shard. (2) Start double-writing. (3) Backfill existing data to new shard. (4) Verify consistency. (5) Update shard map. (6) Stop double-writing. (7) Clean up old data.
- **Rate-limited migration**: Move 10K keys per batch. Monitor replication lag, error rates. Pause if any threshold exceeded.


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
| 1 | Unbounded rebalance time**: Rebalancing 100GB over a slow network takes hours. Monitor progress, estimate completion time, communicate with stakeholders. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

