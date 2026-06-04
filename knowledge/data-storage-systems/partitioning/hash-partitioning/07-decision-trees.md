# 8-3 Hash Partitioning - Decision Trees

## Hash vs KEY Partitioning (MySQL)

---

## Decision Context

Choosing between MySQL's HASH partitioning (MOD on integer column) and KEY partitioning (MD5 hash on any column type).

---

## Decision Criteria

* performance: KEY uses MD5 for more even distribution on non-integer columns
* architectural: HASH requires integer partition key; KEY works with any type
* maintainability: KEY auto-uses primary key if no column specified

---

## Decision Tree

Partition key is an integer?

YES → HASH partitioning

    ↓
    CREATE TABLE ... PARTITION BY HASH (user_id) PARTITIONS 16;
    
    ↓
    MOD(hash(int_value), N) — even distribution for integers
    Simple, predictable mapping
    
    ↓
    Works best when: key is BIGINT/INT, values are evenly distributed

NO → Partition key is string/UUID/compound?

    YES → KEY partitioning (MySQL)
        
        ↓
        CREATE TABLE ... PARTITION BY KEY (uuid_col) PARTITIONS 16;
        
        ↓
        Uses MD5 for hashing — works with any column type
        More even distribution than HASH on non-integer columns
        
        ↓
        Convenient: PARTITION BY KEY() with no column uses primary key
        
    NO → Using PostgreSQL?
    
        → PostgreSQL uses hash partitioning differently
        PARTITION BY HASH (column) — supports any type
        No KEY equivalent needed

---

## Recommended Default

**Default:** HASH for integer keys; KEY for string/UUID/compound keys (MySQL)
**Reason:** HASH is simplest for integers. KEY uses MD5 for even distribution on non-integer types. Both avoid data skew.

---

## Number of Partitions

---

## Decision Context

Choosing the hash partition count — too few causes hot partitions, too many adds metadata overhead.

---

## Decision Criteria

* performance: more partitions = more parallelism but more metadata
* architectural: power-of-2 counts (8, 16, 32, 64) ensure even distribution
* maintainability: changing partition count requires full table rebuild

---

## Decision Tree

Expected table size?

↓

Massive (> 1B rows)?

YES → 64–256 partitions

    ↓
    Maximum parallelism for write distribution
    Each partition stays manageable (4–16M rows each at 64)
    Warning: approaching MySQL 8192 limit if also using subpartitioning

NO → Large (100M–1B rows)?

    YES → 32–64 partitions
        
        ↓
        Good balance of parallelism and metadata overhead
        Each partition: 1.5M–30M rows
        
        ↓
        Power of 2 recommended: 32 or 64

NO → Moderate (10M–100M rows)?

    YES → 8–16 partitions
        
        ↓
        Each partition: 625K–12.5M rows
        Sufficient write distribution
        Minimal metadata overhead

NO → Small (< 10M rows)?

    → 4–8 partitions (or no partitioning at all)
    Minimal benefit from many partitions
    Consider whether partitioning is needed

---

## Recommended Default

**Default:** 16 partitions for most OLTP tables; 32–64 for very large tables
**Reason:** Power-of-2 counts ensure even distribution. 16 is low overhead for metadata but provides meaningful distribution. Revisit as data grows.

---

## Related Rules

* Rule 8-3-1: Always Include Partition Key In WHERE
* Rule 8-3-2: Choose Partition Count Carefully

---

## Related Skills

* Implement Hash Partitioning
* Implement KEY Partitioning
