# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Multi-Column Cursor Pagination
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Multi-Column Cursor Necessity

---

## Decision Context

Determining whether a single-column cursor is sufficient or a multi-column composite cursor is required for deterministic pagination.

---

## Decision Criteria

* performance
* maintainability
* reliability

---

## Decision Tree

Is the primary sort column guaranteed unique (UNIQUE constraint)?
├── YES → Single-column cursor is sufficient (tiebreaker still recommended)
└── NO → Does the primary sort column have frequent duplicate values?
    ├── YES → Multi-column cursor required (add tiebreaker PK)
    └── NO → Is the sort dynamic (client specifies sort column)?
        ├── YES → Multi-column cursor is not feasible; use offset or document limitations
        └── NO → Multi-column cursor required (add tiebreaker PK)

Are there more than 4 sort columns needed?
├── YES → Simplify the sort order; 5+ columns cause index bloat and complex WHERE chains
└── NO → Proceed with composite index matching the ORDER BY columns exactly

---

## Rationale

Multi-column cursors are necessary when the primary sort column has duplicates or when sorting by multiple dimensions. The tiebreaker (primary key) must always be the final column to guarantee deterministic ordering. More than 4 columns causes excessive index bloat and unmanageable WHERE complexity.

---

## Recommended Default

**Default:** Always include primary key as tiebreaker; limit composite index to 3-4 columns
**Reason:** Guarantees deterministic ordering; keeps index size and write overhead manageable.

---

## Risks Of Wrong Choice

Single-column cursor on non-unique column causes duplicate/skipped records. 5+ column composite indexes bloat to 100MB+ and slow writes significantly. Dynamic client-specified sort cannot use composite indexes.

---

## Related Rules

* Always Include the Primary Key as the Final Tiebreaker Column
* Place Equality-Filter Columns Before Range/Sort Columns in the Index
* Keep Composite Indexes to 3-4 Columns Maximum
* Use Row Constructor Syntax When Available

---

## Related Skills

* Implement Multi-Column Cursors for Stable Pagination on Non-Unique Sort Columns

---

## Row Constructor vs Nested OR Strategy

---

## Decision Context

Choosing between row constructor syntax `(a, b) > (x, y)` and nested OR WHERE clauses for multi-column cursor queries.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Does the database support row constructor syntax (PostgreSQL, MySQL 8.0+)?
├── YES → Is the ORM/Laravel version compatible with row constructors?
│   ├── YES → Use row constructor syntax (cleaner, optimized for index range scan)
│   └── NO → Fall back to nested OR WHERE chain
└── NO → Use nested OR WHERE chain with explicit tiebreaker conditions

Has the nested OR chain been tested with edge cases?
├── YES → Deploy with EXPLAIN ANALYZE verification
└── NO → Test with all boundary conditions before deploying

---

## Rationale

Row constructor syntax is cleaner and better optimized for composite index range scans in modern databases. Nested OR chains are more portable but error-prone and may not be as well optimized. Laravel's `cursorPaginate()` handles both automatically.

---

## Recommended Default

**Default:** Use Laravel's `cursorPaginate()` which handles multi-column ORDER BY automatically
**Reason:** Avoids manual WHERE construction errors; consistent behavior across database backends.

---

## Risks Of Wrong Choice

Incorrect OR chain construction (wrong operator direction) returns incorrect results. Row constructor on unsupported database versions causes SQL syntax errors. Manual construction without testing produces incorrect pagination at boundaries.

---

## Related Rules

* Use Row Constructor Syntax When Available

---

## Related Skills

* Implement Multi-Column Cursors for Stable Pagination on Non-Unique Sort Columns
