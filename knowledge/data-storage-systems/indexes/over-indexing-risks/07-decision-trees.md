# 3-23 Over-Indexing Risks - Decision Trees

## Add Index vs Consolidate Existing Indexes

---

## Decision Context

When considering a new index, deciding whether to add it or consolidate with existing indexes to avoid over-indexing.

---

## Decision Criteria

* performance: each index adds write amplification
* architectural: composite indexes can serve multiple query patterns
* maintainability: fewer indexes = simpler schema

---

## Decision Tree

Considering adding a new index?

↓

Does an existing index already cover this column via leftmost prefix?

YES → Don't add — existing index(es) already serve this query

    ↓
    Example: Existing index (a, b, c) covers queries on (a) and (a, b)
    
    New index on (a) alone → REDUNDANT

NO → Can an existing index be extended to cover this query?

    YES → Extend existing index instead of creating new one
    
        ↓
        Currently: INDEX (a)
        Need: query with WHERE a = ? AND b = ?
        
        → Replace INDEX (a) with INDEX (a, b)
        
        ↓
        Check: does the existing index serve other queries that would be harmed?
        
        If INDEX (a) is used for WHERE a > ? (range), changing to INDEX (a, b) still works
        
        If INDEX (a) is used alone, and b makes it larger, weigh the tradeoff

NO → Create new index

    ↓
    BUT first: check total index count on table
    
    If > 5-6 indexes on a high-write table, reconsider
    
    Is the query performance improvement worth the write amplification?

---

## Rationale

Index consolidation is the most effective way to prevent over-indexing. A well-designed set of composite indexes can serve many query patterns with fewer total indexes than a collection of single-column indexes. Each index you avoid saves write I/O on every INSERT/UPDATE/DELETE.

---

## Recommended Default

**Default:** Consolidate by extending existing composites; only add new indexes when no extension is possible
**Reason:** Minimizes total index count while maintaining query coverage.

---

## Risks Of Wrong Choice

Adding redundant indexes: write amplification without query benefit. Over-consolidating: composite index becomes too wide, wasting space and still not covering all query patterns.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design Composite Indexes with Correct Leftmost Prefix
* Use Covering Indexes for Index-Only Scans

---

## Keep vs Drop: Unused Index Review

---

## Decision Context

Deciding whether to keep or drop indexes that appear unused in index usage statistics.

---

## Decision Criteria

* performance: unused indexes add write overhead
* architectural: some indexes serve unique constraints (appear unused in scans)
* maintainability: dropping requires caution

---

## Decision Tree

Index appears unused (idx_scan = 0)?

↓

Is it a unique constraint index?

YES → Keep (enforces data integrity, not just query performance)

    ↓
    Unique indexes may have zero scans but are critical for data integrity
    
    Exceptions:
    - Partial unique index that no longer applies
    - Unique index that could be replaced by application-level validation

NO → Is it a FK index?

    YES → Keep if FK is actively used in JOINs
        
        ↓
        Check if FK index is redundant with another composite index
        A composite (fk_col, other_col) already covers the FK
        
        → Drop FK index if covered by composite

NO → Regular index with zero scans?

    YES → Recommended: Drop
    
        ↓
        Process:
        1. Confirm with EXPLAIN that the index is truly unused
        2. Check recent queries — seasonal patterns may cause intermittent use
        3. Drop in non-peak hours
        4. Monitor for query regression after dropping

---

## Rationale

Unused indexes are pure cost: they increase write amplification, consume storage and buffer pool, and add vacuum/maintenance overhead. Unique constraint indexes are the main exception — they serve data integrity even without query scans.

---

## Recommended Default

**Default:** Drop unused non-unique indexes after verification
**Reason:** Unused indexes provide no benefit while adding measurable write overhead.

---

## Risks Of Wrong Choice

Keeping unused indexes: ongoing write performance penalty, wasted storage. Dropping a used index: risk of query regression if usage statistics are misleading (e.g., after restart or stats reset).

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Maintain and Rebuild Indexes for Bloat Management
