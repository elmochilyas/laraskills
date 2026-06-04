# Binding Resolution

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Binding Resolution |
| Difficulty | Foundation |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Binding resolution is the process by which Laravel's service container transforms an abstract name (interface FQCN, class name, or string key) into a concrete object instance. The resolution pipeline — exposed through `make()`, `makeWith()`, and `build()` — evaluates binding definitions, manages the instance cache, invokes factory closures, and falls back to auto-resolution via PHP reflection when no explicit binding exists. The critical engineering decision is the auto-resolution fallback: when no binding exists, the container uses `ReflectionClass` to inspect the constructor, recursively resolves each parameter, and attempts construction — eliminating the need to register every class explicitly but introducing non-deterministic resolution risk.

## Core Concepts
- **`make()`** — Primary resolution method; follows full resolution chain (instances → bindings → auto-resolution).
- **`makeWith()`** — Parameterized resolution; passes additional parameters to constructor.
- **`build()`** — Raw construction; bypasses all caching, extenders, and callbacks.
- **Resolution Chain** — Alias normalization → contextual bindings → instances cache → bindings → auto-resolution → exception.
- **Parameter Matching** — Parameters matched by name (not position) via reflection.

## When To Use
- `make()` for all standard service resolution in application code.
- `makeWith()` when a constructor requires primitive parameters (string, int, array).
- `build()` never in application code (internal container method).

## When NOT To Use
- `build()` in application code — bypasses extenders, resolution callbacks, and caching.
- `make()` inside business logic (service locator anti-pattern) — use constructor injection.
- `makeWith()` with positional parameters — container matches by name, not position.

## Best Practices
- **Prefer `make()` over direct instantiation** — even for classes without dependencies, future-proofs against constructor changes.
- **Avoid `build()` in application code** — intended for container internals; prevents extenders and resolution callbacks.
- **Use `makeWith()` sparingly** — if a class requires primitives, consider a factory or parameter object DTO.
- **Log resolution failures** — catch `BindingResolutionException` at kernel level and log abstract name + build stack.
- **Pre-resolve during boot** — call `$app->make(HotService::class)` in `boot()` to front-load reflection costs.
- WHY: The resolution chain determines which concrete implementation every consumer receives. Understanding it prevents hours of debugging "wrong object" bugs.

## Architecture Guidelines
- Resolution checks instances cache before bindings — ensures resolved singletons remain authoritative over later bindings.
- Contextual binding checked after instances cache — cached singletons are shared regardless of context.
- `make()` and `makeWith()` enforce container lifecycle; `build()` is low-level and skips lifecycle.
- The auto-resolution fallback means "unexpected resolution" bugs are more common than "resolution failure" bugs.

## Performance Considerations
- Each `make()` call involves alias normalization, contextual check, instances check, bindings check, and optionally reflection.
- For a class with 3 typed dependencies, a single `make()` triggers 7-15 reflection operations.
- `makeWith()` adds ~2-5μs parameter matching overhead.
- `build()` is fastest raw path but bypasses caching — repeated calls create N instances.
- In Octane, second call to `make()` for a singleton is O(1) — reflection cost paid once per worker.

## Security Considerations
- Auto-resolution can silently resolve wrong implementations if constructor type-hints change.
- `build()` bypasses security-related extenders and resolution callbacks — use with extreme caution.
- Logged resolution failures may reveal container structure; sanitize exception messages in production.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using `build()` in controller for fresh instance | Wanting new instance each call | Bypasses extenders and callbacks; service lacks configuration | Use `make()` or `bind()` with closure |
| Passing positional params to `makeWith()` | Habit from positional array APIs | Parameters ignored if names don't match | Always use named parameter arrays |
| Calling `make()` inside business logic | Convenience over design | Service locator pattern; untestable | Inject through constructor |
| Expecting new instance after `singleton()` | Misunderstanding singleton semantics | Same instance returned; mutation affects all consumers | Use `bind()` for fresh instances |

## Anti-Patterns
- **`build()` in Application Code** — Bypasses container lifecycle entirely.
- **`make()` as Service Locator** — Using `app()->make()` inside controllers/jobs instead of constructor injection.
- **`makeWith()` for Every Constructor** — Overusing parameterized resolution instead of using factories or DTOs.

## Examples

### Standard resolution
```php
$service = $this->app->make(ReportService::class);
```

### Parameterized resolution
```php
$report = $this->app->makeWith(Report::class, [
    'id' => 1234,
    'format' => 'pdf',
]);
```

### Resolution chain pseudo-code
```
make($abstract)
  → normalize abstract (resolve aliases)
  → check contextual bindings
  → check $instances cache (singletons/scoped)
  → check $bindings definition
  → auto-resolution via ReflectionClass
  → throw BindingResolutionException
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Types
- **Closely Related:** Auto-Resolution via Reflection, Contextual Binding
- **Advanced:** Circular Dependency Detection, Resolution Callbacks
- **Cross-Domain:** Service Providers (registration + resolution lifecycle)

## AI Agent Notes
- When debugging "Target is not instantiable", check interface type-hints without registered bindings.
- When `make()` returns wrong type, check if instances cache or contextual bindings are intercepting resolution.
- Use `BoundMethod` class for method injection resolution (`$container->call([$obj, $method])`).

## Verification
- [ ] Can trace the full resolution chain: alias → instances → bindings → auto-resolution → exception
- [ ] Understand difference between `make()`, `makeWith()`, and `build()`
- [ ] Know why instances cache is checked before bindings
- [ ] Can debug `BindingResolutionException` using build stack trace
- [ ] Can explain why `build()` is not appropriate for application code
