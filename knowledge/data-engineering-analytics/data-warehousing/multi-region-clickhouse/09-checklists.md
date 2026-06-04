# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** multi-region-clickhouse
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] ReplicatedMergeTree engine configured for multi-region high availability
- [ ] ClickHouse Keeper (or ZooKeeper) cluster provisioned for replication coordination
- [ ] Distributed table configured for cross-region query routing
- [ ] Sharding key chosen to balance data distribution and query locality
- [ ] Cluster configuration defines shards and replicas across regions
- [ ] Multi-region latency, consistency, and conflict-resolution challenges addressed

---

# Architecture Checklist

- [ ] ReplicatedMergeTree for each table with replication factor per region
- [ ] ClickHouse Keeper cluster sized for replication metadata (3 or 5 nodes recommended)
- [ ] Distributed table for cross-shard queries across all regions
- [ ] Sharding key chosen for data locality (events shard by region to minimize cross-region queries)
- [ ] Each shard has at least one replica in primary region, async replica in standby region
- [ ] Projections/MVs created independently on each shard (K031 integration)

---

# Implementation Checklist

- [ ] ReplicatedMergeTree ENGINE with ZooKeeper path per table for replication
- [ ] ClickHouse Keeper nodes deployed in odd quorum (3 or 5) across availability zones
- [ ] Distributed table defined with cluster name and sharding key expression
- [ ] Shard definition in config.xml or remote_servers.xml for each region
- [ ] Engine argument format: ReplicatedMergeTree('/clickhouse/tables/{shard}/{table}', '{replica}')
- [ ] HTTP vs TCP driver considerations for multi-region connection latency (K032)

---

# Performance Checklist

- [ ] Cross-region replication latency measured (seconds behind primary)
- [ ] Distributed query overhead measured — query fan-out across shards
- [ ] Sharding key distributes data evenly across shards (no hot spots)
- [ ] Local queries routed to local replica to avoid cross-region network cost
- [ ] Replication queue monitored for backlog during peak ingestion
- [ ] Merge behavior across replicas does not duplicate merge work

---

# Security Checklist

- [ ] Cross-region replication traffic encrypted with TLS
- [ ] Keeper-to-server communication secured with TLS and authentication
- [ ] Distributed table permissions scoped to prevent cross-region data pull without authorization
- [ ] Replica access restricted to local region Kubernetes/service mesh
- [ ] Backup strategy includes multi-region snapshot for disaster recovery

---

# Reliability Checklist

- [ ] Replica failure detection via Keeper with automatic failover
- [ ] Read-only replica configured for disaster recovery standby region
- [ ] Replication queue monitor for failure conditions (Keeper unavailable)
- [ ] Distributed table skips unavailable shard (prefer_localhost_replica = 1)
- [ ] Cluster rebalance procedure documented for node addition/removal

---

# Testing Checklist

- [ ] Test replication — insert on primary, verify data available on replica
- [ ] Test failover — replica promoted to primary when primary unreachable
- [ ] Test distributed query returns consistent results across all shards
- [ ] Test cross-region latency impact on application query timeout
- [ ] Test shard add/remove — no data loss, cluster rebalancing completes
- [ ] Test Keeper quorum loss — cluster behavior when majority of Keepers down

---

# Maintainability Checklist

- [ ] Cluster topology documented per environment (dev, staging, prod)
- [ ] Shard key decisions documented with rationale and data distribution analysis
- [ ] Keeper cluster configuration in version-controlled Ansible or Terraform
- [ ] Replica promotion/demotion runbook documented
- [ ] Table creation scripts include ReplicatedMergeTree engine arguments

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use default MergeTree for multi-region — must use ReplicatedMergeTree
- [ ] Do not skip Keeper for replication metadata — file-based replication is legacy
- [ ] Do not use high-cardinality sharding key (UUID) — leads to uneven distribution
- [ ] Do not query distributed tables from every region — prefer local replica
- [ ] Do not deploy single Keeper node — minimum 3 nodes for quorum

---

# Production Readiness Checklist

- [ ] Prometheus metrics for replication lag per shard, replication queue size
- [ ] Logged warning when replication lag exceeds 30 seconds
- [ ] Alert when Keeper node count drops below quorum
- [ ] Cross-region network latency measured and monitored
- [ ] Deploy checklist includes ClickHouse cluster topology verification
- [ ] Disaster recovery drill performed: failover from primary to standby region

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: ReplicatedMergeTree, Keeper cluster, Distributed tables, sharding strategy
- [ ] Security requirements satisfied: encrypted replication, Keeper TLS, restricted replica access
- [ ] Performance requirements satisfied: measured replication lag, distributed overhead, balanced shards, local routing
- [ ] Testing requirements satisfied: replication correctness, failover, distributed query consistency, Keeper quorum
- [ ] Anti-pattern checks passed: ReplicatedMergeTree used, Keeper provisioned, low-cardinality shard key, local queries preferred
- [ ] Production readiness verified: replication lag metrics, Keeper alerts, network monitoring, DR drill

---

# Related References

- K012 (ClickHouse MergeTree): Base engine for ReplicatedMergeTree
- K032 (ClickHouse Driver Tradeoffs): HTTP vs TCP considerations for multi-region connections
- K031 (Projections vs Materialized Views): Projections/MVs must be created on each shard independently
