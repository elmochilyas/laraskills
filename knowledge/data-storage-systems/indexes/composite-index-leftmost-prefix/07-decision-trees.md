# 3-8 Composite Index Leftmost Prefix - Decision Trees

## Composite Index Column Ordering Strategy

---

## Decision Context

Determining the optimal column order in a composite B-Tree index given query patterns (WHERE, ORDER BY, JOIN).

---

## Decision Criteria

* performance: leftmost prefix rule, selectivity, index-only scans
* architectural: query coverage, avoiding redundant indexes
* maintainability: fewer indexes = less write amplification

---

## Decision Tree

Need to order columns in a composite index on (col_a, col_b, col_c)?

↓

Identify column usage in target queries:

- Equality: `WHERE col = ?`
- Range: `WHERE col > ?`, `col BETWEEN ? AND ?`
- Sort: `ORDER BY col`

↓

Are there columns used in equality conditions?

YES → Place all equality columns first (order among them by selectivity: highest first)

    ↓
    Are there range columns?
    
    YES → Place range column(s) next (one range column per index)
    
        ↓
        Are there sort columns?
        
        YES → Place sort column(s) last (matches ORDER BY direction)
        
            ↓
            Include remaining columns in INCLUDE for index-only scans
        
        NO → Done
    
    NO → Are there sort columns?
    
        YES → Place sort columns after equality columns
        
        NO → Done

NO → Only range and/or sort columns?

    YES → Leading column should be the most selective or the range column used most frequently

---

## Rationale

Equality columns narrow the search space to exact matches before anything else. Range columns then scan within those matches. Sort columns at the end eliminate the need for an external sort. This ordering maximizes the number of query patterns a single index serves.

---

## Recommended Default

**Default:** (equality_1, equality_2, ..., range_column, sort_column) with highest-selectivity equality first
**Reason:** Equality first reduces the search space most efficiently. Range/sort can only use one column each per query for index optimization.

---

## Risks Of Wrong Choice

Range column before equality: the index scans a wider range for each equality value because the equality condition isn't applied until after the range scan. Ignoring leftmost prefix: creating (a, b, c) but never querying 'a' means the index is never used.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions
* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design Composite Indexes with Correct Leftmost Prefix
* Apply Composite Index Selectivity Principles

---

## One Composite vs Multiple Single-Column Indexes

---

## Decision Context

Deciding whether to create one composite index or multiple single-column indexes for queries filtering by different column combinations.

---

## Decision Criteria

* performance: MySQL uses only one index per table (generally), PostgreSQL can combine
* architectural: index maintenance overhead, storage
* maintainability: fewer indexes = simpler schema

---

## Decision Tree

Need to index multiple columns for different query patterns?

↓

What database?

↓

MySQL (typically uses only one index per table per query)?

YES → Prefer composite indexes

    ↓
    For multiple query patterns, create separate composites:
    - Index (a, b) for queries WHERE a = ? AND b = ?
    - Index (a, c) for queries WHERE a = ? AND c = ?
    - Index (b) for queries WHERE b = ? (if not covered by leftmost prefix)
    
    Avoid: single-column indexes on (a), (b), (c) — MySQL can only use one

NO → PostgreSQL (can combine multiple indexes with Bitmap Scan)?

    YES → Both strategies work
    
        ↓
        Composite (a, b) is still better for queries using both columns
        
        Multiple single-column indexes work well for independent column filters
        
        ↓
        Consider:
        - Composite if columns are always queried together
        - Single-column if columns are queried independently
        - Both if some queries need combined filters and others single-column

---

## Rationale

MySQL's optimizer typically picks only one index per table. PostgreSQL can combine multiple indexes using bitmap scans. On PostgreSQL, having indexes on (a), (b), (c) separately can serve queries on any combination, but a composite (a, b, c) is still faster when all columns are used together.

---

## Recommended Default

**Default:** Composite indexes (designed for specific query patterns) over multiple single-column indexes
**Reason:** Composites serve the exact query pattern more efficiently. Single-column indexes are more flexible but cover fewer combined-filter scenarios well.

---

## Risks Of Wrong Choice

Single-column indexes in MySQL: optimizer picks one index, leaving others unused. Composite indexes for every combination: too many indexes, write amplification, storage waste.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design Composite Indexes with Correct Leftmost Prefix
* Design B-Tree Indexes for Equality and Range Queries

---

## Including Non-Key Columns for Index-Only Scans

---

## Decision Context

Deciding whether to include extra columns in a composite index (via INCLUDE in PostgreSQL or as key columns in MySQL) to enable index-only scans.

---

## Decision Criteria

* performance: index-only scans avoid heap lookups
* architectural: PostgreSQL INCLUDE vs MySQL key columns
* maintainability: larger index = more write amplification
* security: none

---

## Decision Tree

Need to add columns to enable index-only scans?

↓

Does the query's SELECT list reference columns not in the WHERE clause?

YES → Can these columns be added to the index?

    ↓
    PostgreSQL?
    
    YES → Use INCLUDE clause (non-key columns)
        
        ↓
        Advantages: INCLUDE columns don't affect index ordering or uniqueness
        They don't count toward the index key limit
        
        ↓
        CREATE INDEX ON table (a, b) INCLUDE (c, d)
        
    NO → MySQL?
    
        YES → Add as additional key columns (or use a covering index)
            
            ↓
            Increases key size, affects ordering
            Only add if index-only scan savings outweigh write overhead
            Consider selective addition: only add frequently-queried columns

NO → No (SELECT only uses indexed columns)?

    YES → Index-only scan will work without additional columns (index is already covering)

---

## Rationale

Index-only scans read only from the index, avoiding the expensive heap/page lookup. PostgreSQL's INCLUDE clause adds columns without affecting key order — the columns don't participate in sorting or uniqueness but are available for index-only scans.

---

## Recommended Default

**Default:** PostgreSQL: use INCLUDE for extra columns; MySQL: add key columns sparingly
**Reason:** INCLUDE columns in PostgreSQL are low-cost. In MySQL, extra key columns increase index size and affect ordering — only add when the query pattern justifies it.

---

## Risks Of Wrong Choice

Not including columns: queries fall back to heap lookups, doubling I/O per row. Including too many columns: index bloat, reduced write throughput, slower index maintenance.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design Composite Indexes with Correct Leftmost Prefix
* Use Covering Indexes for Index-Only Scans
