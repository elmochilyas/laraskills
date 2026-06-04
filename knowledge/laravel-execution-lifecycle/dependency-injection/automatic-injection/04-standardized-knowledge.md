# ku-04: Automatic Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-04-automatic-injection
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Automatic injection (auto-resolution) is the fallback mechanism by which Laravel's container resolves a class when no explicit binding exists. It uses PHP Reflection to inspect the class constructor, recursively resolve its type-hinted dependencies, and instantiate the class. This is what makes the container feel "magical" — classes can be injected without any prior registration.

## Core Concepts
- **ReflectionClass inspection**: `Container::build()` creates a `ReflectionClass`, gets the constructor, and iterates parameters.
- **Recursive resolution**: Each class-typed parameter triggers another `Container::make()` — building the full dependency tree depth-first.
- **No binding required for concrete classes**: If a class is concrete (not abstract or interface) and all its deps are resolvable, auto-resolution handles it.
- **Interface failure**: Auto-resolution on an interface throws `TargetInterfaceNotInstantiableException` — interfaces must have explicit bindings.
- **Primitive failure**: Scalar parameters without defaults throw `BindingResolutionException` — the container cannot auto-resolve strings, ints, or arrays.
- **Variadic resolution**: Variadic class-typed parameters (`Reportable ...$handlers`) are resolved by collecting all tagged implementations.

## When To Use
- For concrete classes with simple dependency trees — no binding registration needed.
- For rapid prototyping and simple applications where explicit bindings would be over-engineering.
- When the dependency chain is well-understood and stable.
- For classes without constructor parameters — auto-resolution is a simple `new $class`.

## When NOT To Use
- For interfaces or abstract classes — auto-resolution fails without an explicit binding.
- For classes with primitive constructor parameters — the container cannot resolve `int`, `string`, `array` without binding or defaults.
- For hot-path resolution in high-throughput applications — Reflection overhead on every `make()` adds latency.
- When you need a different implementation than auto-resolution would provide — use explicit binding.

## Best Practices (WHY)
- **Let auto-resolution handle concrete deps**: No need to register `app()->bind(Service::class, Service::class)` — auto-resolution does this.
- **Bind interfaces explicitly**: Auto-resolution cannot instantiate interfaces — always register a binding.
- **Provide defaults for optional primitives**: `__construct(?string $config = null)` lets the container skip unresolvable primitives.
- **Use auto-resolution as convenience, not strategy**: For important architectural boundaries (interfaces, repositories), use explicit bindings.

## Architecture Guidelines
- Auto-resolution traverses the dependency graph depth-first — it resolves the deepest dependency first, then works back up.
- The `buildStack` array tracks the current resolution chain — circular dependencies are detected when a class appears twice in the stack.
- Auto-resolution does NOT cache Reflection results — each `make()` re-inspects the constructor.
- For classes resolved on every request (controllers), consider explicit bindings to bypass auto-resolution cost.

## Performance
- ReflectionClass construction: ~0.01-0.05ms per resolved class.
- Deep dependency chains multiply this: 3 levels of injection = 3 Reflection calls.
- No built-in caching — each `make()` call triggers fresh Reflection.
- Singleton-resolved classes pay auto-resolution cost once — subsequent calls return the cached instance.
- OpCache does NOT help Reflection — Reflection is runtime introspection, not compiled opcode.

## Security
- Auto-resolution gives the container access to any concrete class — ensure untrusted code cannot trigger resolution of sensitive classes.
- Auto-resolution for interface types fails loudly — no silent fallback to wrong implementations.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Assuming auto-resolution for interfaces | `make(LoggerInterface::class)` without binding | Not understanding auto-resolution limits | TargetInterfaceNotInstantiableException | Register explicit binding |
| Forgetting primitives | `__construct($config)` without type-hint or default | Not providing resolution path | BindingResolutionException | Add default value or register primitive binding |
| Deep circular deps not detected | Auto-resolution infinite loop | Complex dependency graph | Memory exhaustion or timeout | Restructure to remove cycles |
| Relying on auto-resolution for hot path | Controller with deep auto-resolution chain on every request | Not profiling resolution cost | Unnecessary per-request overhead | Register explicit singletons for hot-path classes |
| Auto-resolving wrong implementation | Concrete class has multiple implementations | No explicit binding to choose | Wrong one selected by container | Always bind interfaces explicitly |

## Anti-Patterns
- **Over-reliance on auto-resolution**: Not registering any bindings leads to brittle code — a constructor change breaks resolution silently.
- **Auto-resolution as default for everything**: Framework classes need explicit bindings for behavior control — don't leave them to chance.
- **Interface to concrete without binding**: Type-hinting an interface and expecting auto-resolution to pick a concrete — it won't.

## Examples
```php
// Auto-resolution — no binding needed for concrete classes
class UserService
{
    public function __construct(
        readonly Logger $log,        // Auto-resolved (concrete class)
        readonly Mailer $mailer,      // Auto-resolved (concrete class)
    ) {}
}
// app(UserService::class) works without any binding

// Auto-resolution fails — interface needs binding
class ReportService
{
    public function __construct(
        readonly ReportGeneratorInterface $generator, // Binding required
    ) {}
}
```

## Related Topics
- Constructor Injection (ku-02) — the primary consumer of auto-resolution
- DI Container Basics (ku-01) — how the container decides between binding and auto-resolution
- Interface Binding (ku-08) — the explicit counterpart when auto-resolution can't handle interfaces
- Circular Dependency Resolution (ku-09) — how the container detects and handles cycles

## AI Agent Notes
- Auto-resolution lives in `Container::build()` at `Illuminate\Container\Container::build()`.
- The method checks `$reflector->isInstantiable()` — throws for interfaces and abstract classes.
- `$buildStack` is the circular dependency detector — a class appearing twice triggers the exception.
- For debugging auto-resolution, set a breakpoint in `Container::build()` and inspect the `$buildStack`.

## Verification
- [ ] All interfaces and abstract classes have explicit bindings
- [ ] No primitive constructor parameters without defaults or explicit bindings
- [ ] Circular dependency detection works (test with a known circular setup)
- [ ] Hot-path classes use explicit bindings or singletons (not auto-resolution on every request)
- [ ] Auto-resolution behavior is documented and expected (not accidental)
