# 6-8 Cross Shard Join Limitations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-8 |
| Knowledge Unit Title | Cross Shard Join Limitations |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.1 Shard key | 6.7 Fan-out queries | 6.13 Shard groups |
| Last Updated | 2026-06-02 |

## Overview

Database joins across shards are not possible. Data for a join lives on different physical servers. Solutions: force co-location (same shard key), denormalize data, perform application-level joins (N+1 across shards), or use Vitess/Spanner (distributed query engine). The shard key choice determines which joins are possible.

---

## Core Concepts

- **Shard key = join key**: If both tables are sharded by `user_id`, a join on `user_id` stays within a shard. Works.
- **Cross-shard join**: Table A sharded by `user_id`, Table B sharded by `order_id`. Join on `user_id` requires fan-out.
- **Denormalization**: Store joined data in the same table/shard. Reduces join needs at the cost of data redundancy.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Shard groups**: Tables sharing the same shard key are co-located on the same shard. Joins on shard key work.
- **Application-level join**: Query shards for parent rows, collect IDs, fan-out to query related rows, assemble in PHP.


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
| 1 | Designing joins without considering shard key**: If `orders` and `users` have different shard keys, joining them requires full fan-out. Pick a shared shard key. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

