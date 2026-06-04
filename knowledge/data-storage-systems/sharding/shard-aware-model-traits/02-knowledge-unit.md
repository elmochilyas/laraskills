# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.14 Shard-aware model traits (getConnectionName, Shardable)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Shard-aware Eloquent models automatically route queries to the correct shard based on the model's shard key. Override `getConnectionName()` to return the correct shard connection. A `Shardable` trait encapsulates routing logic, shard key extraction, and connection resolution.

---

# Core Concepts

- **getConnectionName()**: Eloquent method that returns the connection name. Override: `public function getConnectionName() { return 'shard_'.$this->shard(); }`. Called on every query.
- **Shardable trait**: Provides `shard()`, `connection()`, `scopeOnShard()`. Models using the trait automatically route.
- **Shard key attribute**: The model attribute used for routing: `$this->user_id`, `$this->tenant_id`. Trait reads it.

---

# Patterns

**Trait with caching**: Cache the shard ID for the model's key. `shard()` method checks cache first, computes on miss.

**Global scope for shard filtering**: Add a global scope to filter by shard key on all queries. Redundant with shard routing but provides defense-in-depth.

---

# Common Mistakes

**Not overriding getConnectionName on relationships**: Related models may not use the same shard connection. Ensure related models share the shard connection or handle cross-shard explicitly.

---

# Related Knowledge Units

6.5 Shard routing | 6.13 Shard groups | 6.15 Sharding packages
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

