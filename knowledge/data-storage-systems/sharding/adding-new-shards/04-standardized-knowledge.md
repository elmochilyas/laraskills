# 6-12 Adding New Shards

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-12 |
| Knowledge Unit Title | Adding New Shards |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.11 Shard splitting | 6.20 Consistent hashing |
| Last Updated | 2026-06-02 |

## Overview

Adding a new shard increases cluster capacity. The transition period requires double-writing to both old and new shards until data is fully redistributed. Consistent hashing minimizes data movement (only 1/N moves). Modulo sharding requires a full rehash (all data moves).

---

## Core Concepts

- **Double-write**: Every write goes to both old shard(s) and new shard for the duration of migration. Read from old shard until cutover.
- **Backfill**: Copy existing data from old shard to new shard. `INSERT ... SELECT` with batch processing. Rate-limited.
- **Cutover**: Update shard map to route reads to new shard. Stop double-writing.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Progressive migration**: Add one shard at a time. Monitor each addition before adding the next. Avoids cascading failures.
- **Reversible cutover**: Keep old shards active for 48 hours post-cutover. If issues detected, revert shard map to old shards.


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
| 1 | Adding multiple shards simultaneously**: Each new shard requires backfill from existing shards. Backfilling to 3 new shards simultaneously multiplies load. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Database Sharding & Horizontal Scaling
- **Closely Related**: Other KUs within Database Sharding & Horizontal Scaling
- **Closely Related**: 6.10 Shard rebalancing
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

