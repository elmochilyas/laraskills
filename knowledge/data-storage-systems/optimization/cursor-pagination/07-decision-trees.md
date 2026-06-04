# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-17 Cursor Pagination
**Generated:** 2026-06-03

---

# Decision Inventory

* Cursor vs offset pagination
* Cursor column selection
* API pagination strategy

---

# Architecture-Level Decision Trees

---

## Pagination Strategy Selection

---

## Decision Context

Choosing between cursor-based (O(1) per page) and offset-based (O(N) per page) pagination based on dataset size and UX requirements.

---

## Decision Criteria

* performance: cursor pagination is O(1) regardless of page depth; offset slows with depth
* architectural: cursor requires a unique, ordered column; offset does not
* maintainability: cursor doesn't support "Go to page 5" — only next/prev
* security: no direct impact

---

## Decision Tree

Pagination needed for a large dataset?
↓
Is "Go to page N" user experience required?
YES → Use offset paginate() — numbered pages
    → Accept O(N) performance on deep pages (>100)
    → Mitigate: limit max page number; use search filters
NO → Use cursorPaginate() — infinite scroll / load more
    ↓
    Is there a unique, ordered column (id, created_at)?
    YES → Cursor on id or created_at
        → O(1) performance regardless of depth
        → Stable sort — no row duplication or skipping
    NO → May need composite cursor (status, id)
        → Unique column required for stable pagination

---

## Rationale

Cursor pagination provides constant-time performance for any page depth, making it ideal for API endpoints and infinite scroll. Offset pagination is required for numbered page navigation but degrades on deep pages. For large datasets, cursor pagination should be the default.

---

## Recommended Default

**Default:** cursorPaginate() for APIs, paginate() only when numbered pages are required
**Reason:** Cursor pagination is O(1) regardless of page depth. Offset pagination is O(N) and slows linearly with page number.

---

## Risks Of Wrong Choice

* Cursor on non-unique column: inconsistent pagination results
* Offset on large dataset: deep pages become extremely slow
* Cursor for numbered navigation: not supported — requires offset

---

## Related Rules

* Always use a unique, ordered column for cursor pagination
* Prefer cursor pagination for API endpoints with large datasets

---

## Related Skills

* Implement cursor pagination for scalable APIs
