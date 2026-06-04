# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Dependency Injection
**Knowledge Unit:** Service Locator Anti-Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Dependency Resolution: Constructor injection vs service locator (`app()`)
2. Fix Strategy: Refactor service locator vs leave as-is
3. Facade Usage: Acceptable vs unacceptable facade use contexts

---

# Architecture-Level Decision Trees

---

## Decision Name: Dependency Resolution Strategy

---

## Decision Context

Choosing between explicit constructor injection and service locator (`app()`, `resolve()`, facade) for resolving dependencies.

---

## Decision Criteria

* performance — `app()` adds negligible overhead; hidden deps may cause repeated resolution
* architectural — constructor injection declares dependencies explicitly; service locator hides them
* security — service locator access is unconstrained; hidden deps are harder to audit
* maintainability — explicit injection enables static analysis; service locator breaks it

---

## Decision Tree

Is the code in a business logic class (service, repository, action, domain model)?
↓
YES → Use constructor injection — never call `app()` in business logic
NO → Is the code in a service provider's `register()` or `boot()` method?
↓
YES → `app()` is acceptable — container access is the provider's purpose
NO → Is the code in a top-level route closure or Blade directive?
↓
YES → `app()` is acceptable for rapid prototyping (refactor before merging)
NO → Is the code in a controller method and the dependency is only needed once?
↓
YES → Consider method injection or constructor injection — avoid `app()` in controllers too
NO → Use constructor injection — always prefer explicit dependency declaration

---

## Rationale

Constructor injection makes every collaborator visible in the class signature, enabling static analysis, IDE autocompletion, and clear documentation of requirements. `app()` hides dependencies, couples to the container, and makes classes impossible to instantiate outside Laravel context. Service providers are the exception because their purpose is to configure the container.

---

## Recommended Default

**Default:** Constructor injection for all business logic classes; `app()` only in service providers and top-level route closures.
**Reason:** Explicit dependencies are testable, analyzable, and decoupled from the container.

---

## Risks Of Wrong Choice

- `app()` in business logic: hidden dependencies; testing requires container config; static analysis broken; cannot use class outside Laravel.
- `app()` in loop: repeated resolution — performance hit and redundant container lookups.
- Container as dependency: `__construct(Container $container)` — disguised service locator with same drawbacks.

---

## Related Rules

- Never call `app()` in business logic classes (05-rules.md, Rule 1)
- Never inject Container into business logic classes (05-rules.md, Rule 2)

---

## Related Skills

- Replace Service Locator with Constructor Injection (06-skills.md)

---

## Decision Name: Facade Usage Context

---

## Decision Context

Determining whether facade usage in a given class is acceptable or constitutes a service locator anti-pattern.

---

## Decision Criteria

* performance — facade resolution is O(1); hidden deps may cause multiple resolutions
* architectural — facades are documented service locators with tradeoffs
* security — facades provide global access to services
* maintainability — facades hide dependencies but have testing support via `shouldReceive()`

---

## Decision Tree

Is the class a controller, Blade view, or route file?
↓
YES → Facade usage is acceptable — these are the documented contexts for facades
NO → Is the class in the `app/` directory as a service, repository, or domain class?
↓
YES → Avoid facades — use constructor injection with interface type-hints instead
NO → Does the class represent domain logic or business rules?
↓
YES → Never use facades — inject dependencies explicitly
NO → Is the class a test class or testing utility?
↓
YES → Facade faking (`shouldReceive()`) is acceptable — testing support is a facade feature
NO → Use constructor injection for non-framework classes

---

## Rationale

Laravel's facades are documented as service locators with the tradeoff explicitly stated in the documentation. They are intended for controllers, views, and route files where convenience outweighs the need for explicit dependency declaration. In domain services, repositories, and business logic, facades hide dependencies and should be replaced with constructor injection.

---

## Recommended Default

**Default:** Facades in controllers, views, and route files; constructor injection in services, repositories, and domain logic.
**Reason:** Facades provide convenience where appropriate; explicit injection provides testability where it matters.

---

## Risks Of Wrong Choice

- Facade in domain service: hidden dependency; testing requires `shouldReceive()` and facade root clearing.
- Facade with `shouldReceive()` in business logic: couples test to facade implementation; breaks on refactor to injection.
- Real-time facade for every class: indiscriminate facade usage defeats the purpose of explicit DI.

---

## Related Rules

- Use facades sparingly and consciously (05-rules.md, Rule 3)
- Never call `app()` in business logic classes (05-rules.md, Rule 1)

---

## Related Skills

- Replace Service Locator with Constructor Injection (06-skills.md)
