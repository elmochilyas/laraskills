# 8-8 Partition Index Design - Decision Trees

## Local vs Global Index (PostgreSQL)

---

## Decision Context

Choosing between local indexes (one per partition) and global indexes (single index across all partitions) for PostgreSQL partitioned tables.

---

## Decision Criteria

* performance: local index probes N partitions; global index probes 1
* architectural: global index has higher write overhead (all partitions update)
* maintainability: local indexes drop with partition; global needs VACUUM

---

## Decision Tree

Using PostgreSQL?

YES → Queries always include partition key in WHERE?

    YES → Local index
    
        ↓
        CREATE INDEX ON orders(user_id) LOCAL;
        
        ↓
        One index per partition
        Partition pruning narrows to 1 partition → 1 index probe
        Lower write overhead (only index in target partition updates)
    
    NO → Queries filter by non-partition key?
    
        YES → Global index
            
            ↓
            CREATE INDEX ON orders(user_id);
            (default is global in PostgreSQL)
            
            ↓
            Single B-tree across all partitions
            1 index probe regardless of partition scan
            Higher write overhead (each insert/update touches global index)
            
        NO → No non-partition key queries?
        
            → No index needed beyond partition pruning
            Partition key alone is sufficient for pruning

NO → Using MySQL?

    → Local indexes only (no global index support)
    All indexes on partitioned tables are automatically local
    
    ↓
    Must include partition key in WHERE for efficient index usage
    Unique indexes MUST include all partition key columns
    ❌ UNIQUE (user_id) — error (no partition key)
    ✅ UNIQUE (created_at, user_id) — OK

---

## Recommended Default

**Default:** PostgreSQL → local indexes if queries include partition key, global if not; MySQL → local indexes only, always include partition key in WHERE
**Reason:** Local indexes have lower write overhead. Global indexes only needed when queries can't include the partition key. MySQL has no choice — all indexes are local.

---

## MySQL Unique Index Restrictions

---

## Decision Context

Designing unique indexes on MySQL partitioned tables where every unique index must include all partition key columns.

---

## Decision Criteria

* performance: composite unique index (partition_key + business_key) satisfies constraint
* architectural: partition key must be part of every unique index
* maintainability: this restriction may force unnatural partition key choices

---

## Decision Tree

Need a unique constraint on a MySQL partitioned table?

↓

Does the unique constraint include the partition key?

YES → Create unique index normally

    ↓
    ✅ UNIQUE INDEX idx_unique (created_at, user_id)
    (table partitioned by created_at)
    
    ↓
    Works as expected
    Both partition key and business key are unique together

NO → Unique constraint cannot include partition key?

    YES → Unnatural constraint — evaluate alternatives
        
        ↓
        Option 1: Change partition key to include the column
            PARTITION BY RANGE (user_id) — if user_id can be partition key
        
        Option 2: Use a non-unique index + application-level enforcement
            Regular INDEX (not UNIQUE)
            Application validates uniqueness before insert
        
        Option 3: Use a trigger to enforce uniqueness
            BEFORE INSERT trigger checks all partitions
            Slower but maintains referential integrity

NO → Using PostgreSQL instead?

    → PostgreSQL doesn't have this restriction
    Unique indexes can exclude partition key
    One of the reasons to choose PostgreSQL for complex partitioning

---

## Recommended Default

**Default:** Include partition key in all unique indexes; if impossible, change partition key or use application-level enforcement
**Reason:** MySQL requires it. PostgreSQL doesn't. For MySQL, restructuring the partition key is cleaner than application-level enforcement.

---

## Related Rules

* Rule 8-8-1: Always Include Index Strategy in Partition Design
* Rule 8-8-2: MySQL Unique Indexes Must Include Partition Key

---

## Related Skills

* Design Indexes for Partitioned Tables
* Optimize Query Performance with EXPLAIN
