# Auto-Resolution via Reflection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Auto-Resolution via Reflection |
| Difficulty | Intermediate |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Auto-resolution via reflection is the mechanism by which Laravel's service container constructs objects without explicit bindings by reading their constructor signatures at runtime. Implemented in `Container::build()`, this process uses PHP's `ReflectionClass` and `ReflectionParameter` APIs to inspect constructor parameters, recursively resolve each type-hinted dependency, and handle primitive parameters with defaults or explicit overrides. This is the foundation of Laravel's "zero-configuration" dependency injection. The critical engineering decision is that auto-resolution treats unbound concrete classes the same as bound abstract interfaces — it inspects the class and resolves dependencies recursively, meaning adding a new interface type-hint to a constructor changes resolution behavior for the entire dependency graph.

## Core Concepts
- **ReflectionClass Constructor Inspection** — `ReflectionClass::getConstructor()` discovers constructor parameters for resolution.
- **Parameter Type Resolution** — Type-hinted class/interface parameters recursively resolved via `resolve()`.
- **Primitive Parameter Handling** — Built-in types (string, int, array) resolved via default values or parameters array from `makeWith()`.
- **Variadic Parameter Support** — Variadic parameters collect tagged bindings or passed parameters.
- **Build Stack** — Tracks resolution progress for circular dependency detection.

## When To Use
- Default approach for resolving concrete classes with no interface dependencies.
- Controllers, jobs, listeners, mailables, events — where auto-resolution works out of the box.
- Rapid prototyping where explicit bindings would slow development.

## When NOT To Use
- Classes with interface type-hints that have no registered binding (auto-resolution will fail).
- Hot-path services where reflection overhead matters (pre-register bindings instead).
- Classes with required primitive parameters (string, int) without defaults (auto-resolution cannot synthesize these).

## Best Practices
- **Pre-register hot-path classes as bindings** — bypasses reflection for frequently resolved services.
- **Always provide default values for primitive constructor parameters** — prevents `Unresolvable dependency` exceptions.
- **Register bindings for every interface used as constructor type-hint** — auto-resolution cannot instantiate interfaces.
- **Avoid deep constructor dependency chains** — each level adds recursive reflection overhead.
- **Enable ReflectionCache in Laravel 12+** — call `$app->enableReflectionCache()` in `bootstrap/app.php`.
- WHY: Auto-resolution eliminates boilerplate but hides the dependency graph from static analysis. Teams should use it as default and add explicit bindings only when necessary.

## Architecture Guidelines
- `build()` handles 4 cases: no constructor, all typed, mixed typed+primitive, unresolvable primitive.
- The `isInstantiable()` check on the reflector is where interface vs concrete resolution diverges.
- Auto-resolution is the slowest path in the container — ~50-200μs per resolution chain.
- Reflection results are not cached by default (caching added in Laravel 12+ as optional feature).

## Performance Considerations
- Each auto-resolution call: `ReflectionClass::getConstructor()` (1-2μs), parameter iteration (0.5μs each), per-parameter type inspection (0.3μs each), plus recursive resolution.
- A class with 3 typed parameters triggers ~4μs reflection + recursive resolution of each dependency.
- In Octane, per-worker: reflection cache lives for worker lifetime — cost paid once per worker per class.
- Pre-registering bindings replaces reflection with pre-compiled closure resolution (~10x faster: 5μs vs 50μs).

## Security Considerations
- Auto-resolution can resolve classes that should not be instantiated directly (e.g., internal framework classes).
- Reflection can expose constructor parameter names; avoid sensitive parameter names in publicly auto-resolved classes.
- Use explicit bindings for services that require authorization checks during construction.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Type-hinting interface without binding | Assuming auto-resolution works for interfaces | `BindingResolutionException: "Target [Interface] is not instantiable"` | Register binding for every interface type-hint |
| Adding required primitive without default | Careless constructor design | All existing `make()` callers break | Always provide default values for primitives |
| Assuming reflection is cached | Default behavior in Laravel 10-11 | Fresh reflection on every `make()` for unbound classes | Pre-register bindings or enable ReflectionCache |
| Relying on auto-resolution for variadic params without tagged bindings | Missing tag registration | Variadic params resolve to empty array | Use `tag()` to register tagged services |

## Anti-Patterns
- **No explicit bindings for interfaces** — Relies on auto-resolution to magically resolve interfaces (always fails).
- **Deep dependency chains without factories** — 5+ levels of nested auto-resolution adds ~250μs+ overhead.
- **Overriding constructors in subclasses to avoid auto-resolution** — Instead of fixing the binding issue, developers create subclasses with empty constructors.

## Examples

### Auto-resolution with type-hints
```php
class ReportGenerator {
    public function __construct(
        protected ReportRepository $repository, // Auto-resolved
        protected string $format = 'pdf',       // Default value
        protected ?int $limit = null             // Nullable with default
    ) {}
}

$generator = $this->app->make(ReportGenerator::class);
```

### Parameterized override via makeWith()
```php
$generator = $this->app->makeWith(ReportGenerator::class, [
    'format' => 'csv',
    'limit' => 100,
]);
```

### Nullable optional dependency
```php
class Logger {
    public function __construct(
        protected ?AlertingService $alerts = null
    ) {}
}
// $logger->alerts === null if not bound
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Resolution, Binding Types
- **Closely Related:** Circular Dependency Detection
- **Advanced:** Contextual Binding, Resolution Callbacks
- **Cross-Domain:** Reflection API (PHP internals)

## AI Agent Notes
- When debugging "Target is not instantiable", check: (1) is it an interface? (2) is it an abstract class? (3) is the concrete class registered?
- For "Unresolvable dependency" with primitives, check constructor has default values or use `makeWith()`.
- Auto-resolution + Octane: pre-register hot-path bindings to avoid per-worker reflection cost.

## Verification
- [ ] Can explain how `build()` uses ReflectionClass to resolve dependencies
- [ ] Understand why auto-resolution fails for interfaces without bindings
- [ ] Know how primitives are handled (defaults, makeWith parameters)
- [ ] Can estimate reflection overhead for a given dependency graph depth
- [ ] Can enable and verify ReflectionCache in Laravel 12+
