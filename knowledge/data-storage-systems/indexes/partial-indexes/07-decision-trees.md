# 3-11 Partial Indexes - Decision Trees

## Partial Index vs Full Index for Filtered Queries

---

## Decision Context

Choosing between a partial index (indexing only a subset of rows) and a full index when queries always include a filter condition.

---

## Decision Criteria

* performance: partial index is smaller, faster to maintain
* architectural: PostgreSQL only (MySQL lacks partial indexes)
* maintainability: query must imply the index predicate
* security: partial indexes can enforce RLS alignment

---

## Decision Tree

Need an index on a table where most queries filter by a status/flag column?

↓

What percentage of rows match the filter?

↓

< 30% of rows (e.g., only active records, unprocessed items)?

YES → Partial index is beneficial

    ↓
    `CREATE INDEX ON orders (tenant_id, created_at) WHERE status = 'pending'`
    
    ↓
    Smaller index (20% of rows = ~20% size)
    Faster writes (only index matching rows)
    Faster reads (smaller tree to traverse)
    
    ↓
    Is the filter column volatile (frequently changed)?
    
    YES → Each change requires delete+insert in the partial index
        → Evaluate if maintenance overhead exceeds benefit
    
    NO → Good candidate for partial index

NO → > 70% of rows match the filter?

    YES → Full index is better (partial has little savings)
    
    NO → 30-70% of rows?
    
        YES → Depends on use case
            If the filtered subset is the "hot" data and the rest is rarely accessed, partial may still help

---

## Rationale

A partial index on 20% of rows is ~20% the size of a full index. Write maintenance is similarly reduced. However, if the filter predicate matches most rows, a full index is similar in cost but simpler and more flexible.

---

## Recommended Default

**Default:** Partial index when filtered subset is < 30% of rows and filter column is stable
**Reason:** Maximum benefit (size and speed) with minimum maintenance overhead.

---

## Risks Of Wrong Choice

Partial index on volatile column: high index churn as rows enter and leave the indexed set. Partial index with predicate that doesn't match query patterns: index is never used, wasted effort.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Apply Partial Indexes for Targeted Data Subsets
* Design Composite Indexes with Correct Column Ordering

---

## Partial Index vs Condition in Query

---

## Decision Context

Deciding how to structure the WHERE predicate in a partial index so that the query planner can recognize and use it.

---

## Decision Criteria

* performance: query predicate must imply the index predicate
* architectural: PostgreSQL can imply subset predicates
* maintainability: query changes may break index usage
* security: none

---

## Decision Tree

Creating a partial index — what predicate to use?

↓

Does the query always filter by the same condition?

YES → Use that exact condition as the index predicate

    ↓
    Query: `WHERE status = 'active' AND tenant_id = ?`
    Index: `WHERE status = 'active'` → works (implied)
    
    ↓
    Does the query use `IN` or OR on the filtered column?
    
    `WHERE status IN ('active', 'pending')` → does NOT match `WHERE status = 'active'`
    → Consider removing the partial condition and using a full index

NO → Query uses multiple possible filter values?

    YES → Can the index be on the most common value only?
    
        Partial on common value + full index for other values
        Or: full index (simpler, broader coverage)

---

## Rationale

PostgreSQL matches queries to partial indexes by checking if the query's WHERE clause implies the index predicate. Simple equality predicates (`status = 'active'`) are easily implied. Complex predicates (`status IN (...)`) may not match.

---

## Recommended Default

**Default:** Match the partial index predicate exactly to the most common query filter value
**Reason:** This ensures the planner can recognize and use the index for the most common access pattern.

---

## Risks Of Wrong Choice

Predicate too narrow: index only used by queries matching exact predicate. Predicate too broad: partial index size approaches full index, losing benefit.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Apply Partial Indexes for Targeted Data Subsets
