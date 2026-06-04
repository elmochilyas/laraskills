# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Nested Resources & Shallow Nesting
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Nesting Depth and Shallow Decision

---

## Decision Context

Choosing the nesting strategy for related resources — shallow, full nesting, or top-level with parent ID parameter.

---

## Decision Criteria

* architectural
* security
* maintainability

---

## Decision Tree

Is there a parent-child relationship between resources?
├── YES → How many levels of nesting are needed?
│   ├── 1 level → Use `Route::apiResource('parent.child', ...)`
│   │   └── Are child IDs globally unique (UUID/ULID)?
│   │       ├── YES → Add `->shallow()` (cleaner URLs, fewer queries)
│   │       └── NO → Standard nesting (include parent in all routes)
│   ├── 2 levels → Use shallow at first boundary, then second level
│   └── 3+ levels → Restructure: break into separate shallow pairs
└── NO → Use top-level resource routes without nesting

For shallow routes, is parent-child ownership verified?
├── YES → Ownership check in policy or controller action
└── NO → Add ownership verification (shallow removes parent URL context)

---

## Rationale

Shallow nesting removes the parent parameter from show/update/destroy routes since child IDs are globally unique, producing cleaner URLs and reducing unnecessary parent model resolution. Deep nesting (3+ levels) should be restructured.

---

## Recommended Default

**Default:** `->shallow()` on all nested API routes with parent-child ownership verification in policies
**Reason:** Cleaner URLs, fewer DB queries, requires explicit ownership check.

---

## Risks Of Wrong Choice

Deep nesting (3+ levels) produces fragile, expensive URLs. No ownership check on shallow routes allows cross-parent access. Non-shallow nesting with UUID child IDs unnecessarily includes parent context.

---

## Related Rules

* Use Shallow Nesting By Default For API Routes
* Validate Parent-Child Ownership In Policies
* Limit Nesting To One Level Maximum
* Always Pair Shallow With Scoped Bindings

---

## Related Skills

* Keep Nested Resource Routes Shallow (Max One Level Deep)
