# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Offset Pagination Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Parameter Naming Convention

---

## Decision Context

Choosing between `page`/`per_page` and `offset`/`limit` parameter naming for offset-paginated endpoints.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Is the API public-facing and consumed by external developers?
├── YES → Use `page`/`per_page` naming (Laravel/JSON:API convention)
└── NO → Is the API internal/gRPC-like?
    ├── YES → Use `offset`/`limit` naming (database-idiomatic)
    └── NO → Is there an established legacy convention?
        ├── YES → Match existing convention for consistency
        └── NO → Use `page`/`per_page` (safer default for future public use)

---

## Rationale

Public APIs benefit from `page`/`per_page` as it is more user-friendly and matches Laravel and JSON:API conventions. Internal APIs can use `offset`/`limit` which is more database-idiomatic and familiar to backend developers.

---

## Recommended Default

**Default:** `page`/`per_page` for all public-facing REST APIs
**Reason:** More user-friendly, matches Laravel defaults, consistent with industry standards.

---

## Risks Of Wrong Choice

Mixing naming conventions across endpoints confuses clients. Using `offset`/`limit` on public APIs creates a steeper learning curve for external developers.

---

## Related Rules

* Use page/per_page Naming for Public APIs
* Enforce a Maximum per_page Limit

---

## Related Skills

* Implement Offset Pagination with Standard Page Number and Limit

---

## Simple vs Full Pagination Selection

---

## Decision Context

Choosing between `paginate()` (with total count) and `simplePaginate()` (without total count) for offset-paginated endpoints.

---

## Decision Criteria

* performance
* architectural
* security

---

## Decision Tree

Does the client UI display "Page X of Y" or provide a page number selector?
├── YES → Use `paginate()` (includes total count and last_page)
└── NO → Is the endpoint consumed by infinite scroll or "load more" patterns?
    ├── YES → Use `simplePaginate()` (no COUNT(*) query)
    └── NO → Does the table exceed 100K rows where COUNT(*) is expensive?
        ├── YES → Use `simplePaginate()` or cached count
        └── NO → Use `paginate()` for maximum client metadata

---

## Rationale

`paginate()` always executes COUNT(*) which can dominate response time on large tables. `simplePaginate()` eliminates the count entirely. If the client only needs next/prev navigation, the total count query is unnecessary overhead.

---

## Recommended Default

**Default:** `simplePaginate()` for mobile/feed endpoints; `paginate()` for admin panels
**Reason:** Most API consumers don't need total count; eliminating COUNT(*) halves response time.

---

## Risks Of Wrong Choice

Using `paginate()` when total isn't shown wastes database resources. Using `simplePaginate()` when clients need "Page 3 of 247" breaks the UI.

---

## Related Rules

* Use simplePaginate() When Total Count Is Not Required
* Benchmark COUNT(*) Separately From Data Query

---

## Related Skills

* Optimize Total Count Queries for Large Paginated Datasets
