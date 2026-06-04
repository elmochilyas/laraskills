## Rich vs Anemic Domain Model

Choosing between putting domain behavior in Eloquent models (rich) or keeping models as data containers with logic in services (anemic).

---

## Decision Context

When organizing domain logic, you must decide whether to place business methods directly on Eloquent models or keep models as data holders with logic in action/service classes.

---

## Decision Criteria

* complexity of domain logic
* whether logic crosses aggregate boundaries
* testability of model methods vs service methods
* team familiarity with Active Record pattern
* need for persistence-ignorant domain models

---

## Decision Tree

Where should domain logic live?

↓

Does the logic operate solely on this model's own attributes and relationships?

YES → Rich model: add method `markAsPaid()` on the model

    Does the logic need to call `save()` after mutation?

    YES → Model method is natural (Active Record pattern)

    NO → Plain method on model or service class

NO → Does the logic coordinate multiple models across aggregate boundaries?

    YES → Extract to Action Class or Domain Service

    NO → Keep on the model

---

## Rationale

Rich models (Active Record as domain layer) are the natural fit for Eloquent. Domain methods that operate on a single model's state fit well as model methods. Cross-aggregate coordination belongs in action classes to avoid coupling models to each other.

---

## Recommended Default

**Default:** Place single-model domain logic on the model; extract cross-aggregate coordination to actions
**Reason:** Keeps models expressive without violating single responsibility; actions handle orchestration

---

## Risks Of Wrong Choice

Anemic models lead to service layer bloat with duplicated logic; overloading models with cross-aggregate coordination creates coupling.

---

## Related Rules

- Domain methods conventions (from active-record-domain-layer standardized knowledge)

---

## Related Skills

- Domain method creation on models (domain-modeling-patterns/06-skills.md)

---

## Strict Mode Configuration (shouldBeStrict vs Individual Options)

Choosing between `shouldBeStrict()` and individual prevention methods for development-time enforcement.

---

## Decision Context

When enabling development-time safeguards, you must choose between the bundled `shouldBeStrict()` and individual `preventLazyLoading()` / `preventSilentlyDiscardingAttributes()` / `preventAccessingMissingAttributes()`.

---

## Decision Criteria

* whether all three preventions are needed
* whether third-party packages cause false positives
* environment (development vs staging vs CI)

---

## Decision Tree

Enabling development-time strict mode?

↓

Are all three protections needed (lazy loading, attribute discarding, missing attributes)?

YES → Use `Model::shouldBeStrict()` (single call)

NO → Use individual `preventLazyLoading()` etc. selectively

    Do third-party packages trigger false positives?

    YES → Use individual preventions with custom handlers to ignore specific relations

---

## Rationale

`shouldBeStrict()` bundles three prevention modes for comprehensive enforcement. Individual methods allow selective application when specific protections cause issues with packages or legacy code.

---

## Recommended Default

**Default:** `shouldBeStrict()` in development and CI environments
**Reason:** Comprehensive enforcement with a single call; prevents N+1, silent attribute discarding, and missing attribute access

---

## Risks Of Wrong Choice

Missing protection for one of the three areas; false positives from packages causing developer frustration.
