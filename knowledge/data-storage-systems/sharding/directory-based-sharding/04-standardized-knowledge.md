# 6-4 Directory Based Sharding

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-4 |
| Knowledge Unit Title | Directory Based Sharding |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.5 Shard mapping | 6.1 Shard key selection |
| Last Updated | 2026-06-02 |

## Overview

Directory-based sharding uses a lookup table (shard map) to track which keys are on which shard. Most flexible — keys can move between shards without changing the shard key. Adds a lookup hop for every query. The lookup table itself must be highly available and low-latency.

---

## Core Concepts

- **Shard map table**: `shard_map(key_hash, shard_id, created_at)`. Query: `SELECT shard_id FROM shard_map WHERE key_hash = ?`. Route query to that shard.
- **Extra hop overhead**: Every query requires a lookup. Cache the shard map aggressively (Redis, local cache).
- **Flexible rebalancing**: Move a key from shard 1 to shard 2 by updating the shard map. No data movement needed at the map level (data still moves).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Cache-backed shard map**: Redis hash `shard:map` stores key→shard_id mapping. Cache hit avoids database lookup. Invalidate on rebalance.
- **Shard map in application memory**: Load entire shard map at boot (small: < 1MB for 100K entries). Fastest lookup.


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
| 1 | Uncached shard map lookup**: Every query hits the shard map database. 2x database load (lookup + actual query). Always cache. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

