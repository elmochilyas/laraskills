# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Pagination Metadata Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Paginator Type Selection

---

### Decision Context

Choosing between `LengthAwarePaginator`, `SimplePaginator`, and `CursorPaginator` based on client requirements and dataset characteristics.

---

### Decision Criteria

* performance
* architectural
* maintainability

---

### Decision Tree

Does the client need page-number navigation (page selector UI, "Page 3 of 20")?
├── YES → Use `LengthAwarePaginator`
│   ├── Is the table large (>1M rows)?
│   │   ├── YES → Consider cursor pagination with total approximation; or cache the count
│   │   └── NO → Standard offset pagination is acceptable
│   └── Does the dataset churn frequently?
│       ├── YES → Consider cursor pagination instead (avoids phantom reads)
│       └── NO → Offset pagination is fine
└── NO → Is the client an infinite scroll UI or activity feed?
    ├── YES → Use `CursorPaginator` (constant query cost, stable pages)
    └── NO → Does the client only need prev/next navigation?
        ├── YES → Use `SimplePaginator` (no count query, lightweight)
        └── NO → Use `LengthAwarePaginator` as default

---

### Rationale

`LengthAwarePaginator` provides full metadata but requires `COUNT(*)`. `CursorPaginator` has constant query cost but no page numbers. `SimplePaginator` is a middle ground with no totals but no count query. Matching paginator type to use case optimizes performance.

---

### Recommended Default

**Default:** `LengthAwarePaginator` for admin/search UIs; `CursorPaginator` for feeds/infinite scroll; `SimplePaginator` for simple prev/next
**Reason:** Choosing the cheapest paginator that meets client requirements avoids unnecessary database cost.

---

### Risks Of Wrong Choice

`LengthAwarePaginator` on large tables causes count-query bottlenecks. `CursorPaginator` on admin UIs prevents page-number navigation. Inconsistent paginator types across endpoints confuse clients.

---

### Related Rules

* Match Paginator Type to Use Case
* Always Include Standardized Pagination Fields in `meta`

---

### Related Skills

* Design Pagination Metadata Keys Consistently Across All Endpoints
* Offset Pagination Design

---

---

## `total` Field Inclusion Strategy

---

### Decision Context

Deciding whether to include the `total` field in paginated responses based on client needs and the performance cost of the count query.

---

### Decision Criteria

* performance
* architectural

---

### Decision Tree

Does the client need the total record count for UI display or progress tracking?
├── YES → Is the count query cheap (small table, indexed filter)?
│   ├── YES → Include `total` in every paginated response
│   └── NO → Consider alternatives:
│       ├── Cached count (updated periodically, approximate)
│       ├── Approximate count (EXPLAIN estimate, table stats)
│       └── Omit `total` and document its absence
└── NO → Omit `total` from the response
    ├── Are there any consumers that silently depend on `total`?
    │   ├── YES → Dual-emit: include `total` while warning clients of planned removal
    │   └── NO → Remove safely

---

### Rationale

`total` requires `SELECT COUNT(*)` which is the dominant cost in paginated responses for large tables. Cursor pagination avoids this entirely. The decision to include `total` should balance client utility against database cost.

---

### Recommended Default

**Default:** Include `total` for `LengthAwarePaginator` (it's the primary use case); omit for `CursorPaginator` and `SimplePaginator`
**Reason:** The paginator type selection already implies whether `total` is available; document its presence in the API spec.

---

### Risks Of Wrong Choice

Missing `total` causes client UI bugs ("Page 1 of undefined"). Including `total` on every cursor-paginated request defeats cursor pagination's performance advantage.

---

### Related Rules

* Document Whether `total` Is Available
* Always Enforce a Maximum `per_page`

---

### Related Skills

* Cursor Pagination Metadata
* Pagination Information Customization

---

---

## Field Name Standardization

---

### Decision Context

Choosing consistent pagination metadata field names across all paginated endpoints regardless of paginator type.

---

### Decision Criteria

* maintainability
* reliability

---

### Decision Tree

Are there existing clients consuming the default Laravel paginator keys?
├── YES → Do the default keys match the API's naming convention?
│   ├── YES → Keep default keys for backward compatibility
│   └── NO → Use `paginationInformation()` to rename — use dual-emit during migration
└── NO → Choose a naming convention and apply universally
    ├── snake_case (default Laravel): `current_page`, `per_page`, `total`
    ├── camelCase (JS convention): `currentPage`, `perPage`, `total`
    └── Is the naming convention consistent with the rest of the API?
        ├── YES → Good — apply to all paginated endpoints
        └── NO → Standardize across both resource fields and pagination fields

---

### Rationale

Inconsistent pagination field names across endpoints force clients to conditional-parse or maintain endpoint-specific pagination handlers. Standardized names enable a single client-side parser for all paginated endpoints.

---

### Recommended Default

**Default:** snake_case (`current_page`, `per_page`, `total`, `last_page`) unless the API uses camelCase for resource fields
**Reason:** snake_case matches Laravel defaults (less customization needed) and JSON conventions.

---

### Risks Of Wrong Choice

Different field names per endpoint force client-side conditional parsing. Renaming fields without dual-emit breaks existing clients silently.

---

### Related Rules

* Standardize Pagination Field Names Across All Endpoints
* Never Expose Raw Paginator Output Directly

---

### Related Skills

* Pagination Information Customization
* Top-Level Meta and Links
