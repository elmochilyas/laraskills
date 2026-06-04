# 6-23 Pre Sharding Vs Progressive

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-23 |
| Knowledge Unit Title | Pre Sharding Vs Progressive |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.10 Shard rebalancing | 6.11 Shard splitting |
| Last Updated | 2026-06-02 |

## Overview

Pre-sharding creates many shards from the start (e.g., 256 shards on 4 servers). Progressive sharding starts with few shards and splits as data grows. Pre-sharding avoids future rebalancing but wastes resources on empty shards. Progressive sharding saves initial cost but adds operational complexity of splits.

---

## Core Concepts

- **Pre-sharding**: Create N shards (e.g., 256) with many virtual shards per physical server. As data grows, move virtual shards to new servers without rebalancing.
- **Progressive sharding**: Start with 2-4 shards. Split hot shards as needed. Each split requires double-write + backfill + cutover.
- **Virtual shards in pre-sharding**: 256 logical shards map to 4 physical servers (64 each). Add server → reassign 64 virtual shards. No data movement.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Pre-shard when growth is predictable**: SaaS with known user acquisition trajectory. Pre-shard for 5 years of growth. Avoids multiple rebalancing operations.
- **Progressive when growth is unknown**: Startup with uncertain scaling needs. Start small, add shards as needed. Accept rebalancing complexity.


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
| 1 | Under-sharding initially**: Starting with 2 shards. Both shards become hot within 6 months. Forced rebalance before team is ready. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

