# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Class Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Entity-Oriented Services vs Capability-Oriented Services
* Stateless Service Design vs Mutable State on $this
* Constructor Injection vs Method Injection for Dependencies
* Single-Method Services vs Multi-Method Services

---

# Architecture-Level Decision Trees

---

## Decision 1: Entity-Oriented Services vs Capability-Oriented Services

---

## Decision Context

Whether to organize service methods around a business entity (entity-oriented) or a cross-cutting capability (capability-oriented).

---

## Decision Criteria

* Whether the service methods all relate to the same entity
* Whether the service crosses entity boundaries
* Whether the capability is used across multiple entities

---

## Decision Tree

Do all methods in the service relate to the same entity?
↓
YES → Entity-oriented — `UserService` with `register()`, `suspend()`, `activate()`
NO → Do the methods span multiple entities but share a capability?
    ↓
    YES → Capability-oriented — `NotificationService` sends email, SMS, push for users, orders, invoices
    NO → Do the methods represent a domain computation not tied to one entity?
        ↓
        YES → Capability-oriented — `PricingService` calculates prices across products, discounts, promotions
        NO → Reconsider the service grouping — unrelated methods suggest service should be split
NO → Is the service a thin wrapper around a capability that maps to an entity?
    ↓
    YES → Entity-oriented — `PaymentService` primarily processes payments for `Order` → name after the primary entity
    NO → Capability-oriented — cross-cutting capability with no primary entity

---

## Rationale

Entity-oriented services are the default because they map to the application's domain model. Developers naturally look for `UserService` when thinking about user operations. Capability-oriented services are for cross-cutting concerns that don't belong to any single entity (notifications, payments, authentication).

---

## Recommended Default

**Default:** Entity-oriented services. Extract capability-oriented services only when the capability truly spans multiple entities.
**Reason:** Entity names are stable and predictable. Capability-oriented services should be the exception, not the rule.

---

## Risks Of Wrong Choice

* Entity-oriented for payments: `OrderService` containing payment logic — violates single responsibility; 40-method god service
* Capability-oriented for entity-specific logic: `RegistrationService` instead of `UserService.register()` — extra files; harder to discover
* Mixed: Both `UserService` and `RegistrationService` exist — unclear where to add new features
* Entity-oriented for truly cross-cutting: `UserService.sendEmail()`, `OrderService.sendEmail()`, `InvoiceService.sendEmail()` — duplicated notification logic

---

## Related Rules

* Enforce Stateless Service Design
* Enforce Services for Multiple Related Operations

---

## Related Skills

* Design Entity-Oriented Services for Entity-Specific Operations
* Design Capability-Oriented Services for Cross-Cutting Concerns

---

---

## Decision 2: Stateless Service Design vs Mutable State on $this

---

## Decision Context

Whether to store per-call state on `$this` properties or pass data as parameters and return results.

---

## Decision Criteria

* Whether the service will run in Octane/RoadRunner (long-lived process)
* Whether the service needs to be shared across requests
* Whether the service is resolved as a singleton

---

## Decision Tree

Will the service run in Octane/RoadRunner?
↓
YES → ALWAYS stateless — mutable state leaks across requests; use `readonly class` for compiler enforcement
NO → Is the service registered as a singleton in the container?
    ↓
    YES → Stateless required — singleton means same instance across all requests; state leaks
    NO → Is the service instantiated per-request (not singleton)?
        ↓
        YES → Stateful is technically safe in PHP-FPM — but still not recommended; stateless is safer
        NO → Stateless — always prefer stateless; no reason to be stateful
NO → Does the service need to accumulate results across method calls?
    ↓
    YES → Return values instead — caller accumulates results; service stays stateless
    NO → Stateless — no benefit to storing state

---

## Rationale

Stateless services are safe in any runtime (PHP-FPM, Octane, RoadRunner). Stateful services work in PHP-FPM (where each request creates a fresh instance) but fail in Octane/RoadRunner (where the same instance handles multiple requests). Using `readonly class` enforces statelessness at the compiler level. Stateless services are also easier to test — no setup/teardown of internal state.

---

## Recommended Default

**Default:** ALWAYS stateless. Use `final readonly class` to enforce at the compiler level.
**Reason:** Stateless is safe in all runtimes, testable, and composable. There is no benefit to mutable state on services.

---

## Risks Of Wrong Choice

* Stateful service in Octane: Request N+1 sees request N's data — data leakage bug
* Stateful service as singleton: Same as Octane — state shared across all requests
* `readonly class` with mutable array property: `readonly` prevents reassignment but array items can still be modified — careful with reference types
* Stateful service with getter: `$service->doSomething(); $result = $service->getResult()` — forces two-step call; not thread-safe

---

## Related Rules

* Enforce Stateless Service Design
* Enforce Services for Multiple Related Operations

---

## Related Skills

