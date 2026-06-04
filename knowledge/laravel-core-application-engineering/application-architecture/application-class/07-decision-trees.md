# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Application Class
**Generated:** 2026-06-03

---

# Decision Inventory

* Fluent API vs Class Extension for Application Customization
* Bootstrap Business Logic Placement
* Dependency Injection vs `app()` Helper Usage

---

# Architecture-Level Decision Trees

---

## Decision 1: Fluent API vs Class Extension for Application Customization

---

## Decision Context

When you need to customize middleware, exception handling, routing, or path resolution, you must choose between the fluent API in `bootstrap/app.php` and extending the Application class.

---

## Decision Criteria

* Customization type (middleware/exceptions/routing vs path resolution)
* Laravel version (11+ vs 10-)
* Need for multi-app path conventions
* Upgrade risk tolerance

---

## Decision Tree

What needs to be customized?
↓
Middleware, exceptions, or routing?
YES → Is the project Laravel 11+?
    YES → Use `bootstrap/app.php` fluent API
    NO → Use Kernel class properties
NO → Path resolution methods?
YES → Is the project Laravel 11+?
    YES → Extend Application class OR use fluent API?
        Fluent API sufficient → Use `->withRouting()`, `->withMiddleware()`, `->withExceptions()`
        Need custom paths → Extend Application class
    NO → Extend Application class
NO → Fluent API suffices → Use fluent API

---

## Rationale

The fluent API is the framework's declared customization contract in Laravel 11+. Extending Application creates tight coupling to the class hierarchy, increasing upgrade risk. Extension is only justified when overriding path resolution methods (`path()`, `configPath()`, `storagePath()`), implementing multi-app setups, or modifying the boot sequence.

---

## Recommended Default

**Default:** Use `bootstrap/app.php` fluent API via `Application::configure()`
**Reason:** Upgrade-safe, standardized, and aligns with framework conventions. Only extend Application when path resolution customization is explicitly required.

---

## Risks Of Wrong Choice

* Using fluent API when path resolution is needed: Cannot customize directory layout, forces default structure
* Extending Application unnecessarily: Upgrade risk, Unnecessary complexity, deviation from framework conventions
* Mixing both approaches: Duplicate configuration, confusing behavior

---

## Related Rules

* Prefer Fluent API Over Class Extension (05-rules.md)
* Always Call parent::__construct() When Extending Application (05-rules.md)
* Validate Custom Path Overrides Thoroughly (05-rules.md)

---

## Related Skills

* Skill: Configure Application via Fluent API
* Skill: Bootstrap Application with Custom Path Resolution

---

## Decision 2: Bootstrap Business Logic Placement

---

## Decision Context

Where to place initialization logic: in `bootstrap/app.php`, in service providers, or in dedicated classes.

---

## Decision Criteria

* Whether the logic is configuration vs business logic
* Whether the logic must run on every request
* Whether the logic needs caching or can be deferred
* Whether the logic requires resolved services

---

## Decision Tree

What type of logic?
↓
Application configuration (middleware, exceptions, routing)?
YES → `bootstrap/app.php` fluent API
NO → Service registration or binding?
YES → Service provider `register()` method
NO → Service initialization or setup?
YES → Service provider `boot()` method
NO → Business logic, DB queries, or API calls?
YES → Does it need to run on every request?
    YES → Wrong approach — move to middleware or controller
    NO → Extract to a dedicated service/action class, call from a command or event listener

---

## Rationale

`bootstrap/app.php` runs on every request and cannot be cached. Service providers have a two-phase contract (register for bindings, boot for initialization). Business logic belongs in dedicated service/action classes, not in bootstrap or provider code.

---

## Recommended Default

**Default:** Keep `bootstrap/app.php` lean — only fluent configuration calls. Use service providers for container binding and initialization. Extract business logic to dedicated classes.
**Reason:** Bootstrap code runs on every request and cannot be cached. Service providers follow a strict two-phase contract. Business logic in bootstrap adds per-request latency and mixes configuration with application behavior.

---

## Risks Of Wrong Choice

* Business logic in `bootstrap/app.php`: Per-request performance penalty, untestable logic, deployment validation bypassed
* Service resolution in `register()`: Works by coincidence but fails when provider order changes
* Bindings registered after boot: Services resolve with default/stale implementations

---

## Related Rules

* Keep bootstrap/app.php Free of Business Logic (05-rules.md)
* Avoid Post-Boot Binding Registration (05-rules.md)

---

## Related Skills

* Skill: Configure Application via Fluent API
* Skill: Register Service Providers

---

## Decision 3: Dependency Injection vs `app()` Helper

---

## Decision Context

Whether to resolve dependencies via constructor injection or use the `app()` helper for service resolution.

---

## Decision Criteria

* Class type (business logic vs bootstrap code)
* Testability requirements
* Dependency visibility
* Refactoring frequency

---

## Decision Tree

Where is the code?
↓
Service provider, bootstrap code, or prototyping?
YES → `app()` helper is acceptable
NO → Business logic class (service, action, domain object)?
YES → Constructor injection (use typed parameters)
NO → Event listener or route closure?
YES → `app()` helper acceptable (minimal ceremony)
NO → Constructor injection preferred

---

## Rationale

Constructor injection makes dependencies explicit, testable, and IDE-friendly. The `app()` helper creates hidden dependencies that cannot be mocked or substituted without container awareness.

---

## Recommended Default

**Default:** Constructor injection for all business logic classes. `app()` only in bootstrap code, service providers, and prototyping.
**Reason:** Explicit dependencies enable isolated unit testing and IDE autocompletion. Hidden `app()` calls create service locator anti-pattern and make refactoring difficult.

---

## Risks Of Wrong Choice

* Using `app()` in business classes: Hidden dependencies that cannot be mocked, classes not testable in isolation, service locator anti-pattern
* Constructor injection in bootstrap code: Unnecessary ceremony in code that only runs once

---

## Related Rules

* Use Dependency Injection Over app() Helper in Application Code (05-rules.md)

---

## Related Skills

* Skill: Configure Application via Fluent API
