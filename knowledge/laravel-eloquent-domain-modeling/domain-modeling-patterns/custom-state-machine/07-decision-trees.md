# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Custom State Machine
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom state machine vs package
* Enum vs constants for states
* Transition logic placement

---

# Architecture-Level Decision Trees

---

## Custom State Machine vs Package

---

## Decision Context

Choosing between writing a custom state machine or using a package like `spatie/laravel-model-states`.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the state machine simple (3-5 states, linear transitions)?
↓
YES → Custom implementation is sufficient — enum + transition map
NO → Are there complex requirements (side effects, transition history, guards)?
    YES → Consider `spatie/laravel-model-states` for formal structure
    NO → Custom implementation remains feasible
NO → Is the state machine shared across multiple models?
    YES → Package provides consistency across models
    NO → Custom implementation is simpler

---

## Rationale

Custom state machines keep the dependency footprint small and give full control. Packages provide formal structure, lifecycle hooks, and query scopes but add a dependency.

---

## Recommended Default

**Default:** Custom state machine for simple cases
**Reason:** Zero dependencies, full control, minimal overhead. Only reach for a package when complexity warrants it.

---

## Risks Of Wrong Choice

Using a package for a 3-state machine adds unnecessary dependency and complexity. Building a custom machine for 20-state workflows with complex transitions risks bugs and missing features.

---

## Related Rules

* Use backed enums for state identity
* Define transitions in a single visible map

---

## Related Skills

* Implement a State Machine on a Model

---

## Enum vs Constants for States

---

## Decision Context

Choosing between PHP backed enums and class constants for representing state values.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the state need to carry behavior (methods like `allowedTransitions()`)?
↓
YES → Use backed enum — methods are colocated with state definition
NO → Are you using enum casting to auto-hydrate state?
    YES → Use backed enum — integrates with Eloquent enum casting
    NO → Use class constants — simpler for plain string state

---

## Rationale

Backed enums provide type safety, method colocation, and integration with Eloquent's enum casting. Constants are simpler for basic state tracking but offer no type enforcement.

---

## Recommended Default

**Default:** Backed PHP enum
**Reason:** Type safety, method colocation, Eloquent cast integration, and IDE support.

---

## Risks Of Wrong Choice

Using constants for states risks type errors (any string can be assigned) and scattered state logic. Using enums for a single state with no behavior is over-engineering.

---

## Related Rules

* Use backed enums for state identity

---

## Related Skills

* Implement a State Machine on a Model

---

## Transition Logic Placement

---

## Decision Context

Deciding where to place transition logic — in the state machine, model, or dedicated transition classes.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the transition have side effects beyond changing the state value?
↓
YES → Use transition classes or domain events for side effects
NO → Is the transition logic reused across multiple models?
    YES → Extract to a shared transition class
    NO → Add `transitionTo()` to the model — simplest placement

---

## Rationale

Model-based transition methods are simplest for single-model use. Transition classes provide reuse and testability when multiple models share the same transition logic or when side effects are complex.

---

## Recommended Default

**Default:** `transitionTo()` method on the model
**Reason:** Simplest, most discoverable, sufficient for most state machines.

---

## Risks Of Wrong Choice

Duplicating transition logic across models when a shared class would serve better. Putting complex side effects inside the transition method mixes concerns.

---

## Related Rules

* Separate guards from transition logic

---

## Related Skills

* Implement a State Machine on a Model
