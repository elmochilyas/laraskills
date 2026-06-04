## State Pattern vs Enum + Conditional

Choosing between a full state pattern implementation and simpler enum-based conditional logic.

---

## Decision Context

When modeling state-dependent behavior, you must choose between the formal State pattern (state classes) and enum + conditional logic.

---

## Decision Criteria

* number of states and transitions (2-3 simple states vs 5+ complex states)
* whether behavior changes significantly per state
* whether the same transition logic is needed in multiple places
* need for explicit, auditable transition maps

---

## Decision Tree

Modeling state-dependent behavior?

↓

Are there 2-3 states with simple transitions?

YES → Use Enum + conditional logic (simpler, fewer classes)

NO → Are there 4+ states with different behavior per state?

    YES → Use State pattern (state classes encapsulate behavior)

    Are transitions complex with multiple preconditions?

    YES → State pattern + transition guards

---

## Rationale

For simple state machines (draft → published), an enum cast with a method that checks current state is sufficient. For complex state machines with state-specific behavior (an Order behaves differently in Pending vs Shipped vs Delivered), the State pattern reduces conditional complexity.

---

## Recommended Default

**Default:** Enum + conditional for 2-3 states; State pattern for 4+ states with behavioral variation
**Reason:** Simpler solutions are maintainable for small state spaces; State pattern prevents condition explosion for complex ones

---

## Risks Of Wrong Choice

State pattern for 2 states creates unnecessary class overhead; enum + conditional for complex states creates unmaintainable switch statements.

---

## Related Rules

- State transition mapping (from state-pattern-fundamentals standardized knowledge)

---

## Related Skills

- State machine implementation (domain-modeling-patterns/06-skills.md)
