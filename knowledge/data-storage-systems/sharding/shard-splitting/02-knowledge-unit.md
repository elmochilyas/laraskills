# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.11 Shard splitting (hot shard detected, split into smaller shards)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

A hot shard receives disproportionate traffic or holds too much data. Split it into two or more shards. Range-based: split the key range. Hash-based: increase virtual bucket resolution or change shard count. Split is a form of rebalancing — double-write + backfill + cutover.

---

# Core Concepts

- **Detection**: Monitor per-shard CPU, IOPS, query latency, storage. Shard exceeding 70% of any resource metric is a candidate for split.
- **Range split**: Shard owning keys 1M-2M splits into shard A (1M-1.5M) and shard B (1.5M-2M). Update range map.
- **Hash split**: Add shard N+1. Consistent hashing redistributes 1/N of keys. Requires rebalancing.

---

# Patterns

**Automated split trigger**: Monitor shard metrics. If a shard exceeds threshold for N minutes, queue split job. Notify ops team.

**Split plan**: (1) Identify split point (median key value or usage boundary). (2) Create new shard. (3) Double-write. (4) Backfill. (5) Cutover.

---

# Common Mistakes

**Manual split during peak hours**: Splitting adds load (backfill queries). Schedule during low-traffic windows.

---

# Related Knowledge Units

6.10 Shard rebalancing | 6.12 Adding new shards | 6.24 Hot shard mitigation
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

