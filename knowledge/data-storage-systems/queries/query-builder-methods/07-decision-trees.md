# 2-10 Query Builder Methods - Decision Trees

## Explicit Select vs SELECT *

---

## Decision Criteria

* performance: explicit select reduces data transfer; SELECT * over-fetches
* architectural: explicit select documents intent
* maintainability: easier to see what's used

---

## Decision Tree

Building a query — specify columns or SELECT *?

↓

Is this a list endpoint or reporting query?

YES → Use explicit select: `->select('id', 'name', 'email')`

    ↓
    Only fetch what you need
    Reduces memory and response size
    
    Exception: when you need all columns (full model hydration), SELECT * is fine

NO → Single-record lookup or all columns needed?

    → SELECT * is acceptable (small result set)

---

## Recommended Default

**Default:** Always use explicit `select()` for list/reporting queries
**Reason:** Prevents over-fetching, documents which columns are needed.

---

## Pagination: offset vs cursor

---

## Decision Context

Choosing between offset-based pagination (limit/offset) and cursor-based pagination.

---

## Decision Criteria

* performance: offset skips rows (slow on deep pages); cursor uses index
* architectural: cursor requires sortable unique column
* maintainability: offset is simpler

---

## Decision Tree

Paginating results?

↓

Will pages be deep (page 1000+)?

YES → Use cursor pagination

    ↓
    `User::orderBy('id')->cursorPaginate(15)`
    
    ↓
    No offset, no skipped rows
    Uses WHERE id > ? LIMIT 15 pattern
    Stable under concurrent writes

NO → Small result set or shallow pages?

    → Use offset pagination (simple)
    
    `User::paginate(15)`

---

## Recommended Default

**Default:** `paginate()` for shallow pages; `cursorPaginate()` for deep pages
**Reason:** Offset pagination degrades on deep pages. Cursor pagination is O(1) per page.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Optimize Pagination with Cursor-Based Approaches
