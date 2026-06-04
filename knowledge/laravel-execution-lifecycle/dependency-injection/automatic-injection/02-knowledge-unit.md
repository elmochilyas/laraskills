# Automatic Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Automatic injection (auto-resolution) is the fallback mechanism by which Laravel's container resolves a class when no explicit binding exists. It uses PHP Reflection to inspect the class constructor, recursively resolve its type-hinted dependencies, and instantiate the class. This is what makes the container feel "magical" — classes can be injected without any prior registration. Understanding when auto-resolution works (concrete classes) and when it fails (interfaces, primitives) is essential for predicting container behavior.

## Core Concepts

### ReflectionClass Inspection
`Container::build()` creates a `ReflectionClass`, gets the constructor, and iterates parameters.

### Recursive Resolution
Each class-typed parameter triggers another `Container::make()` — building the full dependency tree depth-first.

### No Binding Required for Concrete Classes
If a class is concrete (not abstract or interface) and all its deps are resolvable, auto-resolution handles it.

### Interface Failure
Auto-resolution on an interface throws `TargetInterfaceNotInstantiableException` — interfaces must have explicit bindings.

### Primitive Failure
Scalar parameters without defaults throw `BindingResolutionException` — the container cannot auto-resolve strings, ints, or arrays.

### Variadic Resolution
Variadic class-typed parameters (`Reportable ...$handlers`) are resolved by collecting all tagged implementations.

## Mental Models

### The Magic Kitchen
Auto-resolution is a magic kitchen. You ask for a "Chef" (class). The kitchen knows how to build a chef — it needs an apron (Logger) and a knife (Knife). The kitchen builds those too. But if you ask for a "CelebrityChef" (interface), the kitchen doesn't know which chef to hire — you must specify.

### The Auto-Parts Factory
Imagine a factory that can build any car model from a blueprint. It reads the blueprint (constructor), identifies the required parts (dependencies), and manufactures each part before assembling the car. But if the blueprint calls for a "brand X engine" by brand name only, without specifying the model, the factory can't proceed.

### The First-Time Chef
Auto-resolution is like a chef cooking a dish for the first time. They read the recipe (Reflection on constructor), gather ingredients (resolve dependencies), and cook (build the class). The first time takes longer (Reflection cost) — subsequent times, they either remember (singleton) or re-read the recipe (new instance).

## Internal Mechanics

### Auto-Resolution Decision Tree
```php
// Container::make($abstract)
// 1. Is $abstract in $bindings? → Use explicit binding
// 2. Is $abstract in $instances? → Return cached instance
// 3. Is $abstract an alias? → Resolve alias
// 4. Auto-resolution: build($abstract)
//    a. Reflector: ReflectionClass($abstract)
//    b. isInstantiable() check → false for interfaces/abstracts
//    c. Get constructor → get parameters
//    d. For each parameter:
//       - Has type-hint? → resolve class recursively
//       - Has default? → use default
//       - Otherwise → throw BindingResolutionException
//    e. newInstanceArgs(resolved deps)
```

### Concrete Class Resolution
```php
// No binding needed — auto-resolution handles it
class UserService
{
    public function __construct(
        readonly Logger $log,        // Concrete class — auto-resolved
        readonly Mailer $mailer,      // Concrete class — auto-resolved
    ) {}
}
// app(UserService::class) — works without any binding
```

### Interface Resolution Failure
```php
// Auto-resolution CANNOT handle interfaces
interface PaymentGateway { /* ... */ }

class OrderService
{
    public function __construct(
        readonly PaymentGateway $gateway, // Interface! Binding required
    ) {}
}
// app(OrderService::class) — throws TargetInterfaceNotInstantiableException
```

### Build Stack (Cycle Detection)
```php
// Container::$buildStack tracks current resolution chain
// When resolving A → B → C → A:
// 1. Push A to buildStack [A]
// 2. Resolve A's deps → needs B
// 3. Push B to buildStack [A, B]
// 4. Resolve B's deps → needs C
// 5. Push C to buildStack [A, B, C]
// 6. Resolve C's deps → needs A
// 7. A already in buildStack! → CircularDependencyException
```

## Patterns

### Default-Before-Binding Pattern
Auto-resolution is the default. Explicit bindings override auto-resolution when needed (interfaces, implementations swaps, configuration).

### Optional Primitive Default Pattern
Always provide defaults for optional primitive parameters: `__construct(?string $config = null)` — lets the container skip unresolvable primitives.

