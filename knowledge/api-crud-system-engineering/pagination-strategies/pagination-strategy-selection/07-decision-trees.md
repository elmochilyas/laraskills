# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Pagination Strategy Selection
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Offset vs Cursor vs Keyset Selection

---

## Decision Context

Choosing the primary pagination strategy for a given API endpoint based on dataset characteristics, access patterns, consistency requirements, and client capabilities.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Is random page access or exact total count required by the client?
├── YES → Is the dataset bounded (<5,000 records)?
│   ├── YES → Use Offset Pagination (paginate())
│   └── NO → Are sort column values acceptable to expose?
│       ├── YES → Use Keyset Pagination (WHERE-based)
│       └── NO → Use Offset with maximum page limit + plan cursor migration
└── NO → Is the dataset real-time with high write concurrency?
    ├── YES → Use Cursor Pagination (cursorPaginate())
    └── NO → Is the dataset expected to grow beyond 10K records?
        ├── YES → Use Cursor Pagination
        └── NO → Use Offset or Keyset based on transparency needs

---

## Rationale

Cursor pagination handles unbounded growth gracefully with O(1) performance at any depth. Offset pagination's simplicity is only valuable where its limitations (deep-offset O(N) performance, phantom reads) don't apply. Keyset pagination provides transparency suitable for internal APIs.

---

## Recommended Default

**Default:** Cursor Pagination for new public endpoints; Offset for admin panels with page selectors
**Reason:** Most datasets grow unboundedly; cursor avoids costly migration later.

---

## Risks Of Wrong Choice

Offset on unbounded datasets causes performance degradation at depth. Cursor on admin panels frustrates users who need page jumping. Keyset on public APIs exposes sort column values and may leak business intelligence.

---

## Related Rules

* Default to Cursor Pagination for New Endpoints
* Choose Strategy Per Resource, Not Per Developer Preference
* Reserve Offset for Bounded Datasets With Random Access Requirements

---

## Related Skills

* Set Up Pagination Strategy Selection
* Implement Cursor-Based Pagination

---

## Hybrid Strategy Decision

---

## Decision Context

Deciding whether to use a single pagination strategy across all endpoints or a hybrid approach with different strategies per resource.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Do different resources in the API have significantly different data characteristics?
├── YES → Do some resources need random access and others need sequential?
│   ├── YES → Hybrid: Offset for admin grids, Cursor for feeds
│   └── NO → Does the API serve mixed client types (mobile + admin)?
│       ├── YES → Hybrid: Cursor for mobile, Offset for admin
│       └── NO → Single strategy for simplicity
└── NO → Is the single dataset expected to grow across all endpoints?
    ├── YES → Cursor for all endpoints
    └── NO → Offset for all endpoints (small, stable datasets)

---

## Rationale

Different resources have different pagination requirements — an activity feed needs cursor (high write concurrency), a user admin list needs offset (random access). A one-size-fits-all strategy creates unnecessary problems for some endpoints.

---

## Recommended Default

**Default:** Hybrid with per-resource strategy configuration
**Reason:** Matches strategy to data characteristics without over-engineering.

---

## Risks Of Wrong Choice

Single offset strategy causes feed duplicates and deep-page slowdowns. Single cursor strategy frustrates admin panel users. Inconsistent hybrid without documentation confuses clients.

---

## Related Rules

* Choose Strategy Per Resource, Not Per Developer Preference
* Document Pagination Approach Per Endpoint

---

## Related Skills

* Hybrid Pagination Configuration
* Pagination Parameter Validation
