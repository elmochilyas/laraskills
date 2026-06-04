# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** multi-region-clickhouse
**Difficulty:** Advanced
**Category:** Distributed Systems
**Last Updated:** 2026-06-03

---

# Overview

Multi-region ClickHouse deployments address two requirements: disaster recovery (survive region failure) and data locality (serve analytics close to users). ClickHouse's architecture supports two forms of distribution: **Replication** (copy data across nodes for HA) via `ReplicatedMergeTree` engine with `Keeper` coordination, and **Sharding** (distribute data across nodes for scale) via `Distributed` table with cluster configuration.

Multi-region adds latency, consistency, and conflict-resolution challenges that single-region deployments don't face. Cross-region replication introduces network latency for INSERTs, and query routing must consider data locality.

Engineers must care because analytics availability requirements are increasing. Users expect dashboards to be available even when an AWS region fails. ClickHouse's native replication makes multi-region achievable, but the configuration is non-trivial and has material tradeoffs.

---

# Core Concepts

## ReplicatedMergeTree

A MergeTree variant that automatically replicates data to ClickHouse nodes in different regions. Uses `ClickHouse Keeper` (or ZooKeeper) for coordination. INSERTs must be acknowledged by all replicas or a configurable quorum.

## ClickHouse Keeper

A lightweight coordination service (replacement for ZooKeeper). In multi-region setups, Keeper must be deployed across regions for fault tolerance. Keeper latency between regions affects insert throughput.

## Distributed Table

A table that provides a unified view across multiple shards. Queries are sent to all shards in parallel. Results are merged on the querying node. Distributed tables do not store data — they are query routers.

## Shard

A horizontal partition of data. Each shard contains a subset of the data. Shards can be replicated for HA. The number of shards determines the parallelism for queries.

---

# When To Use

- Applications serving users in multiple geographic regions
- Disaster recovery requirements with RPO < 1 hour
- Analytics systems that must survive region-level outages
- Wear-close-to-users for read-heavy analytics workloads
- Compliance requirements for data residency in specific regions

---

# When NOT To Use

- Single-region applications with no DR requirements
- Small data volumes that fit on one server
- Applications that can tolerate hours of downtime for DR
- Teams without dedicated ClickHouse operational expertise

---

# Best Practices

## Co-located Keeper

Deploy ClickHouse Keeper nodes in the same regions as ClickHouse nodes. Keeper latency directly impacts INSERT throughput. Cross-region Keeper quorums add 50-200ms to every INSERT.

## Asynchronous Replication Default

Use asynchronous replication for cross-region setups. Synchronous replication across regions adds unacceptable latency to INSERTs. Accept that recent data may be lost in a region failure (RPO = seconds to minutes).

## Read from Local Shards

Route read queries to the local region's replicas. Use `Distributed` table with `prefer_localhost_replica = 1` to avoid cross-region query traffic.

---

# Architecture Guidelines

## Replication Topology

Each shard should have 2-3 replicas distributed across availability zones within a region. For cross-region DR, add one replica per region. Example: 2 shards × 3 replicas (2 in primary region, 1 in DR region).

## Query Routing

Application → Local ClickHouse → Distributed Table (local first) → Local replicas. If local replicas are unavailable, query cross-region replicas.

## Data Locality

User-specific analytics data should be sharded by user region. EU users' data lives on EU shards. US users' data on US shards. This enables wear-close-to-users for reads and reduces cross-region query traffic.

---

# Performance Considerations

- Cross-region INSERT: 50-200ms added latency per insert for asynchronous replication.
- Cross-region query: 50-500ms added latency for query execution and result transfer.
- Keeper latency: Keeper quorum across regions adds latency to every DDL operation.
- Shard count: More shards increase query parallelism but add coordination overhead.
- Replication lag: Typically 1-5 seconds for cross-region async replication.

---

# Security Considerations

- Cross-region replication data travels over public internet unless using private networking.
- Use TLS for inter-node ClickHouse communication.
- Keeper communication should be on a private network.
- Data residency compliance: ensure data does not leave the designated region.
- Set up firewall rules between regions to restrict ClickHouse access.

---

# Common Mistakes

## Mistake: Synchronous Cross-Region Replication

Configuring `insert_quorum` across regions. Every INSERT takes 200ms+ waiting for cross-region acknowledgment. Insert throughput drops to 5/sec.

**Better approach:** Use async replication for cross-region. Configure quorum only for intra-region replicas.

## Mistake: Single Keeper Cluster

Running one Keeper cluster across all regions. The Keeper quorum requires cross-region communication for every operation. Latency is high and availability is limited by the slowest region.

**Better approach:** Deploy Keeper within each region. Use separate Keeper clusters per region.

## Mistake: No Query Locality

Reading from the Distributed table without preferring local replicas. Queries are routed to remote shards unnecessarily, adding latency.

**Better approach:** Configure `prefer_localhost_replica = 1` on Distributed tables. Route queries to local replicas first.

---

# Anti-Patterns

## Too Many Shards
Creating 100+ shards for a table with 10M rows/month. Query parallelism is high but each shard has only 100K rows. The overhead of distributing and merging queries exceeds the benefit.

**Solution:** Right-size shard count. Each shard should have 50M-500M rows for optimal performance.

## Uneven Shard Distribution
Sharding by `cityHash64(user_id) % shard_count` without considering user distribution. If one region has 80% of users, its shard is overloaded while other shards are idle.

**Solution:** Use consistent hashing or weighted sharding based on expected data distribution.

## Ignoring Replication Lag Monitoring
Cross-region async replication lag is not monitored. A network issue causes replication to fall 6 hours behind. The DR region has data that is 6 hours old when the primary fails.

**Solution:** Monitor `system.replicas` for replication lag. Alert when lag exceeds the target RPO.

## No Disaster Recovery Plan
Multi-region replication is configured but never tested. When the primary region fails, the team discovers that the DR region's Distributed table points at the now-unavailable primary shards.

**Solution:** Test failover regularly. Document and automate the failover process.
