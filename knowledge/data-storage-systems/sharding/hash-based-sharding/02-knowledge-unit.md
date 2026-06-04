# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.2 Hash-based sharding (consistent hashing, modulo ring, virtual buckets)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Hash-based sharding maps each row to a shard by hashing the shard key. `shard = hash(key) % N`. Consistent hashing reduces data movement when adding/removing shards (only 1/N of keys move instead of all). Most common sharding strategy for evenly distributed workloads.

---

# Core Concepts

- **Modulo sharding**: `shard_id = crc32(user_id) % 4`. Simple, but adding shard 5 changes the mapping for every key (all data must move).
- **Consistent hashing**: Keys map to a ring. Each shard owns a range of the ring. Adding a shard splits one range; only 1/N of keys move.
- **Virtual buckets**: Divide key space into many virtual buckets (e.g., 4096). Map buckets to physical shards. Rebalancing moves buckets, not individual keys.

---

# Patterns

**Modulo for fixed shard count**: Use when shard count is fixed and unlikely to change. Simple and efficient.

**Consistent hashing for elastic sharding**: Use when shard count will grow over time. Less data movement during rebalance.

---

# Common Mistakes

**Modulo for dynamic shard count**: Adding one shard changes every key's shard. Requires full re-shard. Use consistent hashing if shard growth is expected.

---

# Related Knowledge Units

6.1 Shard key selection | 6.20 Modulus vs consistent hashing
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

