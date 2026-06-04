# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** State Machine Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* State machine vs status column
* Transition method design
* State machine scope

---

# Architecture-Level Decision Trees

---

## State Machine vs Status Column

---

## Decision Context

Choosing between a formal state machine and a simple status string/enum column.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Does the entity have a well-defined lifecycle with constrained state transitions?
↓
YES → Are there business rules that prevent certain transitions?
    YES → Formal state machine enforces transition rules
    NO → Simple status column with assignments may suffice
NO → Can the status change freely in any direction?
    YES → Simple status column is sufficient — no constraint needed
    NO → Use state machine to enforce valid transitions

---

## Rationale

A formal state machine prevents invalid state transitions that would put the entity in an inconsistent state. A simple status column allows any string assignment, which can lead to bugs where invalid state combinations occur.

---

## Recommended Default

**Default:** Simple status column for 2-3 unrestricted states
**Reason:** Minimal code, no transition logic overhead. Escalate to state machine when transition rules emerge.

---

## Risks Of Wrong Choice

Using a status column without transition enforcement allows invalid states (e.g., shipped before paid). Using a state machine for a binary (active/inactive) flag adds unnecessary complexity.

---

## Related Rules

* Define all states as constants or backed enum
* Define allowed transitions in a central map

---

## Related Skills

* Implement a State Machine on a Model

---

## Transition Method Design

---

## Decision Context

Designing transition methods — generic `transitionTo()` vs specific shorthand methods.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are the transitions frequently called by name (e.g., `$order->ship()`)?
↓
YES → Add shorthand methods for common transitions — expressive and discoverable
NO → Is a generic `transitionTo()` sufficient for all callers?
    YES → Use only `transitionTo()` — simpler API surface
    NO → Add shorthand methods for the frequently used transitions

---

## Rationale

Shorthand methods like `$order->ship()` express intent clearly and can encapsulate transition-specific logic. The generic `transitionTo()` is useful for programmatic or dynamic transitions.

---

## Recommended Default

**Default:** Both — `transitionTo()` for generic use + shorthand methods for common transitions
**Reason:** Provides flexibility for dynamic transitions while keeping common operations expressive.

---

## Risks Of Wrong Choice

Only providing `transitionTo()` forces callers to know the target state constant. Only providing shorthand methods forces adding methods for every transition, even rarely used ones.

---

## Related Rules

* Add shorthand methods for common transitions

---

## Related Skills

* Implement a State Machine on a Model

---

## State Machine Scope

---

## Decision Context

Determining whether a state machine belongs on the model, in a dedicated class, or in a package.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the state machine simple (5 or fewer states, linear transitions)?
↓
YES → Implement on the model — simplest, most discoverable
NO → Is the state machine shared across multiple models?
    YES → Extract to a dedicated state machine class or package
    NO → Extract to a dedicated class to keep model focused

---

## Rationale

Simple state machines on the model are discoverable and don't require navigating additional classes. Complex state machines benefit from extraction to keep the model focused and allow independent testing.

---

## Recommended Default

**Default:** On the model for simple machines; dedicated class for complex ones
**Reason:** Complexity determines extraction need. Don't abstract prematurely.

---

## Risks Of Wrong Choice

Embedding a complex state machine on the model makes it large and hard to test. Extracting a simple state machine to a separate class adds indirection without benefit.

---

## Related Rules

* Guard transitions with domain exceptions

---

## Related Skills

* Implement a State Machine on a Model
