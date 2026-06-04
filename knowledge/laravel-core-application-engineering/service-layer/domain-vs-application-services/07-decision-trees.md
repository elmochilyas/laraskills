# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Domain vs Application Services
**Generated:** 2026-06-03

---

# Decision Inventory

* Domain Service vs Application Service Classification
* Infrastructure-Free Domain Services vs Framework-Coupled Domain Logic
* Framework-Free Testing for Domain Services vs Laravel-Bootstrapped Testing
* Pure Domain Logic on Entities vs Domain Service Extraction

---

# Architecture-Level Decision Trees

---

## Decision 1: Domain Service vs Application Service Classification

---

## Decision Context

Whether a given class should be modeled as a domain service (pure business logic) or an application service (orchestration + infrastructure coordination).

---

## Decision Criteria

* Whether the logic involves pure business rules or infrastructure coordination
* Whether the service knows about HTTP, persistence, or external systems
* Whether the service can be tested without framework boot

---

## Decision Tree

Does the operation contain pure business rules (calculations, validations, domain decisions)?
↓
NO → Application service — infrastructure coordination only; no domain rules
YES → Does the operation need HTTP, cache, database, or queue infrastructure?
    ↓
    YES → Application service — orchestration with infrastructure dependencies; delegate domain rules to domain services
    NO → Can the logic be expressed as a method on an entity or value object?
        ↓
        YES → Entity method — put the logic on the domain object itself (e.g., `Order::calculateTotal()`)
        NO → Domain service — pure business logic that doesn't fit on an entity
NO → Is the operation orchestrating multiple steps (call order, transaction, error handling)?
    ↓
    YES → Application service — orchestration is the defining characteristic of application services
    NO → Is the operation a CRUD pass-through?
        ↓
        YES → Neither — CRUD pass-through doesn't need a service; use controller or repository directly
        NO → Application service — most business operations in Laravel are application services

---

## Rationale

Domain services contain business rules that don't naturally fit on an entity (e.g., `PricingService.calculateTotal()` that spans multiple products). Application services orchestrate infrastructure and domain objects to fulfill use cases (e.g., `CheckoutService.checkout()`). In Laravel, 80%+ of services are application services because most business operations involve infrastructure (database, cache, queues).

---

## Recommended Default

**Default:** Application service for most Laravel service classes. Domain service only when there's significant pure business logic that doesn't fit on an entity.
**Reason:** Most Laravel operations involve infrastructure. Forcing pure domain services for everything adds unnecessary abstraction.

---

## Risks Of Wrong Choice

* Application service for pure domain logic: Business rules coupled to infrastructure; untestable without Laravel boot
* Domain service with infrastructure: Repository/HTTP dependencies in a domain service violate layering; test becomes slow
* Entity method for cross-entity logic: Entity doesn't have access to other entities' data; requires injected repositories
* Neither when orchestration is needed: Logic in controller; unreusable, untestable

---

## Related Rules

* Enforce Infrastructure-Free Domain Services
* Enforce Application Services for Orchestration

---

## Related Skills

* Classify Services as Application or Domain Based on Infrastructure Dependencies
* Delegate Pure Business Logic to Domain Services

---

---

## Decision 2: Infrastructure-Free Domain Services vs Framework-Coupled Domain Logic

---

## Decision Context

Whether a domain service should have zero infrastructure dependencies (pure PHP) or can use Laravel framework classes.

---

## Decision Criteria

* Whether the domain logic needs database lookups, caching, or external API calls
* Whether the domain service will be tested with `new` keyword
* Whether the domain service is shared across multiple application services

---

## Decision Tree

Can the domain logic be computed solely from input parameters (no external data needed)?
↓
YES → Infrastructure-free — pure PHP; no framework dependencies; testable with `new`
NO → Does the domain logic need database lookups?
    ↓
    YES → Not a domain service — the data retrieval is infrastructure; split into application service + pure domain service
    NO → Does the domain logic need caching or external API calls?
        ↓
        YES → Not a domain service — infrastructure dependencies; move to application service
        NO → Infrastructure-free — if it truly doesn't need infrastructure, keep it pure
NO → Will the domain service be tested without Laravel boot?
    ↓
    YES → Infrastructure-free — framework dependencies prevent pure unit testing
    NO → Can accept framework dependencies — but reconsider if the service is truly a domain service

---

## Rationale

Domain services must be infrastructure-free by definition. If the logic needs database lookups or external API calls, it's an application service that calls a pure domain service for the computation step. The domain service receives pre-fetched data as parameters and computes the result. This keeps business rules testable without framework boot.

---

## Recommended Default

**Default:** Domain services must be infrastructure-free (pure PHP, no Laravel dependencies).
**Reason:** Infrastructure dependencies make domain logic untestable without framework boot and violate the domain layer's independence.

---

## Risks Of Wrong Choice

* Eloquent query in domain service: Test requires database; slow; violates domain purity
* Cache call in domain service: Cache is infrastructure; domain service should not know about caching
* HTTP client in domain service: External API dependency makes the test flaky and slow
* Pure domain service with infrastructure: Still pure — if it has no infrastructure, it's correct by definition

