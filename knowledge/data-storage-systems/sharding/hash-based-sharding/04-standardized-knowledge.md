# 6-2 Hash Based Sharding

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-2 |
| Knowledge Unit Title | Hash Based Sharding |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.20 Modulus vs consistent hashing |
| Related KUs | 6.1 Shard key selection |
| Last Updated | 2026-06-02 |

## Overview

Hash-based sharding maps each row to a shard by hashing the shard key. `shard = hash(key) % N`. Consistent hashing reduces data movement when adding/removing shards (only 1/N of keys move instead of all). Most common sharding strategy for evenly distributed workloads.

---

## Core Concepts

- **Modulo sharding**: `shard_id = crc32(user_id) % 4`. Simple, but adding shard 5 changes the mapping for every key (all data must move).
- **Consistent hashing**: Keys map to a ring. Each shard owns a range of the ring. Adding a shard splits one range; only 1/N of keys move.
- **Virtual buckets**: Divide key space into many virtual buckets (e.g., 4096). Map buckets to physical shards. Rebalancing moves buckets, not individual keys.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Modulo for fixed shard count**: Use when shard count is fixed and unlikely to change. Simple and efficient.
- **Consistent hashing for elastic sharding**: Use when shard count will grow over time. Less data movement during rebalance.


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
| 1 | Modulo for dynamic shard count**: Adding one shard changes every key's shard. Requires full re-shard. Use consistent hashing if shard growth is expected. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

