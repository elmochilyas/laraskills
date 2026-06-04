# Auto-Resolution Strategy

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Auto-Resolution Strategy |
| Difficulty | Intermediate |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Auto-Resolution Strategy is the fallback mechanism by which Laravel's service container resolves a class when no explicit binding has been registered. It uses PHP Reflection to inspect the class constructor, recursively resolve its type-hinted dependencies, and instantiate the class. This strategy makes Laravel's container feel "magical" — concrete classes can be injected without any prior registration. It operates on principle of convention over configuration, reducing boilerplate while maintaining explicit dependency contracts.

## Core Concepts
- **ReflectionClass inspection**: The container uses `ReflectionClass::getConstructor()` to find the constructor, then `getParameters()` for each dependency.
- **Recursive resolution**: Each type-hinted dependency in the constructor is itself resolved via `make()` — if that class has no binding, it too is auto-resolved.
- **Primitive parameter handling**: Parameters without type-hints (strings, ints, arrays) require explicit bindings or defaults — auto-resolution only works for class/interface types.
- **Optional parameter skipping**: Parameters with default values (`?Logger $logger = null`) are left as defaults if no binding exists.
- **Variadic parameter resolution**: Variadic parameters with type-hints (`Handler ...$handlers`) resolve all tagged bindings for that type.
- **Exception on failure**: If a required parameter cannot be resolved (no type, no binding, no default), `BindingResolutionException` is thrown.

## When To Use
- For concrete classes that follow Laravel's conventions — no explicit binding needed.
- For rapid prototyping where registering every class is overhead.
- For classes whose constructor dependencies are all concrete or have explicit bindings.

## When NOT To Use
- For interfaces — they require explicit bindings; auto-resolution throws `TargetInterfaceNotInstantiableException`.
- For classes with primitive constructor parameters without defaults — auto-resolution cannot resolve scalar values.
- For production hot paths where reflection cost should be avoided — bind explicitly and use singletons.
- For classes that should use a specific implementation — explicit binding ensures the correct concrete is used.

## Best Practices (WHY)
- **Bind interfaces explicitly**: Auto-resolution only works for concrete classes. *Why: Interfaces abstract from implementation — the container cannot guess which concrete to use.*
- **Use auto-resolution for concrete classes**: If a class has resolvable dependencies, no binding is needed. *Why: Reduces boilerplate in service providers while maintaining testability.*
- **Pre-resolve hot paths in production**: For frequently-resolved classes, explicit bindings (especially singletons) avoid reflection overhead. *Why: Reflection-based resolution is the slowest resolution path.*
- **Default optional dependencies**: Use `= null` for parameters that shouldn't block resolution. *Why: Gives the container a fallback when no binding exists.*

## Architecture Guidelines
- Auto-resolution is implemented in `Container::build()` which calls `ReflectionClass::newInstanceArgs()`.
- The resolution chain: `$bindings` → `$instances` → contextual → auto-resolution → exception.
- Auto-resolution only applies to concrete class names — interfaces and abstract classes require bindings.
- Recursive resolution depth is tracked via `$buildStack` to detect circular dependencies.
- The resolved class is NOT cached — each `make()` call re-inspects the constructor via Reflection.

## Performance
- Auto-resolution is the slowest resolution path: ~0.01-0.05ms per class for Reflection inspection.
- Deep resolution chains (A → B → C → D) add linearly — each level pays Reflection cost.
- Resolution cost is NOT cached — every `make()` call re-inspects the entire chain.
- Singleton binding with auto-resolution: the singleton is built once via auto-resolution, then cached.
- Pre-binding with explicit `bind()` or `singleton()` avoids the Reflection path entirely.

## Security
- Auto-resolution can instantiate any concrete class — ensure untrusted class names are not passed to `make()`.
- The `$buildStack` tracks resolution depth to prevent infinite loops from circular dependencies.
- Auto-resolved classes have full container access — use constructor injection to limit exposed capabilities.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Type-hinting interface without binding | Expecting auto-resolution for interface | TargetInterfaceNotInstantiableException | Always bind interfaces |
| Primitive parameter without default | `__construct($pageSize)` without type or binding | BindingResolutionException for scalar | Add a default or explicit binding |
| Circular dependency | Class A requires B, B requires A | Detection at runtime — CircularDependencyException | Extract shared dependency |
| Expecting cached resolution | Calling `make()` multiple times | Each call re-inspects constructor via Reflection | Use singleton binding |
| Auto-resolving with side-effect constructors | Constructor that does I/O | Side effects on every resolution | Use factory pattern or pre-resolve |

## Anti-Patterns
- **Auto-resolving everything**: Registering no bindings and relying solely on auto-resolution — interfaces won't work, and hot paths pay reflection cost.
- **Constructor side effects**: Constructors that perform I/O, DB queries, or API calls — auto-resolution triggers these on every make().
- **Empty catch around make()**: Wrapping `app()->make()` in try/catch to silently fall back — hides resolution errors.

## Examples
```php
// Auto-resolved — no binding needed
class ReportService
{
    public function __construct(
        private PdfRenderer $renderer,   // concrete — auto-resolved
        private Cache $cache,            // concrete or bound — resolved
    ) {}
}

// Requires explicit binding
class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway, // interface — must be bound
    ) {}
}

// Resolution
$reportService = app(ReportService::class); // works without binding
```

## Related Topics
- **Prerequisites:** Container Fundamentals — understanding the $bindings array and resolution chain.
- **Closely Related:** Constructor Injection — the primary use case for auto-resolution.
- **Advanced:** Reflection API Usage — how PHP Reflection powers auto-resolution.
- **Cross-Domain:** Binding Types — explicit binding as alternative to auto-resolution.

## AI Agent Notes
- The `build()` method at `Illuminate\Container\Container::build()` is the core of auto-resolution.
- `ReflectionClass::newInstanceArgs()` is the final instantiation call after all dependencies are resolved.
- The `$buildStack` array on the Container tracks currently-resolving classes for circular detection.
- Auto-resolution is NOT magic — it's PHP Reflection API wrapped in an array-based caching system.
- To pre-resolve an auto-resolved class as a singleton: `$app->singleton(ConcreteClass::class)`.

## Verification
- [ ] All interface/abstract type-hints have explicit bindings in service providers
- [ ] Concrete classes without bindings have resolvable constructors (no unresolvable primitives)
- [ ] Hot-path classes are explicitly bound as singletons to avoid reflection cost
- [ ] No circular dependencies exist in the auto-resolution chain
- [ ] Constructor side effects are avoided (no I/O, DB, API calls in constructors)
