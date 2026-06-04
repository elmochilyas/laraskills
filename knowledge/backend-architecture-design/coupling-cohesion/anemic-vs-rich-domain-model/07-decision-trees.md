# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Anemic domain model vs rich domain model
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Anemic vs Rich domain model per context
* Decision 2: Where behavior belongs — entity vs domain service vs application service
* Decision 3: Eloquent's dual role — domain object vs persistence object

---

# Architecture-Level Decision Trees

---

## Decision: Anemic vs Rich Domain Model Per Context

---

## Decision Context

Choose between anemic (data-only) and rich (behavior-encapsulating) domain models for different parts of the system.

---

## Decision Criteria

* performance considerations: rich models may use more memory due to embedded value objects
* architectural considerations: rich models provide encapsulation; anemic models are simpler
* security considerations: rich models enforce invariants internally; anemic models rely on external services
* maintainability considerations: rich models keep logic co-located; anemic models scatter logic in services

---

## Decision Tree

Is the context a simple CRUD operation with no business rules?
↓
YES → Anemic model (DTO/read model) — no behavior needed, data transfer only
NO → Does the model represent a domain entity with state transitions and invariants?
    YES → Rich domain model (behavior on entity, invariants enforced internally)
    NO → Is it a CQRS read model or query result?
        YES → Anemic model (intentionally no behavior; performance-focused)
        NO → Is it a DTO crossing architectural boundaries?
            YES → Anemic model (data transfer only; no behavior)
            NO → Does the context require validation and business rules?
                YES → Rich domain model (validate inside, not outside)
                NO → Anemic model acceptable

---

## Rationale

Rich domain models are valuable where business rules and state transitions exist. Anemic models are appropriate for read models, DTOs, and simple CRUD. The mistake is using anemic models for complex business logic, not using anemic models for data transfer.

---

## Recommended Default

**Default:** Rich domain model for entities with business rules; anemic model for read models, DTOs, and query results.

**Reason:** Each approach serves different purposes. Rich models encapsulate behavior where it matters; anemic models provide simplicity where behavior isn't needed.

---

## Risks Of Wrong Choice

Anemic models everywhere: all business logic in services, no encapsulation, OOP benefit lost. Rich models everywhere: over-engineered DTOs, unnecessary complexity for simple data carriers.

---

## Related Rules

- Rule 1: Never allow domain entities to be property bags with zero behavior
- Rule 4: A rich model does not mean every object must be complex

---

## Related Skills

- Design a Rich Domain Model
- Measure Cohesion Types

---

## Decision: Where Behavior Belongs — Entity vs Domain Service vs Application Service

---

## Decision Context

Determine where to place a piece of business logic: on the entity itself, in a domain service, or in an application service.

---

## Decision Criteria

* performance considerations: entity methods have no indirection; services add overhead
* architectural considerations: entity methods are most cohesive; services orchestrate across entities
* security considerations: authorization belongs in application service, not entity
* maintainability considerations: behavior in the right place reduces duplication

---

## Decision Tree

Does the behavior involve only the data of a single aggregate?
↓
YES → Implement as a method on the entity or aggregate root
NO → Does the behavior coordinate multiple aggregates or external systems?
    YES → Is the coordination purely business logic (no infrastructure)?
        YES → Domain service (pure business orchestration)
        NO → Application service (orchestration + infrastructure coordination)
    NO → Does the behavior enforce cross-aggregate business rules?
        YES → Domain service (business rules that don't belong to one entity)
        NO → Is the logic a query or computation that doesn't modify state?
            YES → Domain service or query object
            NO → Application service

---

## Rationale

Information Expert (GRASP) dictates that behavior should be placed where the data lives. If the behavior uses only one aggregate's data, it belongs on that aggregate. Cross-aggregate logic goes in domain services. Infrastructure coordination goes in application services.

---

## Recommended Default

**Default:** Entity first; domain service if cross-aggregate; application service if infrastructure coordination included.

**Reason:** Entity placement provides the highest cohesion and discoverability. Escalate to services only when the behavior naturally spans multiple entities or requires infrastructure.

---

## Risks Of Wrong Choice

Logic in wrong place: entity with infrastructure dependencies (cannot unit test), application service with domain logic (not reusable), domain service with single-entity logic (scattered, hard to find).

---

## Related Rules

- Rule 2: Keep domain logic inside the model, not in application services
- Rule 3: Expose intent-revealing interfaces, not property getters

---

## Related Skills

- Design a Rich Domain Model
- Apply Information Expert GRASP Pattern
- Measure Cohesion Types

---

## Decision: Eloquent's Dual Role — Domain Object vs Persistence Object

---

## Decision Context

Decide how to handle Eloquent models that serve as both domain objects and persistence objects in a Laravel application.

---

## Decision Criteria

* performance considerations: dual-role models are simpler but couple domain to ORM
* architectural considerations: separating domain from persistence enables Hexagonal/Clean Architecture
* security considerations: persistence-coupled models may expose internal state through serialization
* maintainability considerations: dual-role models are simpler initially but harder to refactor later

---

## Decision Tree

Is the application using Hexagonal or Clean Architecture?
↓
YES → Separate domain entities from Eloquent models (domain-agnostic entities + Eloquent adapters)
NO → Is the domain logic complex enough to warrant framework independence?
    YES → Is the team willing to maintain parallel class hierarchies?
        YES → Separate domain entities from Eloquent models (full separation)
        NO → Use Eloquent models with rich behavior but accept framework coupling
    NO → Is the team disciplined about keeping Eloquent model behavior focused on domain?
        YES → Eloquent models with rich domain methods (pragmatic, Laravel-idiomatic)
        NO → Separate domain entities (forced discipline through separation)

---

## Rationale

Eloquent's Active Record nature makes it both a domain object and a persistence object. For simple to moderate complexity, this dual role is acceptable and productive. For complex domains or strict architecture requirements, separating domain entities from persistence models is necessary despite the added complexity.

---

## Recommended Default

**Default:** Use Eloquent models with rich domain methods for most Laravel applications; separate only when transitioning to Hexagonal/Clean Architecture.

**Reason:** The dual role is productive for most projects. The cost of maintaining parallel class hierarchies only pays off when framework independence is critically important.

---

## Risks Of Wrong Choice

Always separate: massive overhead for simple projects, parallel maintenance burden. Never separate: framework coupling prevents upgrades, domain logic tied to ORM features, difficult to test without database.

---

## Related Rules

- Rule 5: Write unit tests against domain behavior, not against getter values

---

## Related Skills

- Design a Rich Domain Model
- Design a Hexagonal Architecture (Ports and Adapters)
