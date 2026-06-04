# 3-26 Index Alignment With Query Patterns - Decision Trees

## Full Query Alignment: Filter + Sort + Cover

---

## Decision Context

Designing an index that aligns with all aspects of a query: WHERE conditions, ORDER BY direction, and SELECT columns for maximum performance.

---

## Decision Criteria

* performance: index that covers filter + sort + select eliminates table access and sort
* architectural: index design must match the exact query pattern
* maintainability: larger composite index may not serve other patterns

---

## Decision Tree

Designing an index for a specific query?

↓

Analyze the query:

`SELECT col_a, col_b FROM table WHERE col_x = ? AND col_y > ? ORDER BY col_z DESC LIMIT 10`

↓

Classify each column:

- WHERE equality: col_x
- WHERE range: col_y
- ORDER BY: col_z DESC
- SELECT: col_a, col_b

↓

Build the index:

`INDEX (col_x, col_y, col_z DESC) INCLUDE (col_a, col_b)`

↓

Check:

- col_x (equality) → first
- col_y (range) → second  
- col_z DESC (sort) → last, matching direction
- col_a, col_b → INCLUDE for covering

↓

Will this serve the query?

YES → Index-only scan, no filesort, minimal I/O

NO → Re-evaluate column order

---

## Rationale

A fully aligned index handles filtering (tree traversal), sorting (index order), and data retrieval (index leaves) — all from the index alone. This is the most efficient possible query execution, often 10-100x faster than unaligned alternatives.

---

## Recommended Default

**Default:** Match index order to query: equality → range → sort; INCLUDE for SELECT columns
**Reason:** This ordering maximizes the index's ability to serve all parts of the query.

---

## Risks Of Wrong Choice

Index with only WHERE columns: database still sorts results (filesort). Index without SELECT columns: database does heap fetches for each matching row. Index with wrong sort direction: database may not use index for ORDER BY.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design Composite Indexes with Correct Column Ordering
* Use Covering Indexes for Index-Only Scans
