# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.7 Fan-out queries (broadcast to all shards, aggregate results)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Fan-out queries send the same query to all shards in parallel, then aggregate results. Required when the query doesn't include the shard key. Examples: admin reports, global search, cross-shard aggregations. Fan-out latency is determined by the slowest shard, not the average.

---

# Core Concepts

- **Parallel execution**: Query all shards concurrently (not sequentially). Use `Promise` combinators, `Swoole` coroutines, or `parallel` PHP extension.
- **Result aggregation**: Merge sorted lists, sum counts, combine sets. Error handling: tolerate partial shard failures.
- **Latency = max(shard_latency)**: One slow shard delays the entire fan-out. Implement timeout per shard.

---

# Patterns

**Coroutine fan-out with Swoole/Octane**: `$responses = collect($shards)->map(fn($shard) => go(fn() => $query->on($shard)->get()))` — parallel execution.

**Timeout per shard**: `try { $shard->query(... timeout 2s ...) } catch (TimeoutException) { log warning, continue }` — partial results.

---

# Common Mistakes

**Sequential fan-out**: Query shard 1, wait, query shard 2, wait — N × latency. Always fan-out in parallel.

---

# Related Knowledge Units

6.5 Shard routing | 6.16 Swoole/Octane coroutine dispatch
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

