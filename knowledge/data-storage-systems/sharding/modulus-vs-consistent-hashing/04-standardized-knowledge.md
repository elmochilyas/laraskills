# 6-20 Modulus Vs Consistent Hashing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-20 |
| Knowledge Unit Title | Modulus Vs Consistent Hashing |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | None |
| Related KUs | 6.2 Hash-based sharding, 6.10 Shard rebalancing, 6.12 Adding new shards |
| Last Updated | 2026-06-02 |

## Overview

Modulus sharding (`hash(key) % N`) moves all keys when N changes. Consistent hashing moves only 1/N of keys (expected). For elastic sharding (adding/removing shards over time), consistent hashing is orders of magnitude more efficient. For fixed shard count, modulo is simpler and equally effective.

---

## Core Concepts

- **Modulus movement on resize**: Going from 4 to 5 shards: every key's `hash % 4 ≠ hash % 5`. All keys must move. 100% data migration.
- **Consistent hashing movement**: Adding shard 5 to a 4-shard ring: each of the 4 existing shards gives up ~20% of its keys. Total: 25% of keys move.
- **Virtual nodes**: Each physical shard represented by multiple virtual nodes on the ring. Better distribution, finer-grained rebalancing.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Modulo for fixed shard count**: If shard count is fixed (e.g., 16 shards, never changes), modulo is simpler and has no rebalancing overhead.
- **Consistent hashing for elastic clusters**: If shard count will grow over time (start with 4, grow to 32), consistent hashing minimizes per-operation data movement.


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
| 1 | Choosing modulus with plans to expand**: The first shard addition moves 100% of data. Expensive and risky. Use consistent hashing. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

