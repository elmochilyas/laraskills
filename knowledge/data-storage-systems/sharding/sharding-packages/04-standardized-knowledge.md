# 6-15 Sharding Packages

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-15 |
| Knowledge Unit Title | Sharding Packages |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.14 Shard model traits | 6.16 Swoole/Octane dispatch |
| Last Updated | 2026-06-02 |

## Overview

allnetru/laravel-sharding is the primary Laravel sharding package. Supports hash, range, db_range, and Redis-based sharding strategies. Includes Snowflake ID generation, database sequence ID generation, coroutine fan-out for Swoole/Octane, and event-based connection resolution. Covers most sharding use cases without custom infrastructure.

---

## Core Concepts

- **Strategies**: Hash (modulo, consistent), range (key ranges), db_range (range with dynamic shard discovery), Redis (shard map via Redis).
- **ID generation**: Snowflake (64-bit, timestamp+shard+sequence), database sequences (sequence per shard).
- **Fan-out**: Coroutine-aware fan-out with Swoole/Octane. `Sharding::fanOut(fn($shard) => $query->on($shard)->get())`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Package + custom shard proxy**: Use allnetru/laravel-sharding for application-level routing (model traits, fan-out). Add Vitess or ProxySQL for cross-shard query support.
- **Strategies per model**: Different sharding strategies for different models. `Order` uses hash on `user_id`. `Log` uses range on `created_at`.


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
| 1 | Package as silver bullet**: The package handles routing, but shard key selection, rebalancing, and cross-shard transaction avoidance require careful design. Package is a tool, not a solution. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

