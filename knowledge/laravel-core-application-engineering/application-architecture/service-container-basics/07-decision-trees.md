# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Service Container Basics
**Generated:** 2026-06-03

---

# Decision Inventory

* Binding Strategy (bind vs singleton vs scoped vs instance)
* Interface Binding vs Auto-Resolution
* Constructor Injection vs Service Locator

---

# Architecture-Level Decision Trees

---

## Decision 1: Binding Strategy (bind vs singleton vs scoped vs instance)

---

## Decision Context

Choosing the correct container binding method for a service based on its lifecycle and state management requirements.

---

## Decision Criteria

* Whether the service holds state
* Whether state is per-request or application-wide
* Whether an existing instance should be shared
* Need for request-scoped lifecycle (Laravel 11+)

---

## Decision Tree

Does the service hold state?
↓
NO → Stateless service (repository, gateway, logger)?
    YES → Use `singleton()` — same instance reused across the application
NO → Stateful service?
    YES → Is the state per-request or per-resolution?
        Per-request → Use `scoped()` (Laravel 11+) — fresh instance per request/scope
        Per-resolution → Use `bind()` — new instance on every `make()`
NO → Do you have an existing (already constructed) instance to share?
    YES → Use `instance()` — inject the pre-built object

Is the service used in Octane/RoadRunner (long-running processes)?
YES → Use `bind()` or `scoped()` — NEVER `singleton()` with per-request state
NO → Use appropriate strategy based on state analysis above

---

## Rationale

Stateless services can be safely shared via singleton — zero construction overhead on subsequent resolutions. Stateful services need `bind()` (fresh instance per resolution) or `scoped()` (fresh instance per request in Octane). Using singleton for stateful services causes state leakage across requests in long-running processes.

---

## Recommended Default

**Default:** `singleton()` for stateless services, `bind()` for stateful services, `scoped()` for request-scoped state in Laravel 11+
**Reason:** Singleton minimizes overhead for services that don't hold state. Bind provides isolation for services that do. Scoped bridges the gap for Octane compatibility.

---

## Risks Of Wrong Choice

* `singleton()` for stateful service: State leaks across requests in Octane, bugs that are hard to reproduce
* `bind()` for stateless service: Unnecessary object construction on every resolution, wasted memory
* `instance()` with mutable object: Shared mutable state across consumers

---

## Related Rules

* Use Singletons for Stateless Services (05-rules.md)
* Never Use Container Resolution for Value Objects or DTOs (05-rules.md)
* Avoid Circular Dependencies Through Constructor Injection (05-rules.md)

---

## Related Skills

* Skill: Bind and Resolve Services in Container

---

## Decision 2: Interface Binding vs Auto-Resolution

---

## Decision Context

Whether to explicitly bind an interface to an implementation or rely on the container's auto-resolution via reflection.

---

## Decision Criteria

* Whether the abstract is an interface or concrete class
* Number of possible implementations
* Need to swap implementations (testing, multi-tenancy)
* Polymorphism requirements

---

## Decision Tree

Is the abstract an interface or abstract class?
↓
YES → Must explicitly bind: `$app->bind(Interface::class, Concrete::class)`
    Auto-resolution cannot determine which implementation to use
NO → Is it a concrete class with no dependencies?
    YES → Auto-resolution works — no binding needed
NO → Is it a concrete class with resolvable constructor dependencies?
    YES → Auto-resolution works — no binding needed
NO → Do different consumers need different implementations of the same abstract?
    YES → Use contextual binding: `$app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)`

---

## Rationale

Interfaces and abstract classes cannot be resolved by reflection because the container cannot determine which implementation to use. Concrete classes resolve automatically. Binding a concrete-to-concrete (`$app->bind(A::class, A::class)`) is redundant.

---

## Recommended Default

**Default:** Bind interfaces only; let concrete classes auto-resolve
**Reason:** Interfaces enable polymorphic substitution and testing. Concrete class auto-resolution keeps registration minimal. Redundant bindings add noise without benefit.

---

## Risks Of Wrong Choice

* Not binding an interface: `BindingResolutionException` at resolution time
* Binding concrete-to-concrete redundantly: Cluttered provider code, no benefit
* Not using contextual binding: Same implementation for all consumers, inflexible

---

## Related Rules

* Bind Interfaces, Not Concrete Classes (05-rules.md)

---

## Related Skills

* Skill: Bind and Resolve Services in Container

---

## Decision 3: Constructor Injection vs Service Locator

---

## Decision Context

Whether to declare dependencies in the constructor (injection) or resolve them on demand via `app()->make()` (service locator).

---

## Decision Criteria

* Class role (business logic vs entry point)
* Testability requirements
* Number of dependencies
* Dependency visibility needs

---

## Decision Tree

Where is the code?
↓
Business logic class (Service, Action, Domain)?
YES → Constructor injection required — never use `app()->make()`
NO → Controller?
    YES → Constructor injection preferred (explicit dependencies)
    NO → Event listener or route callback?
        YES → Either acceptable — injection for regular code, `app()->make()` for simple callbacks
NO → Is the dependency optional and only needed conditionally?
    YES → Method injection (`handle(Service $s)`) or optional constructor parameter
    NO → Constructor injection

---

## Rationale

Constructor injection makes dependencies explicit in the class signature, enables mock injection in tests, and makes the dependency graph visible without reading method bodies. The service locator pattern (`app()->make()`) hides dependencies and couples classes to the container.

---

## Recommended Default

**Default:** Constructor injection for all production business logic classes; `app()->make()` only in prototyping and simple callbacks
**Reason:** Explicit dependencies enable isolated testing, IDE support for refactoring, and clear understanding of a class's requirements without reading its implementation.

---

## Risks Of Wrong Choice

* `app()->make()` in services: Hidden dependencies, untestable without container mocking, service locator anti-pattern
* Constructor injection in prototyping: Unnecessary ceremony that slows iteration
* Circular dependencies through constructor: Container throws exception — redesign dependency graph

---

## Related Rules

* Use Constructor Injection Over Container Resolution in Application Code (05-rules.md)
* Never Reference Container in Serialized Job Payloads (05-rules.md)
* Clean Up Instance Bindings Between Tests (05-rules.md)

---

## Related Skills

* Skill: Bind and Resolve Services in Container
