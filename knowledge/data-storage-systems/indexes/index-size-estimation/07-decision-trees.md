# 3-22 Index Size Estimation - Decision Trees

## Keep Index vs Drop Index Based on Size and Usage

---

## Decision Context

Deciding whether to keep, consolidate, or drop an index based on its size relative to the table and its usage frequency.

---

## Decision Criteria

* performance: index size affects buffer pool efficiency
* architectural: index-to-data ratio
* maintainability: drop unused indexes reduces overhead
* security: none

---

## Decision Tree

Evaluating whether to keep an index?

↓

Check usage statistics:

PostgreSQL: `SELECT idx_scan FROM pg_stat_user_indexes WHERE indexrelname = '...'`
MySQL: `SELECT * FROM sys.schema_unused_indexes`

↓

Index has zero or near-zero scans?

YES → Drop it

    ↓
    Confirm with application team
    Drop: `DB::statement('DROP INDEX IF EXISTS idx_name')`
    
    ↓
    Monthly review: schedule index audit
    
    Exception: index used for unique constraint — keep even if no scans

NO → Index is used but very large (>50% of table size)?

    YES → Consider consolidation
    
        ↓
        Is a composite index covering the same queries?
        
        YES → Drop redundant single-column index
        
        NO → Is index-to-table ratio > 2x?
        
            YES → Investigate bloat
                Consider REINDEX or pg_repack
                Consider BRIN for time-series columns
                
            NO → Index size is acceptable (0.5-2x is normal)

---

## Rationale

Indexes consume storage, memory (buffer pool), and write I/O. Unused indexes are pure cost with no benefit. Very large indexes may not fit in memory efficiently. Regular audits keep index footprint optimal.

---

## Recommended Default

**Default:** Drop indexes with zero scans over 30 days; investigate indexes >50% of table size
**Reason:** Zero-scan indexes provide no query benefit while costing write performance. Large indexes may indicate bloat or suboptimal index type.

---

## Risks Of Wrong Choice

Keeping unused indexes: wasted storage, slower writes, vacuum overhead. Dropping a used index: sudden query performance degradation, potential production incident.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Maintain and Rebuild Indexes for Bloat Management
