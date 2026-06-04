# 3-18 Composite Index Selectivity - Decision Trees

## High-Cardinality vs Low-Cardinality Leading Column

---

## Decision Context

Choosing the leading column of a composite index based on column cardinality (selectivity) to maximize query pruning.

---

## Decision Criteria

* performance: high-cardinality leading column prunes more rows per index step
* architectural: depends on query patterns — must still respect leftmost prefix
* maintainability: wrong leading column = ineffective index
* security: none

---

## Decision Tree

Which column should be first in a composite index?

↓

Are both columns used in equality conditions?

YES → Compare cardinality (distinct values)

    ↓
    Column A: 1M distinct values (high selectivity)
    Column B: 3 distinct values (low selectivity)
    
    → Index (A, B): A narrows search to ~1 row, then B filters within
    
    → Index (B, A): B narrows to 33% of table, then A searches within that
    
    ↓
    Correct: (A, B) — high-cardinality first

NO → Mixed equality and range?

    YES → Equality columns first (regardless of cardinality)
        
        After equality, then consider selectivity for range column ordering
        
        ↓
        `WHERE status = 'active' AND created_at > '2024-01-01'`
        → Index (status, created_at) — equality first, range second
        
        Even though status has low cardinality, it's the equality filter

NO → Both range columns?

    → Place the more selective range column first (if possible, use separate indexes)

---

## Rationale

A high-cardinality leading column narrows the search space significantly at the first index level. With `(user_id, status)`, a `user_id` lookup immediately narrows to one user's rows. With `(status, user_id)`, you must scan 33% of the index to find active users, then narrow by user_id.

---

## Recommended Default

**Default:** High-cardinality equality column first, then low-cardinality equality, then range
**Reason:** Maximizes early pruning. Exception: if the low-cardinality column is always filtered, it may be beneficial as the leading column to reduce index scans for queries that only filter by it.

---

## Risks Of Wrong Choice

Low-cardinality leading column: index is much less efficient for queries filtering by the high-cardinality column. The optimizer may even choose to ignore the index if the leading column has too few distinct values.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Apply Composite Index Selectivity Principles

---

## Single-Column Low-Cardinality Index vs No Index

---

## Decision Context

Deciding whether to create an index on a low-cardinality column (e.g., status with 3 values) that is used alone in WHERE conditions.

---

## Decision Criteria

* performance: index on low-cardinality column may be ignored by optimizer
* architectural: composite with a high-cardinality column is usually better
* maintainability: unused indexes waste write I/O

---

## Decision Tree

Need to index a low-cardinality column (status, flag, type)?

↓

Is the column used alone in WHERE (no other filtered columns)?

YES → Does the query typically filter by other columns too?

    YES → Create a composite index with the other columns
        Low-cardinality column as second or later position
        
        Example: `WHERE status = 'active' AND user_id = ?`
        → Index (user_id, status) — user_id (high) first, status (low) second
        
    NO → Indexing status alone for `WHERE status = 'active'`?
    
        YES → Is the table large (>100K rows)?
        
            YES → Create the index (may still help for specific status values that match few rows)
                
                Note: if status values are evenly distributed and you query 'active' (33% of rows),
                the optimizer may still do a table scan (cheaper than index scan for large fractions)
                
                Check with EXPLAIN
            
            NO → Don't index (table scan is fine for small tables)

NO → The column is part of a composite index?

    → Already covered — no separate index needed (unless the column needs to be used alone)

---

## Rationale

Indexing a low-cardinality column alone is often wasteful because scanning 30%+ of a table via the index is usually slower than a full table scan (sequential read is faster than random I/O). The main value of low-cardinality columns is as part of composite indexes with more selective columns.

---

## Recommended Default

**Default:** Don't index low-cardinality columns alone; use them in composites with high-cardinality columns
**Reason:** Index on low-cardinality column alone is often not used by the optimizer and wastes write I/O.

---

## Risks Of Wrong Choice

Indexing status alone: wasted storage, write I/O amplification, optimizer may still ignore it. Not indexing at all with composite: queries that only filter by the low-cardinality column may be slower, but a full table scan may be acceptable.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Apply Composite Index Selectivity Principles
