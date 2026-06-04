# 6-13 Shard Groups

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-13 |
| Knowledge Unit Title | Shard Groups |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.1 Shard key | 6.8 Cross-shard joins | 6.14 Shard model traits |
| Last Updated | 2026-06-02 |

## Overview

Shard groups co-locate tables that share the same shard key on the same physical shard. Tables in the same shard group support JOINs on the shard key without cross-shard overhead. Essential for relational data models in sharded environments.

---

## Core Concepts

- **Shared shard key**: `users` and `orders` both sharded by `user_id`. A user's data and their orders are on the same shard. `JOIN users ON orders.user_id = users.id` stays within shard.
- **Co-location**: Elasticsearch term is "routing". Vitess calls it "shard group" or "colocation". Same concept: related data stays together.
- **Cross-group joins**: Tables in different shard groups require fan-out queries. Design groups carefully.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **User-centric shard group**: `users, orders, order_items, carts, reviews` all sharded by `user_id`. All user-related queries are single-shard.
- **Tenant-centric shard group**: Multi-tenant SaaS: all tables sharded by `tenant_id`. All tenant queries are single-shard.


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
| 1 | Random shard key per table**: `users` by `user_id`, `orders` by `order_id` — no table shares a shard key. Every join is cross-shard. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

