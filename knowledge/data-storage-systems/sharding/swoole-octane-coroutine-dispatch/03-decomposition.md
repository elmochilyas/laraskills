# Decomposition: 6.16 Swoole/Octane coroutine-aware shard dispatching

## Topic Overview
Swoole and Laravel Octane enable coroutine-based parallel shard queries. Fan-out queries to all shards execute concurrently in coroutines, reducing total latency to the slowest shard (not the sum of all shards). Each coroutine establishes its own database connection.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-16-swoole-octane-coroutine-dispatch/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.16 Swoole/Octane coroutine-aware shard dispatching
- **Purpose:** Swoole and Laravel Octane enable coroutine-based parallel shard queries. Fan-out queries to all shards execute concurrently in coroutines, reducing total latency to the slowest shard (not the sum of all shards).
- **Difficulty:** Advanced
- **Dependencies:** 6.7 Fan-out queries, 6.15 Sharding packages

## Dependency Graph
**Depends on:** "6.7 Fan-out queries", "6.15 Sharding packages"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Coroutine fan-out**: `$results = collect($shards)->map(fn($shard) => go(fn() => DB::connection('shard_'.$shard)->table('orders')->get()))` — each shard query runs in a separate coroutine.; - **Connection per coroutine**: Each coroutine needs its own database connection. Shared connections would block. Octane's connection pool handles this.; - **Channel aggregation**: Use Swoole channels to collect results: `$chan = new Chan(count($shards)); foreach ($shards as $s) { go(fn() => $chan->push(...)); }`..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization