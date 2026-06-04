# 7-13 Synchronous Replication - Decision Trees

## Async vs Sync Replication

---

## Decision Context

Choosing between asynchronous replication (master-replica with lag) and synchronous replication (Galera, Group Replication, PostgreSQL sync_commit) based on consistency requirements and write latency tolerance.

---

## Decision Criteria

* performance: sync adds 2-5ms write latency per hop (same AZ); async adds zero write latency
* architectural: sync provides RPO=0; async may lose seconds of writes on failover
* maintainability: sync cluster (odd nodes, quorum, flow control) is more complex

---

## Decision Tree

Zero data loss required (RPO = 0)?

YES → Synchronous replication

    ↓
    Options:
    - Galera Cluster (MariaDB/Percona XtraDB)
    - MySQL Group Replication
    - PostgreSQL synchronous_commit
    
    ↓
    Requirements:
    - 3 or 5 nodes (odd number for quorum)
    - Same region, preferably same AZ (< 5ms latency between nodes)
    - Network reliability

NO → Data loss up to N seconds is acceptable?

    YES → Asynchronous replication
        
        ↓
        Standard master-replica topology
        Zero write impact (no network wait)
        RPO = seconds of writes (configurable as needed)
        
        ↓
        Simpler, lower latency, more widely supported
        Suitable for most applications

NO → Cross-region deployment?

    → Asynchronous only
    Sync replication across regions = 100-300ms write latency
    Impractical — use async with active-passive topology

---

## Recommended Default

**Default:** Async replication for most applications; sync replication only when RPO=0 is mandated by compliance or business requirements
**Reason:** Sync adds latency and operational complexity. Most applications can tolerate seconds of data loss in exchange for lower write latency and simpler operations.

---

## Galera Cluster Sizing

---

## Decision Context

Choosing the number of nodes in a synchronous replication cluster — balancing fault tolerance against write latency and cost.

---

## Decision Criteria

* performance: more nodes = higher write latency (wait for all nodes)
* architectural: odd number required for quorum (avoid split-brain)
* maintainability: more nodes = more monitoring and failure surface

---

## Decision Tree

Cluster size?

↓

3 nodes?

YES → Tolerates 1 node failure

    ↓
    Write latency: ~2-5ms additional (same AZ)
    Cost: 3x infrastructure
    Most common configuration
    
    ↓
    Suitable for: most apps needing sync replication
    Downside: if 1 node fails, cluster is at risk (1 more failure = quorum loss)

NO → 5 nodes?

    YES → Tolerates 2 node failures
        
        ↓
        Write latency: ~3-8ms additional (more nodes to ack)
        Cost: 5x infrastructure
        
        ↓
        Required when:
        - Multi-AZ cluster (tolerate 1 AZ failure + 1 node failure)
        - Very high availability requirement

NO → 2 nodes?

    → Not recommended for sync replication
    Can't tolerate any failure (loses quorum)
    Use async replication instead for 2-node topologies

---

## Recommended Default

**Default:** 3-node cluster for synchronous replication; 5-node for multi-AZ or extreme HA requirements
**Reason:** 3 nodes is the minimum for quorum (tolerates 1 failure). 5 nodes adds cost but enables multi-AZ resilience.

---

## Related Rules

* Rule 7-13-1: Always Use Odd Number of Cluster Nodes
* Rule 7-13-2: Never Deploy Sync Cluster Across Distant Regions

---

## Related Skills

* Deploy Synchronous Replication Cluster
* Troubleshoot Synchronous Replication Cluster Issues
