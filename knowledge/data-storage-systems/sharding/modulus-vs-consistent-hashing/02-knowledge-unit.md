# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.20 Modulus vs. consistent hashing for rebalancing efficiency
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Modulus sharding (`hash(key) % N`) moves all keys when N changes. Consistent hashing moves only 1/N of keys (expected). For elastic sharding (adding/removing shards over time), consistent hashing is orders of magnitude more efficient. For fixed shard count, modulo is simpler and equally effective.

---

# Core Concepts

- **Modulus movement on resize**: Going from 4 to 5 shards: every key's `hash % 4 ≠ hash % 5`. All keys must move. 100% data migration.
- **Consistent hashing movement**: Adding shard 5 to a 4-shard ring: each of the 4 existing shards gives up ~20% of its keys. Total: 25% of keys move.
- **Virtual nodes**: Each physical shard represented by multiple virtual nodes on the ring. Better distribution, finer-grained rebalancing.

---

# Patterns

**Modulo for fixed shard count**: If shard count is fixed (e.g., 16 shards, never changes), modulo is simpler and has no rebalancing overhead.

**Consistent hashing for elastic clusters**: If shard count will grow over time (start with 4, grow to 32), consistent hashing minimizes per-operation data movement.

---

# Common Mistakes

**Choosing modulus with plans to expand**: The first shard addition moves 100% of data. Expensive and risky. Use consistent hashing.

---

# Related Knowledge Units

6.2 Hash-based sharding | 6.10 Shard rebalancing | 6.12 Adding new shards
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

