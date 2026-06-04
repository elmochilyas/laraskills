# 7-16 Read Replica Sizing - Decision Trees

## Replica Sizing for Write-Heavy Workloads

---

## Decision Context

Determining whether replica lag is caused by insufficient replica capacity (CPU, IOPS, RAM) to replay the primary's write volume while serving read queries.

---

## Decision Criteria

* performance: replica must handle replay load + read load
* architectural: replica must have at least primary's CPU/memory, possibly more
* maintainability: upgrade replica before primary when lag persists

---

## Decision Tree

Replica lag during peak write hours?

YES → Check replica resource utilization

    ↓
    CPU > 80%?
    
    YES → Upgrade CPU (larger instance class)
        Replica CPU = replay CPU + read CPU
        If saturated, lag grows indefinitely
    
    NO → IOPS > 80%?
        
        YES → Increase IOPS (provisioned IOPS or faster storage)
            Binlog replay is sequential write
            But read queries add random IO
            
        NO → Memory pressure (buffer pool hit ratio < 95%)?
            
            YES → Increase RAM
                Larger buffer pool reduces disk reads
                More buffer = fewer IOPS needed

NO → Replica sizing seems adequate?

    → Check primary write throughput
    Primary writes/second may exceed replica apply capacity
    Consider parallel replication (MySQL 8.0 slave_parallel_workers)

---

## Recommended Default

**Default:** Start with same instance size as primary; upgrade replica when lag correlates with CPU/IOPS saturation
**Reason:** Matching primary spec ensures replica can replay writes. Additional read load may require larger replica.

---

## Right-Sizing for Read-Heavy Workloads

---

## Decision Context

When replicas serve significantly more reads than the primary (80%+ of total queries), determining the optimal vertical (larger instance) vs horizontal (more replicas) scaling approach.

---

## Decision Criteria

* performance: vertical scaling is simpler; horizontal scales linearly
* architectural: more replicas = more write replay load per replica
* maintainability: horizontal adds balancing complexity

---

## Decision Tree

Single replica read capacity exhausted?

YES → Evaluate vertical vs horizontal scaling

    ↓
    Can a single larger instance serve the read load?
    
    YES → Vertical scaling (larger replica)
        Upgrade to next instance size
        Simpler: no balancing change needed
        Check: buffer pool hit ratio > 95%, CPU < 70%
    
    NO → Horizontal scaling (more replicas)
        
        ↓
        Add replicas to spread read load
        Each replica adds write replay overhead
        Use weighted balancing for heterogeneous replicas
        
        ↓
        N replicas with load balancer
        Each handles 1/N of read traffic

NO → Single replica sufficient?

    → Keep current sizing
    Monitor: if read traffic grows 30%+, re-evaluate
    Plan capacity for 12 months ahead

---

## Recommended Default

**Default:** Vertical scaling first (larger instance); horizontal scaling when read capacity needs to exceed what a single instance can provide
**Reason:** Vertical scaling is simpler and doesn't require balancing changes. Horizontal scaling adds complexity and per-replica write replay overhead.

---

## Related Rules

* Rule 7-16-1: Always Size Replicas at Least Equal to Primary
* Rule 7-16-2: Increase Replicas Before Primary When Lag Persists

---

## Related Skills

* Size Read Replicas for Write-Heavy Workloads
* Right-Size Replicas for Read-Heavy Workloads
