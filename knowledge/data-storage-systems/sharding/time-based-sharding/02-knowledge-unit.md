# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.21 Time-based sharding (partition by time period, natural data lifecycle)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Time-based sharding partitions data by time ranges: one shard per month, quarter, or year. Natural fit for time-series data, logs, events. Old shards can be archived, compressed, or dropped. Hot shard is always the current time period. Writes are not evenly distributed — current shard gets all writes.

---

# Core Concepts

- **Time range per shard**: `shard_2024_q1`, `shard_2024_q2`, etc. Each shard holds data for a time interval.
- **Hot current shard**: All writes go to the current shard. Other shards are read-only (historical data).
- **Archival lifecycle**: After N months, move old shard to cold storage. After N years, drop.

---

# Patterns

**Time + hash hybrid**: Shard by `(year_month, hash(user_id) % 4)`. Distributes writes within the current month across 4 shards. Hot shard is a group of shards.

**Pre-creation of future shards**: Create shards for the next 6 months in advance. Automated provisioning.

---

# Common Mistakes

**Single shard per month for write-heavy workloads**: Current month's shard handles 100% of writes. If write volume is high, add hash-based sub-sharding.

---

# Related Knowledge Units

8.1 Table partitioning | 6.1 Shard key | 6.22 Shard vs partition distinction
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

