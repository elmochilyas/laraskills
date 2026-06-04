# 6-6 Shard Aware Id Generation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-6 |
| Knowledge Unit Title | Shard Aware Id Generation |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.1 Shard key | 6.4 Directory-based sharding | 6.5 Shard routing |
| Last Updated | 2026-06-02 |

## Overview

Globally unique, ordered IDs that encode the shard or are shard-predictable are essential for sharded systems. Sequence-based IDs require coordination across shards. Snowflake IDs encode timestamp + shard ID + sequence. UUID v7 (time-ordered) provides global uniqueness without coordination. The ID strategy determines whether a lookup is needed to find the shard.

---

## Core Concepts

- **Snowflake**: 64-bit ID: timestamp (41 bits) + shard ID (10 bits) + sequence (12 bits). Shard ID encoded in the ID — no lookup needed to route.
- **UUID v7**: Time-ordered UUID. Monotonically increasing. Globally unique. Does not encode shard ID — requires shard map lookup.
- **Database sequence**: `auto_increment` per shard with offset: shard 1 (1, 5, 9...), shard 2 (2, 6, 10...). Simple but limited.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Snowflake for embedded shard routing**: Decode shard ID from ID to route queries. No extra lookup. Most efficient.
- **UUID v7 for global uniqueness**: No coordination between shards. Use with directory-based routing (shard map cache).


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
| 1 | auto_increment across shards**: Two shards may generate the same ID. Always use shard-aware sequences or global ID generators. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

