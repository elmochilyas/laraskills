# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Event Control — Quiet Operations
**Generated:** 2026-06-03

---

# Decision Inventory

* Quiet method vs withoutEvents() scope
* When to suppress events
* Breaking infinite event loops

---

# Architecture-Level Decision Trees

---

## Quiet Method vs withoutEvents() Scope

---

## Decision Context

Choosing between individual quiet methods (`saveQuietly()`) and scoped suppression (`withoutEvents()`).

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the suppression scoped to a block of multiple operations?
↓
YES → Use `Model::withoutEvents(fn () => { ... })` — single scope, multiple operations
NO → Is it a single operation?
    YES → Individual quiet method (`saveQuietly()`) is simpler
    NO → `withoutEvents()` for broader scopes

---

## Recommended Default

**Default:** `withoutEvents()` for scoped suppression
**Reason:** Clearer intent, covers all operations in the scope, and prevents accidentally forgetting to suppress on some operations.

---

## Risks Of Wrong Choice

Individual quiet methods can miss some operations within a block, causing unwanted event dispatch. `withoutEvents()` for a single operation is slightly more verbose but clearer.

---

## Related Rules

* Use withoutEvents() for scoped suppression

---

## Related Skills

* Suppress Model Events with Quiet Operations

---

## When to Suppress Events

---

## Decision Context

Determining when it's appropriate to suppress model events.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the operation a bulk data migration or seeding operation?
↓
YES → Suppress events — side effects would add overhead without value
NO → Is event suppression preventing an infinite loop?
    YES → Suppress events — document the specific loop being broken
    NO → Is the operation test setup where event side effects are unwanted?
        YES → Suppress events in test setup; verify events in test assertions
        NO → Do not suppress — events should fire by default

---

## Recommended Default

**Default:** Do not suppress events
**Reason:** Events fire by default for a reason. Only suppress when there's a specific, documented justification.

---

## Risks Of Wrong Choice

Suppressing events without justification hides side effects that should fire. Not suppressing during bulk operations causes massive performance overhead.

---

## Related Rules

* Document quiet usage

---

## Related Skills

* Suppress Model Events with Quiet Operations

---

## Breaking Infinite Event Loops

---

## Decision Context

Handling infinite loops where an observer saves a model that triggers itself.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the observer call `save()` on the same model it observes?
↓
YES → Use `Model::withoutEvents(fn () => $model->save())` — prevents re-trigger
NO → Does the observer save a different model that triggers another observer pointing back?
    YES → Use `withoutEvents()` on the intermediate save — break the cycle
    NO → No infinite loop risk

---

## Recommended Default

**Default:** `withoutEvents()` to break the loop at the point of the triggered save
**Reason:** Targeted suppression breaks only the re-triggering save, not all observer functionality.

---

## Risks Of Wrong Choice

Not addressing the infinite loop causes stack overflow or max execution time exceeded. Using `saveQuietly()` everywhere in the observer suppresses events for legitimate saves too.

---

## Related Rules

* Prevent infinite event loops with quiet operations

---

## Related Skills

* Suppress Model Events with Quiet Operations
