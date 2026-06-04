# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.24 Hot shard mitigation (split, move tenants, rebalance)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Hot shard receives disproportionate load (e.g., a viral tenant on a multi-tenant shard). Mitigation: split the shard (smaller ranges), move hot keys to a less loaded shard, or rebalance the entire cluster. Detection via per-shard CPU, IOPS, and connection monitoring. Mitigation must be automated or at least scripted.

---

# Core Concepts

- **Causes**: Poor shard key distribution, viral user/tenant on one shard, time-based shard on current period.
- **Split**: Divide the hot shard's range into two shards. Reduces per-shard load by half.
- **Move keys**: Relocate specific hot keys (e.g., viral tenant) to a dedicated shard. Requires double-write + cutover.

---

# Patterns

**Automated detection → alert → action**: Monitor per-shard metrics. If any metric > 80% for 10 minutes, alert. If > 95% for 5 minutes, auto-split or move.

**Whale tenant to dedicated shard**: A tenant consuming 30% of a shard's resources should move to its own shard. Prevents impact on other tenants.

---

# Common Mistakes

**Ignoring hot shard until it fails**: Hot shard degrades gradually. Alert at 70%, plan mitigation at 80%, execute at 90%. Don't wait for 100%.

---

# Related Knowledge Units

6.11 Shard splitting | 6.10 Shard rebalancing
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

