# 6-22 Shard Vs Partition Distinction - Decision Trees

## Sharding vs Partitioning Decision

---

## Decision Context

Choosing between table partitioning (within a single database server) and sharding (across multiple servers) for horizontal data distribution — based on data volume, throughput, and operational requirements.

---

## Decision Criteria

* performance: partitioning enables query pruning but limited to one server; sharding provides true horizontal scaling
* architectural: partitioning shares server resources; sharding has independent failure domains
* maintainability: partitioning is simpler to manage; sharding requires significant ops expertise

---

## Decision Tree

Will the data fit on a single database server for the next 2-3 years?

YES → Use table partitioning

    ↓
    Data fits on one server
    Partition BY RANGE (date), BY HASH, BY LIST
    
    ↓
    Pro: Simpler management (one server)
    Pro: Fast partition DROP for archival
    Pro: Query pruning with partition key
    Pro: Global indexes (PostgreSQL)
    
    ↓
    Con: Limited by single server resources
    Con: No horizontal write scaling

NO → Data will exceed single server capacity

    ↓
    Use sharding
    
    ↓
    Data split across multiple servers
    Each shard is a complete database instance
    
    ↓
    Pro: True horizontal scale (CPU, memory, storage, IOPS)
    Pro: Independent failure domains
    Pro: Geographic distribution possible
    
    ↓
    Con: Cross-shard queries are fan-out
    Con: Distributed transactions are not possible
    Con: Rebalancing is complex

Combined approach:

↓

Need both lifecycle management AND horizontal scale?

    YES → Shard + Partition
        
        ↓
        Shard by user_id (across servers)
        Partition by created_at within each shard
        
        ↓
        Best of both:
        - Horizontal scale via sharding
        - Fast archival via partition DROP per shard
        - Query pruning within each shard

---

## Recommended Default

**Default:** Partitioning first (simpler); add sharding when single-server capacity is exhausted; combine for maximum scale
**Reason:** Partitioning is simpler and sufficient for most databases. Sharding is a significant complexity step that should not be taken prematurely.

---

## Partitioning Use Case Decision

---

## Decision Context

Determining when partitioning alone is sufficient vs when sharding is required — covering lifecycle management, query optimization, and scale.

---

## Decision Criteria

* performance: pruning reduces scan size; retention DROP is metadata-only
* architectural: partitions are on the same server; shards are independent
* maintainability: automated partition management is essential

---

## Decision Tree

Primary driver for data splitting:

↓

Lifecycle management (archival, retention)?

    YES → Partitioning is likely sufficient
        
        ↓
        PARTITION BY RANGE (created_at)
        Monthly or quarterly ranges
        Automated: CREATE PARTITION next period, DROP old partition
        
        ↓
        Pro: DROP PARTITION is metadata-only (instant)
        Pro: No cross-server complexity
        
        ↓
        Con: Does NOT scale writes across servers

Performance (query pruning)?

    YES → Partitioning helps if partition key is in WHERE
        
        ↓
        Query without partition key → full scan (no benefit)
        Partition key must be a common filter
        
        ↓
        If queries consistently include partition key:
        → Partitioning is sufficient for performance
        
        ↓
        If not: partitioning may not help performance

Write throughput exceeds single server capacity?

    YES → Partitioning won't help
        
        ↓
        Partitioning doesn't distribute writes across servers
        Need sharding for write throughput scaling
        
        ↓
        Shard count determined by write volume
        Each shard handles a fraction of total writes

---

## Recommended Default

**Default:** Partitioning for lifecycle management and query optimization; sharding for write throughput scale
**Reason:** Partitioning addresses different problems than sharding. They are complementary, not alternatives.

---

## Related Rules

* Rule 6-22-1: Always Choose Simpler Approach First
* Rule 6-22-2: Never Assume Partitioning Provides Horizontal Scale
* Rule 6-22-3: Always Include Partition Key In WHERE

---

## Related Skills

* Distinguish Sharding from Partitioning
* Decide Between Partitioning and Sharding
