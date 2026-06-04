# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Factory Callbacks
**Generated:** 2026-06-03

---

# Decision Inventory

* afterCreating vs has() for child setup
* Callback placement (configure() vs definition())
* afterCreating vs afterMaking

---

# Architecture-Level Decision Trees

---

## afterCreating vs has() for Child Setup

---

## Decision Context

Choosing between `afterCreating()` callback and `has()` for setting up child relationships.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the child setup a simple HasMany/BelongsToMany relationship?
↓
YES → Use `has()` or `hasAttached()` — declarative, no callback needed
NO → Does the setup require conditional logic or dynamic configuration?
    YES → Use `afterCreating()` — provides full control
    NO → `has()` is simpler — prefer it

---

## Recommended Default

**Default:** `has()` for simple parent-child relationships
**Reason:** Declarative, single-line, and automatically resolves foreign keys.

---

## Risks Of Wrong Choice

Using `afterCreating()` for simple `has()` relationships duplicates what the framework handles declaratively. Using `has()` for complex conditional setup forces workarounds.

---

## Related Rules

* Keep definition() Pure — No Side Effects
* Use afterCreating for Persistence-Dependent Logic

---

## Related Skills

* Implement afterCreating Factory Callback

---

## Callback Placement

---

## Decision Context

Deciding whether to place callbacks in `configure()` or in `definition()`.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the logic post-persistence (requires model ID)?
↓
YES → Register in `configure()` via `afterCreating()` — not in `definition()`
NO → Is the logic pre-persistence setup?
    YES → Can be in `definition()` (attribute array) or `afterMaking()`
    NO → `definition()` should only return attribute arrays — no side effects

---

## Recommended Default

**Default:** Callbacks in `configure()`; `definition()` stays pure
**Reason:** Separation of concerns — `definition()` returns data; callbacks handle side effects.

---

## Risks Of Wrong Choice

Placing callbacks in `definition()` mixes concerns and can cause unexpected behavior when the factory is used with `make()` (model not persisted).

---

## Related Rules

* Register Callbacks in configure() — Not in definition()

---

## Related Skills

* Implement afterCreating Factory Callback

---

## afterCreating vs afterMaking

---

## Decision Context

Choosing between `afterCreating()` (post-persist) and `afterMaking()` (post-instantiation).

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the logic require the model to have a database ID?
↓
YES → `afterCreating()` — model must be persisted first
NO → Should the logic also run when using `make()` (not persisted)?
    YES → `afterMaking()` — runs for both `make()` and `create()`
    NO → `afterCreating()` — persistence-dependent only

---

## Recommended Default

**Default:** `afterCreating()` for persistence-dependent logic
**Reason:** Most factory callback use cases require the model ID (setting up relationships).

---

## Risks Of Wrong Choice

Using `afterCreating()` for logic that `make()` also needs forces callers to manually trigger the setup. Using `afterMaking()` for persistence-dependent logic produces errors when the model has no ID.

---

## Related Rules

* Use afterCreating for Persistence-Dependent Logic

---

## Related Skills

* Implement afterCreating Factory Callback
