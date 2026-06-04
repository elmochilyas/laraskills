# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.18 Shard-level backups, monitoring, and observability
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Each shard is an independent database that needs independent backup, monitoring, and observability. Per-shard backup schedules, per-shard metrics (CPU, IOPS, connections, query latency), and per-shard alerting. Dashboard aggregates shard-level metrics into a cluster view.

---

# Core Concepts

- **Per-shard backup**: Each shard's database backed up independently. Restore per shard without affecting other shards.
- **Per-shard monitoring**: Track shard-specific metrics: query latency P50/P95/P99, connection count, replication lag, storage usage.
- **Cluster dashboard**: Aggregate view: shard count, total data size, per-shard utilization heatmap, hot shard alerts.

---

# Patterns

**Backup scheduling per shard tier**: Write-heavy shards: hourly snapshots. Archive shards: daily snapshots. Consistent with shard importance.

**Shard health check**: Automated probe queries on each shard. Fail if query doesn't return within threshold. Alert on shard failure.

---

# Common Mistakes

**Monitoring shards as a single entity**: Average latency looks fine but one hot shard has 5s P99. Monitor per-shard metrics. Aggregate for cluster view.

---

# Related Knowledge Units

6.10 Shard rebalancing | 6.17 Read replica per shard
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

