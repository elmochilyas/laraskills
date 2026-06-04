# 8-11 Postgresql Partitioning Features - Decision Trees

## Declarative vs Inheritance Partitioning

---

## Decision Context

PostgreSQL offers declarative partitioning (native, v10+) and legacy table inheritance. Choosing the right approach for new vs existing systems.

---

## Decision Criteria

* performance: declarative partitioning is more performant and optimizer-aware
* architectural: inheritance allows per-partition column overrides; declarative requires uniform structure
* maintainability: declarative is simpler to manage

---

## Decision Tree

Creating new partitioned tables?

YES → Always use declarative partitioning

    ↓
    CREATE TABLE orders (...) PARTITION BY RANGE (created_at);
    CREATE TABLE orders_2024 PARTITION OF orders
        FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
    
    ↓
    Native partition pruning (PG 10+)
    Supports: range, list, hash (PG 11+)
    Subpartitioning (PG 13+)

NO → Existing table inheritance schema?

    YES → Migrate to declarative partitioning
        
        ↓
        Step 1: Create new declarative parent table
        Step 2: ATTACH existing inheritance children as partitions
        Step 3: Verify constraints, triggers, indexes on new structure
        Step 4: Drop old inheritance parent
        
        ↓
        Benefits: better pruning, partition-wise JOIN, global indexes

NO → Need per-partition column customization?

    → Inheritance may still be needed
    Declarative requires all partitions have same columns
    Inheritance allows per-child-table column additions
    Rare — most cases don't need this

---

## Recommended Default

**Default:** Declarative partitioning for all new tables; migrate inheritance to declarative where possible
**Reason:** Declarative is the recommended PostgreSQL approach. Inheritance is only justified for legacy compatibility or non-uniform partition columns.

---

## Partition Detachment vs DROP

---

## Decision Context

Choosing between DETACH PARTITION (retain data as standalone table) and DROP PARTITION (remove data permanently) for data archival in PostgreSQL.

---

## Decision Criteria

* performance: DETACH is metadata-only; DROP removes data permanently
* architectural: DETACH retains data for re-attachment or querying; DROP is final
* maintainability: DETACH enables safe migration of old data

---

## Decision Tree

Need to remove a partition but may need the data later?

YES → DETACH PARTITION

    ↓
    ALTER TABLE orders DETACH PARTITION orders_2020;
    
    ↓
    orders_2020 becomes a standalone table (data intact)
    Can re-attach: ALTER TABLE orders ATTACH PARTITION orders_2020 ...
    
    ↓
    Use cases:
    - Archive data to cold storage (detach → move tablespace)
    - Hold for compliance before deletion
    - Debug/reporting on old data

NO → Data retention period fully expired?

    YES → DROP PARTITION
        
        ↓
        DROP TABLE orders_2020;  -- or DROP from parent
        
        ↓
        Permanent data removal
        Free up disk space
        Cannot be undone (backup required)

NO → Just clearing data, keeping structure?

    → TRUNCATE orders_2020;
    Removes data, keeps partition as part of parent
    Partition continues serving new data

---

## Recommended Default

**Default:** DETACH for data subject to compliance or potential re-query; DROP for fully expired retention
**Reason:** DETACH is the safest option — data remains accessible but separated. Only DROP when retention is fully complete and data is backed up.

---

## Related Rules

* Rule 8-11-1: Always Use Declarative Partitioning
* Rule 8-11-2: Prefer Global Indexes for Queries Without Partition Key

---

## Related Skills

* Leverage PostgreSQL Partitioning Features
* Implement Partition Detachment for Archival
