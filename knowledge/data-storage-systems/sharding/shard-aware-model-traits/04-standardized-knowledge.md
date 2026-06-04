# 6-14 Shard Aware Model Traits

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-14 |
| Knowledge Unit Title | Shard Aware Model Traits |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.5 Shard routing | 6.13 Shard groups | 6.15 Sharding packages |
| Last Updated | 2026-06-02 |

## Overview

Shard-aware Eloquent models automatically route queries to the correct shard based on the model's shard key. Override `getConnectionName()` to return the correct shard connection. A `Shardable` trait encapsulates routing logic, shard key extraction, and connection resolution.

---

## Core Concepts

- **getConnectionName()**: Eloquent method that returns the connection name. Override: `public function getConnectionName() { return 'shard_'.$this->shard(); }`. Called on every query.
- **Shardable trait**: Provides `shard()`, `connection()`, `scopeOnShard()`. Models using the trait automatically route.
- **Shard key attribute**: The model attribute used for routing: `$this->user_id`, `$this->tenant_id`. Trait reads it.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Trait with caching**: Cache the shard ID for the model's key. `shard()` method checks cache first, computes on miss.
- **Global scope for shard filtering**: Add a global scope to filter by shard key on all queries. Redundant with shard routing but provides defense-in-depth.


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
| 1 | Not overriding getConnectionName on relationships**: Related models may not use the same shard connection. Ensure related models share the shard connection or handle cross-shard explicitly. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

