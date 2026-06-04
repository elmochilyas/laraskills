# 8-10 Mysql Partition Limitations - Decision Trees

## Handling Foreign Keys on Partitioned Tables

---

## Decision Context

MySQL partitioned tables cannot have foreign key relationships (as parent or child). Choosing between application-level enforcement, triggers, or restructuring the schema.

---

## Decision Criteria

* performance: application-level checks add query overhead (SELECT before INSERT)
* architectural: FK removal shifts integrity from DB to app layer
* maintainability: triggers are complex and performance-heavy

---

## Decision Tree

Need referential integrity from a partitioned table?

↓

Can the reference table also be non-partitioned?

YES → Keep FK on non-partitioned table, partition the child only

    ↓
    Example: orders_items (partitioned) → orders (non-partitioned)
    FK on orders_items.orders_id → orders.id works
    Partition the child table, leave the parent unpartitioned

NO → Both tables must be partitioned?

    YES → Application-level referential integrity
        
        ↓
        Remove FK constraint from schema
        Check existence in application: Order::findOrFail($orderId)
        Accept eventual consistency
        
        ↓
        Risk: race conditions between check and insert
        Mitigation: unique constraint on (order_id, item_id) to catch duplicates

NO → Need strict referential integrity?

    → Use triggers for referential validation
    BEFORE INSERT trigger checks parent exists
    Slower than FK but enforces at database level
    Complex to maintain and debug

---

## Recommended Default

**Default:** Remove FK and enforce at application level; keep FK on non-partitioned tables where possible
**Reason:** Application-level enforcement is simpler than triggers. Race conditions are acceptable for most use cases.

---

## Partition Count Planning

---

## Decision Context

MySQL has a hard limit of 8192 partitions per table and practical performance degradation above ~1000. Planning partition count across the table's lifespan.

---

## Decision Criteria

* performance: more partitions = more metadata overhead (~1-2KB per partition in memory)
* architectural: 8192 is an absolute limit; stay well under it
* maintainability: fewer partitions = simpler management

---

## Decision Tree

Expected total partitions across all tables?

↓

Will any single table exceed 500 partitions?

YES → Reduce partition count

    ↓
    Options:
    - Use larger partition interval (monthly instead of daily)
    - Use composite partitioning (fewer primary partitions + subpartitions)
    - Archive old partitions to separate tables
    
    ↓
    Example: Daily → Monthly = 12/year vs 365/year
    At 12/year → 40+ years under 500 partitions

NO → Will multiple tables each have many partitions?

    YES → Track total across ALL partitioned tables
        
        ↓
        MySQL limit is 8192 total per table, but practical limit = 500-1000
        Monitor INFORMATION_SCHEMA.PARTITIONS for total count
        
        ↓
        If approaching 1000:
        - Merge small partitions
        - Archive/drop old partitions
        - Consider sharding instead

NO → Hash partitions with fixed count?

    → Choose count for maximum expected growth
    16-64 partitions for most tables
    Pre-partition conservatively (count is fixed)

---

## Recommended Default

**Default:** Stay under 500 partitions per table; monitor total across all partitioned tables; use monthly intervals for most time-series
**Reason:** 500 provides headroom below the 8192 hard limit and avoids performance degradation from metadata overhead.

---

## Related Rules

* Rule 8-10-1: Always Include Partition Key in Unique Indexes
* Rule 8-10-2: Never Rely on Foreign Keys with Partitioned Tables in MySQL

---

## Related Skills

* Work Around MySQL Partition Limitations
* Implement Application-Level Referential Integrity
