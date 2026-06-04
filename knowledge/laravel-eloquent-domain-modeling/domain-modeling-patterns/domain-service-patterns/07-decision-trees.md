# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Service Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Domain service vs model method
* Domain service vs action class
* Stateless service design

---

# Architecture-Level Decision Trees

---

## Domain Service vs Model Method

---

## Decision Context

Choosing between adding logic to a domain service class or to a model's domain method.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the logic involve only one model's own state?
↓
YES → Model domain method — the model knows its own state best
NO → Does the logic span two or more unrelated models?
    YES → Domain service — no single model "owns" this logic
    NO → Does the logic involve external domain computations (tax, exchange rates)?
        YES → Domain service — encapsulates external domain logic
        NO → Model method may still be appropriate

---

## Rationale

Domain services hold business logic that doesn't naturally belong to any single entity. When an operation reads from and coordinates multiple models, a service provides a clear home without bloating any one model.

---

## Recommended Default

**Default:** Model domain method
**Reason:** Belongs to the model that owns the data. Only extract to a service when cross-model logic demands it.

---

## Risks Of Wrong Choice

Putting cross-model logic on a single model creates inappropriate coupling and violates SRP. Using services for single-model logic scatters behavior away from the data it operates on.

---

## Related Rules

* Extract stateless domain services for cross-model logic
* Define interfaces for domain services

---

## Related Skills

* Extract a Domain Service for Cross-Model Logic

---

## Domain Service vs Action Class

---

## Decision Context

Choosing between a domain service (domain layer) and an action class (application layer).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the operation involve application concerns (HTTP, queue, auth, transactions)?
↓
YES → Action class — application layer handles orchestration and cross-cutting concerns
NO → Is the logic purely domain computation with no infrastructure dependencies?
    YES → Domain service — keep in domain layer, testable without Laravel
    NO → Does it mix domain logic with persistence or external services?
        YES → Action class — infrastructure dependencies belong in application layer
        NO → Domain service — pure domain computation

---

## Rationale

Domain services operate at the domain layer (business logic only). Action classes operate at the application layer (orchestration, transactions, infrastructure). Domain services are more testable and reusable across application contexts.

---

## Recommended Default

**Default:** Action class for mixed concerns; domain service for pure domain logic
**Reason:** Action classes have access to infrastructure; domain services are pure and testable.

---

## Risks Of Wrong Choice

Putting infrastructure concerns in a domain service makes it untestable without mocking the world. Putting pure domain logic in an action class couples it to the application layer, preventing reuse in other contexts.

---

## Related Rules

* Keep domain services free of Eloquent
* Inject services, don't instantiate

---

## Related Skills

* Extract a Domain Service for Cross-Model Logic

---

## Stateless Service Design

---

## Decision Context

Designing domain services to be stateless for testability and reliability.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the service maintain internal state between calls?
↓
YES → Refactor — domain services MUST be stateless
NO → Are all dependencies injected via constructor?
    YES → Correct — service is stateless and testable
    NO → Is the service fetching data internally (e.g., calling queries)?
        YES → Pass data as parameters — service should receive, not fetch
        NO → Service is well-designed

---

## Rationale

Stateless services are predictable, testable, and thread-safe. All data should be passed as parameters; the service computes, queries through injected abstractions, and returns results without mutating internal state.

---

## Recommended Default

**Default:** Stateless service with injected dependencies
**Reason:** Testable, predictable, and safe for concurrent use.

---

## Risks Of Wrong Choice

Stateful domain services cause unpredictable behavior in concurrent requests and make testing impossible without resetting internal state between assertions.

---

## Related Rules

* Service is stateless (no mutable properties)
* Domain services receive models, not fetch them

---

## Related Skills

* Extract a Domain Service for Cross-Model Logic
