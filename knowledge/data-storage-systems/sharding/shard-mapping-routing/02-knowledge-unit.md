# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.5 Shard mapping and routing (service-side routing, proxy-level routing)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Shard routing determines which shard to query. Service-side routing: the application computes the shard (via hash/range/directory) and connects directly. Proxy-level routing: a middleware (ProxySQL, Vitess, pgcat) routes queries transparently. Service-side gives the application full control; proxy-level simplifies application code.

---

# Core Concepts

- **Service-side routing**: Application calls `shard = ShardRouter::getShard($userId)`, then `DB::connection('shard_'.$shard)->query(...)`. Explicit, testable.
- **Proxy-level routing**: Application connects to proxy as if it's a single database. Proxy parses queries, routes to correct shard. Vitess, ProxySQL, Spanner.
- **Connection management**: Service-side: N connections per request (fan-out). Proxy-level: one connection, proxy handles backend routing.

---

# Patterns

**Service-side for Laravel**: ShardRouter class with `connection()` method. Model trait overrides `getConnectionName()` based on shard key.

**Proxy-level for complex routing**: Vitess handles cross-shard queries, distributed transactions. Application code stays shard-unaware.

---

# Common Mistakes

**Hardcoded shard routing**: `if ($id < 1000000) { shard 1 }`. Brittle. Always use a routing class or lookup.

---

# Related Knowledge Units

6.2 Hash-based sharding | 6.4 Directory-based sharding | 6.14 Shard model traits
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

