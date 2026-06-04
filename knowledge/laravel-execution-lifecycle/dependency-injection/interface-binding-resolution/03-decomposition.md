# Decomposition: Interface Binding Resolution

## Boundary Analysis
Interface Binding Resolution covers the storage, lookup, and execution of abstract-to-concrete mappings within the service container. Its boundary begins when a binding is registered via `bind()`, `singleton()`, or `when()->needs()->give()`, and ends when the resolved concrete instance is returned. It intersects with Auto-Resolution Strategy at the point where the concrete class is built (the same `Container::build()` / `make()` chain is used), but the binding lookup itself is a distinct concern. It does **not** cover facade resolution (which uses a different alias-based lookup) or tagged resolution (which uses a separate `tagged()` method).

## Atomicity Assessment
**Status:** 🔶 Fragments possible (2 fragments)

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | **Binding Registration** | `bind()`, `singleton()`, `instance()`, `alias()`, contextual `when()...needs()...give()` | Can be analyzed independently; the syntax and storage model |
| 2 | **Binding Resolution** | `resolve()`, contextual lookup, Closure invocation, delegation to concrete `build()` | Executes at `make()` time, separate from registration |

Fragment 1 (Registration) is a thin CRUD interface over the binding storage — the interesting logic is entirely in Fragment 2. Fragment 2 is tightly coupled to `Container::make()` and `Container::build()`. Keeping this as a single KU avoids splitting registration from its execution context.

## Dependency Graph
```
Container::make(Interface::class)
 ├─ Container::has(Interface::class)?
 │   ├─ Container::isAlias()? → resolve alias name first
 │   ├─ Container::isSingleton()? → return stored instance
 │   └─ Container::getBinding()? → proceed
 ├─ Container::resolve(Interface::class)
 │   ├─ Container::getContextualBinding($consumer, Interface::class)?
 │   │   └─ returns concrete or Closure
 │   ├─ Container::getBinding(Interface::class)
 │   │   ├─ returns ['concrete' => ..., 'shared' => bool]
 │   │   └─ concrete is Closure? → invoke Closure(Container)
 │   │       └─ returns instance
 │   │   └─ concrete is string? → Container::make($concrete)
 │   │       ├─ Container::has($concrete)?
 │   │       │   ├─ yes → resolve binding for $concrete (chain)
 │   │       │   └─ no → Container::build($concrete) [auto-resolve]
 │   │       └─ returns instance
 │   ├─ is singleton? → store in $this->instances[]
 │   └─ return instance
 └─ Container::build(Interface::class) [no binding fallback]
     └─ ReflectionClass::isInstantiable()? → false
         └─ TargetInterfaceNotInstantiableException
```

## Follow-up Opportunities
- Explore the feasibility of a compile-time binding validator that checks all registered interface bindings for resolvability (concrete exists, concrete's own deps resolvable, concrete implements the interface). This could be a `php artisan` command.
- Investigate the performance impact of contextual binding lookups at scale — 500+ contextual bindings per request in a multi-tenant application. Benchmark array traversal vs. hash-map optimization.
- Evaluate whether the `when()->needs()->give()` API could be extended with attributes (PHP 8+): `#[Contextual(consumer: ReportController::class)]` as an alternative to service provider registration.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization