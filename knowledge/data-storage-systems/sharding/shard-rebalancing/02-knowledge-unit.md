# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.10 Shard rebalancing: data movement, downtime vs. online migration
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Shard rebalancing moves data between shards when the cluster is unbalanced (one shard has 40% of data) or when shards are added/removed. Approaches: offline (downtime, simpler), online (no downtime, complex). Online rebalancing uses double-write + backfill + cutover or consistent hashing with virtual bucket migration.

---

# Core Concepts

- **Offline rebalancing**: Stop writes, dump all data, reload with new shard config. Simple but requires downtime proportional to data volume.
- **Online rebalancing (double-write)**: Write new data to both old and new shard. Backfill existing data. Atomic cutover via shard map update. No downtime.
- **Virtual bucket migration**: Move buckets (not individual keys) between physical shards. Less granular but simpler than per-key migration.

---

# Patterns

**Online rebalance workflow**: (1) Add new shard. (2) Start double-writing. (3) Backfill existing data to new shard. (4) Verify consistency. (5) Update shard map. (6) Stop double-writing. (7) Clean up old data.

**Rate-limited migration**: Move 10K keys per batch. Monitor replication lag, error rates. Pause if any threshold exceeded.

---

# Common Mistakes

**Unbounded rebalance time**: Rebalancing 100GB over a slow network takes hours. Monitor progress, estimate completion time, communicate with stakeholders.

---

# Related Knowledge Units

6.11 Shard splitting | 6.12 Adding new shards | 6.20 Consistent hashing
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

