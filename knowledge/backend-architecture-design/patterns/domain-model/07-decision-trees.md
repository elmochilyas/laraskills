# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Domain Model (Fowler) in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Rich domain model vs anemic domain model
* Decision 2: Eloquent as domain model vs separate domain layer
* Decision 3: Domain model persistence approach — Active Record vs Data Mapper

---

# Architecture-Level Decision Trees

---

## Decision: Rich Domain Model vs Anemic Domain Model

---

## Decision Context

Choose whether domain objects contain behavior (methods beyond getters/setters) or are data containers with logic in services.

---

## Decision Criteria

* performance considerations: rich models may load more dependencies; anemic models keep data access fast
* architectural considerations: rich models encapsulate rules in single place; anemic scatters rules across services
* security considerations: rich models can enforce invariants internally; anemic relies on external validation
* maintainability considerations: rich models reduce duplication; anemic is simpler but duplicates across services

---

## Decision Tree

Is the business logic complex (interconnected rules, state-based behavior, invariant enforcement)?
↓
YES → Rich domain model (encapsulates rules where they belong — in the domain object)
    ↓
    Can the rich model be tested independently of persistence?
    YES → Rich model is correctly designed (unit-testable without DB)
    ↓
    Domain object methods should use only the object's own state and injected domain services
    NO → Refactor: domain object is coupled to infrastructure — extract persistence concerns
    NO → Simple CRUD or basic validation — anemic domain model is acceptable
↓
Do multiple services duplicate the same business rules?
YES → Rich domain model eliminates duplication (rules live in the model once)
NO → Is the application simple enough that rules rarely change?
    YES → Anemic is fine (the rules are simple and stable)
    ↓
    Monitor: if rules start appearing in multiple services, refactor to rich model
    NO → Rich model will pay off as rules evolve

---

## Rationale

Rich domain models encapsulate business logic in the domain object, providing a single place for rules, invariants, and state changes. Anemic domain models (data with getters/setters only) move logic to services, causing duplication as rules grow. Start anemic (simple is fine), but refactor to rich model when duplication emerges.

---

## Recommended Default

**Default:** Anemic domain model for simple CRUD. Rich domain model when business rules are complex or duplicated across services.

**Reason:** Anemic models are simpler and sufficient for data-centric operations. Rich models eliminate duplication and provide better encapsulation as complexity grows. The threshold is when the same rule appears in 2+ services.

---

## Risks Of Wrong Choice

Rich model for simple CRUD: unnecessary methods, harder to serialize, over-engineering. Anemic model for complex domain: rules scattered across services, duplication, inconsistent enforcement. Rich model leaking persistence: domain object calls `save()` or queries the database.

---

## Related Rules

- Rule 1: Domain Model incorporates both data and behavior — rich domain objects with business logic
- Rule 2: Domain models should not depend on persistence concerns (no Eloquent calls in domain logic)

---

## Related Skills

- Design Rich Domain Model
- Identify Anemic Domain Model

---

## Decision: Eloquent as Domain Model vs Separate Domain Layer

---

## Decision Context

Choose whether to use Eloquent models as the domain model (convenient, coupled) or create separate domain objects (clean, more code).

---

## Decision Criteria

* performance considerations: Eloquent as domain is zero-cost (no mapping); separate domain adds hydration overhead
* architectural considerations: Eloquent as domain couples to framework; separate domain is framework-agnostic
* security considerations: Eloquent models expose all attributes and relations; domain objects can limit exposure
* maintainability considerations: Eloquent as domain is simpler; separate domain requires mapping but is cleaner

---

## Decision Tree

Is framework agnosticism a priority (hexagonal architecture, domain reuse across frameworks)?
↓
YES → Separate domain layer (plain PHP domain objects, no Eloquent dependency)
    ↓
    Is the mapping effort acceptable (Eloquent → Domain object → Eloquent)?
    YES → Separate domain layer with repositories handling mapping
    ↓
    Use repositories that map between Eloquent models and domain objects
    Domain objects are plain PHP with no Laravel dependency
    NO → If the mapping cost is prohibitive, reconsider whether framework agnosticism is worth it
