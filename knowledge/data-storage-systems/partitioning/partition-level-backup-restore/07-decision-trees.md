# 8-14 Partition Level Backup Restore - Decision Trees

## Backup Frequency by Partition Age

---

## Decision Context

Determining how frequently to back up each partition based on its age — active partitions change daily, archived partitions are static.

---

## Decision Criteria

* performance: daily full table backups waste time on static data
* architectural: backup frequency = partition age × change rate
* maintainability: automate backup schedule per partition tier

---

## Decision Tree

Partition age?

↓

Current month (active)?

YES → Back up daily

    ↓
    mysqldump --where="1=1" orders PARTITION (p202406)
    Or: pg_dump on the current month's partition
    
    ↓
    This partition gets all new writes
    Needs daily protection for RPO < 24h

NO → Recent (1-6 months old)?

    YES → Back up weekly
        
        ↓
        Only occasional updates or corrections
        Weekly backup sufficient for RPO < 7 days

NO → Archived (6+ months old, read-only)?

    YES → Back up once before DROP PARTITION
        
        ↓
        No new writes — static data
        Back up once for compliance/audit
        Store in cold storage (Glacier, S3 Glacier)
        
        ↓
        After backup: DROP PARTITION if retention permits

NO → Retention expired?

    → No backup needed (data should be gone)
    DROP PARTITION (data removed)
    Only if compliance requires archival

---

## Recommended Default

**Default:** Active → daily; recent → weekly; archived → once before drop
**Reason:** Matching backup frequency to change rate optimizes storage and time. Static data doesn't need repeated backups.

---

## Granular Restore: Single Partition Recovery

---

## Decision Context

Restoring a single partition's data (e.g., a specific month) without affecting other partitions or the entire table.

---

## Decision Criteria

* performance: EXCHANGE PARTITION enables instant swap
* architectural: restore to staging table first, then exchange into partition
* maintainability: granular restore avoids full table rebuild

---

## Decision Tree

Need to restore data for a specific time range?

YES → Identify the affected partition

    ↓
    Partition name from date range
    e.g., p202401 for January 2024 data
    
    ↓
    Step 1: Restore backup to staging table
    
    MySQL:
    CREATE TABLE orders_restore LIKE orders;
    ALTER TABLE orders_restore REMOVE PARTITIONING;
    -- Load backup data into orders_restore
    
    PostgreSQL:
    pg_restore -t orders_2024 orders_backup.dump
    
    ↓
    Step 2: Exchange partition (MySQL) or ATTACH (PostgreSQL)
    
    MySQL:
    ALTER TABLE orders EXCHANGE PARTITION p202401 WITH TABLE orders_restore;
    
    PostgreSQL:
    ALTER TABLE orders DETACH PARTITION orders_202401;
    DROP TABLE orders_202401;
    ALTER TABLE orders ATTACH PARTITION orders_restore
        FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

NO → Need to restore entire table?

    → Full table restore from backup
    Restore entire partitioned table
    Last resort — slower, more downtime

---

## Recommended Default

**Default:** Restore to staging → EXCHANGE/ATTACH for zero-downtime single partition recovery
**Reason:** EXCHANGE is metadata-only (instant). Full table restore is only needed for catastrophic failures.

---

## Related Rules

* Rule 8-14-1: Always Back Up Partitions Before Dropping
* Rule 8-14-2: Never Do Full Table Backup When Partition-Level Works

---

## Related Skills

* Implement Partition-Level Backup and Restore
* Implement EXCHANGE PARTITION for Restoration