* Design Entity-Oriented Services for Entity-Specific Operations
* Design Capability-Oriented Services for Cross-Cutting Concerns

---

---

## Decision 3: Constructor Injection vs Method Injection for Dependencies

---

## Decision Context

Whether to inject dependencies via constructor (available to all methods) or via method parameters (per-call).

---

## Decision Criteria

* Whether the dependency is used by multiple methods
* Whether the dependency varies per method call
* Whether the dependency is infrastructure (constructor) or data (method parameter)

---

## Decision Tree

Is the dependency used by multiple methods in the service?
↓
YES → Constructor injection — DRY; one injection point for all methods
NO → Is the dependency only used by a single method?
    ↓
    YES → Method injection — no need to pollute constructor for a single-method dependency
    NO → Constructor injection — any shared dependency belongs in the constructor
YES → Is the dependency operational data that varies per call (user ID, request data)?
    ↓
    YES → Method parameter — operational data belongs in method signature, not constructor
    NO → Constructor injection — stable dependencies (repositories, gateways, loggers) belong in the constructor
NO → Is the dependency optional?
    ↓
    YES → Method injection with default — constructor injection with null default is also acceptable
    NO → Constructor injection — required dependencies should be explicit in the constructor

---

## Rationale

Constructor injection is for stable infrastructure dependencies that don't change between calls (repositories, gateways). Method injection is for operational data that varies per call (user ID, filter criteria). Constructor injection makes the service's stable dependencies visible at instantiation time and enables proper dependency mocking in tests.

---

## Recommended Default

**Default:** Constructor injection for all stable, shared dependencies. Method parameters for all per-call data.
**Reason:** Constructor injection makes dependencies explicit at instantiation. Method parameters make per-call data explicit at invocation.

---

## Risks Of Wrong Choice

* Constructor injection for per-call data: Service must be re-instantiated for each call; defeats statelessness
* Method injection for shared dependencies: Every method signature is cluttered; tests must mock per-method
* 15 constructor parameters: Service depends on too many things — needs refactoring (max 8 guideline)
* Method injection for rare dependencies: A dependency used by 1 method can be method-injected — cleaner than constructor

---

## Related Rules

* Enforce Stateless Service Design
* Enforce Services for Multiple Related Operations

---

## Related Skills

* Design Entity-Oriented Services for Entity-Specific Operations
* Design Capability-Oriented Services for Cross-Cutting Concerns

---

---

## Decision 4: Single-Method Services vs Multi-Method Services

---

## Decision Context

Whether to design a service with multiple related methods or split each operation into its own service.

---

## Decision Criteria

* Whether the methods share dependencies
* Whether the methods are related by entity or capability
* Whether the methods are likely to be tested together

---

## Decision Tree

Do the methods share common dependencies?
↓
YES → Multi-method service — shared dependencies constructor-injected once; available to all methods
NO → Are the methods related to the same entity (User, Order)?
    ↓
    YES → Multi-method service — entity grouping is the primary organizational unit
    NO → Single-method service (action) — unrelated operations should not be in the same class
YES → Are the methods all simple delegations (CRUD pass-through)?
    ↓
    YES → Multi-method service — CRUD methods naturally group together; extracting each to a separate file is over-engineering
    NO → Are some methods complex enough to need isolated testing?
        ↓
        YES → Extract complex methods to actions; keep simple methods in the service
        NO → Multi-method service — all methods are simple; no need for extraction
NO → Is the method reused across multiple entry points (HTTP, CLI, queue)?
    ↓
    YES → Action pattern — a reused operation benefits from its own testable class
    NO → Multi-method service — single-entry operations can stay in the service

---

## Rationale

Multi-method services are the default. They group related operations that share dependencies and context. Single-method services (actions) are for operations that are complex enough to warrant their own file, need isolated testing, or are reused across multiple entry points. The decision is contextual — start with a service, extract to an action when the need arises.

---

## Recommended Default

**Default:** Multi-method service. Extract to single-method actions when an operation demonstrates need (complexity, reuse, isolated testing).
**Reason:** Defaulting to actions creates excessive files. Services provide organizational structure. Extract only when justified.

---

## Risks Of Wrong Choice

* Multi-method service with 40 methods: God service; hard to test; merge conflicts; violates SRP
* Single-method for every CRUD op: 7 files per entity (index, show, create, store, edit, update, destroy) — excessive file proliferation
* Multi-method service for unrelated ops: `UserService` with `register()`, `sendNewsletter()`, `calculatePayroll()` — unrelated; split by responsibility
* Single-method for complex orchestration: Method needs multiple dependencies — constructor injection is cleaner than method injection

---

## Related Rules

* Enforce Stateless Service Design
* Enforce Services for Multiple Related Operations

---

## Related Skills

* Design Entity-Oriented Services for Entity-Specific Operations
* Design Capability-Oriented Services for Cross-Cutting Concerns
