# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Facade System
**Generated:** 2026-06-03

---

# Decision Inventory

* Facades vs Constructor Injection
* Facade vs Helper vs Injection Access Pattern
* Real-Time Facades Usage

---

# Architecture-Level Decision Trees

---

## Decision 1: Facades vs Constructor Injection

---

## Decision Context

Whether to access a service via a static facade proxy or inject it through the constructor.

---

## Decision Criteria

* Service type (framework infrastructure vs application business logic)
* Class role (controller vs service/action)
* Test mocking requirements
* Dependency visibility needs

---

## Decision Tree

What type of service is being accessed?
↓
Well-known framework service (Cache, Log, Config, DB, Route, Session, Auth)?
YES → What class role?
    Controller or View → Facade is acceptable
    Service, Action, Domain Object → Constructor injection required
    Event Listener or Route Closure → Either acceptable
NO → Custom application service (PaymentService, UserRepository)?
    YES → Constructor injection required
    NO → Package code?
        YES → Constructor injection required (no facades in packages)
        NO → Constructor injection preferred

---

## Rationale

Framework services are stable, well-understood, and unlikely to be swapped. Application services need explicit, testable dependency signatures. Controllers benefit from facade ergonomics; business logic classes benefit from injection explicitness.

---

## Recommended Default

**Default:** Facades for framework services in controllers and views; constructor injection for all application services in business logic classes
**Reason:** Keeps convenience where it's safe (stable framework APIs) and explicitness where it's needed (custom business logic that changes and is tested).

---

## Risks Of Wrong Choice

* Facades in service classes: Hidden dependencies invisible in constructor signature, hard to test, refactoring resistance
* Constructor injection for everything: Verbose controllers, unnecessary ceremony for stable framework services
* Mixed patterns in same class: Confusing dependency graph

---

## Related Rules

* Use Facades for Framework Services, Injection for Application Services (05-rules.md)
* Avoid Mixed Access Patterns in the Same Class (05-rules.md)
* Never Use Facades in Package Code (05-rules.md)

---

## Related Skills

* Skill: Choose Between Facades and Constructor Injection

---

## Decision 2: Facade vs Helper vs Injection Access Pattern

---

## Decision Context

Choosing the right syntax to access a service — static facade call, helper function, or injected dependency.

---

## Decision Criteria

* Class context (controller, service, view)
* Need for autocompletion (IDE helper availability)
* Testability requirements
* Consistency with surrounding code

---

## Decision Tree

Where is the code?
↓
Blade view or template?
YES → Helper function (e.g., `{{ config('app.name') }}`, `{{ url('/path') }}`)
NO → Controller or route handler?
    YES → Facade for framework services, injection for application services
NO → Service, Action, or Domain Object?
    YES → Constructor injection (no facades or helpers)
NO → Event listener or Job handler?
    YES → Constructor injection or method injection

Does the class need IDE autocompletion?
YES → Use constructor injection (IDE sees type hints) or run `php artisan ide-helper:generate`
NO → Facade or helper acceptable in appropriate contexts

---

## Rationale

Each access pattern has a natural habitat: helpers in views (concise), facades in controllers (ergonomic for stable services), injection in business logic (explicit, testable). Choosing by context keeps each pattern where it's most valuable.

---

## Recommended Default

**Default:** Helpers in views, facades for framework services in controllers, constructor injection in services/actions
**Reason:** Each pattern serves its context best. Helpers are most concise in views. Facades provide ergonomic static syntax for controllers. Constructor injection provides testability for business logic.

---

## Risks Of Wrong Choice

* Helpers in services: Hidden dependencies, no type safety, hard to mock
* Injection in views: Verbose template code, unnecessary parameter passing
* Facades in service provider `register()`: Runtime exceptions (facades may not be available yet)

---

## Related Rules

* Use Facades for Framework Services, Injection for Application Services (05-rules.md)
* Never Use Facades in Service Provider register() Methods (05-rules.md)
* Avoid Facade Calls in Class Constructors (05-rules.md)

---

## Related Skills

* Skill: Choose Between Facades and Constructor Injection

---

## Decision 3: Real-Time Facades Usage

---

## Decision Context

Whether to use the `Facades\` prefix to access any class as a facade (real-time facade) or use standard constructor injection.

---

## Decision Criteria

* Whether the usage is production code or prototyping
* How many call sites use the service
* Whether the call is within a business logic class
* Test isolation needs

---

## Decision Tree

Is this prototyping or throwaway code?
↓
YES → Real-time facades acceptable (speed over structure)
NO → Production code?
    YES → How many call sites use this service?
        1-2 call sites → Real-time facade may be acceptable (but injection preferred)
        3+ call sites → Constructor injection required
NO → Is the calling class a business logic class (Service, Action, Domain)?
    YES → Constructor injection required (never real-time facades)
    NO → Controller or event listener?
        YES → Real-time facade acceptable (but injection still preferred)

---

## Rationale

Real-time facades provide prototyping speed at the cost of hidden dependencies. In production code, constructor injection makes dependencies visible and testable. Reserve real-time facades for prototyping or leaf operations where speed matters more than structure.

---

## Recommended Default

**Default:** Constructor injection for all production code; real-time facades only for prototyping
**Reason:** Real-time facades create implicit dependencies that are invisible in class signatures. For production code, the explicitness of constructor injection is worth the additional ceremony.

---

## Risks Of Wrong Choice

* Real-time facade in service: Hidden dependency, hard to test, refactoring requires finding all facade usages in method bodies
* Constructor injection in prototype: Unnecessary ceremony slows iteration
* Overused real-time facades: Every service call becomes implicit dependency, codebase becomes hard to refactor

---

## Related Rules

* Avoid Mixed Access Patterns in the Same Class (05-rules.md)
* Reset Facade State Between Tests (05-rules.md)
* Use IDE Helper for Facade Autocompletion (05-rules.md)

---

## Related Skills

* Skill: Choose Between Facades and Constructor Injection
