# 8-18 Partitioning Vs Sharding Framework - Decision Trees

## Partitioning vs Sharding

---

## Decision Context

Choosing between partitioning (splitting within a single database server) and sharding (splitting across multiple servers) for horizontal data distribution.

---

## Decision Criteria

* performance: partitioning enables pruning within one server; sharding distributes load across servers
* architectural: partitioning is simpler (single server); sharding requires distributed system design
* maintainability: sharding adds operational complexity (resharding, cross-shard queries)

---

## Decision Tree

Does data fit on a single server (≤500GB)?

YES → Use partitioning

    ↓
    Partition within the single database
    Benefits: lifecycle management (DROP PARTITION), pruning, global indexes
    
    ↓
    When to use which:
    - Need archival/retention → Range partitioning
    - Need even write distribution → Hash partitioning
    - Both → Composite partitioning (range + hash)

NO → Data exceeds single server (>1TB)?

    YES → Need geographic distribution?
        
        YES → Sharding
            
            ↓
            Distribute across servers by shard key (user_id, region)
            Each shard is an independent database
            Cross-shard queries fan-out to all shards
            
            ↓
            Complexity: higher (resharding, routing, transactions)
            Scale: nearly unlimited (add more shards)

NO → Write throughput exceeds single server (>10K writes/sec)?

    YES → Sharding
        
        ↓
        Distribute write load across servers
        Each shard handles 1/N of total writes
        Shard key must evenly distribute writes

NO → Single server is sufficient?

    → Partitioning or standard indexing
    Partitioning for lifecycle management
    Standard indexes if no partitioning benefit

---

## Recommended Default

**Default:** Start with partitioning (simpler); migrate to sharding only when data size or write throughput exceeds single server capacity
**Reason:** Premature sharding adds unnecessary complexity. Most applications never outgrow a single well-partitioned server.

---

## Combining Partitioning and Sharding

---

## Decision Context

Using both partitioning (within a shard) and sharding (across servers) simultaneously — shard key for distribution, partition key for lifecycle.

---

## Decision Criteria

* performance: shard routing + partition pruning = optimal performance
* architectural: clear separation — shard key for horizontal scale, partition key for lifecycle
* maintainability: both dimensions must be considered in query patterns

---

## Decision Tree

Need both horizontal scaling AND lifecycle management?

YES → Combine sharding + partitioning

    ↓
    Layer 1 (Sharding): Distribute by user_id across servers
    Shard key: user_id (high cardinality, in most queries)
    
    Layer 2 (Partitioning): Within each shard, partition by month
    Partition key: created_at (for archival and pruning)
    
    ↓
    Query pattern:
    SELECT * FROM orders
    WHERE user_id = 123          ← routes to 1 shard
    AND created_at >= '2024-01-01'  ← prunes to 1 partition
    AND created_at < '2024-02-01'
    
    ↓
    Archival: DROP PARTITION on each shard independently
    Scalability: add more shards horizontally

NO → Only one need?

    YES → Only horizontal scaling → Sharding alone
        Shard key selection, cross-shard query handling
        
    NO → Only lifecycle → Partitioning alone
        Range partitioning by date, automated archiving

---

## Recommended Default

**Default:** Shard by user_id/tenant_id for distribution; partition by month within each shard for lifecycle
**Reason:** Clear separation of concerns. Sharding handles scale. Partitioning handles retention. Queries benefit from both routing and pruning.

---

## Related Rules

* Rule 8-18-1: Start With Partitioning Before Sharding
* Rule 8-18-2: Choose Sharding Only When Data Exceeds Single Server

---

## Related Skills

* Choose Between Partitioning and Sharding
* Implement Horizontal Sharding
