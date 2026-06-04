# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Registry pattern (Service Container)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Registry usage — dependency injection container vs service locator
* Decision 2: Configuration registry — config() for static config vs runtime state
* Decision 3: Registry vs constructor injection — when to use the container explicitly

---

# Architecture-Level Decision Trees

---

## Decision: Registry Usage — Dependency Injection Container vs Service Locator

---

## Decision Context

Choose whether to use Laravel's container as a DI container (inject dependencies) or as a service locator (resolve dependencies internally).

---

## Decision Criteria

* performance considerations: DI container resolution is similar to service locator
* architectural considerations: DI container makes dependencies explicit; service locator hides them
* security considerations: DI container prevents runtime dependency swapping; service locator allows it
* maintainability considerations: DI container enables constructor injection; service locator obscures class requirements

---

## Decision Tree

Is the class using `app()->make()` or `resolve()` inside its methods?
↓
YES → Service locator pattern — evaluate if this is appropriate
    ↓
    Is this a framework-level class (service provider, middleware, route registration)?
    YES → Service locator is acceptable (framework integration points)
    NO → Is this business logic or application code?
        YES → Refactor to constructor injection (service locator hides dependencies)
        ↓
        Can the dependency be injected via constructor instead?
        YES → Refactor now — constructor injection is always preferred
        ↓
        Does the class have more than 5 constructor parameters already?
        YES → Class may violate SRP — split instead of using locator
        NO → Constructor injection is straightforward
        NO → Framework integration point: service locator may be acceptable
NO → Is the class using constructor injection with container-resolved dependencies?
    YES → DI container pattern (correct usage — dependencies are explicit)
    ↓
    Are all dependencies injected through the constructor (no facades, no helpers)?
    YES → Proper DI usage
    NO → Refactor facades and helpers to constructor injection

---

## Rationale

Laravel's container works as both a DI container (automatic resolution of constructor parameters) and a service locator (`app()->make()`). The DI container pattern is always preferred — dependencies are explicit, testable, and documented by the constructor. Service locator hides dependencies, making classes harder to test and understand. Reserve service locator for framework integration points only.

---

## Recommended Default

**Default:** Constructor injection via the DI container. Service locator (`app()->make()`) only in service providers and framework bootstrap code.

**Reason:** Constructor injection makes dependencies explicit, enables easy mocking in tests, and documents what a class needs. Service locator obscures dependencies and makes testing harder.

---

## Risks Of Wrong Choice

Service locator in business logic: hidden dependencies, untestable without container, DIP violation. Constructor injection for everything: constructor pollution if class violates SRP.

---

## Related Rules

- Rule 1: The container is a DI container first — use constructor injection, not `app()->make()` in business logic
- Rule 2: Service locator (calling `app()` or `resolve()` inside methods) is for framework code only

---

## Related Skills

- Apply Constructor Injection
- Refactor Facades to Constructor Injection

---

## Decision: Configuration Registry — config() for Static Config vs Runtime State

---

## Decision Context

Choose whether to use Laravel's config registry for static configuration only or also for runtime state.

---

## Decision Criteria

* performance considerations: config is cached (fast after first access); runtime state in config is not cached
* architectural considerations: config is for static, environment-specific values; runtime state belongs elsewhere
* security considerations: runtime state in config may expose sensitive runtime data
* maintainability considerations: mixing config and state creates confusion about source of truth

---

## Decision Tree

Is the value environment-specific and does it remain constant during a request (e.g., API URL, database name)?
↓
YES → Use `config()` (correct usage — registry for static configuration)
    ↓
    Can this value change at runtime?
    YES → It's not config — it's runtime state (see below)
    NO → Config is the correct place
NO → Is the value derived from runtime data (user preferences, request headers, computed values)?
    YES → Store in context object, session, or DTO — NOT in config
    ↓
    Is the value shared across multiple classes in the same request?
    YES → Use a scoped DTO or request context object (injected via container)
    ↓
    Pass the context object as a constructor or method dependency
    NO → Pass the value directly where needed (don't store in global registry)
NO → Is this a cached result of an expensive computation?
    YES → Use cache driver or in-memory singleton — not config

---

## Rationale

Configuration registry (`config()`) is for static, environment-specific values that don't change at runtime. Runtime state (user, request data, computed values) should be passed explicitly via context objects or DTOs. Using config() for runtime state subverts caching, creates confusion, and can lead to stale or inconsistent state across requests.

---

## Recommended Default

**Default:** `config()` for environment-specific static values only. Runtime state handled via injected context objects or DTOs.

**Reason:** Config is cached and shared across requests. Runtime state in config is not cached, creates confusion about the source of truth, and can leak between requests in long-running processes.

---

## Risks Of Wrong Choice

Runtime state in config: stale values, request leak in Octane, cache bypass, confusion about source of truth. Not using config for static values: hardcoded values, environment coupling, no configuration centralization.

---

## Related Rules

- Rule 3: config() is for static configuration only — not runtime state
- Rule 4: Use injected DTOs or context objects for runtime state

---

## Related Skills

- Design Configuration Registry
- Pass Runtime Context via DTOs

---

## Decision: Registry vs Constructor Injection — When to Use the Container Explicitly

---

## Decision Context

Choose when to resolve dependencies from the container explicitly versus relying on automatic constructor injection.

---

## Decision Criteria

* performance considerations: explicit resolve adds method call overhead; automatic injection is resolved once
* architectural considerations: automatic injection is standard; explicit resolve indicates a special case
* security considerations: explicit resolve can conditionally choose implementations
* maintainability considerations: automatic injection is simpler; explicit resolve adds code

---

## Decision Tree

Is the dependency determined at runtime (not known at construction time)?
↓
YES → Explicit container resolution with contextual binding
    ↓
    Can the dependency be selected via the container (tagged services)?
    YES → Use container tags + `app()->tagged()` for runtime selection
    ↓
    Register all possible implementations with tags, resolve at runtime
    NO → Is there a factory or strategy pattern that can encapsulate selection?
        YES → Factory uses container, consumer gets resolved instance via constructor
        NO → Explicit `app()->make()` in the consumer (last resort)
    NO → Constructor injection (dependency is known at construction time)
↓
Is this a factory that needs to create new instances with dependencies?
YES → Inject `Application` or `ContainerInterface` into factory (acceptable)
    ↓
    Does the factory create multiple types?
    YES → Factory needs container reference to resolve each type
    NO → Inject specific dependencies, not the container
NO → Constructor injection is the standard approach

---

## Rationale

The container should be used explicitly only in specific cases: (1) runtime-dependent implementation selection, (2) factories that create multiple types, and (3) framework integration points. For all other cases, automatic constructor injection is the standard and preferred approach.

---

## Recommended Default

**Default:** Automatic constructor injection. Explicit `app()->make()` only in factories, runtime strategy selection, and service providers.

**Reason:** Automatic injection is standard, explicit, and testable. Calling the container explicitly should be the exception, not the rule — it signals a special resolution requirement.

---

## Risks Of Wrong Choice

Explicit resolve everywhere: hidden dependencies, service locator anti-pattern, hard to test. Never using explicit resolve: forcing all dependencies through constructor when runtime selection is needed.

---

## Related Rules

- Rule 5: Use explicit container resolution only for runtime-dependent implementations and factories
- Rule 6: Prefer injecting resolved instances over resolving from container inside methods

---

## Related Skills

- Configure Contextual Binding
- Implement Factory with Container
- Use Tagged Services
