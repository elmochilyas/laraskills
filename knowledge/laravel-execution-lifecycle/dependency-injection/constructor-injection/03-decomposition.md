# Decomposition: Constructor Injection

## Boundary Analysis
Constructor Injection spans the intersection of Reflection-based DI, binding resolution, and class instantiation within the service container. Its boundary begins when the container's `build()` method processes a constructor's parameter list and ends when the fully-configured instance is returned. It does **not** cover method-level injection (handled by `BoundMethod`), primitive resolution with explicit binding, or the facade proxy pattern.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

Constructor Injection is a single, well-defined mechanism: the container reads constructor type-hints, resolves each dependency, and instantiates the class. There is no meaningful axis of decomposition — separating "parameter inspection" from "dependency resolution" from "instantiation" would introduce artificial boundaries without independent utility. The entire flow is linear and mandatory: all steps must execute for the mechanism to function.

## Dependency Graph
```
Container::make($class)
 └─ Container::build($class)
     ├─ ReflectionClass::getConstructor()
     ├─ ReflectionMethod::getParameters() [loop]
     │   ├─ ReflectionParameter::getType()
     │   ├─ Container::resolveDependencies() [recursive]
     │   │   ├─ Container::make() [for each class-typed param]
     │   │   │   └─ returns to build() recursively
     │   │   ├─ Container::isPrimitive() [for scalar params]
     │   │   └─ Container::resolvePrimitive() [or throw]
     │   └─ Container::getContextualBinding() [if configured]
     └─ ReflectionClass::newInstanceArgs($resolvedParams)
         └─ returns constructed instance
```

## Follow-up Opportunities
- Benchmark the cold-start cost of Reflection-based constructor resolution vs. explicitly wired containers (PHP-DI compiled, Symfony container). Determine whether `php artisan optimize` provides meaningful Reflection caching.
- Investigate how PHP 8.x attributes could replace Reflection for dependency resolution, and whether Laravel has considered an attribute-based resolution path.
- Explore the interaction between constructor injection and PHP 8.1+ readonly promoted properties (`public function __construct(readonly SomeDep $dep)`) — does the container handle them correctly?
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization