## Aggregate Size Decision (Small vs Large Aggregates)

Choosing between one large aggregate and multiple smaller aggregates for transactional consistency.

---

## Decision Context

When modeling aggregate boundaries, you must decide how many child entities to include in a single aggregate.

---

## Decision Criteria

* whether all entities need transactional consistency
* whether child entities have independent lifetimes
* performance impact of loading the entire aggregate
* whether external code needs to reference children directly

---

## Decision Tree

Designing aggregate boundaries?

↓

Do all child entities need to be loaded together for transactional consistency?

YES → Single aggregate (keep loading cost acceptable)

NO → Split into multiple smaller aggregates

    Can children exist independently of the root?

    YES → They should be separate aggregates

    NO → Keep within the aggregate

Do external systems reference children by ID?

YES → Consider making it a separate aggregate

---

## Rationale

Smaller aggregates improve performance (less loading overhead) and reduce transaction contention. A common mistake is making aggregates too large. If child entities are referenced by other parts of the system independently, they may be separate aggregates.

---

## Recommended Default

**Default:** Start with smaller aggregates; merge only when transactional consistency demands it
**Reason:** Smaller aggregates perform better, reduce contention, and are easier to reason about

---

## Risks Of Wrong Choice

Large aggregates with many children cause slow loads and high contention; too-small aggregates may leave inconsistencies when entities change independently.

---

## Related Rules

- Aggregate root invariants (from aggregate-roots standardized knowledge)

---

## Related Skills

- Aggregate root design (domain-modeling-patterns/06-skills.md)

---

## Child Access Strategy (Through Root vs Direct)

Choosing between accessing child entities through aggregate root methods vs direct relationship access.

---

## Decision Context

When modifying child entities of an aggregate, you must decide whether to go through root methods or access children directly.

---

## Decision Criteria

* whether invariant enforcement is needed on every modification
* whether the root needs to update its state when children change
* whether direct access would bypass business rules

---

## Decision Tree

Modifying a child entity?

↓

Does the root need to enforce invariants (e.g., recalculate total)?

YES → Access through root methods: `$order->addItem(...)`

NO → Direct access is acceptable

    Does the root need to update its state when child changes?

    YES → Root method (root recalculates after child modification)

---

## Rationale

Root methods enforce aggregate invariants on every modification. Direct child access bypasses these guards. For simple aggregates with no cross-child invariants, direct access may be acceptable.

---

## Recommended Default

**Default:** Access children through aggregate root methods
**Reason:** Enforces invariants; single point of change for consistency rules

---

## Risks Of Wrong Choice

Bypassing root methods allows inconsistent state (e.g., adding an item without recalculating total); direct access creates multiple entry points for aggregate modification.
