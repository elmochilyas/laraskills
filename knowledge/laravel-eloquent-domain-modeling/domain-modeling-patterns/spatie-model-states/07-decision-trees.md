# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Spatie Model States
**Generated:** 2026-06-03

---

# Decision Inventory

* Package usage vs custom implementation
* State class vs Transition class scope
* State class organization pattern

---

# Architecture-Level Decision Trees

---

## Package Usage vs Custom Implementation

---

## Decision Context

Choosing between `spatie/laravel-model-states` and a custom state machine implementation.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the state machine complex (many states, branching transitions, lifecycle hooks)?
↓
YES → Use `spatie/laravel-model-states` — provides structure, validation, hooks
NO → Is the state machine shared across multiple models?
    YES → Package provides consistent pattern across models
    NO → Custom implementation (enum + transition map) is simpler
NO → Do you value explicit state classes with behavior over simple string/enum states?
    YES → Package provides state-specific behavior encapsulation
    NO → Custom implementation is sufficient

---

## Rationale

`spatie/laravel-model-states` formalizes state as dedicated classes, auto-discovers transitions, and provides lifecycle hooks. For complex state machines, this structure pays off. For simple ones, it adds overhead.

---

## Recommended Default

**Default:** Custom implementation for simple machines; package for complex ones
**Reason:** Package dependency is justified when its features (state classes, transition lifecycle, query scopes) are actively used.

---

## Risks Of Wrong Choice

Adding the package for a 2-state machine adds dependency and file overhead. Writing a custom complex state machine misses the package's battle-tested features like transition history and query scopes.

---

## Related Rules

* Define transitions explicitly in each state class
* Use transition classes for side effects

---

## Related Skills

* Implement a State Machine with spatie/laravel-model-states

---

## State Class vs Transition Class Scope

---

## Decision Context

Deciding what logic belongs in the state class vs in a dedicated transition class.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the transition involve side effects beyond changing the state value?
↓
YES → Create a dedicated Transition class — keeps side effects separate from state definition
NO → Is the transition logic simple (just state change)?
    YES → State class is sufficient — `transitionTo()` handles it
    NO → Consider if complexity warrants a Transition class

---

## Rationale

State classes define allowed transitions and state-specific behavior (scopes, display logic). Transition classes handle the execution of state changes with side effects. This separation keeps both focused.

---

## Recommended Default

**Default:** State class for simple transitions; Transition class when side effects exist
**Reason:** Side effects (logging, events, updates) are separate concerns that don't belong in state definition.

---

## Risks Of Wrong Choice

Putting complex side effects in state classes couples state definition to execution logic. Creating Transition classes for every trivial state change adds unnecessary file overhead.

---

## Related Rules

* Keep state classes focused on transition logic

---

## Related Skills

* Implement a State Machine with spatie/laravel-model-states

---

## State Class Organization Pattern

---

## Decision Context

Structuring state classes and their file organization.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the entity have more than 3 states?
↓
YES → Group state classes in a subdirectory: `App\States\{Entity}\*`
NO → Flat naming is acceptable: `App\States\Pending`, `App\States\Approved`

---

## Rationale

As the number of states grows, a subdirectory per entity keeps files organized and discoverable. For 2-3 states, flat naming is sufficient.

---

## Recommended Default

**Default:** Subdirectory per entity: `App\States\OrderStatus\*`
**Reason:** Scalable, discoverable, and prevents naming conflicts between entities.

---

## Risks Of Wrong Choice

Flat organization with many state files across entities becomes cluttered and hard to navigate.

---

## Related Rules

* State classes in App\States\{Entity}\* per domain entity

---

## Related Skills

* Implement a State Machine with spatie/laravel-model-states
