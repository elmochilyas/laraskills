# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Singleton Resource Controllers
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Singleton vs Resource Controller Decision

---

## Decision Context

Choosing between `Route::singleton()` for one-to-one relationships and `Route::apiResource()` for standard one-to-many resources.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the resource have exactly one instance per parent context (one-to-one)?
├── YES → Is the one-to-one relationship guaranteed by the domain?
│   ├── YES → Use `Route::singleton()` — no ID parameter in URL
│   └── NO → Could the domain evolve to allow multiple instances?
│       ├── YES → Use `Route::apiResource()->only()` (safer for future)
│       └── NO → Use `Route::singleton()`
└── NO → Use `Route::apiResource()` or `Route::resource()`

Will the singleton always exist after the parent is created?
├── YES → Use `Route::singleton()` without `creatable()`
├── NO → Use `Route::singleton()->creatable()` (adds create/store routes)
└── Not sure → Use `->creatable()` (better to have unused routes than 404s)

---

## Rationale

`Route::singleton()` removes the `{id}` parameter from the URL entirely, producing cleaner URLs like `/users/{user}/profile`. The framework resolves the singleton via the parent model's relationship method.

---

## Recommended Default

**Default:** `Route::singleton()` for one-to-one relationships; `->creatable()` when resource may not exist
**Reason:** Cleaner URL structure; communicates one-to-one domain constraint.

---

## Risks Of Wrong Choice

Singleton for one-to-many breaks when domain allows multiple instances. Non-creatable singleton on missing resource returns 404. Relationship name mismatch causes 500 error.

---

## Related Rules

* Use Route::singleton() For One-To-One Resources
* Align Relationship Method Name With Singleton Name
* Eager-Load Singleton On Parent Queries
* Use creatable() Only When Resource May Not Exist

---

## Related Skills

* Implement Singleton Resource Controllers for One-Per-Parent Resources
