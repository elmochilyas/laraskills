# Resolution Callbacks — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Resolution Callbacks
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | `beforeResolving` vs `resolving` vs `afterResolving` | Choosing the correct hook | Timing; cache state; instance mutability |
| 2 | Abstract-specific vs global callback | Registering callbacks per-type vs catch-all | Performance; clarity; overhead |
| 3 | Instance replacement in `resolving()` callback | Returning non-null from callback | Extender output preservation; lifecycle |

---

## Decision 1: `beforeResolving` vs `resolving` vs `afterResolving`

### Decision Context
Registering a callback at a specific point in the resolution pipeline.

### Decision Criteria
- **Need abstract name + parameters before construction?** → `beforeResolving()`
- **Need to configure instance after construction and extenders?** → `resolving()`
- **Need to run side effects after instance is cached?** → `afterResolving()`

### Decision Tree
```
Which resolution hook to use?
├── Need access BEFORE instance is built
│   ├── Log/inspect abstract name and parameters
│   │   └── Use beforeResolving()
│   ├── Modify parameters before construction
│   │   └── Use beforeResolving()
│   └── Cannot use resolved instance (not built yet)
│       └── Use beforeResolving()
├── Need to CONFIGURE the instance after construction
│   ├── Set properties, call initialization methods
│   │   └── Use resolving() — runs before caching
│   ├── Instance is fully built and extended
│   │   └── Use resolving() — sees the final instance
│   └── Modifications affect the cached instance
│       └── Use resolving() — runs before caching
├── Need SIDE EFFECTS after instance is cached
│   ├── Logging, metrics, notification
│   │   └── Use afterResolving() — instance is final, cached
│   ├── Modifications do NOT affect cached instance
│   │   └── Use afterResolving() — but modifications won't be cached
│   └── Don't need to modify the instance
│       └── Use afterResolving()
└── Execution order: beforeResolving → build → extenders → resolving → cache → afterResolving
    ├── Modifications in resolving() ARE reflected in the cached singleton
    └── Modifications in afterResolving() are NOT reflected (already cached)
```

### Rationale
The execution order determines what state is available at each hook. `beforeResolving()` has access only to the abstract name and parameters. `resolving()` has access to the fully-built instance (including all extenders) and modifications affect the cached singleton. `afterResolving()` is for fire-and-forget — the instance is already cached.

### Default
Use `resolving()` for most configuration needs — it sees the fully extended instance and modifications affect the cache. Use `afterResolving()` only for side effects.

### Risks
- Using `afterResolving()` for modifications → modifications not reflected in cached singleton
- Using `beforeResolving()` for configuration → instance not built yet
- Returning non-null from `resolving()` → replaces the fully-extended instance

### Related Rules/Skills
- Use `afterResolving()` for Side Effects Only
- Skill: Configure Services at Resolution Time

---

## Decision 2: Abstract-Specific vs Global Callback

### Decision Context
Registering a callback. Choose between binding to a specific abstract or registering a global callback.

### Decision Criteria
- **Applies to one type?** → abstract-specific callback
- **Applies to many types?** → consider separate abstract-specific callbacks vs global with instanceof
- **Number of types targeted**: 1-5 types → abstract-specific; 6+ → benchmark both approaches
- **Cross-cutting concern (logging, profiling)?** → global callback may be appropriate

### Decision Tree
```
Callback scope: specific or global?
├── Applies to A SINGLE abstract type
│   └── Use ABSTRACT-SPECIFIC callback: $app->resolving(Repo::class, fn($r) => ...)
│   └── O(1) dispatch — no branching overhead
├── Applies to 2-5 abstract types
│   ├── Same logic for each type
│   │   └── Register individual abstract-specific callbacks — each O(1)
│   └── Different logic per type
│       └── Register individual abstract-specific callbacks
├── Applies to 6+ abstract types
│   ├── Different logic per type
│   │   └── REGISTER INDIVIDUAL — still O(1) per type
│   ├── Same generic logic (logging, tagging, profiling)
│   │   └── Consider GLOBAL callback — but benchmark against individual
│   └── instanceof check in global
│       └── Global with instanceof chains is slower than individual callbacks
├── Cross-cutting concern (truly applies to all services)
│   ├── Metrics collector that tags every resolved service
│   │   └── Global callback may be appropriate
│   └── Profiling interceptor
│       └── Global callback — but ensure it's fast (<1μs)
└── Performance comparison
    ├── 10 individual callbacks: 10 O(1) lookups + 10 closures = ~5μs
    ├── 1 global callback with 10 instanceof checks: 10 instanceof per resolution = ~3-5μs
    └── Global is slightly faster for single type check; individual is clearer
```

