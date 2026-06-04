# 7-1 Master-Replica Topology - Decision Trees

## Replication Mode: Async vs Semi-Sync vs Sync

---

## Decision Context

Choosing the replication mode for master-replica topology based on data durability and performance requirements.

---

## Decision Criteria

* performance: async is fastest writes; sync is slowest
* architectural: data loss risk vs write latency
* maintainability: sync requires reliable network
* security: data durability

---

## Decision Tree

Which replication mode for production?

↓

Can you tolerate any data loss on primary failure?

YES → Asynchronous replication

    ↓
    Fastest write performance
    Risk: seconds of data loss on primary crash
    Suitable for: reporting replicas, analytics, non-critical data

NO → Zero data loss required?

    YES → Semi-synchronous replication
        
        ↓
        Primary waits for at least one replica to acknowledge
        Configure: `rpl_semi_sync_master_wait_point=AFTER_SYNC`
        
        ↓
        Default for most production workloads
        Good balance of safety and performance

NO → Must all replicas be fully in sync?

    YES → Synchronous replication
        
        ↓
        Primary waits for ALL replicas
        Slowest writes (latency = slowest replica)
        Rarely used: Galera, PostgreSQL synchronous_commit
        Suitable for: financial systems, absolute data integrity

---

## Recommended Default

**Default:** Semi-synchronous replication for production writes
**Reason:** Zero data loss with manageable write latency overhead.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Configure Master-Replica Replication Topology