### Explicit Binding for Hot Path Pattern
Register explicit bindings or singletons for classes resolved on every request — bypasses auto-resolution cost.

## Architectural Decisions

### Why auto-resolution at all?
Auto-resolution eliminates boilerplate. Without it, every concrete class would need an explicit `bind(Concrete::class, Concrete::class)` registration — hundreds of lines of redundant wiring.

### Why does auto-resolution fail on interfaces?
Interfaces are contracts without implementations. The container cannot guess which implementation to use. Explicit bindings are required because the developer must make this architectural decision.

### Why no caching of Reflection results?
Caching Reflection results would require storing serialized Reflection data between requests. PHP Reflection objects are not serializable, and caching constructor parameter metadata would add complexity for marginal gain (auto-resolution is typically only a few microseconds per class).

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero configuration for concrete classes | Reflection overhead on every make() | Explicit bindings for hot paths |
| Recursive resolution = complete deps | Deep chains = slow resolution | Design flat dependency graphs |
| No boilerplate bindings | Interface resolution fails silently | Must remember to bind interfaces |
| Easy prototyping | Accidental resolution of wrong class | Explicit bindings for important boundaries |

## Performance Considerations

- **ReflectionClass construction:** ~0.01-0.05ms per resolved class.
- **Deep dependency chains:** 3 levels of injection = 3 Reflection calls.
- **No caching:** Each `make()` call triggers fresh Reflection.
- **Singleton amortization:** Singleton-resolved classes pay auto-resolution cost once.
- **OpCache does NOT help Reflection:** Reflection is runtime introspection, not compiled opcode.

## Production Considerations

- **Let auto-resolution handle concrete deps:** No need to register redundant bindings.
- **Bind interfaces explicitly:** Auto-resolution cannot instantiate interfaces.
- **Provide defaults for optional primitives:** Prevents `BindingResolutionException`.
- **Use auto-resolution as convenience, not strategy:** For important architectural boundaries, use explicit bindings.
- **Monitor resolution failures:** Unexpected `TargetInterfaceNotInstantiableException` indicates a missing binding.

## Common Mistakes

- **Assuming auto-resolution for interfaces:** `make(LoggerInterface::class)` without binding — `TargetInterfaceNotInstantiableException`.
- **Forgetting primitives:** `__construct($config)` without type-hint or default — `BindingResolutionException`.
- **Deep circular deps not detected:** Complex dependency graph — memory exhaustion before exception.
- **Relying on auto-resolution for hot path:** Controller with deep auto-resolution chain on every request — unnecessary overhead.
- **Auto-resolving wrong implementation:** Concrete class has multiple implementations — no explicit binding to choose.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Interface not instantiable | `TargetInterfaceNotInstantiableException` | Auto-resolution on interface | Register explicit binding |
| Primitive not resolved | `BindingResolutionException` | Scalar parameter without default | Add default or register primitive binding |
| Circular dependency | `CircularDependencyException` | A↔B cycle in resolution chain | Restructure classes |
| Wrong implementation | Incorrect behavior | Concrete class auto-resolved, but different impl needed | Register explicit binding |

## Ecosystem Usage

- **Laravel Framework:** Framework classes use auto-resolution for concrete dependencies, explicit bindings for interfaces. Core facades resolve via auto-resolution when no binding exists.
- **Laravel Horizon:** Uses explicit bindings for interfaces, auto-resolution for concrete service classes.
- **Laravel Nova:** Resource tools are auto-resolved when concrete; auth gates use explicit bindings.
- **Spatie packages:** Use explicit bindings for interfaces they define, auto-resolution for Laravel core classes.

## Related Knowledge Units

### Prerequisites
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — how the container decides between binding and auto-resolution.

### Related Topics
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md) — the primary consumer of auto-resolution.
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md) — the explicit counterpart when auto-resolution can't handle interfaces.
- [Circular Dependency Resolution (ku-09)](../ku-09-circular-dependency-resolution/02-knowledge-unit.md) — how the container detects and handles cycles.

## Research Notes
- Auto-resolution lives in `Container::build()` at `Illuminate\Container\Container::build()`.
- The method checks `$reflector->isInstantiable()` — throws for interfaces and abstract classes.
- `$buildStack` is the circular dependency detector — a class appearing twice triggers the exception.
- For debugging auto-resolution, set a breakpoint in `Container::build()` and inspect the `$buildStack`.
