# Decision Trees — DI Container Basics

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-01: DI Container Basics |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | bind() vs singleton() vs instance() | Which registration method to use for a given service | Every new binding | High |
| D02 | Explicit Binding vs Auto-Resolution | Whether to register a binding or let the container auto-resolve | Every dependency | Medium |
| D03 | Interface vs Concrete Type Binding | Whether to bind an interface or the concrete class directly | Architecture decision | High |
| D04 | Binding Location — Provider vs Elsewhere | Where the binding registration should live | Every new binding | Medium |

---

## D01: bind() vs singleton() vs instance()

### Decision Context
You are registering a service in the container and must choose between `bind()` (new instance per resolution), `singleton()` (cached instance), or `instance()` (pre-built object).

### Criteria
1. **Statefulness**: Does the service maintain state across a request?
2. **Lifecycle requirement**: Should each resolution get a fresh instance or the same one?
3. **Existing instance**: Do you already have a built object to register?
4. **Construction cost**: Is the service expensive to create (DB connection, HTTP client)?

### Decision Tree
```
Service registration needed
├── Do you already have a built object ready?
│   ├── Yes → Use instance() (lowest overhead, bypasses resolution)
│   └── No → Is the service stateless (no per-request mutable state)?
│       ├── Yes → Use singleton() (cached, efficient, one instance per application)
│       │   └── Is the service expensive to construct (DB, API, file I/O)?
│       │       ├── Yes → singleton() is strongly preferred
│       │       └── No → singleton() still beneficial for performance
│       └── No (has per-request mutable state) → Use bind() (new instance each resolution)
│           └── Does the service need cleanup between usages?
│               ├── Yes → bind() with a factory closure that handles cleanup
│               └── No → simple bind() is sufficient
```

### Rationale
`singleton()` creates one instance per container lifetime (typically one per request for FPM, one per worker for Octane). `bind()` creates a new instance each time. `instance()` bypasses resolution entirely. Stateless services should be singletons — they incur construction cost once. Stateful services need `bind()` to prevent data leakage between consumers.

### Default
Stateless services → `singleton()`. Stateful services → `bind()`. Do not use `instance()` unless you have a pre-built object.

### Risks
- Singleton with mutable state = data leaks between consumers.
- `bind()` for expensive services = repeated construction cost.
- `instance()` for objects the container should construct = bypassing DI lifecycle.

### Related Rules/Skills
- Skill: Service Container Binding Types

---

## D02: Explicit Binding vs Auto-Resolution

### Decision Context
You need a class resolved from the container. Should you register an explicit binding or rely on the container's auto-resolution?

### Criteria
1. **Class type**: Is it a concrete class, an interface, or an abstract class?
2. **Implementation control**: Do you need to specify which concrete to use?
3. **Constructor complexity**: Does the constructor have primitives without defaults?
4. **Performance**: Is this resolved on every request (hot path)?

### Decision Tree
```
Class or interface needs resolution
├── Is it an interface or abstract class?
│   ├── Yes → MUST bind explicitly (auto-resolution throws TargetInterfaceNotInstantiableException)
│   └── No → Is it a concrete class with all resolvable constructor dependencies?
│       ├── Yes → Auto-resolution works — no binding needed
│       │   └── Is this resolved on a hot path (every request)?
│       │       ├── Yes → Consider explicit singleton binding (avoids Reflection overhead)
│       │       └── No → Auto-resolution is fine
│       └── No → Does constructor have primitive params without defaults?
│           ├── Yes → MUST provide explicit binding or defaults
│           └── No → Auto-resolution works
```

### Rationale
Auto-resolution is a convenience mechanism for concrete classes with simple dependency trees. It uses Reflection on every `make()` call. For interfaces and abstract classes, auto-resolution cannot instantiate — explicit binding is required. For hot paths, explicit singleton bindings avoid the Reflection cost.

### Default
Let auto-resolution handle concrete classes. Always bind interfaces and abstract classes explicitly.

### Risks
- Relying on auto-resolution for interfaces = runtime exceptions.
- Auto-resolution for hot paths = unnecessary Reflection overhead.
- Changing a concrete class constructor can silently break resolution.

### Related Rules/Skills
- Skill: Service Container Binding Types

---

## D03: Interface vs Concrete Type Binding

### Decision Context
You are type-hinting a dependency. Should you use an interface or the concrete class as the type?

### Criteria
1. **Swappability**: Might the implementation need to change (different environment, testing)?
2. **Abstraction boundary**: Is this an architectural boundary (repository, gateway, service)?
3. **Multiple implementations**: Are there (or could there be) multiple implementations?
4. **Testability**: Do you need to mock the dependency in tests?

### Decision Tree
```
Type-hinting a dependency
├── Is this an architectural boundary (repository, gateway, external service)?
│   ├── Yes → Type-hint the interface (enables swapping, mocking, testing)
│   └── No → Is there a chance of multiple implementations?
│       ├── Yes → Type-hint the interface (future-proof)
│       └── No → Do you need to mock this in tests?
│           ├── Yes → Type-hint the interface (easier mocking)
│           └── No → Concrete class is acceptable (simpler, no binding needed)
```

### Rationale
Interface binding is the cornerstone of DI — it decouples consumers from implementations. For architectural boundaries (repositories, payment gateways, mailers), interfaces are essential. For internal service classes with only one implementation and no mocking need, concrete type-hinting avoids the overhead of maintaining an interface.

### Default
Type-hint interfaces for architectural boundaries. Type-hint concrete classes for internal utilities with no swap/mock requirements.

### Risks
- Always using concrete types = hard to swap implementations, harder to mock.
- Always using interfaces = interface proliferation, unnecessary abstraction overhead.
- Binding concrete-to-concrete (`bind(Service::class, Service::class)`) = redundant — auto-resolution handles it.

### Related Rules/Skills
- Skill: Service Container Binding Types

---

## D04: Binding Location — Provider vs Elsewhere

### Decision Context
You need to register a container binding. Where should the binding registration be placed?

### Criteria
1. **Binding type**: Is this a global binding, contextual binding, or tagged binding?
2. **Domain**: Which domain does this binding belong to?
3. **Existing provider**: Is there already a provider for this domain?
4. **Application vs package**: Is this an application binding or a package binding?

### Decision Tree
```
Binding registration placement
├── Is this a global application binding?
│   ├── Yes → Is there an existing provider for this domain?
│   │   ├── Yes → Add to that provider's register() method
│   │   └── No → Does it belong to an existing domain?
│   │       ├── Yes → Create or use existing domain provider
│   │       └── No (cross-cutting) → Add to AppServiceProvider
│   └── No → Is it a contextual binding?
│       ├── Yes → Register in the provider that owns the consumer class
│       └── No → Is it a tagged binding?
│           ├── Yes → Register alongside the related bindings
│           └── No → (see above)
├── Is this a package binding?
│   ├── Yes → Register in the package's own service provider
│   └── No → (see above)
```

### Rationale
The service provider is the composition root — all binding registration belongs here. Placing bindings near their domain makes them discoverable and maintainable. Contextual bindings should be registered in the provider that owns the consumer. Cross-cutting bindings (logging, caching, config) that don't belong to any specific domain go in `AppServiceProvider`.

### Default
Register in the domain-specific provider. Cross-cutting bindings in `AppServiceProvider`.

### Risks
- Scattering bindings outside providers (routes, controllers) = untestable, non-deterministic.
- Putting everything in `AppServiceProvider` = God provider.
- Registering in `boot()` instead of `register()` = timing issues with resolution.

### Related Rules/Skills
- Skill: Create and Register a Service Provider
