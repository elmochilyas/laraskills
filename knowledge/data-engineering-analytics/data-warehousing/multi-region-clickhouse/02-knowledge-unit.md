# Multi-Region ClickHouse

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** multi-region-clickhouse
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Multi-region ClickHouse deployments address disaster recovery and data locality requirements through ReplicatedMergeTree (replication) and Distributed tables (sharding). Cross-region deployments introduce latency, consistency, and conflict-resolution challenges absent in single-region setups — replication lag, Keeper coordination latency, and query routing must be carefully managed to balance availability with performance.

---

## Core Concepts

- **ReplicatedMergeTree:** Automatically replicates data to ClickHouse nodes in different regions — uses ClickHouse Keeper (or ZooKeeper) for coordination — INSERTs must be acknowledged by quorum of replicas
- **ClickHouse Keeper:** Lightweight coordination service replacing ZooKeeper — in multi-region setups, Keeper must be deployed across regions for fault tolerance — Keeper latency between regions affects insert throughput
- **Distributed Table:** Provides unified view across multiple shards — queries sent to all shards in parallel, results merged on querying node — does not store data, acts as query router
- **Shard:** Horizontal partition of data — each shard contains a subset of data — can be replicated for HA — number of shards determines query parallelism

---

## Mental Models

- **Regions as Data Centers in Different Cities:** Each region is a fully-staffed office that can operate independently. Replication is like sending daily reports between offices. Sharding is like splitting customers by region — EU customers handled by London office, US customers by New York. If London goes down, New York has backup copies.
- **Keeper as Traffic Controller:** ClickHouse Keeper is the air traffic controller — it coordinates which planes (data) land where and when. Cross-region Keeper communication is like air traffic controllers in different cities talking to each other — useful but adds delay.

---

## Internal Mechanics

Each shard has 2-3 replicas distributed across availability zones within a region, with an additional replica in a DR region. ReplicatedMergeTree uses Keeper to coordinate data replication. On INSERT, the data is written to all replicas (synchronous intra-region, asynchronous cross-region). Distributed tables route queries: application → local ClickHouse → Distributed table (local first) → local replicas. If local replicas are unavailable, queries route to cross-region replicas. Keeper maintains metadata about which replicas are current and coordinates failover decisions.

---

## Patterns

- **Co-located Keeper:** Deploy ClickHouse Keeper nodes in the same regions as ClickHouse nodes — Keeper latency directly impacts INSERT throughput
- **Asynchronous Replication Default:** Use async replication for cross-region — synchronous across regions adds unacceptable INSERT latency — accept RPO of seconds to minutes
- **Read from Local Shards:** Route read queries to local region's replicas — use `prefer_localhost_replica = 1` on Distributed tables to avoid cross-region query traffic

---

## Architectural Decisions

Use 2 shards × 3 replicas topology (2 in primary region, 1 in DR region) for most deployments. Shard user-specific data by region for data locality. Use async replication for cross-region with synchronous quorum only for intra-region replicas. Deploy Keeper within each region with separate clusters rather than one cross-region Keeper cluster.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Region-level disaster recovery | Cross-region INSERT latency: 50-200ms | Async replication mitigates for writes |
| Data locality for read-heavy workloads | Query routing complexity | Must configure `prefer_localhost_replica` |
| Linear scaling via sharding | Shard management overhead | Right-size shards: 50M-500M rows each |
| Keeper enables automated failover | Keeper latency impacts DDL operations | Separate Keeper clusters per region |

---

## Performance Considerations

Cross-region INSERT: 50-200ms added latency for async replication. Cross-region query: 50-500ms added latency. Keeper latency: Keeper quorum across regions adds latency to every DDL operation. Replication lag: typically 1-5 seconds for cross-region async replication.

---

## Production Considerations

Cross-region replication data travels over public internet unless using private networking — use TLS for inter-node ClickHouse communication. Keeper communication should be on a private network. Ensure data does not leave designated region for compliance. Set up firewall rules between regions to restrict ClickHouse access.

---

## Common Mistakes

- **Synchronous Cross-Region Replication:** Configuring `insert_quorum` across regions — every INSERT takes 200ms+ waiting for cross-region acknowledgment, insert throughput drops to 5/sec. Better: use async replication for cross-region, quorum only intra-region.
- **Single Keeper Cluster:** One Keeper cluster across all regions — requires cross-region communication for every operation. Better: deploy Keeper within each region, separate clusters per region.
- **No Query Locality:** Reading from Distributed table without preferring local replicas — queries routed to remote shards unnecessarily. Better: configure `prefer_localhost_replica = 1`.

---

## Failure Modes

- **Too Many Shards:** 100+ shards for a table with 10M rows/month — overhead of distributing and merging queries exceeds benefit. Mitigation: right-size shards — 50M-500M rows each for optimal performance.
- **Uneven Shard Distribution:** Sharding by hash without considering user distribution — one region's shard overloaded while others idle. Mitigation: use consistent hashing or weighted sharding.
- **Ignoring Replication Lag Monitoring:** Cross-region async replication lag not monitored — network issue causes 6-hour lag, DR region has 6-hour-old data when primary fails. Mitigation: monitor `system.replicas` for replication lag, alert when exceeds RPO.

---

## Ecosystem Usage

Multi-region ClickHouse is configured at the infrastructure level, not in Laravel application code. The `laravel-clickhouse` driver connects to the local ClickHouse node (or Distributed table endpoint). Application-level configuration involves specifying the correct ClickHouse connection endpoint per region. Connection failover is typically handled at the load balancer or DNS level.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — Base engine for ReplicatedMergeTree
- ClickHouse Codecs — Storage optimization across replicated nodes

### Related Topics
- Self-Hosted Analytics Platforms — Multi-region deployment of analytics platforms
- Warehouse Cost Optimization — Cross-region data transfer costs

### Advanced Follow-up Topics
- Kafka CDC — Cross-region CDC for synchronized analytics
- ClickHouse Materialized Views — MV behavior in replicated environments

---

## Research Notes

Multi-region ClickHouse deployments are becoming more common as analytics availability requirements increase. The key insight is that async replication for cross-region is the pragmatic choice — synchronous replication across regions adds unacceptable latency for most workloads. Monitoring replication lag and testing failover processes regularly are the most critical operational practices.
