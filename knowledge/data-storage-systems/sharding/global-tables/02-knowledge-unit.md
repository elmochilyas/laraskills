# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.25 Global tables (replicated to all shards for JOIN support)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Global tables contain reference data replicated to every shard. Tables like `countries`, `categories`, `tax_rates` — small, rarely updated, frequently joined. Replicating to all shards enables local JOINs without cross-shard queries. Update propagation: application-level double-write, CDC (Debezium), or materialized cache.

---

# Core Concepts

- **What goes global**: Small tables (< 1000 rows), rarely updated, frequently joined with sharded tables. Lookup/reference data.
- **Replication method**: Write to one source, propagate to all shards. CDC via Kafka, application-level double-write, or scheduled refresh.
- **Consistency**: Global tables are eventually consistent across shards. Acceptable for reference data.

---

# Patterns

**Read from local shard, write to central**: Application reads global table from the local shard. Writes go to a central source that fans out to all shards.

**Cache-as-global-table**: Store reference data in Redis (cache). Each shard reads from Redis. No replication needed. Redis is the source of truth.

---

# Common Mistakes

**Treating large tables as global**: Tables with millions of rows should not be global. Replicating 10M rows to 16 shards wastes 160M rows of storage.

---

# Related Knowledge Units

6.8 Cross-shard joins | 6.13 Shard groups
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

