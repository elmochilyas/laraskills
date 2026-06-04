# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.8 Cross-shard join limitations (alternative: denormalization, application-level joins)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Database joins across shards are not possible. Data for a join lives on different physical servers. Solutions: force co-location (same shard key), denormalize data, perform application-level joins (N+1 across shards), or use Vitess/Spanner (distributed query engine). The shard key choice determines which joins are possible.

---

# Core Concepts

- **Shard key = join key**: If both tables are sharded by `user_id`, a join on `user_id` stays within a shard. Works.
- **Cross-shard join**: Table A sharded by `user_id`, Table B sharded by `order_id`. Join on `user_id` requires fan-out.
- **Denormalization**: Store joined data in the same table/shard. Reduces join needs at the cost of data redundancy.

---

# Patterns

**Shard groups**: Tables sharing the same shard key are co-located on the same shard. Joins on shard key work.

**Application-level join**: Query shards for parent rows, collect IDs, fan-out to query related rows, assemble in PHP.

---

# Common Mistakes

**Designing joins without considering shard key**: If `orders` and `users` have different shard keys, joining them requires full fan-out. Pick a shared shard key.

---

# Related Knowledge Units

6.1 Shard key | 6.7 Fan-out queries | 6.13 Shard groups
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

