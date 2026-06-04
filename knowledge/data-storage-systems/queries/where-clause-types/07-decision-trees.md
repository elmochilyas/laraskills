# 2-11 Where Clause Types - Decision Trees

## whereDate vs Range Query

---

## Decision Context

Choosing between `whereDate` (convenient but non-sargable) and a range-based date query (sargable).

---

## Decision Criteria

* performance: range query uses index; whereDate does not
* architectural: whereDate generates DATE(col) which wraps column
* maintainability: range syntax is slightly more verbose

---

## Decision Tree

Filtering records by a date column?

↓

`whereDate('created_at', today())` (non-sargable — `DATE(created_at) = ?`)?

YES → Replace with range query

    ↓
    `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`
    
    ↓
    Uses index on created_at
    Same result, different SQL

NO → `whereMonth`, `whereYear`, `whereDay`, `whereTime`?

    YES → All non-sargable — wrap columns in functions
        Replace with range queries where possible

---

## Recommended Default

**Default:** Use `whereBetween` for date filtering; never use `whereDate` on indexed columns
**Reason:** whereDate breaks index usage. Range query is equivalent and index-friendly.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Optimize Query Performance with Sargable WHERE Clauses
