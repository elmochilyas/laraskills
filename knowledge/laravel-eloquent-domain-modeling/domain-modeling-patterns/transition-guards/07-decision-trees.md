# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Transition Guards
**Generated:** 2026-06-03

---

# Decision Inventory

* Guard placement (inline vs separate class)
* Guard granularity (one check per guard vs composite)
* Guard vs domain method precondition

---

# Architecture-Level Decision Trees

---

## Guard Placement

---

## Decision Context

Choosing whether to put guard logic inline in the transition method or extract it to a dedicated guard class.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the guard logic simple (one condition, one line)?
↓
YES → Inline in the transition method is acceptable
NO → Is the guard used across multiple transitions or models?
    YES → Extract to a dedicated guard class — reusable
    NO → Is the guard logic complex (multiple conditions, external checks)?
        YES → Dedicated guard class — testable independently
        NO → Inline — simple enough for the transition method

---

## Rationale

Simple inline guards are discoverable and don't require navigating additional files. Complex or reused guards benefit from extraction to dedicated testable classes.

---

## Recommended Default

**Default:** Inline for simple guards; dedicated class for complex/reused guards
**Reason:** Balance between simplicity and testability based on guard complexity.

---

## Risks Of Wrong Choice

Inline complex guards make transition methods long and hard to test. Dedicated guard classes for a single simple condition add unnecessary indirection.

---

## Related Rules

* Each guard validates one condition
* Guards do not modify state or perform side effects

---

## Related Skills

* Add a Guard to Prevent Invalid State Transitions

---

## Guard Granularity

---

## Decision Context

Deciding how many conditions a single guard should check.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the guard check more than one condition?
↓
YES → Are the conditions logically related (all part of the same business rule)?
    YES → Acceptable in a single guard class, but consider documenting each
    NO → Split into separate guards — each checks one condition
NO → Single condition per guard — ideal, testable in isolation

---

## Rationale

Each guard should have a single responsibility. Multiple conditions in one guard make testing harder (you test multiple things) and reduce reusability when only one condition is needed elsewhere.

---

## Recommended Default

**Default:** One condition per guard
**Reason:** Testable, reusable, and clear about what precondition it validates.

---

## Risks Of Wrong Choice

Too many guards for closely related conditions creates class proliferation. Too few guards with multiple conditions makes failure messages ambiguous (which condition failed?).

---

## Related Rules

* Each guard validates one condition
* Throw specific, actionable exceptions on failure

---

## Related Skills

* Add a Guard to Prevent Invalid State Transitions

---

## Guard vs Domain Method Precondition

---

## Decision Context

Choosing between an external guard class and a precondition check inside the domain method itself.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the precondition check specific to this one domain method?
↓
YES → Inline precondition in the domain method — simplest, most visible
NO → Is the precondition shared across multiple transitions or models?
    YES → Extract to a guard class — reusable
    NO → Is the precondition complex enough to warrant its own test?
        YES → Guard class — testable independently
        NO → Inline precondition — sufficient

---

## Rationale

Inline preconditions are the most visible and simplest approach. Extract to a guard class when the check is reused or complex enough to warrant independent testing.

---

## Recommended Default

**Default:** Inline precondition in the domain method
**Reason:** Most discoverable, simplest, and keeps the guard with the logic it guards.

---

## Risks Of Wrong Choice

Extracting every precondition to a guard class creates scattered logic that's hard to follow. Putting complex shared preconditions inline duplicates them across methods.

---

## Related Rules

* Guards check preconditions, not perform side effects

---

## Related Skills

* Add a Guard to Prevent Invalid State Transitions
