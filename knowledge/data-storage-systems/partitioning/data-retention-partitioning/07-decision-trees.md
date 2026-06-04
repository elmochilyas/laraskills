# 8-16 Data Retention Partitioning - Decision Trees

## DROP PARTITION vs DELETE for Retention

---

## Decision Context

Choosing between DROP PARTITION (instant, removes partition + data) and DELETE (row-by-row, causes bloat) for enforcing data retention policies.

---

## Decision Criteria

* performance: DROP is instant (filesystem-level); DELETE is O(n) with logging
* architectural: DROP requires range partitioning by date; DELETE works on any table
* maintainability: DROP is metadata-only; DELETE requires VACUUM/OPTIMIZE to reclaim space

---

## Decision Tree

Table is range-partitioned by date?

YES → Use DROP PARTITION for retention

    ↓
    ALTER TABLE orders DROP PARTITION p202301;
    
    ↓
    Instant — removes partition file/directory
    No bloat, no VACUUM, no OPTIMIZE needed
    Space is immediately reclaimed
    
    ↓
    Automate: monthly job drops partitions older than N months

NO → Table is large and retention is time-based?

    YES → Consider repartitioning for retention
        
        ↓
        Migrate to range partitioning by date
        Partition key = retention column (created_at, timestamp)
        
        ↓
        Once partitioned: DROP PARTITION for retention
        Migration effort pays off over time

NO → Table is small (< 10M rows)?

    YES → DELETE is acceptable
        
        ↓
        DELETE FROM orders WHERE created_at < NOW() - INTERVAL 12 MONTH;
        
        ↓
        Small table → DELETE is fast enough
        Space reclaimed by subsequent OPTIMIZE TABLE

NO → Need selective deletion (not time-based)?

    → DELETE is necessary (partitioning doesn't help)
    DROP PARTITION works on entire partitions only
    DELETE for specific rows matching criteria
    Accept bloat — schedule regular OPTIMIZE TABLE

---

## Recommended Default

**Default:** DROP PARTITION for time-based retention on partitioned tables; DELETE for non-partitioned or small tables
**Reason:** DROP is instant and bloat-free. DELETE is only acceptable for small tables or non-time-based criteria.

---

## Grace Period Configuration

---

## Decision Context

Setting a grace period before dropping retention-expired partitions — balancing compliance (keep data long enough) versus storage savings (drop sooner).

---

## Decision Criteria

* performance: grace period adds no performance cost (partition stays)
* architectural: grace period is a delay in DROP execution
* maintainability: 7-day grace period is standard safety buffer

---

## Decision Tree

Retention period is legally required (GDPR, HIPAA, PCI-DSS)?

YES → Add 30-day grace period

    ↓
    Retention = 12 months
    Drop partition when: partition_end + 12 months + 30 days has passed
    
    ↓
    Compliance buffer: ensures no accidental early deletion
    Audit: evidence that data was kept for required duration

NO → Business requirement (not legal)?

    YES → Add 7-day grace period
        
        ↓
        Retention = 12 months
        Drop when: partition_end + 12 months + 7 days
        
        ↓
        Safety buffer: covers weekends, holidays, job failures
        Allows time to catch automation issues before data is gone

NO → Cost-driven (maximize storage savings)?

    → 0-day grace period (hard boundary)
    Drop immediately on retention boundary
    Maximum storage savings
    Risk: dropping during job failure window

---

## Recommended Default

**Default:** 7-day grace period for business retention; 30-day for compliance; 0-day for cost optimization
**Reason:** Grace period protects against automation failures and holiday/weekend delays. Compliance requires extra buffer for audit confidence.

---

## Related Rules

* Rule 8-16-1: Always Use DROP PARTITION for Retention (not DELETE)
* Rule 8-16-2: Always Back Up Before Dropping Retention Partitions

---

## Related Skills

* Implement Data Retention with Partitioning
* Implement Compliance-Driven Data Retention
