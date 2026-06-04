# 8-12 Hash Partition Incremental Scaling - Decision Trees

## Initial Partition Count Selection

---

## Decision Context

Choosing the starting hash partition count at table creation — balancing growth headroom against metadata overhead.

---

## Decision Criteria

* performance: each partition adds ~1KB metadata overhead in buffer pool
* architectural: power-of-2 counts enable future splitting/merging
* maintainability: changing count requires full table rebuild

---

## Decision Tree

Expected final table size?

↓

> 1B rows?

YES → Start with 64–128 partitions

    ↓
    64 → 15.6M rows/partition at 1B
    128 → 7.8M rows/partition at 1B
    
    ↓
    Growth headroom: 5-10 years
    Consider composite partitioning: range + hash

NO → 100M–1B rows?

    YES → Start with 16–32 partitions
        
        ↓
        Power of 2: 16 or 32
        16 → 6.25M–62.5M rows per partition
        32 → 3.1M–31.25M rows per partition
        
        ↓
        Good balance: low overhead + growth room
        Most common starting point

NO → 10M–100M rows?

    YES → Start with 8–16 partitions
        
        ↓
        16 → 625K–6.25M rows per partition
        Minimal overhead (16 partitions)
        May not need partitioning at the low end

NO → < 10M rows?

    → Consider not partitioning at all
    Hash partitioning adds complexity
    Standard indexes likely sufficient
    Re-evaluate at 50M+ rows

---

## Recommended Default

**Default:** 16 partitions for most OLTP tables; 32-64 for very large; power-of-2 always
**Reason:** 16 provides good distribution with low overhead. Power-of-2 enables future operations. Pre-partition for 2-5 years of growth.

---

## Changing Partition Count

---

## Decision Context

When the initial partition count is no longer adequate — deciding between full rebuild, merging, or composite partitioning.

---

## Decision Criteria

* performance: rebuild copies entire table (requires equal free space)
* architectural: merging reduces count temporarily; composite adds lifecycle
* maintainability: rebuild is a major operation — schedule carefully

---

## Decision Tree

Need to change hash partition count?

↓

Too many partitions (metadata overhead)?

YES → Merge partitions

    ↓
    ALTER TABLE ... REORGANIZE PARTITION p0,p1 INTO (
        PARTITION p0 VALUES ...
    );
    
    ↓
    Merges 2+ partitions into fewer
    Copies data between partitions
    Not a full rebuild — targeted
    
    ↓
    Use case: too many small partitions, reduce overhead

NO → Too few partitions (each too large)?

    YES → Full rebuild with higher count
        
        ↓
        ALTER TABLE ... PARTITION BY HASH (key) PARTITIONS 32;
        
        ↓
        Copies entire table
        Requires equal free disk space
        Use pt-online-schema-change or gh-ost for production
        
        ↓
        Alternative: composite partitioning
        Add range as primary, hash as subpartition
        Enables lifecycle + write distribution

NO → Data outgrown partitioning entirely?

    → Consider sharding instead
    Table too large for single MySQL instance
    Hash partitioning only distributes within one DB
    Horizontal sharding distributes across many DBs

---

## Recommended Default

**Default:** Pre-partition conservatively to avoid rebuilds; if needed, use online rebuild tools (pt-online-schema-change)
**Reason:** Rebuilds are expensive. Choose initial count with growth margin. For extreme cases, consider composite partitioning or sharding.

---

## Related Rules

* Rule 8-12-1: Always Use Power of 2 Partition Count
* Rule 8-12-2: Always Pre-Partition for Expected Growth

---

## Related Skills

* Plan Hash Partition Count for Incremental Scaling
* Rebuild Partitioned Tables Online
