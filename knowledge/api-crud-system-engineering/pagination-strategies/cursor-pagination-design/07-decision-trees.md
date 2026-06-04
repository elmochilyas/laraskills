# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Cursor Pagination Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Cursor vs Offset Decision

---

## Decision Context

Choosing between cursor pagination and offset pagination for a given endpoint based on dataset characteristics and client requirements.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Does the client require random page access ("jump to page N")?
├── YES → Use Offset Pagination (paginate())
└── NO → Is the dataset expected to grow beyond 5,000 records?
    ├── YES → Is the data real-time with frequent concurrent writes?
    │   ├── YES → Use Cursor Pagination (cursorPaginate())
    │   └── NO → Is the sort order by relevance score (search results)?
    │       ├── YES → Use Offset Pagination
    │       └── NO → Use Cursor Pagination
    └── NO → Does the client need a total count or "Page X of Y" display?
        ├── YES → Use Offset Pagination with simplePaginate()
        └── NO → Use Cursor Pagination

---

## Rationale

Cursor pagination provides O(1) performance at any depth and immunity to phantom reads, making it ideal for growing datasets and real-time feeds. Offset pagination is only preferable when random page access or total count is required.

---

## Recommended Default

**Default:** Cursor Pagination for new endpoints unless random page access is explicitly required
**Reason:** Most datasets grow unboundedly; cursor handles growth gracefully from day one.

---

## Risks Of Wrong Choice

Offset on unbounded datasets causes deep-page timeouts. Cursor on admin panels frustrates users needing page jumping. Search relevance scores invalidate cursor positions.

---

## Related Rules

* Always Include a Tiebreaker Column
* Expose Only Cursor Parameters, Not Page Numbers
* Use cursorPaginate() Over Manual Cursor Construction

---

## Related Skills

* Implement Cursor-Based Pagination for Stable, Performant Ordering

---

## Tiebreaker Column Decision

---

## Decision Context

Deciding whether a tiebreaker column (typically primary key) is needed in the ORDER BY clause for cursor pagination.

---

## Decision Criteria

* performance
* maintainability
* reliability

---

## Decision Tree

Is the primary sort column guaranteed unique (e.g., UNIQUE constraint)?
├── YES → Does the sort column have a UNIQUE index?
│   ├── YES → Tiebreaker is optional (but still recommended for safety)
│   └── NO → Always add primary key as tiebreaker
└── NO → Always add primary key as tiebreaker

---

## Rationale

Without a tiebreaker, multiple records sharing the same sort value create non-deterministic page boundaries, causing records to appear on multiple pages or be skipped entirely. The primary key guarantee deterministic ordering.

---

## Recommended Default

**Default:** Always include primary key as final ORDER BY column
**Reason:** Even with apparently unique columns, the tiebreaker guarantees determinism at near-zero cost.

---

## Risks Of Wrong Choice

Non-deterministic ordering; duplicate records across pages; skipped records; confusing UX.

---

## Related Rules

* Always Include a Tiebreaker Column

---

## Related Skills

* Implement Multi-Column Cursors for Stable Pagination on Non-Unique Sort Columns
