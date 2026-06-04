# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.17 Read replica per shard (shard-level read scaling)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Each shard can have its own read replicas for read scaling within the shard. Write-heavy shards get more or larger replicas. Read replicas per shard provide shard-level read capacity independent of other shards. Combined: sharding for horizontal write scaling + replicas for read scaling.

---

# Core Concepts

- **Shard-level read replica**: Shard 1 has 2 replicas, Shard 2 has 1 replica, Shard 3 has 3 replicas (based on read load per shard).
- **Asymmetric replica count**: Hot shards get more replicas. Cold shards get fewer. More cost-effective than symmetric replicas.
- **Read routing per shard**: `ShardRouter::connection($shardId, 'read')` returns a random replica connection for that shard.

---

# Patterns

**Read replica config per shard**: `config('database.shards.1.read.host')` per shard. Route reads to replicas per shard.

**Replica lag monitoring per shard**: Each shard's replicas may have different lag. Route to replicas within acceptable lag threshold.

---

# Common Mistakes

**Same replica config for all shards**: Hot shards need more read capacity. Monitor per-shard replica lag and add replicas to hot shards.

---

# Related Knowledge Units

6.1 Shard key | 7.2 Read/write splitting | 7.10 Replica lag
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

