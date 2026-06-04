# 6-17 Read Replica Per Shard

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-17 |
| Knowledge Unit Title | Read Replica Per Shard |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.1 Shard key | 7.2 Read/write splitting | 7.10 Replica lag |
| Last Updated | 2026-06-02 |

## Overview

Each shard can have its own read replicas for read scaling within the shard. Write-heavy shards get more or larger replicas. Read replicas per shard provide shard-level read capacity independent of other shards. Combined: sharding for horizontal write scaling + replicas for read scaling.

---

## Core Concepts

- **Shard-level read replica**: Shard 1 has 2 replicas, Shard 2 has 1 replica, Shard 3 has 3 replicas (based on read load per shard).
- **Asymmetric replica count**: Hot shards get more replicas. Cold shards get fewer. More cost-effective than symmetric replicas.
- **Read routing per shard**: `ShardRouter::connection($shardId, 'read')` returns a random replica connection for that shard.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Read replica config per shard**: `config('database.shards.1.read.host')` per shard. Route reads to replicas per shard.
- **Replica lag monitoring per shard**: Each shard's replicas may have different lag. Route to replicas within acceptable lag threshold.


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
| 1 | Same replica config for all shards**: Hot shards need more read capacity. Monitor per-shard replica lag and add replicas to hot shards. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

