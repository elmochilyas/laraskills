# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.1 Shard key selection principles (high cardinality, even distribution, query alignment)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Shard key is the single most important decision in sharding. A good shard key has high cardinality, distributes data evenly across shards, and aligns with the most frequent query patterns. A bad shard key creates hot shards, uneven data distribution, and fan-out queries on every read.

---

# Core Concepts

- **High cardinality**: Many unique values. `user_id` is high cardinality (millions of values). `status` is low cardinality (few values) — terrible shard key.
- **Even distribution**: Each shard holds roughly equal data volume and throughput.
- **Query alignment**: Most queries include the shard key in WHERE clause. Queries without shard key require fan-out to all shards.

---

# Patterns

**user_id or tenant_id**: Good shard key for most SaaS apps. High cardinality, included in most queries, distributes evenly.

**Composite shard key**: `(tenant_id, user_id)` — queries can target a single shard if they include tenant_id. Within a tenant, data is collocated.

**Avoid date-only shard key**: `created_at` as sole shard key causes hot shard (all writes to current date's shard). Use hash or user-based key.

---

# Common Mistakes

**Changing shard key after production**: Shard key change requires full data re-shard. Pick carefully; changes are extremely expensive.

---

# Related Knowledge Units

6.2 Hash-based sharding | 6.3 Range-based sharding | 6.13 Shard groups
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

