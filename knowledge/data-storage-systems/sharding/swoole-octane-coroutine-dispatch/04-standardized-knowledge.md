# 6-16 Swoole Octane Coroutine Dispatch

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-16 |
| Knowledge Unit Title | Swoole Octane Coroutine Dispatch |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.7 Fan-out queries | 6.15 Sharding packages |
| Last Updated | 2026-06-02 |

## Overview

Swoole and Laravel Octane enable coroutine-based parallel shard queries. Fan-out queries to all shards execute concurrently in coroutines, reducing total latency to the slowest shard (not the sum of all shards). Each coroutine establishes its own database connection. Coroutine-aware shard dispatching is essential for low-latency fan-out.

---

## Core Concepts

- **Coroutine fan-out**: `$results = collect($shards)->map(fn($shard) => go(fn() => DB::connection('shard_'.$shard)->table('orders')->get()))` — each shard query runs in a separate coroutine.
- **Connection per coroutine**: Each coroutine needs its own database connection. Shared connections would block. Octane's connection pool handles this.
- **Channel aggregation**: Use Swoole channels to collect results: `$chan = new Chan(count($shards)); foreach ($shards as $s) { go(fn() => $chan->push(...)); }`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Octane + shard trait**: Shardable trait's `scopeAll` method fans out to all shards using coroutines. Returns merged collection.
- **Timeout per coroutine**: `go(function() use ($shard, $timeout) { $result = $shard->query()->timeout($timeout)->get(); })` — prevents one slow shard from blocking the fan-out.


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
| 1 | Sequential shard queries in Octane**: Octane doesn't automatically parallelize queries. You must explicitly use coroutines for parallel execution. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

