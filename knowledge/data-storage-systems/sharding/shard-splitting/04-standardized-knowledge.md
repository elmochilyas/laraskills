# 6-11 Shard Splitting

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-11 |
| Knowledge Unit Title | Shard Splitting |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.10 Shard rebalancing | 6.12 Adding new shards | 6.24 Hot shard mitigation |
| Last Updated | 2026-06-02 |

## Overview

A hot shard receives disproportionate traffic or holds too much data. Split it into two or more shards. Range-based: split the key range. Hash-based: increase virtual bucket resolution or change shard count. Split is a form of rebalancing — double-write + backfill + cutover.

---

## Core Concepts

- **Detection**: Monitor per-shard CPU, IOPS, query latency, storage. Shard exceeding 70% of any resource metric is a candidate for split.
- **Range split**: Shard owning keys 1M-2M splits into shard A (1M-1.5M) and shard B (1.5M-2M). Update range map.
- **Hash split**: Add shard N+1. Consistent hashing redistributes 1/N of keys. Requires rebalancing.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Automated split trigger**: Monitor shard metrics. If a shard exceeds threshold for N minutes, queue split job. Notify ops team.
- **Split plan**: (1) Identify split point (median key value or usage boundary). (2) Create new shard. (3) Double-write. (4) Backfill. (5) Cutover.


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
| 1 | Manual split during peak hours**: Splitting adds load (backfill queries). Schedule during low-traffic windows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

