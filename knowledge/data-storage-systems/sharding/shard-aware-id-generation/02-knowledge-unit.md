# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.6 Shard-aware ID generation (Snowflake, database sequences, UUID v7)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Globally unique, ordered IDs that encode the shard or are shard-predictable are essential for sharded systems. Sequence-based IDs require coordination across shards. Snowflake IDs encode timestamp + shard ID + sequence. UUID v7 (time-ordered) provides global uniqueness without coordination. The ID strategy determines whether a lookup is needed to find the shard.

---

# Core Concepts

- **Snowflake**: 64-bit ID: timestamp (41 bits) + shard ID (10 bits) + sequence (12 bits). Shard ID encoded in the ID — no lookup needed to route.
- **UUID v7**: Time-ordered UUID. Monotonically increasing. Globally unique. Does not encode shard ID — requires shard map lookup.
- **Database sequence**: `auto_increment` per shard with offset: shard 1 (1, 5, 9...), shard 2 (2, 6, 10...). Simple but limited.

---

# Patterns

**Snowflake for embedded shard routing**: Decode shard ID from ID to route queries. No extra lookup. Most efficient.

**UUID v7 for global uniqueness**: No coordination between shards. Use with directory-based routing (shard map cache).

---

# Common Mistakes

**auto_increment across shards**: Two shards may generate the same ID. Always use shard-aware sequences or global ID generators.

---

# Related Knowledge Units

6.1 Shard key | 6.4 Directory-based sharding | 6.5 Shard routing
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