### Rationale
Abstract-specific callbacks provide O(1) dispatch — the container directly invokes them when resolving that abstract. Global callbacks are checked on every single `make()` call, incurring overhead even for unrelated resolutions. For most use cases, multiple abstract-specific callbacks are both clearer and more performant than a single global callback with instanceof chains.

### Default
Use abstract-specific callbacks. Use global callbacks only for truly cross-cutting concerns that apply to every resolved service.

### Risks
- Global callback with heavy instanceof chain → measurable overhead on every resolution
- Too many abstract-specific callbacks → registration noise in provider (but not a performance issue)
- Global callback that throws → breaks every resolution in the application

### Related Rules/Skills
- Use Abstract-Specific Callbacks Over Global Callbacks with `instanceof`
- Skill: Configure Services at Resolution Time

---

## Decision 3: Instance Replacement in `resolving()` Callback

### Decision Context
The `resolving()` callback can return a non-null value to replace the resolved instance. Decide whether to use this capability.

### Decision Criteria
- **Is this decoration?** Yes → use `extend()` instead; No → `resolving()` may be acceptable
- **Need to replace after extenders?** Yes → `resolving()` (runs after extenders); No → `extend()`
- **Accidental replacement risk**: Callbacks using `tap()` may accidentally return and replace

### Decision Tree
```
Instance replacement in resolving()?
├── Purpose is DECORATION (wrapping instance)
│   └── DO NOT use resolving() — use extend() instead
│   └── resolving() runs after extenders — extender output is lost if callback replaces
├── Purpose is COMPLETE REPLACEMENT after decoration
│   ├── Rare — replacing the instance after all extenders ran
│   │   └── Use resolving() with return — only when absolutely necessary
│   └── Normal use case → extend() is correct
├── ACCIDENTAL REPLACEMENT
│   ├── Callback uses tap() which returns the instance
│   │   └── $app->resolving(Foo::class, fn($f) => tap($f)->setX()) // Returns $f — replaces instance!
│   ├── Callback has `return` statement
│   │   └── $app->resolving(Foo::class, fn($f) => { $f->setX(); return $f; }) // Replaces!
│   └── Mistaken assumption that return has no effect
│       └── Remove return: $app->resolving(Foo::class, fn($f) => $f->setX())
└── When replacement IS appropriate
    ├── Modifying the instance after all extenders AND the modification must be the final result
    │   └── Acceptable — but document why extend() wasn't sufficient
    └── Extremely rare — almost always extend() is the correct API
```

### Rationale
Instance replacement in `resolving()` callbacks is an escape hatch, not a primary API. The intended decoration API is `extend()`, which runs before `resolving()`. If a `resolving()` callback returns a non-null value, it replaces the instance that has already been through extenders, discarding the extender output. The only legitimate use is when you need the final say after all decoration.

### Default
Never return a non-null value from `resolving()` callbacks. Use `extend()` for decoration.

### Risks
- Accidental return from `tap()` → replaces instance, losing extender output
- Extender registered by package A lost when callback from package B replaces the instance
- Debugging "decoration not working" → check if `resolving()` callback replaces the instance

### Related Rules/Skills
- Use `extend()` for Decoration, `resolving()` for Configuration
- Avoid Instance Replacement in `resolving()` Callbacks
- Skill: Configure Services at Resolution Time
