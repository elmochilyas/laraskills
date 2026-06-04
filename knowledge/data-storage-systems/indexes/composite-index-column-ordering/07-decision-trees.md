# 3-9 Composite Index Column Ordering - Decision Trees

## Equality-First vs Range-First Column Ordering

---

## Decision Context

Deciding whether to place equality-filtered columns or range-filtered columns first in a composite B-Tree index.

---

## Decision Criteria

* performance: equality first enables precise tree traversal; range first forces wider scan
* architectural: query pattern dependency — one range column per index
* maintainability: reordering requires dropping and recreating index
* security: none

---

## Decision Tree

Need to order columns in index (col_a, col_b)?

↓

Does the query have equality conditions?

YES → Place equality columns first

    ↓
    Query: `WHERE col_a = ? AND col_b > ?`
    
    Index: (col_a, col_b) → correct! Equality first, range second
    
    Index: (col_b, col_a) → wrong! Range first, equality second — scans wider range

NO → Query has only range/sort conditions?

    YES → Place the most frequently filtered range column first
    
        ↓
        Query: `WHERE col_a > ? AND col_b > ?`
        
        Index: (col_a, col_b) → serves col_a queries, partial for col_b
        
        Consider: two separate indexes or one composite with most-used column first

---

## Rationale

Equality conditions narrow the search to exact key matches using the B-Tree structure. After the first range condition, subsequent columns in the index cannot use exact lookups — they only filter within the already-scanned range.

---

## Recommended Default

**Default:** Equality columns first, then one range column, then sort columns
**Reason:** This maximizes the number of index steps that use exact key lookups before falling back to range scans.

---

## Risks Of Wrong Choice

Range column before equality: the index scans all rows matching the range condition, then applies the equality filter — potentially scanning millions of rows instead of a handful.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design Composite Indexes with Correct Column Ordering

---

## Including ORDER BY Columns in the Index

---

## Decision Context

Deciding whether to add ORDER BY columns to a composite index to avoid filesort (external memory sort).

---

## Decision Criteria

* performance: index-provided sort eliminates filesort, reduces memory/CPU
* architectural: ORDER BY column must be after all equality columns in the index
* maintainability: larger index, may not be used if sort direction mismatches

---

## Decision Tree

Query uses ORDER BY — should the sort column be in the index?

↓

Does the WHERE clause filter by leading index columns?

YES → Add ORDER BY column as the last key column in the index

    ↓
    Ensure sort direction matches (ASC/DESC)
    
    ↓
    `WHERE tenant_id = ? ORDER BY created_at DESC`
    → Index: (tenant_id, created_at DESC)
    → No filesort needed

NO → ORDER BY without WHERE filter?

    YES → Single-column index on the sort column (if ORDER BY is the main access pattern)
    
    NO → Mixed directions?
    
        YES → Descending index for DESC columns (MySQL 8+, PostgreSQL)
            Ascending index for ASC (default)

---

## Rationale

When the ORDER BY column is the last column in the index (after all equality columns), the database finds the matching rows already in sorted order and can return them directly. This eliminates the filesort step, which reads all matching rows into memory and sorts them.

---

## Recommended Default

**Default:** Include the ORDER BY column as the last index column, matching sort direction
**Reason:** Eliminates filesort for common sorted listing queries, especially important for paginated endpoints.

---

## Risks Of Wrong Choice

ORDER BY column not in index: database sorts in memory — may spill to disk for large result sets, causing major performance degradation. Index with wrong direction: PostgreSQL can reverse scan efficiently; MySQL may not use the index for the opposite direction.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design Composite Indexes with Correct Column Ordering
