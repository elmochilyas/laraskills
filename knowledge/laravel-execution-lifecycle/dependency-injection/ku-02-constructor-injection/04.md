# ku-02: Constructor Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-02-constructor-injection
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Constructor injection is the canonical DI pattern in Laravel. Dependencies are declared as type-hinted constructor parameters, and the container automatically resolves and injects them when the class is instantiated. This is the default and recommended approach for controllers, jobs, listeners, services, and most resolvable classes.

## Core Concepts
- **Type-hinted parameters**: `public function __construct(Logger $log, UserRepository $users)` — the container reads parameter types via Reflection.
- **Automatic resolution**: `Container::build()` inspects the constructor, resolves each type-hinted dependency, and passes them to `newInstanceArgs()`.
- **Recursive resolution**: Each dependency's own constructor is resolved recursively — the container walks the full dependency tree.
- **No explicit binding needed for concrete classes**: If a class is concrete (not an interface), the container can auto-resolve it without a binding.
- **Singleton awareness**: If a dependency is bound as singleton, the already-resolved instance is reused rather than creating a new one.
- **Optional dependencies**: Default values (`?Logger $log = null`) allow the container to skip resolution if no binding exists.

## When To Use
- For all classes that need dependencies: controllers, services, repositories, jobs, listeners, middleware.
- When dependencies are required for the class to function — constructor injection makes them explicit.
- For shared services that should be resolved once and reused — pair with singleton binding.

## When NOT To Use
- For DTOs and value objects — these should be plain PHP objects constructed with `new`.
- For Eloquent models — models are hydrated by Eloquent, not the container.
- For classes with 7+ constructor parameters — indicates over-injection (violation of SRP).
- When the dependency is used in only one method — prefer method injection for single-use dependencies.

## Best Practices (WHY)
- **Make dependencies explicit**: Every dependency in the constructor signature is a contract — the class cannot function without them.
- **Keep constructor parameter count low**: 3-4 max for most classes. More indicates the class does too much.
- **Use readonly promoted properties**: `public function __construct(readonly Logger $log) {}` — concise and immutable.
- **Bind interfaces in constructor types**: `__construct(UserRepositoryInterface $users)` — enables swapping implementations.
- **Avoid side effects in constructors**: The constructor should only accept and assign dependencies. No I/O, no service resolution.

## Architecture Guidelines
- Controllers: Constructor for shared services, method injection for request-specific dependencies.
- Services: Constructor for domain abstractions and infrastructure interfaces.
- Jobs: Constructor for serializable payload, method injection for non-serializable services.
- Middleware: Constructor for configuration — the `handle()` signature is fixed.
- Service Providers: Constructor injection is NOT supported — use method injection in `boot()`.

## Performance
- Container auto-resolution uses Reflection on each constructor — ~0.01-0.05ms per resolved class.
- Deep resolution chains multiply this cost — a class with 3 levels of dependency injection needs 3 Reflection calls.
- Singleton-resolved dependencies amortize the Reflection cost — paid once, reused forever.
- No built-in caching of Reflection results — each `make()` call re-inspects the constructor.

## Security
- Constructor-injected dependencies are resolved at construction time — any access controls on the dependency apply at that point.
- Never accept untrusted data in constructor arguments of injected classes — constructors should take framework-managed dependencies only.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Not type-hinting the interface | `__construct(Logger $log)` binds to concrete | Using concrete class instead of interface | Harder to swap implementations | Type-hint the interface, bind in provider |
| Mixing injection with new | `new SomeClass()` bypasses container | Not understanding container resolution | Returned instance has no injected deps | Use `app(SomeClass::class)` instead of `new` |
| Side effects in constructor | DB queries, API calls in constructor | Using constructor for setup | Unexpected behavior on instantiation | Move to boot() or a dedicated method |
| Circular dependencies | A depends on B, B depends on A | Poor class design | CircularDependencyException | Restructure classes to remove cycle |
| Optional dependencies without defaults | `__construct(?Logger $log)` without `= null` | Forgetting the default value | Container throws on resolution failure | Always provide `= null` for optional deps |

## Anti-Patterns
- **Over-injection**: 7+ constructor parameters — the class does too much. Split into smaller classes.
- **Constructor service locator**: Accepting `Container $container` and pulling deps internally — disguised service locator.
- **Fat constructors with I/O**: Database queries, HTTP calls, or file operations in the constructor of an injected class.

## Examples
```php
class UserController
{
    public function __construct(
        readonly UserRepositoryInterface $users,
        readonly LoggerInterface $log,
    ) {}

    public function show(string $id): User
    {
        $this->log->info('Fetching user', ['id' => $id]);
        return $this->users->findOrFail($id);
    }
}
```

## Related Topics
- DI Container Basics (ku-01) — the container mechanism that powers constructor injection
- Method Injection (ku-03) — alternative for method-specific dependencies
- Automatic Injection (ku-04) — how the container auto-resolves when no binding exists
- Over-Injection Anti-Pattern — when constructor injection is overused

## AI Agent Notes
- `Container::build()` at `Illuminate\Container\Container::build()` is the core method.
- It uses `ReflectionClass::getConstructor()` and `ReflectionMethod::getParameters()`.
- Parameters with class type-hints are resolved via recursive `Container::make()`.
- Parameters without type-hints or with built-in types (int, string) require explicit binding or default values.

## Verification
- [ ] All dependencies are declared as type-hinted constructor parameters
- [ ] No `app()` calls exist in business logic
- [ ] Constructor parameter count is ≤ 4 for most classes
- [ ] Constructors have no side effects (I/O, DB queries, API calls)
- [ ] Interface type-hints are used where implementations should be swappable
- [ ] Readonly promoted properties are preferred for injected dependencies
