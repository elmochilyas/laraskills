# 8-6 Partition Management - Decision Trees

## DROP vs TRUNCATE vs DELETE Partition

---

## Decision Context

Choosing between DROP PARTITION (remove structure + data), TRUNCATE PARTITION (remove data, keep structure), and DELETE FROM ... WHERE (row-by-row removal) for removing data from a partition.

---

## Decision Criteria

* performance: DROP and TRUNCATE are instant (metadata operations); DELETE is row-by-row with logging
* architectural: DROP removes the partition definition; TRUNCATE preserves it
* maintainability: backup before destructive operations

---

## Decision Tree

Need to remove data from a partition?

↓

Need to keep the partition structure for future data?

NO → DROP PARTITION

    ↓
    ALTER TABLE orders DROP PARTITION p202301;
    
    ↓
    Instant — metadata-only operation
    Partition and data both gone
    Cannot rollback — ensure backup first
    
    ↓
    Use when: data retention expired, partition is no longer needed

YES → Keep the structure?

    ↓
    Need to remove ALL data from the partition?
    
    YES → TRUNCATE PARTITION
        
        ↓
        ALTER TABLE orders TRUNCATE PARTITION p202301;
        
        ↓
        Instant — removes all data, keeps structure
        Faster than DELETE (no per-row logging)
        Cannot be rolled back (DDL)
        
        ↓
        Use when: want to reuse partition, clear all data
    
    NO → Need to remove specific rows?
        
        → DELETE FROM orders WHERE partition_key BETWEEN ... AND ...
        Row-by-row removal (logs each row)
        Can be rolled back (in transaction)
        Use when: need to remove subset of rows

---

## Recommended Default

**Default:** DROP PARTITION for expired data/retention; DELETE for subset removal; TRUNCATE for full partition clearing
**Reason:** DROP and TRUNCATE are instant. DELETE is only needed for row-level removal. Always backup before DROP.

---

## ADD vs REORGANIZE for Managing Partitions

---

## Decision Context

Choosing between ADD PARTITION (range/list only, simple append) and REORGANIZE PARTITION (split/merge any type) for modifying partition structure.

---

## Decision Criteria

* performance: ADD is metadata-only; REORGANIZE copies data
* architectural: ADD only works for range/list at the end; REORGANIZE works for any partition type
* maintainability: ADD for simple growth; REORGANIZE for structural changes

---

## Decision Tree

Need to add a new range at the end of a range-partitioned table?

YES → ADD PARTITION

    ↓
    ALTER TABLE orders ADD PARTITION (
        PARTITION p202405 VALUES LESS THAN (TO_DAYS('2024-06-01'))
    );
    
    ↓
    Metadata-only — instant
    New partition must be higher than highest range
    Works for: range and list partitioning only

NO → Need to split an existing partition (overfull)?

    YES → REORGANIZE PARTITION (split)
        
        ↓
        ALTER TABLE orders REORGANIZE PARTITION p2023 INTO (
            PARTITION p2023_h1 VALUES LESS THAN (TO_DAYS('2023-07-01')),
            PARTITION p2023_h2 VALUES LESS THAN (TO_DAYS('2024-01-01'))
        );
        
        ↓
        Copies data to new partitions
        Requires disk space for copy
        Use for splitting overfull or merging sparse partitions

NO → Need to change hash partition count?

    → REORGANIZE or rebuild entire table
    Cannot ADD PARTITION to hash-partitioned table
    Changing hash count = full table rebuild
    Plan hash partition count carefully from start

---

## Recommended Default

**Default:** ADD PARTITION for routine range growth; REORGANIZE for structural changes (split/merge)
**Reason:** ADD is instant. REORGANIZE is I/O-intensive. Automate both via scheduled jobs.

---

## Related Rules

* Rule 8-6-1: Always Automate Partition Creation
* Rule 8-6-2: Always Backup Before DROP PARTITION

---

## Related Skills

* Manage Partitions (Add, Drop, Truncate, Reorganize)
* Automate Partition Lifecycle with Cron
