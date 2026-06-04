# 6-1 Shard Key Selection Principles

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-1 |
| Knowledge Unit Title | Shard Key Selection Principles |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.2 Hash-based sharding | 6.3 Range-based sharding | 6.13 Shard groups |
| Last Updated | 2026-06-02 |

## Overview

Shard key is the single most important decision in sharding. A good shard key has high cardinality, distributes data evenly across shards, and aligns with the most frequent query patterns. A bad shard key creates hot shards, uneven data distribution, and fan-out queries on every read.

---

## Core Concepts

- **High cardinality**: Many unique values. `user_id` is high cardinality (millions of values). `status` is low cardinality (few values) — terrible shard key.
- **Even distribution**: Each shard holds roughly equal data volume and throughput.
- **Query alignment**: Most queries include the shard key in WHERE clause. Queries without shard key require fan-out to all shards.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **user_id or tenant_id**: Good shard key for most SaaS apps. High cardinality, included in most queries, distributes evenly.
- **Composite shard key**: `(tenant_id, user_id)` — queries can target a single shard if they include tenant_id. Within a tenant, data is collocated.
- **Avoid date-only shard key**: `created_at` as sole shard key causes hot shard (all writes to current date's shard). Use hash or user-based key.


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
| 1 | Changing shard key after production**: Shard key change requires full data re-shard. Pick carefully; changes are extremely expensive. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

