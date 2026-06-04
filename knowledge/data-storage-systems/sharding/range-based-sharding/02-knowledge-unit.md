# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.3 Range-based sharding (key ranges, predictable splits)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Range-based sharding assigns contiguous key ranges to each shard: shard 1 (users 1-1M), shard 2 (users 1M-2M), etc. Predictable, supports range scans within a shard, easy to split hot ranges. Risk of uneven distribution if ranges are poorly chosen.

---

# Core Concepts

- **Contiguous ranges**: Each shard owns a range of shard key values. `users.id BETWEEN 1 AND 1000000` goes to shard 1.
- **Range scan friendly**: `WHERE id BETWEEN 500 AND 600` targets a single shard. Hash-based sharding scatters the same query across all shards.
- **Hot range**: New users all go to the last shard (monotonically increasing key). Write-heavy shard while others are idle.

---

# Patterns

**Date range sharding**: `orders_2024_01`, `orders_2024_02`. Natural data lifecycle. Can archive old shards. Hot shard on current month.

**ID range with pre-splitting**: Estimate growth, pre-allocate ranges with 20% headroom. Reduces split frequency.

---

# Common Mistakes

**Monotonically increasing key without mitigation**: All new writes go to the last shard. Hot shard on the highest-range shard. Combine with hash to distribute.

---

# Related Knowledge Units

6.1 Shard key | 6.2 Hash-based sharding | 6.10 Shard rebalancing
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

