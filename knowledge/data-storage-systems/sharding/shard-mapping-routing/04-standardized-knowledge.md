# 6-5 Shard Mapping Routing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-5 |
| Knowledge Unit Title | Shard Mapping Routing |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.2 Hash-based sharding | 6.4 Directory-based sharding | 6.14 Shard model traits |
| Last Updated | 2026-06-02 |

## Overview

Shard routing determines which shard to query. Service-side routing: the application computes the shard (via hash/range/directory) and connects directly. Proxy-level routing: a middleware (ProxySQL, Vitess, pgcat) routes queries transparently. Service-side gives the application full control; proxy-level simplifies application code.

---

## Core Concepts

- **Service-side routing**: Application calls `shard = ShardRouter::getShard($userId)`, then `DB::connection('shard_'.$shard)->query(...)`. Explicit, testable.
- **Proxy-level routing**: Application connects to proxy as if it's a single database. Proxy parses queries, routes to correct shard. Vitess, ProxySQL, Spanner.
- **Connection management**: Service-side: N connections per request (fan-out). Proxy-level: one connection, proxy handles backend routing.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Service-side for Laravel**: ShardRouter class with `connection()` method. Model trait overrides `getConnectionName()` based on shard key.
- **Proxy-level for complex routing**: Vitess handles cross-shard queries, distributed transactions. Application code stays shard-unaware.


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
| 1 | Hardcoded shard routing**: `if ($id < 1000000) { shard 1 }`. Brittle. Always use a routing class or lookup. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

