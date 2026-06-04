# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** BelongsTo Factories
**Generated:** 2026-06-03

---

# Decision Inventory

* Factory vs instance for parent
* Magic for{Relation} vs explicit for()
* for() vs direct foreign key in definition()

---

# Architecture-Level Decision Trees

---

## Factory vs Instance for Parent

---

## Decision Context

Choosing between passing a factory or an existing model instance to `for()` when creating child models.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Should each child have its own independent parent?
↓
YES → Pass `ParentModel::factory()` to `for()` — each child creates a new parent
NO → Should children share the same parent instance?
    YES → Pre-create the parent and pass the instance — fewer DB writes
    NO → Pass factory for independent parents

---

## Recommended Default

**Default:** Pass existing instance when children should share a parent; factory for independent parents
**Reason:** Avoids redundant database writes for shared parents.

---

## Risks Of Wrong Choice

Creating N factories for N children when they should share a parent causes N extra writes. Using one instance for all children when they need independent parents creates unrealistic test data.

---

## Related Rules

* Pass a Factory for New Parents, Pass an Instance for Existing
* Use recycle() When Multiple Children Share the Same BelongsTo Parent

---

## Related Skills

* Set Up BelongsTo Factory Relationship with for()

---

## Magic for{Relation} vs Explicit for()

---

## Decision Context

Choosing between the shorthand magic `for{Relation}()` method and the explicit `for()` method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the relationship name unambiguous (only one BelongsTo to this model)?
↓
YES → Use magic `for{Relation}()` — more readable
NO → Is the relationship name ambiguous (multiple BelongsTo to same model)?
    YES → Use explicit `for()` with the relationship name as the third argument
    NO → Magic method is sufficient

---

## Recommended Default

**Default:** Magic `for{Relation}()` for readability
**Reason:** Cleaner, self-documenting call site.

---

## Risks Of Wrong Choice

Magic methods on ambiguous relationships may resolve to the wrong foreign key. Explicit `for()` is required for disambiguation.

---

## Related Rules

* Use Magic for{Relation} Methods for Readability

---

## Related Skills

* Set Up BelongsTo Factory Relationship with for()

---

## for() vs Direct Foreign Key in definition()

---

## Decision Context

Choosing between using `for()` at the call site vs hard-coding foreign key assignment in the factory's `definition()` method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the foreign key value vary per test/seeding context?
↓
YES → Use `for()` at the call site — flexible, explicit
NO → Can a default parent be defined without affecting reusability?
    YES → Consider a default in `definition()` but prefer `for()` for clarity
    NO → Always use `for()` — never hard-code FK in definition()

---

## Recommended Default

**Default:** `for()` at the call site, never hard-coded FK in `definition()`
**Reason:** Keeps the factory reusable and the FK relationship explicit at each call site.

---

## Risks Of Wrong Choice

Hard-coded FK in `definition()` creates hidden coupling, makes the factory non-reusable, and produces confusing test output when the default parent is inappropriate for the test scenario.

---

## Related Rules

* Do Not Set Foreign Key Columns Directly in Factory Definitions

---

## Related Skills

* Set Up BelongsTo Factory Relationship with for()