---

## Related Rules

* Enforce Infrastructure-Free Domain Services
* Enforce Application Services for Orchestration

---

## Related Skills

* Classify Services as Application or Domain Based on Infrastructure Dependencies
* Delegate Pure Business Logic to Domain Services

---

---

## Decision 3: Framework-Free Testing for Domain Services vs Laravel-Bootstrapped Testing

---

## Decision Context

Whether to test domain services with pure PHP unit tests (no Laravel) or with Laravel test case bootstrapping.

---

## Decision Criteria

* Whether the domain service has any framework dependencies
* Whether test speed is a priority
* Whether the team uses Pest or PHPUnit

---

## Decision Tree

Does the domain service have any framework dependencies?
↓
YES → Must use Laravel test boot — but this means it's not a pure domain service; refactor first
NO → Is test execution speed a priority?
    ↓
    YES → Pure PHPUnit test (no Laravel boot) — <1ms per test; thousands run in milliseconds
    NO → Does the team prefer framework consistency (all tests extend TestCase)?
        ↓
        YES → Use Laravel TestCase — creates the service via `new` but bootstraps framework unnecessarily
        NO → Pure PHPUnit test — instantiate with `new`, pass dependencies, test
NO → Is the domain service used in a context where framework boot is mandatory?
    ↓
    YES → Use Laravel TestCase — the service may be indirectly dependent on framework features
    NO → Pure PHPUnit test — domain services should always be testable without boot

---

## Rationale

Domain services are pure PHP classes with no framework dependencies. They can be instantiated with `new Service($dependency)` and tested without Laravel boot. Framework boot adds ~200ms per test file, so pure test classes for domain services run significantly faster. This enables TDD with rapid feedback loops.

---

## Recommended Default

**Default:** Pure PHPUnit test classes for domain services — instantiate with `new`, no Laravel boot.
**Reason:** Domain services are pure by definition. Framework boot is unnecessary overhead for business logic testing.

---

## Risks Of Wrong Choice

* Laravel TestCase for domain service: 200ms overhead per test file; slow feedback loop
* Pure PHPUnit test for application service: Missing framework features (DB, container, facades) — test won't work
* Pure PHPUnit test for impure domain service: Test passes because dependencies are mocked, but real framework dependencies cause runtime errors
* No tests for domain services: Business logic untested; highest risk of production bugs

---

## Related Rules

* Enforce Infrastructure-Free Domain Services
* Enforce Application Services for Orchestration

---

## Related Skills

* Write Pure Unit Tests for Domain Services (No Framework Boot)
* Test Domain Services with `new` Keyword Instantiation

---

---

## Decision 4: Pure Domain Logic on Entities vs Domain Service Extraction

---

## Decision Context

Whether to put business logic as a method on an entity/Model or extract it to a domain service.

---

## Decision Criteria

* Whether the logic involves multiple entities
* Whether the logic requires external data (beyond the entity's own state)
* Whether the logic is complex enough to warrant a separate class

---

## Decision Tree

Does the logic involve only the entity's own state (single entity)?
↓
YES → Entity method — `$order->calculateTotal()` uses `$order->items` and `$order->discount`
NO → Does the logic span multiple entities or require external data?
    ↓
    YES → Domain service — `$pricingService->calculateTotal($order, $catalog)` needs data from multiple sources
    NO → Entity method — if it only needs the entity's own state, keep it on the entity
NO → Is the logic complex (30+ lines, multiple sub-calculations)?
    ↓
    YES → Domain service — complex logic benefits from its own class with its own tests
    NO → Is the logic needed from multiple contexts (HTTP, CLI, queue)?
        ↓
        YES → Domain service — reusable across contexts without duplicating entity method calls
        NO → Entity method — simple logic on the entity is sufficient

---

## Rationale

Single-entity logic belongs on the entity. Cross-entity logic or logic requiring external data belongs in a domain service. Entity methods are discoverable (developers look at the Model for related logic), while domain services are appropriate for operations that span multiple domain objects.

---

## Recommended Default

**Default:** Entity methods for single-entity logic. Domain services for cross-entity or externally-dependent logic.
**Reason:** Entity methods are more discoverable and simpler. Domain services are only needed when the logic transcends entity boundaries.

---

## Risks Of Wrong Choice

* Domain service for single-entity logic: Unnecessary abstraction; developers must know where to find the logic
* Entity method for cross-entity logic: Entity gets injected dependencies (repository, other services) — breaks the entity's purity
* Entity method for complex logic: Entity class grows beyond single responsibility; class becomes a "god model"
* Domain service for trivial logic: Over-engineering; one-line calculation delegated to a separate class

---

## Related Rules

* Enforce Infrastructure-Free Domain Services
* Enforce Application Services for Orchestration

---

## Related Skills

* Classify Services as Application or Domain Based on Infrastructure Dependencies
* Delegate Pure Business Logic to Domain Services
