# 6-24 Hot Shard Mitigation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-24 |
| Knowledge Unit Title | Hot Shard Mitigation |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.11 Shard splitting | 6.10 Shard rebalancing |
| Last Updated | 2026-06-02 |

## Overview

Hot shard receives disproportionate load (e.g., a viral tenant on a multi-tenant shard). Mitigation: split the shard (smaller ranges), move hot keys to a less loaded shard, or rebalance the entire cluster. Detection via per-shard CPU, IOPS, and connection monitoring. Mitigation must be automated or at least scripted.

---

## Core Concepts

- **Causes**: Poor shard key distribution, viral user/tenant on one shard, time-based shard on current period.
- **Split**: Divide the hot shard's range into two shards. Reduces per-shard load by half.
- **Move keys**: Relocate specific hot keys (e.g., viral tenant) to a dedicated shard. Requires double-write + cutover.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Automated detection → alert → action**: Monitor per-shard metrics. If any metric > 80% for 10 minutes, alert. If > 95% for 5 minutes, auto-split or move.
- **Whale tenant to dedicated shard**: A tenant consuming 30% of a shard's resources should move to its own shard. Prevents impact on other tenants.


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
| 1 | Ignoring hot shard until it fails**: Hot shard degrades gradually. Alert at 70%, plan mitigation at 80%, execute at 90%. Don't wait for 100%. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

