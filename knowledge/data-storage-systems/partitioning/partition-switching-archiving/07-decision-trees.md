# 8-15 Partition Switching Archiving - Decision Trees

## EXCHANGE vs DROP vs INSERT...SELECT for Archival

---

## Decision Context

Choosing between EXCHANGE PARTITION (atomic swap), DROP PARTITION (remove data), and INSERT...SELECT (copy data) for archiving old partition data.

---

## Decision Criteria

* performance: EXCHANGE is metadata-only (instant); INSERT...SELECT copies rows
* architectural: EXCHANGE preserves data as standalone table; DROP destroys it
* maintainability: staging table must match partition structure exactly

---

## Decision Tree

Need to preserve data for compliance or future access?

YES → EXCHANGE PARTITION (recommended)

    ↓
    Step 1: CREATE TABLE orders_archive LIKE orders;
    Step 2: ALTER TABLE orders_archive REMOVE PARTITIONING;
    Step 3: ALTER TABLE orders EXCHANGE PARTITION p202401 WITH TABLE orders_archive;
    
    ↓
    Instant — no data copy
    Partition data now in standalone orders_archive table
    Can compress, move to cold storage, or keep as is
    
    ↓
    After exchange: DROP orders_archive or keep for compliance

NO → Data can be discarded entirely?

    YES → DROP PARTITION
        
        ↓
        ALTER TABLE orders DROP PARTITION p202401;
        
        ↓
        Instant — removes data + partition structure
        No data retained
        Cannot be recovered without backup

NO → Need to copy data but keep partition online?

    → INSERT...SELECT (slow, avoid)
    INSERT INTO archive_table SELECT * FROM orders PARTITION (p202401);
    -- Then DROP PARTITION or TRUNCATE PARTITION
    Slower but works without EXCHANGE support

---

## Recommended Default

**Default:** EXCHANGE PARTITION for archival with data preservation; DROP PARTITION when data can be discarded
**Reason:** EXCHANGE is instant and preserves data as a standalone table. Only use DROP when retention is fully complete.

---

## Data Loading via Partition Exchange

---

## Decision Context

Loading new data into a partition without downtime by loading into a staging table first, validating, then exchanging into the live partition.

---

## Decision Criteria

* performance: EXCHANGE is instant after staging is ready
* architectural: staging table must have identical structure to partitioned table
* maintainability: enables validation before data goes live

---

## Decision Tree

Need to bulk-load data into a partition with zero downtime?

YES → Use EXCHANGE for data loading

    ↓
    Step 1: CREATE TABLE staging LIKE orders;
    Step 2: ALTER TABLE staging REMOVE PARTITIONING;
    Step 3: Load data into staging (CSV import, ETL, etc.)
    Step 4: Validate data quality (row count, constraints, duplicates)
    
    ↓
    Step 5: ALTER TABLE orders EXCHANGE PARTITION p202406 WITH TABLE staging;
    
    ↓
    Instant — data is live in the partition
    Old partition data (if any) is now in staging
    Process staging table (discard, archive, or re-import)

NO → Small amount of data?

    YES → INSERT directly into partition
        
        ↓
        INSERT INTO orders (created_at, ...) VALUES (...);
        
        ↓
        No staging needed
        Works for individual rows or small batches
        
    NO → Database doesn't support EXCHANGE?
    
        → INSERT...SELECT fallback
        INSERT INTO orders SELECT * FROM staging WHERE created_at BETWEEN ...;
        Slower but universally supported

---

## Recommended Default

**Default:** EXCHANGE PARTITION for bulk data loading with validation; direct INSERT for individual rows
**Reason:** EXCHANGE enables validation before data goes live and is instant. Only use INSERT...SELECT when EXCHANGE is unavailable.

---

## Related Rules

* Rule 8-15-1: Always Verify Structure Match Before Exchange
* Rule 8-15-2: Never Exchange Without Backing Up the Staging Table First

---

## Related Skills

* Implement Partition Switching for Zero-Downtime Archival
* Implement Data Loading with Partition Exchange
