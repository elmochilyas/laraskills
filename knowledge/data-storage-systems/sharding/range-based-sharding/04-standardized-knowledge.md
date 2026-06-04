# 6-3 Range Based Sharding

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-3 |
| Knowledge Unit Title | Range Based Sharding |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.1 Shard key | 6.2 Hash-based sharding | 6.10 Shard rebalancing |
| Last Updated | 2026-06-02 |

## Overview

Range-based sharding assigns contiguous key ranges to each shard: shard 1 (users 1-1M), shard 2 (users 1M-2M), etc. Predictable, supports range scans within a shard, easy to split hot ranges. Risk of uneven distribution if ranges are poorly chosen.

---

## Core Concepts

- **Contiguous ranges**: Each shard owns a range of shard key values. `users.id BETWEEN 1 AND 1000000` goes to shard 1.
- **Range scan friendly**: `WHERE id BETWEEN 500 AND 600` targets a single shard. Hash-based sharding scatters the same query across all shards.
- **Hot range**: New users all go to the last shard (monotonically increasing key). Write-heavy shard while others are idle.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Date range sharding**: `orders_2024_01`, `orders_2024_02`. Natural data lifecycle. Can archive old shards. Hot shard on current month.
- **ID range with pre-splitting**: Estimate growth, pre-allocate ranges with 20% headroom. Reduces split frequency.


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
| 1 | Monotonically increasing key without mitigation**: All new writes go to the last shard. Hot shard on the highest-range shard. Combine with hash to distribute. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

