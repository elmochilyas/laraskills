## Domain Service vs Model Method vs Action Class

Choosing between placing cross-entity logic in a domain service, on a model, or in an action class.

---

## Decision Context

When business logic involves multiple domain objects, you must decide where to place it.

---

## Decision Criteria

* whether the logic spans multiple aggregates
* whether the logic involves external system interaction
* whether the logic belongs conceptually to a specific entity
* whether the logic is pure domain calculation or orchestration

---

## Decision Tree

Cross-entity business logic?

↓

Does the logic fit naturally on a single entity/aggregate root?

YES → Model method (preferred)

NO → Does the logic involve calculations or rules across multiple aggregates?

    YES → Domain Service (stateless, coordinates domain objects)

NO → Does it involve coordination with external infra (email, queue) across aggregates?

    YES → Action Class (application service)

---

## Rationale

Domain services hold pure domain logic that doesn't belong to any single entity. Action classes handle cross-aggregate operations with infrastructure side effects. Model methods are for within-entity logic. Each has a distinct role in the domain layer.

---

## Recommended Default

**Default:** Domain service for cross-aggregate domain logic; action class for orchestration with side effects
**Reason:** Domain services keep logic pure and testable; action classes manage infrastructure coupling

---

## Risks Of Wrong Choice

Domain logic in action classes creates framework coupling; infrastructure concerns in domain services break purity; cross-entity logic in model methods creates coupling between aggregates.
