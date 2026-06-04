# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.15 Packages: allnetru/laravel-sharding (hash, range, db_range, redis strategies; Snowflake/sequence ID; coroutine fan-out)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

allnetru/laravel-sharding is the primary Laravel sharding package. Supports hash, range, db_range, and Redis-based sharding strategies. Includes Snowflake ID generation, database sequence ID generation, coroutine fan-out for Swoole/Octane, and event-based connection resolution. Covers most sharding use cases without custom infrastructure.

---

# Core Concepts

- **Strategies**: Hash (modulo, consistent), range (key ranges), db_range (range with dynamic shard discovery), Redis (shard map via Redis).
- **ID generation**: Snowflake (64-bit, timestamp+shard+sequence), database sequences (sequence per shard).
- **Fan-out**: Coroutine-aware fan-out with Swoole/Octane. `Sharding::fanOut(fn($shard) => $query->on($shard)->get())`.

---

# Patterns

**Package + custom shard proxy**: Use allnetru/laravel-sharding for application-level routing (model traits, fan-out). Add Vitess or ProxySQL for cross-shard query support.

**Strategies per model**: Different sharding strategies for different models. `Order` uses hash on `user_id`. `Log` uses range on `created_at`.

---

# Common Mistakes

**Package as silver bullet**: The package handles routing, but shard key selection, rebalancing, and cross-shard transaction avoidance require careful design. Package is a tool, not a solution.

---

# Related Knowledge Units

6.14 Shard model traits | 6.16 Swoole/Octane dispatch
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

