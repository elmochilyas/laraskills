# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Manual Event Firing
**Generated:** 2026-06-03

---

# Decision Inventory

* fireModelEvent() vs automatic event dispatch
* Custom event registration with $observables
* Manual events for testing

---

# Architecture-Level Decision Trees

---

## fireModelEvent() vs Automatic Event Dispatch

---

## Decision Context

Choosing between manually firing a model event and relying on automatic dispatch during `save()`/`delete()`.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the operation a normal persistence flow?
↓
YES → Rely on automatic dispatch — `save()` fires events automatically
NO → Is the purpose to trigger side effects without persisting?
    YES → Use `fireModelEvent()` — triggers event handlers without DB write
    NO → Use automatic dispatch for standard operations

---

## Recommended Default

**Default:** Automatic dispatch via `save()`/`delete()`
**Reason:** Events fire correctly in the dispatch sequence; no risk of firing out of order.

---

## Risks Of Wrong Choice

Replacing normal persistence with manual events bypasses the dispatch sequence and can lead to inconsistent state.

---

## Related Rules

* Don't replace normal persistence with manual events

---

## Related Skills

* Fire Model Events Manually for Testing

---

## Custom Event Registration with $observables

---

## Decision Context

Adding custom event names to the `$observables` array for custom model lifecycle hooks.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the custom event a meaningful point in the model's lifecycle?
↓
YES → Add to `$observables` and use `fireModelEvent()` to dispatch
NO → Is the event more appropriate as a domain event (Event facade)?
    YES → Use domain events instead of custom model events
    NO → Add to `$observables`

---

## Recommended Default

**Default:** Domain events for business occurrences; `$observables` for model lifecycle extensions
**Reason:** Domain events are decoupled from persistence; `$observables` are appropriate for lifecycle-specific hooks.

---

## Risks Of Wrong Choice

Using `$observables` for business events ties domain logic to the model lifecycle. Using domain events for model lifecycle hooks loses the convenience of observer integration.

---

## Related Rules

* Use $observables for custom event names

---

## Related Skills

* Fire Model Events Manually for Testing

---

## Manual Events for Testing

---

## Decision Context

Using `fireModelEvent()` in tests to trigger observer logic without database persistence.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the test need to verify observer behavior without creating a database record?
↓
YES → Use `fireModelEvent()` on a `make()`'d model — fire event, no DB write
NO → Is the test verifying the persistence behavior itself?
    YES → Use `create()` — automatic event dispatch with DB write
    NO → Use `fireModelEvent()` for targeted observer testing

---

## Recommended Default

**Default:** `create()` for integration tests; `fireModelEvent()` for unit-testing observer logic
**Reason:** Integration tests should use the full stack; unit tests benefit from isolation.

---

## Risks Of Wrong Choice

Using `fireModelEvent()` in integration tests may miss issues with the full persistence flow. Using `create()` in a unit test of observer logic adds unnecessary database dependency.

---

## Related Rules

* Use fireModelEvent() for testing

---

## Related Skills

* Fire Model Events Manually for Testing
