# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Pagination with Complex Filters
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Filter Application Strategy

---

## Decision Context

Determining where and how to apply filters in paginated queries to ensure correct results and optimal performance.

---

## Decision Criteria

* performance
* security
* maintainability

---

## Decision Tree

Are the filters applied in the database query before pagination?
├── YES → Can the filter columns be indexed?
│   ├── YES → Create composite indexes including filter columns as leading columns
│   └── NO → Is the filter using LIKE '%term%' (full-text search)?
│       ├── YES → Use dedicated search engine (Meilisearch, Algolia, ES) or full-text index
│       └── NO → Test performance; consider limiting this filter combination
└── NO → Are filters applied in application code after fetching the page?
    ├── YES → Critical anti-pattern: Move filters to database query before pagination
    └── NO → Apply filters before pagination (correct approach)

Is the search filter using `LIKE '%term%'`?
├── YES → Replace with prefix search `LIKE 'term%'` or full-text index
└── NO → Standard indexed filter is acceptable

---

## Rationale

Filtering after pagination produces incomplete pages — the query returns per_page records, then the application filter removes some, leaving fewer than per_page visible results. Applying filters in the database before pagination is the only correct approach.

---

## Recommended Default

**Default:** Apply all filters in database query before pagination; use composite indexes with filter columns as leading columns
**Reason:** Produces correct page sizes; enables index utilization; avoids full table scans.

---

## Risks Of Wrong Choice

Filtering after pagination produces incomplete pages. Unindexed filter columns cause full table scans. LIKE '%term%' kills pagination performance on large tables.

---

## Related Rules

* Apply All Filters Before Pagination in the Database
* Index Equality-Filter Columns as Leading Index Columns
* Reset Pagination When Filters Change

---

## Related Skills

* Apply Filters on Paginated Queries Before Pagination Applies

---

## Cursor Invalidation on Filter Change

---

## Decision Context

Handling the scenario where a client changes filter parameters while holding a cursor from a previous filter context.

---

## Decision Criteria

* reliability
* security
* maintainability

---

## Decision Tree

Does the client send both cursor and filter parameters in the same request?
├── YES → Has the filter session hash changed since the cursor was issued?
│   ├── YES → Reject the cursor with 400: "Filters changed. Pagination reset."
│   │   └── Optionally: Reset pagination automatically (return page 1 with new filters)
│   └── NO → Proceed with cursor + filters (consistent session)
└── NO → Only filters changed, no cursor present
    ├── YES → Return page 1 of filtered results (fresh pagination session)
    └── NO → Normal pagination with filters

Are the number of simultaneous filters limited?
├── YES → Validate filter count ≤ max (e.g., 5)
└── NO → Implement filter count limit to prevent abusive query combinations

---

## Rationale

Cursor position is scoped to a specific filter combination. Changing filters while retaining a cursor from a different filter context produces incorrect results — the cursor position is meaningless under different WHERE conditions.

---

## Recommended Default

**Default:** Return 400 error when filters change mid-pagination; use filter session hash for detection
**Reason:** Prevents silent incorrect results; clients understand they need to restart pagination.

---

## Risks Of Wrong Choice

Silently using wrong cursor produces incorrect pagination results. No filter limit allows complex unindexable query combinations for DoS. Reusing cursors across user contexts violates authorization scope.

---

## Related Rules

* Reset Pagination When Filters Change

---

## Related Skills

* Apply Filters on Paginated Queries Before Pagination Applies
