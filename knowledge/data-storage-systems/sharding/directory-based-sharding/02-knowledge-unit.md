# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.4 Directory-based sharding (lookup table, flexible but extra hop)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Directory-based sharding uses a lookup table (shard map) to track which keys are on which shard. Most flexible — keys can move between shards without changing the shard key. Adds a lookup hop for every query. The lookup table itself must be highly available and low-latency.

---

# Core Concepts

- **Shard map table**: `shard_map(key_hash, shard_id, created_at)`. Query: `SELECT shard_id FROM shard_map WHERE key_hash = ?`. Route query to that shard.
- **Extra hop overhead**: Every query requires a lookup. Cache the shard map aggressively (Redis, local cache).
- **Flexible rebalancing**: Move a key from shard 1 to shard 2 by updating the shard map. No data movement needed at the map level (data still moves).

---

# Patterns

**Cache-backed shard map**: Redis hash `shard:map` stores key→shard_id mapping. Cache hit avoids database lookup. Invalidate on rebalance.

**Shard map in application memory**: Load entire shard map at boot (small: < 1MB for 100K entries). Fastest lookup.

---

# Common Mistakes

**Uncached shard map lookup**: Every query hits the shard map database. 2x database load (lookup + actual query). Always cache.

---

# Related Knowledge Units

6.5 Shard mapping | 6.1 Shard key selection
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

