# ECC Standardized Knowledge — Service Container Basics

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Service Container Basics |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Dependency Injection |
| **Last Updated** | 2026-06-02 |

---

## Overview

The Laravel service container (`Illuminate\Container\Container`) is the dependency injection container that powers the framework's entire object resolution system. It provides automatic constructor injection via PHP Reflection, manual binding for interfaces and abstract classes, singleton management, contextual resolution, and call-time method injection. Every Laravel application uses the container — whether explicitly through `$app->make()` and `$app->bind()`, or implicitly through controller constructors, queued job handlers, command handlers, and event listeners.

The container's architectural significance extends beyond simple DI: it is the brain of the framework. Service providers register into it. Facades proxy through it. Controllers are resolved by it. Understanding its resolution mechanics — and the four strategies it attempts in order (contextual override, explicit binding, alias resolution, auto-resolution via reflection) — is the single most important skill for advanced Laravel development.

---

## Core Concepts

### Binding
Three primary methods: `bind()` (new instance every time), `singleton()` (same instance on every resolution), `instance()` (inject existing object). `scoped()` (Laravel 11+ for lifecycle-scoped singletons).

### Resolution
`make($abstract)` resolves with optional parameters. `get($abstract)` throws if not resolvable. `build($concrete)` is the reflection engine. `call($callable)` enables method injection.

### Auto-Resolution
If no explicit binding exists, the container inspects the constructor via reflection, recursively resolves each type-hinted parameter, and constructs the instance. This works for any concrete class with resolvable constructor dependencies.

### Contextual Binding
`when()->needs()->give()` provides different implementations of the same abstract depending on which class consumes it. The container's solution to "constructor ambiguity" — when two consumers need different concretions of the same interface.

### Resolution Priority
1. Check `$instances` (already-resolved singletons)
2. Check contextual bindings
3. Check explicit bindings
4. Check aliases
5. Auto-resolution via reflection

---

## When To Use

- **Every controller, service, middleware, job, event listener** — the container resolves all of these automatically
- **Interface binding** — when a class depends on an interface, `$app->bind(Interface::class, Concrete::class)` is required
- **Singleton management** — when exactly one instance of a service should exist per application lifecycle
- **Contextual binding** — when different consumers need different implementations of the same interface
- **Testing with mocks** — `$this->instance(Abstract::class, $mock)` replaces bindings in tests

---

## When NOT To Use

- **Value objects and DTOs** — these should be constructed with `new`, not resolved from the container
- **Simple data classes** — no container involvement needed for plain data transfer
- **Hot-path loops** — resolving thousands of objects through the container adds unnecessary reflection cost
- **Static utility classes** — pure functions with no dependencies don't need container resolution

---

## Best Practices

### Prefer Constructor Injection
Declare dependencies in the constructor and let the container autowire them.

**Why:** Constructor injection makes dependencies explicit, testable via mock injection, and visible in the class signature. Service locator patterns (`app()->make()`) create hidden dependencies.

### Bind Interfaces, Not Concrete Classes
Use `$app->bind(Interface::class, Concrete::class)` for polymorphic dependencies.

**Why:** Concrete classes resolve automatically via reflection. Interfaces cannot — they must be explicitly bound. Explicit binding is also the right place to document the interface-to-implementation mapping.

### Use Singletons for Stateless Services
Register stateless services (repositories, gateways, loggers) as singletons.

**Why:** Singleton resolution is O(1) after first resolution. The same instance is reused across the entire request (or application lifecycle in Octane), reducing memory and construction overhead.

### Avoid app()->make() in Application Code
Resolve from the container in entry points (controllers, commands, jobs), not in business logic classes.

**Why:** `app()->make()` creates a hidden dependency on the container itself. The class becomes untestable without container awareness. The dependency is invisible in the constructor signature.

---

## Architecture Guidelines

### Resolution Flow
```
make($abstract)
  → Check $instances (singleton cache)
  → Check contextual bindings
  → Check explicit bindings
  → Check aliases
  → Auto-resolution via build() + reflection
```

### Service Locator vs DI
Constructor injection is preferred for mandatory dependencies. `resolve()` (via container) is acceptable for truly optional dependencies. Community consensus favors explicit DI for testability.

### Container Data Structures
- `$bindings` — abstract → concrete + shared flag
- `$instances` — resolved singletons
- `$contextual` — [consumer => [abstract => concrete]]
- `$buildStack` — circular dependency detection

---

## Performance Considerations

### Reflection Cost
Each resolution calls `ReflectionClass::getConstructor()` and recursively resolves parameters. For a class with 5 dependencies, this is approximately 20 reflection calls. Adds 1-3ms for typical controller resolution.

### Singleton Performance
`$instances` lookup is O(1). After first resolution, singletons cost nothing. This is why stateless services should be singletons.

### Resolution Caching
Non-singletons are NOT cached. Each `make()` repeats the full resolution. For hot-path code, resolve once and reuse the local variable.

### Closure vs Class Bindings
Closure bindings avoid reflection (invoked directly). Class-name bindings trigger `build()` with reflection. For simple construction, class-name bindings are faster. For complex construction, closures are more efficient.

---

## Security Considerations

### Container Injection
Never inject untrusted user data through the container. The container resolves constructor dependencies; if a class accepts user-controlled parameters, they should be validated before reaching the class.

### Singleton Data Leakage
Singleton services must be stateless. If a singleton captures per-request state, that state leaks across requests in Octane/RoadRunner.

### Binding Override in Tests
`$this->instance()` replaces bindings. Ensure test cleanup calls `forgetInstance()` to prevent binding pollution across tests.

---

## Common Mistakes

### Expecting make() to Return Fresh Instance for Singletons
Desc: Calling `make()` expecting a new instance when a singleton binding exists.
Cause: Unaware of package-registered singleton bindings.
Consequence: Shared state between consumers, unexpected behavior.
Better: Check for singleton bindings or use `forgetInstance()`.

### Constructor Injection in Classes Created with new
Desc: Using `new SomeClass()` and expecting automatic DI.
Cause: Confusion about container scope.
Consequence: Constructor dependencies are not resolved.
Better: Resolve via `app()->make()` or pass fully-resolved dependencies.

### Circular Dependency Through Constructor
Desc: Class A depends on B, B depends on A via constructor injection.
Cause: Poor dependency graph design.
Consequence: Container throws "Circular dependency detected."
Better: Break the cycle by converting one dependency to method injection.

---

## Anti-Patterns

### Service Locator Abuse
Using `app()->make()` throughout business logic classes. Creates hidden dependencies, makes testing impossible without container awareness, and violates the explicit dependency principle.

### God Binding Configuration
Registering hundreds of bindings in a single provider without grouping by concern. Makes bindings hard to audit, maintain, and defer.

### Binding Concrete to Concrete
`$app->bind(ConcreteService::class, ConcreteService::class)` is redundant — concrete classes auto-resolve. Only bind interfaces or abstract classes.

---

## Examples

### Basic Binding
```php
$app->bind(PaymentGateway::class, StripeGateway::class);
$app->singleton(Logger::class, FileLogger::class);
$app->instance('config', $configRepository);
```

### Contextual Binding
```php
$app->when(OrderController::class)
    ->needs(PaymentGateway::class)
    ->give(StripeGateway::class);

$app->when(RefundController::class)
    ->needs(PaymentGateway::class)
    ->give(PayPalGateway::class);
```

### Auto-Resolution
```php
class UserController
{
    public function __construct(
        private UserService $service,  // auto-resolved
        private Request $request,       // auto-resolved
    ) {}
}
```

---

## Related Topics

### Prerequisites
- **Application Class** — The Application extends Container

### Closely Related
- **Service Provider Strategies** — Providers register bindings into the container
- **Bootstrapping Lifecycle** — Container is instantiated and populated during bootstrap
- **Dependency Injection (Controllers)** — Controller DI patterns

### Advanced
- **Contextual Binding Patterns** — Advanced multi-tenancy and polymorphism
- **Tagged Bindings** — Collecting multiple bindings under a single tag

### Cross-Domain
- **Testing & Reliability Engineering** — Mock injection via container `instance()`

---

## AI Agent Notes

### Important Decisions
- `scoped()` bindings were added in Laravel 11 — lifecycle-scoped singletons that are reset per request/scope
- Closure bindings run at resolution time, not registration time
- The container is not serializable — never reference it in queued job serialized state

### Important Constraints
- Auto-resolution only works for concrete classes — interfaces and abstracts MUST be explicitly bound
- Circular dependencies are detected via `$buildStack` with a max depth of 25
- The container is a singleton — there is exactly one instance per application

### Rules Generation Hints
- Enforce constructor injection over `app()->make()` in application code
- Enforce interface binding for all polymorphic dependencies
- Enforce singletons for stateless services

---

## Verification

This document has been validated against:
- `Illuminate\Container\Container` (~900 lines) — the complete implementation
- Key methods: `build()`, `make()`, `resolve()`, `bind()`, `singleton()`, `call()`
- Internal arrays: `$bindings`, `$instances`, `$contextual`, `$resolved`, `$buildStack`
