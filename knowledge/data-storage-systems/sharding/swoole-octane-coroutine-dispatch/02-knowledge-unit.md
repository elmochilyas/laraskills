# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.16 Swoole/Octane coroutine-aware shard dispatching
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Swoole and Laravel Octane enable coroutine-based parallel shard queries. Fan-out queries to all shards execute concurrently in coroutines, reducing total latency to the slowest shard (not the sum of all shards). Each coroutine establishes its own database connection. Coroutine-aware shard dispatching is essential for low-latency fan-out.

---

# Core Concepts

- **Coroutine fan-out**: `$results = collect($shards)->map(fn($shard) => go(fn() => DB::connection('shard_'.$shard)->table('orders')->get()))` — each shard query runs in a separate coroutine.
- **Connection per coroutine**: Each coroutine needs its own database connection. Shared connections would block. Octane's connection pool handles this.
- **Channel aggregation**: Use Swoole channels to collect results: `$chan = new Chan(count($shards)); foreach ($shards as $s) { go(fn() => $chan->push(...)); }`.

---

# Patterns

**Octane + shard trait**: Shardable trait's `scopeAll` method fans out to all shards using coroutines. Returns merged collection.

**Timeout per coroutine**: `go(function() use ($shard, $timeout) { $result = $shard->query()->timeout($timeout)->get(); })` — prevents one slow shard from blocking the fan-out.

---

# Common Mistakes

**Sequential shard queries in Octane**: Octane doesn't automatically parallelize queries. You must explicitly use coroutines for parallel execution.

---

# Related Knowledge Units

6.7 Fan-out queries | 6.15 Sharding packages
## Ecosystem Usage

Horizontal sharding in Laravel is less common than single-node strategies. Custom implementations handle shard routing. Vitess provides proxy-based MySQL sharding. Citus enables distributed PostgreSQL.

## Failure Modes

Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Performance Considerations

Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must account for total connections across shards.

## Production Considerations

Pre-sharding vs progressive sharding tradeoff. Consistent hashing minimizes data movement. Global tables must be replicated to all shards. Monitor per-shard load.

## Research Notes

Vitess adoption grows for MySQL sharding. Citus/PostgreSQL is the leading open-source distributed SQL. Most Laravel applications outgrow single-node before reaching sharding scale.

## Internal Mechanics

Hash-based routing: shard = hash(key) mod N. Directory-based routing uses a lookup table. Range-based assigns key ranges to shards.

## Architectural Decisions

Hash sharding for even distribution (full remap on N change). Range sharding for efficient range scans (range splitting needed). Directory sharding for flexible routing (simple remap).

## Tradeoffs

Benefit: Horizontal scaling. Cost: Query complexity. Benefit: Independent failures. Cost: Cross-shard join impossible. Benefit: Cost-effective scaling. Cost: Operational complexity.

## Mental Models

Sharding is horizontal partitioning across servers. Each shard is an independent database. The shard key determines data locality.

