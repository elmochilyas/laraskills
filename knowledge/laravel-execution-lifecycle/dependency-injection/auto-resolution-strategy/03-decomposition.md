# Decomposition: Auto-Resolution Strategy

## Boundary Analysis
Auto-Resolution Strategy is the fallback resolution path within the container that activates when no explicit binding exists for a requested type. Its boundary starts when `Container::build()` determines there is no registered binding or contextual binding for the class, and ends when the fully-constructed instance is returned. It relies on Reflection to inspect constructor parameters and recursively resolves each one. The strategy does **not** cover explicit bindings (`$this->app->bind()`), contextual bindings (`when()->needs()->give()`), or primitive resolution with explicit tagging — these are separate resolution paths that short-circuit auto-resolution.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

Auto-Resolution is a single depth-first traversal algorithm: inspect constructor → resolve each parameter → recurse for class types → instantiate. The algorithm is uniform regardless of the class being resolved. Splitting it into sub-strategies (e.g., "concrete resolution" vs. "interface fallback") would create artificial categories since the branching logic is linear within a single method (`Container::build()`). The behavior for interfaces is simply a failure path, not a separate strategy.

## Dependency Graph
```
Container::make($abstract)
 ├─ has explicit binding? → resolve binding; return
 ├─ has contextual binding? → resolve contextual; return
 └─ no binding → Container::build($abstract)
     ├─ ReflectionClass::getConstructor()
     ├─ no constructor → new $abstract; return
     ├─ has constructor → loop parameters
     │   ├─ ReflectionParameter::getType()
     │   ├─ type is builtin (primitive)?
     │   │   ├─ has default → use default
     │   │   └─ no default → BindingResolutionException
     │   ├─ type is class/interface?
     │   │   ├─ Container::has($type)?
     │   │   │   ├─ yes → Container::make($type) [uses binding]
     │   │   │   └─ no → Container::build($type) [recurse]
     │   │   ├─ is interface? → TargetInterfaceNotInstantiableException
     │   │   └─ is abstract class? → same exception
     │   ├─ is variadic? → resolve all tagged implementations
     │   └─ collect into $dependencies[]
     └─ ReflectionClass::newInstanceArgs($dependencies)
```

## Follow-up Opportunities
- Benchmark the resolution speed of auto-resolution vs. explicit binding chains of depth 1, 3, and 5. Determine the practical threshold where explicit bindings become beneficial for performance.
- Investigate whether PHP 8.1+ readonly promoted properties could be used as a compile-time dependency map, bypassing Reflection entirely for known class structures.
- Analyze the feasibility of a "compiled container" approach for Laravel — generating factory methods for auto-resolved classes during `php artisan optimize` to eliminate runtime Reflection cost.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization