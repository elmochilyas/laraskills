# Constructor Injection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Constructor Injection |
| Difficulty | Foundation |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Constructor Injection is the canonical dependency injection pattern in Laravel. Dependencies are declared as type-hinted parameters in a class constructor, and the service container automatically resolves and injects them when the class is instantiated. This is the preferred mechanism for Controllers, Jobs, Listeners, and most resolvable classes because it makes dependencies explicit, enforces immutability, and integrates seamlessly with the container's auto-resolution.

## Core Concepts
- **Type-hinted constructor parameters**: The class declares `__construct(SomeDependency $dep)` and the container reads the parameter's type via Reflection.
- **Automatic resolution**: When the container builds an object, it inspects constructor parameters, resolves each type-hinted class, and passes them in order.
- **Implicit binding**: If no explicit binding exists for a type, the container falls back to auto-resolution via Reflection-based recursive construction.
- **Binding awareness**: The container respects `singleton()`, `when()->needs()->give()`, and other binding modifiers during resolution.
- **Explicit dependency contract**: Constructor injection makes dependencies visible in the class signature, enabling static analysis and IDE tooling.

## When To Use
- Always, for classes that have dependencies managed by the container — controllers, services, repositories, listeners, jobs.
- When you need immutable dependencies (set once at construction, never changed).
- When you want clear, testable dependency contracts visible in the class signature.

## When NOT To Use
- For data transfer objects (DTOs) or value objects — `new UserData(...)` is fine without the container.
- For classes that need conditional or optional dependencies — use setter injection or method injection.
- When you have too many constructor parameters (over-injection) — consider refactoring into smaller classes.

## Best Practices (WHY)
- **Type-hint interfaces, not concretions**: `__construct(UserRepositoryInterface $users)` instead of `__construct(EloquentUserRepository $users)`. *Why: Interface binding enables swapping implementations without changing consumers.*
- **Keep constructors pure**: Only accept and assign dependencies — never perform I/O, database queries, or HTTP calls. *Why: Constructor should not have side effects; resolution should be safe.*
- **Use one dependency per parameter**: Each parameter should be a single, cohesive service. *Why: Multiple concerns in one parameter indicate a missing abstraction.*
- **Prefer constructor injection over app()**: Avoid `app()->make()` in class bodies. *Why: Constructor injection makes dependencies explicit; app() hides them.*

## Architecture Guidelines
- The container's `build()` method handles constructor injection — it uses ReflectionClass to inspect parameters.
- Dependencies are resolved recursively — a dependency's own constructor dependencies are resolved first.
- Optional dependencies use `?Type $dep = null` — the container skips resolution if a default exists.
- Variadic parameters with type-hints `__construct(Handler ...$handlers)` resolve all tagged bindings.
- Primitive parameters without defaults or explicit bindings throw `BindingResolutionException`.

## Performance
- Reflection-based resolution adds ~0.01-0.05ms per class with constructor dependencies.
- Deep resolution chains (A depends on B depends on C) add linearly — negligible in practice.
- Singleton dependencies resolve their constructor only once — subsequent resolutions return the cached instance.
- Pre-resolve hot-path services in Octane's `booted()` callback to avoid per-request resolution.

## Security
- Constructor injection exposes dependencies to the container — ensure bound services don't leak sensitive capabilities.
- Auto-resolution of concrete classes bypasses interface binding — a class's direct dependencies are always resolved.
- Over-injection (many constructor parameters) can indicate a class with too many responsibilities — a security risk via complexity.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Not type-hinting interfaces | Binding to concrete class | Tight coupling; hard to swap implementations | Use interface type-hints |
| Mixing injection with manual `new` | `new SomeClass()` inside injected class | Bypasses container; no injection | Use constructor injection for all dependencies |
| Circular dependencies | Class A injects B, B injects A | CircularDependencyException at resolution | Refactor to extract shared dependency |
| Optional dependency without default | `__construct(?Logger $logger)` without default | Null injection when no binding exists | Use `?Logger $logger = null` |

## Anti-Patterns
- **Over-injection**: A constructor with 7+ parameters — signals the class has too many responsibilities. Refactor into smaller classes.
- **Constructor hidden dependencies**: Using `app()` or `resolve()` inside the constructor body — constructor should only receive, not fetch.
- **Constructor side effects**: I/O, database calls, cache operations in the constructor of an injected class.
- **Wide type-hints**: Injecting `Container $container` and pulling dependencies — this is a disguised service locator.

## Examples
```php
// Correct: interface type-hint, pure constructor, explicit dependencies
class OrderService
{
    public function __construct(
        private OrderRepositoryInterface $orders,
        private PaymentGatewayInterface $payment,
        private LoggerInterface $logger,
    ) {}
}

// Wrong: service locator in constructor
class OrderService
{
    public function __construct()
    {
        $this->orders = app(OrderRepositoryInterface::class);
    }
}
```

## Related Topics
- **Prerequisites:** Auto-Resolution Strategy — the underlying mechanism powering automatic resolution.
- **Closely Related:** Method Injection — alternative injection path for controller actions and event handlers.
- **Advanced:** Interface Binding Resolution — how interfaces in constructors map to concretes.
- **Cross-Domain:** Service Container Fundamentals — the container's build() method.

## AI Agent Notes
- The container's `build()` method at `Illuminate\Container\Container::build()` is the core of constructor resolution.
- `BoundMethod` is NOT involved in constructor injection — that path goes through `make()` → `build()`.
- Constructor injection has been stable since Laravel 5.x — no significant changes in modern versions.
- Third-party autowiring containers (PHP-DI, Symfony DI) offer similar but more feature-rich constructor resolution.

## Verification
- [ ] All constructor parameters have type-hints (no untyped parameters)
- [ ] Interfaces are used in type-hints, not concrete classes (where applicable)
- [ ] No `app()` or `resolve()` calls in class bodies (constructor or methods)
- [ ] Constructors have no side effects (I/O, DB, API calls)
- [ ] Classes with 7+ constructor parameters are refactored into smaller classes
