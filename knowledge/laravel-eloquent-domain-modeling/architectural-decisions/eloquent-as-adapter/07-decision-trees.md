## Active Record vs Eloquent as Adapter

Choosing between treating Eloquent models as domain entities (Active Record) and treating them as infrastructure adapters.

---

## Decision Context

At the architectural level, you must decide whether Eloquent models serve as the domain layer or as persistence adapters behind domain interfaces.

---

## Decision Criteria

* complexity of business rules
* need for persistence-ignorant domain models
* whether the domain model and DB schema differ significantly
* team size and architecture maturity
* whether the application is simple CRUD or complex domain

---

## Decision Tree

Architecting the domain layer?

↓

Is the application simple CRUD with minimal business rules?

YES → Active Record (Eloquent models are the domain layer) — simpler, faster

NO → Are business rules complex enough to warrant persistence ignorance?

    YES → Eloquent as Adapter (models are infrastructure, plain PHP domain classes)

    NO → Does the DB schema differ significantly from domain concepts?

        YES → Adapter pattern

        NO → Active Record

---

## Rationale

Active Record is simpler and follows Laravel conventions. The Adapter pattern provides domain purity at the cost of mapping overhead. For complex domains with extensive business rules, the decoupling pays off in testability and maintainability.

---

## Recommended Default

**Default:** Active Record for most Laravel applications
**Reason:** Simpler, convention-aligned, less mapping overhead

---

## Risks Of Wrong Choice

Active Record for complex domain creates testability issues; Adapter for simple CRUD creates unnecessary mapping classes.

---

## Related Rules

- Domain model purity conventions (from eloquent-as-adapter standardized knowledge)

---

## Related Skills

- Adapter implementation (architectural-decisions/06-skills.md)
