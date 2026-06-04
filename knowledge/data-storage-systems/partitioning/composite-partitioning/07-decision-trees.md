# 8-4 Composite Partitioning - Decision Trees

## Single-Level vs Composite Partitioning

---

## Decision Context

Choosing between single-level partitioning (range, list, or hash alone) and two-level composite partitioning (primary + subpartitioning).

---

## Decision Criteria

* performance: composite adds subpartition pruning, reduces scanned data
* architectural: primary for lifecycle, sub for write distribution
* maintainability: composite adds operational complexity
* security: same security model as single-level

---

## Decision Tree

Need both lifecycle management AND write distribution?

YES → Use composite partitioning

    ↓
    Determine primary strategy:
    - Need range-based archival (DROP old data)? → Range primary
    - Need region/category separation? → List primary
    
    Determine subpartition strategy:
    - Need even write distribution? → Hash subpartition
    - Need sub-category filtering? → List subpartition
    
    ↓
    Total = primary × sub ≤ 500 (practical limit)
    Example: Range by month (12) × Hash by user_id (4) = 48 total

NO → Single primary strategy sufficient?

    YES → Use single-level partitioning
        
        ↓
        Only need lifecycle? → Range partitioning
        Only need category separation? → List partitioning
        Only need write distribution? → Hash partitioning
        
        ↓
        Simpler management, fewer partitions
        No subpartition pruning concerns
        
    NO → Table size moderate (< 50M rows)?
    
        → Consider no partitioning at all
        Composite partitioning is overkill for moderate tables
        Start with good indexing, scale up when needed

---

## Recommended Default

**Default:** Single-level partitioning unless both lifecycle management and write distribution are required
**Reason:** Composite adds complexity. Only justify when both range-based archival and key-based distribution needs exist.

---

## Composite Strategy Selection

---

## Decision Context

Choosing the right composite combination: range-hash, range-list, or list-hash for the two-level partition structure.

---

## Decision Criteria

* performance: range-hash optimizes for time-range queries with user-based distribution
* architectural: range-hash is most common; range-list suits multi-status systems
* maintainability: primary level drives lifecycle operations (DROP/TRUNCATE)

---

## Decision Tree

What is the primary access pattern?

↓

Time-series with user-level access?

YES → Range-Hash composite

    ↓
    Primary: RANGE (created_at) — monthly/yearly partitions
    Sub: HASH (user_id) — 4-8 subpartitions per range
    
    ↓
    Lifecycle: DROP old month partitions
    Distribution: even writes across subpartitions
    Pruning: WHERE created_at >= ? AND user_id = ?

NO → Time-series with status filtering?

    YES → Range-List composite
        
        ↓
        Primary: RANGE (created_at)
        Sub: LIST (status) — active/pending/archive subpartitions
        
        ↓
        Subpartition pruning for status-based queries
        Active records in separate subpartition within each month

NO → Region-based with user distribution?

    YES → List-Hash composite
        
        ↓
        Primary: LIST (region) — US/EU/APAC partitions
        Sub: HASH (user_id) — even distribution within region
        
        ↓
        Region-level data locality
        Regional DROP/archival without affecting other regions

NO → Simple write distribution only?

    → Single-level hash partitioning sufficient
    No lifecycle benefit from composite

---

## Recommended Default

**Default:** Range-Hash composite for time-series tables with user-level access
**Reason:** Most common pattern — date-range lifecycle management with even write distribution via user hash. Range-List for status-heavy workloads.

---

## Related Rules

* Rule 8-4-1: Always Include Both Partition Keys In WHERE
* Rule 8-4-2: Keep Total Partition Count Under 500

---

## Related Skills

* Implement Composite (Sub)partitioning
* Implement Partition Management
