# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Recycle Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* recycle() vs for() for parent assignment
* Singleton vs collection recycling
* recycle() placement in chain

---

# Architecture-Level Decision Trees

---

## recycle() vs for() for Parent Assignment

---

## Decision Context

Choosing between `recycle()` (shared parent) and `for()` (explicit parent) for assigning BelongsTo parents.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Are you creating many children that should share the same parent set?
↓
YES → Use `recycle()` — pre-create parents once, distribute across children
NO → Is each child getting its own independent parent?
    YES → Use `for()` — explicit, per-child parent creation
    NO → `recycle()` for shared parents; `for()` for independent ones

---

## Recommended Default

**Default:** `for()` for explicit parent-child creation; `recycle()` for batch shared-parent scenarios
**Reason:** `for()` is explicit and clear for single-parent use; `recycle()` optimizes batch operations.

---

## Risks Of Wrong Choice

Using `recycle()` when each child needs an independent parent creates unrealistic data. Using `for()` on each child for a shared parent creates N redundant writes.

---

## Related Rules

* Use recycle() When Many Children Share the Same Parent
* Use recycle() for Performance, Not as a Data Strategy Default

---

## Related Skills

* Set Up Shared Parent with recycle() for Batch Child Creation

---

## Singleton vs Collection Recycling

---

## Decision Context

Choosing between passing a single model and a collection to `recycle()`.

---

## Decision Criteria

* performance
* realism

---

## Decision Tree

Should all children reference the exact same parent?
↓
YES → Pass a single instance to `recycle()` — all children share one parent
NO → Should children be distributed across a set of parents?
    YES → Pass a collection — round-robin distribution across parents
    NO → Not a batch scenario — use `for()`

---

## Recommended Default

**Default:** Collection for realistic data distribution
**Reason:** Real-world data typically has many children per parent, but not all from one parent.

---

## Risks Of Wrong Choice

Single instance recycling creates unrealistic test data (all posts by one user). Collection recycling when singleton is intended creates unexpected parent variation.

---

## Related Rules

* Pass a Collection for Round-Robin Distribution
* Apply recycle() at the Top of the Factory Chain

---

## Related Skills

* Set Up Shared Parent with recycle() for Batch Child Creation

---

## recycle() Placement in Chain

---

## Decision Context

Determining where to place `recycle()` in the factory method chain.

---

## Decision Criteria

* reliability

---

## Decision Tree

Is `recycle()` called before `has()`, `for()`, or `hasAttached()`?
↓
YES → Correct — recycled models propagate to nested factories
NO → Is it placed after relationship methods?
    YES → WRONG — nested factories won't receive the recycled model
    NO → Place `recycle()` first, before all relationship methods

---

## Recommended Default

**Default:** `recycle()` at the top of the factory chain, before relationship modifiers
**Reason:** Ensures recycled models propagate correctly to all nested factory calls.

---

## Risks Of Wrong Choice

Placing `recycle()` after `has()` or `for()` causes nested factories to create new parents instead of recycling, defeating the purpose.

---

## Related Rules

* Apply recycle() at the Top of the Factory Chain

---

## Related Skills

* Set Up Shared Parent with recycle() for Batch Child Creation
