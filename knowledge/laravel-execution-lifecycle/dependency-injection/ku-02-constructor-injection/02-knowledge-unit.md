# Constructor Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Constructor injection is the canonical DI pattern in Laravel. Dependencies are declared as type-hinted constructor parameters, and the container automatically resolves and injects them when the class is instantiated. This is the default and recommended approach for controllers, jobs, listeners, services, and most resolvable classes. It makes dependencies explicit, testable, and immutable.

## Core Concepts

### Type-Hinted Parameters
`public function __construct(Logger $log, UserRepository $users)` — the container reads parameter types via Reflection.

### Automatic Resolution
`Container::build()` inspects the constructor, resolves each type-hinted dependency, and passes them to `newInstanceArgs()`.

### Recursive Resolution
Each dependency's own constructor is resolved recursively — the container walks the full dependency tree depth-first.

### No Explicit Binding for Concrete Classes
If a class is concrete (not an interface), the container can auto-resolve it without a binding.

### Singleton Awareness
If a dependency is bound as singleton, the already-resolved instance is reused rather than creating a new one.

### Optional Dependencies
Default values (`?Logger $log = null`) allow the container to skip resolution if no binding exists.

## Mental Models

### The Dependency Tree
Constructor injection is a tree. The root (your class) has branches (constructor parameters). Each branch splits into smaller branches (their own dependencies). The container climbs this tree from the leaves up, resolving the deepest dependencies first.

### The Car Assembly Line
Think of constructor injection as a car assembly line. The chassis (your class) arrives. The line installs the engine (dependency A), then the wheels (dependency B), then the interior (dependency C). Each component arrives fully assembled with its own sub-components already installed.

### The Recipe
A constructor is like a recipe ingredient list. It declares exactly what ingredients (dependencies) are needed. A chef (the container) reads the recipe, gathers all ingredients from the pantry, and combines them. If an ingredient is optional (`= null`), the chef can skip it.

## Internal Mechanics

### Reflection-Based Resolution
```php
// Container::build() simplified
public function build($concrete)
{
    $reflector = new ReflectionClass($concrete);
    
    if (! $reflector->isInstantiable()) {
        throw new BindingResolutionException(...);
    }
    
    $constructor = $reflector->getConstructor();
    
    if (is_null($constructor)) {
        return new $concrete; // No constructor — simple instantiation
    }
    
    $dependencies = $constructor->getParameters();
    $instances = $this->resolveDependencies($dependencies);
    
    return $reflector->newInstanceArgs($instances);
}
```

### Dependency Resolution Loop
```php
protected function resolveDependencies(array $dependencies)
{
    $results = [];
    
    foreach ($dependencies as $dependency) {
        // If type-hinted class exists
        if ($this->hasParameterType($dependency)) {
            $class = $dependency->getType()->getName();
            $results[] = $this->make($class); // Recursive!
        }
        // If optional and has default value
        elseif ($dependency->isDefaultValueAvailable()) {
            $results[] = $dependency->getDefaultValue();
        }
        // Primitive without default — throw
        else {
            throw new BindingResolutionException(...);
        }
    }
    
    return $results;
}
```

### Readonly Promoted Properties (PHP 8+)
```php
// Modern syntax — less boilerplate, immutable
public function __construct(
    readonly UserRepository $users,
    readonly Logger $log,
) {}
// Equivalent to:
// private UserRepository $users;
// private Logger $log;
```

## Patterns

### Interface Type-Hinting Pattern
Bind interfaces in constructor types: `__construct(UserRepositoryInterface $users)` — enables swapping implementations without changing the consumer.

### Readonly Promoted Properties Pattern
Use `readonly` promoted properties for injected dependencies — concise, immutable, and enforces injection-only access.

### Optional Dependency Pattern
Use nullable type-hints with defaults for truly optional dependencies: `__construct(?Logger $log = null)`.

## Architectural Decisions

