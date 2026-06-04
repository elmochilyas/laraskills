# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Partial Resource Routes
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Action Whitelisting Decision

---

## Decision Context

Choosing which resource actions to register via `only()` and how to handle custom non-CRUD actions alongside resource routes.

---

## Decision Criteria

* architectural
* security
* maintainability

---

## Decision Tree

Does the resource need all standard CRUD actions?
├── YES → Use `Route::apiResource()` without `only()`
└── NO → Which actions does it need?
    ├── Read-only → `only(['index', 'show'])`
    ├── Write-only → `only(['store', 'update', 'destroy'])`
    ├── List-only → `only(['index'])`
    └── Custom set → `only(['index', 'store', 'show'])`

Are there custom non-CRUD actions (search, restore, archive)?
├── YES → Register custom routes BEFORE the resource route
│   └── Remove controller methods excluded by `only()` to avoid dead code
└── NO → Standard partial resource route is sufficient

---

## Rationale

`only()` self-documents exactly what the controller supports. Custom routes must appear before the resource route to prevent wildcard parameter capture. Dead methods should be removed.

---

## Recommended Default

**Default:** `Route::apiResource()->only()` with custom routes before the resource declaration
**Reason:** Explicit whitelisting prevents unintended route registration.

---

## Risks Of Wrong Choice

Custom routes after resource route are captured by wildcard `{resource}` parameter, causing 404s. Dead controller methods confuse maintainers. `except()` for security is not authorization.

---

## Related Rules

* Prefer only() Over except() For Route Filtering
* Register Custom Routes Before Resource Routes
* Remove Controller Methods Excluded By only()
* Use Route::apiResource()->only() For APIs

---

## Related Skills

* Register Only Required Resource Routes with Partial Definitions
