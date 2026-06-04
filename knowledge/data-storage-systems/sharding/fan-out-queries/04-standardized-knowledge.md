# 6-7 Fan Out Queries

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-7 |
| Knowledge Unit Title | Fan Out Queries |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.5 Shard routing | 6.16 Swoole/Octane coroutine dispatch |
| Last Updated | 2026-06-02 |

## Overview

Fan-out queries send the same query to all shards in parallel, then aggregate results. Required when the query doesn't include the shard key. Examples: admin reports, global search, cross-shard aggregations. Fan-out latency is determined by the slowest shard, not the average.

---

## Core Concepts

- **Parallel execution**: Query all shards concurrently (not sequentially). Use `Promise` combinators, `Swoole` coroutines, or `parallel` PHP extension.
- **Result aggregation**: Merge sorted lists, sum counts, combine sets. Error handling: tolerate partial shard failures.
- **Latency = max(shard_latency)**: One slow shard delays the entire fan-out. Implement timeout per shard.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Coroutine fan-out with Swoole/Octane**: `$responses = collect($shards)->map(fn($shard) => go(fn() => $query->on($shard)->get()))` — parallel execution.
- **Timeout per shard**: `try { $shard->query(... timeout 2s ...) } catch (TimeoutException) { log warning, continue }` — partial results.


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
| 1 | Sequential fan-out**: Query shard 1, wait, query shard 2, wait — N × latency. Always fan-out in parallel. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