### Why constructor injection over setter injection?
Constructor injection makes dependencies explicit at instantiation time — you can't create an object without providing its dependencies. Setter injection allows partial construction, leading to null checks and temporal coupling.

### Why not property injection (like some DI containers)?
Property injection (setting `public $db`) hides dependencies and breaks encapsulation. The class's public API doesn't reflect its requirements. Constructor injection keeps dependencies private and immutable.

### Why recursive resolution?
Recursive resolution ensures the full dependency tree is satisfied before any object is returned. No object is "half-baked" — everything it needs is ready.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Explicit, visible dependencies | Verbose constructor signatures (7+ params) | Indicates over-injection, SRP violation |
| Immutable dependencies (readonly) | Cannot swap dependencies after construction | Must create new instance for different deps |
| Recursive resolution (always complete) | Reflection overhead on construction | Pay once per object, not per method call |
| Default values for optional deps | Optional deps may be forgotten | Runtime error if default is null but used |

## Performance Considerations

- **Reflection cost:** ~0.01-0.05ms per resolved class for ReflectionClass inspection.
- **Deep resolution chains:** 3 levels of injection = 3 Reflection calls.
- **Singleton resolution:** Reflection cost paid once — subsequent calls return cached instance.
- **No caching of Reflection results:** Each `make()` call re-inspects the constructor.

## Production Considerations

- **Keep constructor parameter count low:** 3-4 max for most classes. More indicates SRP violation.
- **Use readonly promoted properties:** Concise, immutable, enforces injection-only access.
- **Bind interfaces in constructor types:** Enables swapping implementations.
- **Avoid side effects in constructors:** No I/O, no service resolution. Accept and assign only.
- **Constructor injection for controllers, services, jobs, listeners.**

## Common Mistakes

- **Not type-hinting the interface:** `__construct(Logger $log)` binds to concrete — harder to swap.
- **Mixing injection with new:** `new SomeClass()` bypasses container — returned instance has no injected deps.
- **Side effects in constructor:** DB queries, API calls in constructor — unexpected behavior on instantiation.
- **Circular dependencies:** A depends on B, B depends on A — `CircularDependencyException`.
- **Optional dependencies without defaults:** `__construct(?Logger $log)` without `= null` — container throws on resolution failure.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Too many dependencies | Constructor with 7+ params | Violation of SRP | Split class into smaller classes |
| Circular dependency | `CircularDependencyException` | A↔B cycle in constructor chain | Restructure or use events |
| Primitive not resolved | `BindingResolutionException` | `string $config` without default | Add default or register binding |
| Interface not bound | `TargetInterfaceNotInstantiableException` | Auto-resolution on interface | Register explicit binding |

## Ecosystem Usage

- **Laravel Framework:** All core classes use constructor injection. `Application` injects `EventDispatcher`, `LogManager`, etc.
- **Laravel Horizon:** `HorizonServiceProvider` injects configuration and queue services via constructor.
- **Laravel Nova:** Resource classes use constructor injection for configuration and authorization services.
- **Spatie packages:** Use constructor injection for dependencies like `Cache`, `Config`, `Logger`.

## Related Knowledge Units

### Prerequisites
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — the container mechanism that powers constructor injection.

### Related Topics
- [Method Injection (ku-03)](../ku-03-method-injection/02-knowledge-unit.md) — alternative for method-specific dependencies.
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — how the container auto-resolves when no binding exists.
- [Over-Injection Anti-Pattern](../../dependency-injection/over-injection-anti-pattern/02-knowledge-unit.md) — when constructor injection is overused.

## Research Notes
- `Container::build()` at `Illuminate\Container\Container::build()` is the core method.
- It uses `ReflectionClass::getConstructor()` and `ReflectionMethod::getParameters()`.
- Parameters with class type-hints are resolved via recursive `Container::make()`.
- Parameters without type-hints or with built-in types require explicit binding or default values.