NO → Is the application complex enough that Eloquent's coupling is a practical problem?
    YES → How much of a problem?
        → Testing difficulty (can't unit test without DB) → Separate domain
        → Eloquent methods polluting domain logic → Separate domain
        → Framework upgrades breaking domain logic → Separate domain
    NO → Eloquent as domain model is acceptable and pragmatic
↓
Is the team size small (<5 devs) and speed more important than purity?
YES → Eloquent as domain (pragmatic, faster development)
NO → Evaluate if the coupling overhead warrants separate domain layer

---

## Rationale

Using Eloquent models as the domain model is pragmatic and fast but couples the domain to Laravel. A separate domain layer (plain PHP objects) provides framework independence at the cost of mapping infrastructure. The decision depends on whether framework coupling causes practical problems (testing, upgrades, reuse). Most Laravel apps use Eloquent as the domain model.

---

## Recommended Default

**Default:** Eloquent as domain model for pragmatic development. Separate domain layer for hexagonal architecture or when framework coupling causes concrete problems.

**Reason:** Separate domain layer adds significant infrastructure (mapping, repositories, hydration) for the benefit of framework independence. Most applications don't need this isolation. Add it only when the coupling actually hurts.

---

## Risks Of Wrong Choice

Eloquent as domain in complex DDD app: domain logic mixed with persistence, testing difficulty, SRP violations. Separate domain layer for simple CRUD: massive over-engineering, mapping overhead with no benefit. Eloquent domain leaking persistence calls: domain logic coupled to database access.

---

## Related Rules

- Rule 3: Most Laravel apps use Eloquent models as the domain model — this is acceptable
- Rule 4: Separate domain layer is for hexagonal architecture or when framework coupling is a problem

---

## Related Skills

- Build Domain Layer with Eloquent
- Build Framework-Agnostic Domain Layer

---

## Decision: Domain Model Persistence Approach — Active Record vs Data Mapper

---

## Decision Context

Choose the persistence pattern for domain objects — Active Record (object saves itself) or Data Mapper (separate object handles persistence).

---

## Decision Criteria

* performance considerations: Active Record is simple and fast; Data Mapper adds mapping overhead
* architectural considerations: Active Record violates SRP (domain + persistence); Data Mapper separates concerns
* security considerations: Data Mapper can enforce data access rules during mapping; Active Record relies on model
* maintainability considerations: Active Record is simpler; Data Mapper is cleaner at scale

---

## Decision Tree

Is the domain model a simple data container with Eloquent as the domain model?
↓
YES → Active Record (Eloquent's native pattern — model saves itself)
    ↓
    Does the model have complex business logic that mixes with Eloquent methods?
    YES → The Active Record pattern is causing SRP violation
    ↓
    Consider separating: domain logic in traits/services, persistence via Eloquent
    NO → Active Record is the pragmatic choice
NO → Is the domain model a separate layer (plain PHP objects, not Eloquent)?
    YES → Data Mapper (domain objects are persistence-ignorant; repositories handle persistence)
    ↓
    Is the mapping between domain and database 1:1 (simple field mapping)?
    YES → Manual or convention-based mapper (attribute mapping, array construction)
    ↓
    Use constructor with named arguments or named constructors for mapping
    NO → Complex mapping requires explicit mapper logic (Data Mapper pattern)
NO → Is the application mixing both patterns (Eloquent models + plain domain objects)?
    YES → Choose one pattern — mixing creates confusion and inconsistent persistence
    ↓
    Standardize on one approach for the project
    Active Record for simple entities, Data Mapper for complex aggregates

---

## Rationale

Active Record (Eloquent's pattern) is simpler and faster to develop — the model handles its own persistence. Data Mapper separates the domain from persistence, enabling a clean domain layer at the cost of mapping infrastructure. The choice depends on whether you have a separate domain layer (Data Mapper) or use Eloquent as the domain (Active Record).

---

## Recommended Default

**Default:** Active Record (Eloquent) as the default persistence pattern. Data Mapper only when a separate framework-agnostic domain layer exists.

**Reason:** Active Record is Eloquent's native pattern, requires no additional mapping code, and is the pragmatic choice for most Laravel apps. Data Mapper is architecturally cleaner but requires significant infrastructure.

---

## Risks Of Wrong Choice

Active Record with separate domain layer: domain objects are saving themselves, defeating the purpose of separation. Data Mapper with Eloquent models: wrapping Eloquent in mapper creates unnecessary indirection. Both patterns in one project: inconsistent persistence approach.

---

## Related Rules

- Rule 5: Eloquent is Active Record — if you use it as the domain model, accept the SRP tradeoff
- Rule 6: If you have a separate domain model, use Data Mapper (repository) for persistence

---

## Related Skills

- Apply Active Record Pattern in Laravel
- Implement Data Mapper Pattern
