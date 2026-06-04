# 3-27 Soft Delete Column Indexing - Decision Trees

## Partial Index vs Composite Index for Soft Delete Filtering

---

## Decision Context

Choosing between a partial index (WHERE deleted_at IS NULL) and a composite index that includes deleted_at as a column for queries that filter non-deleted rows.

---

## Decision Criteria

* performance: partial index is smaller; composite is more flexible
* architectural: PostgreSQL only for partial indexes
* maintainability: partial index query predicate must match
* security: none

---

## Decision Tree

Table uses SoftDeletes — queries always filter `WHERE deleted_at IS NULL`?

↓

Using PostgreSQL?

YES → Consider partial index

    ↓
    `CREATE INDEX ON orders (tenant_id, status) WHERE deleted_at IS NULL`
    
    ↓
    Benefits:
    - Only indexes active rows (typically 50-90% of rows)
    - Smaller index, faster writes
    - No need to include deleted_at in index columns
    
    ↓
    Constraint: query must imply the predicate:
    `WHERE tenant_id = ? AND status = ? AND deleted_at IS NULL` → matches
    `WHERE tenant_id = ? AND deleted_at IS NULL` → matches

NO → MySQL or need more flexibility?

    YES → Use composite index with deleted_at as last column
    
        ↓
        `INDEX (tenant_id, status, deleted_at)`
        
        ↓
        Benefits:
        - Works on both MySQL and PostgreSQL
        - Also covers queries that filter by deleted_at value (e.g., trashed items)
        - Simpler to understand
        
        ↓
        Tradeoff: larger index (includes all rows, not just active)

---

## Rationale

Partial indexes are ideal for the common case where 90% of rows are active. The index is 10x smaller. However, when soft-deleted rows are the majority (e.g., most orders are completed), a partial index on non-deleted is still valuable (filtering to the minority active set). Composite indexes work everywhere but include all rows.

---

## Recommended Default

**Default:** PostgreSQL: partial index WHERE deleted_at IS NULL; MySQL: composite with deleted_at last
**Reason:** Partial indexes leverage PostgreSQL's unique capability for smaller, faster indexes. MySQL has no alternative.

---

## Risks Of Wrong Choice

Partial index if queries filter by trashed status: WHERE deleted_at IS NOT NULL won't match the partial index — falls back to full scan. Composite on large table with 90% active rows: index is 10x larger than necessary.

---

## Related Rules

* Rule 2: Always index foreign key columns

---

## Related Skills

* Apply Partial Indexes for Targeted Data Subsets

---

## deleted_at Alone vs Composite Integration

---

## Decision Context

Deciding whether to index the `deleted_at` column alone or integrate it into existing composite indexes.

---

## Decision Criteria

* performance: deleted_at alone rarely used (low selectivity)
* architectural: composite integration is almost always better
* maintainability: fewer indexes, same coverage

---

## Decision Tree

Considering an index on deleted_at?

↓

Is deleted_at the only column in the WHERE clause?

YES → Rare case: `WHERE deleted_at IS NOT NULL` (trashed items query)

    ↓
    If trashed items are a small percentage (<10%), partial index helps:
    PostgreSQL: `CREATE INDEX ON orders (deleted_at) WHERE deleted_at IS NOT NULL`
    
    If trashed items are most of the table, no index needed (sequential scan is fine)

NO → deleted_at is part of multi-condition WHERE?

    YES → Integrate into existing composite indexes
    
        ↓
        Existing index: (tenant_id, status)
        Query adds: `AND deleted_at IS NULL`
        
        → Extend index to: (tenant_id, status, deleted_at)
        
        ↓
        Never index deleted_at alone — low selectivity makes it useless as a standalone index
        
        Exception: partial index WHERE deleted_at IS NOT NULL for "show trash" queries

---

## Rationale

`deleted_at IS NULL` as a standalone condition matches 50-100% of rows, making a single-column index on it useless (the optimizer will prefer a table scan over scanning 50%+ of the index). The value comes from integrating deleted_at into composites that already narrow the search space.

---

## Recommended Default

**Default:** Integrate deleted_at as the last column in existing composite indexes; never index alone
**Reason:** deleted_at alone has terrible selectivity. Its value is as a secondary filter in composites.

---

## Risks Of Wrong Choice

Indexing deleted_at alone: wastes storage and write I/O, index is rarely if ever used. Not including deleted_at in composites: the soft delete filter causes residual filtering after the index scan, potentially scanning many extra rows.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design Composite Indexes with Correct Leftmost Prefix
* Apply Partial Indexes for Targeted Data Subsets
