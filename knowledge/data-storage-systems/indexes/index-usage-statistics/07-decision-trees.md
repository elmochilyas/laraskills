# 3-25 Index Usage Statistics - Decision Trees

## Identifying Covering Index Opportunities

---

## Decision Context

Using index usage statistics (idx_tup_read vs idx_tup_fetch) to identify queries that would benefit from covering indexes.

---

## Decision Criteria

* performance: high idx_tup_fetch indicates many heap lookups
* architectural: added INCLUDE columns would convert to index-only scans
* maintainability: larger index vs reduced heap I/O

---

## Decision Tree

High idx_tup_fetch relative to idx_tup_read?

↓

Check PostgreSQL:

`SELECT idx_scan, idx_tup_read, idx_tup_fetch, idx_tup_read + idx_tup_fetch AS total
FROM pg_stat_user_indexes WHERE indexrelname = '...'`

↓

If idx_tup_fetch >> idx_tup_read (e.g., 10x more fetches than reads)?

YES → Index is used for lookup but NOT for covering

    ↓
    Each index match requires a heap fetch to read column values
    
    Opportunity: Add commonly-selected columns via INCLUDE
    
    ↓
    Identify which queries use this index
    Check EXPLAIN (EXPLAIN) output for "Index Scan" (not "Index Only Scan")
    
    ↓
    Add INCLUDE:
    `CREATE INDEX CONCURRENTLY idx_new ON table (existing_cols) INCLUDE (commonly_selected_cols)`
    
    Monitor: idx_tup_fetch should decrease after covering index

NO → idx_tup_read ≈ total (low fetches)?

    → Index is already covering or the table is small enough that fetches aren't costly

---

## Rationale

High idx_tup_fetch means the index finds rows efficiently but must read the table for additional columns. Adding INCLUDE columns converts "Index Scan" to "Index Only Scan", eliminating heap fetches and reducing I/O.

---

## Recommended Default

**Default:** Investigate indexes where idx_tup_fetch > 5x idx_tup_read
**Reason:** This ratio indicates significant heap fetch overhead that a covering index could eliminate.

---

## Risks Of Wrong Choice

Adding INCLUDE columns to every index: index bloat, slower writes. Not investigating high fetches: missed opportunity to optimize hot queries.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Use Covering Indexes for Index-Only Scans

---

## Quarterly Index Audit: Keep vs Drop

---

## Decision Context

Performing a quarterly index audit using usage statistics to identify and remove unused indexes.

---

## Decision Criteria

* performance: unused indexes waste write I/O and storage
* architectural: review must be systematic and careful
* maintainability: regular cleanup prevents index bloat
* security: none

---

## Decision Tree

Time for quarterly index audit?

↓

Fetch unused indexes:

PostgreSQL: 
```sql
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND indexrelid NOT IN (
    SELECT indexrelid FROM pg_constraint WHERE contype = 'u'
);
```

MySQL: 
```sql
SELECT * FROM sys.schema_unused_indexes;
```

↓

Index has zero scans?

YES → Is it a unique constraint index?

    YES → Keep (data integrity)
    
    NO → Verify with last statistics reset time
    
        ↓
        Stats reset recently (e.g., after restart)?
        
        YES → Collect data for longer before deciding
        
        NO → Seasonal/periodic usage pattern?
        
            YES → Monitor for one more cycle before dropping
            
            NO → Drop: `DROP INDEX CONCURRENTLY ...` (PostgreSQL) or `ALTER TABLE ... DROP INDEX ...` (MySQL)

---

## Rationale

A systematic quarterly audit prevents "index cruft" — indexes that were added for past query patterns but are no longer needed. Each unused index dropped reduces write amplification and storage costs permanently.

---

## Recommended Default

**Default:** Quarterly audit; drop unused non-unique indexes with no scans for >30 days
**Reason:** Balance between cleanup and caution. 30+ days without a scan suggests the index is genuinely unused.

---

## Risks Of Wrong Choice

Not auditing: indexes accumulate, write performance degrades over time. Dropping a seasonally-used index: query regression during peak periods. Resetting stats before audit: loses useful data, must wait for new statistics.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Maintain and Rebuild Indexes for Bloat Management
