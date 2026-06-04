# Container Fundamentals — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Container Fundamentals
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Register binding in `register()` vs `boot()` | Service provider method selection | Binding availability; lifecycle correctness |
| 2 | Explicit binding vs auto-resolution | Registering dependency or letting container infer | Performance; determinism; maintenance |
| 3 | Interface-to-concrete binding vs self-binding | Deciding the abstract name for registration | Flexibility; dependency inversion |

---

## Decision 1: Register Binding in `register()` vs `boot()`

### Decision Context
Placing container binding registration within a service provider. Choose between the `register()` or `boot()` method.

### Decision Criteria
- **Binding registration** → always in `register()`
- **Dependency on other provider's binding** → `boot()` (after all providers registered)
- **Resolution callbacks and extenders** → `boot()` (after binding exists)
- **Code that consumes resolved services** → `boot()` (after all providers registered)

### Decision Tree
```
Where to put this code in a service provider?
├── Registering a binding (bind, singleton, scoped, alias, tag)
│   └── ALWAYS in register() — bindings must be available before boot
├── Registering extenders or resolution callbacks
│   └── In boot() — target binding must already exist
├── Code that consumes other services
│   ├── Uses make() to resolve something
│   │   └── In boot() — all provider bindings are registered
│   └── Type-hints a dependency in the provider constructor
│       └── In boot() — container can resolve all dependencies
├── Code that depends on another provider having registered bindings
│   └── In boot() — all register() methods run first
└── Registering event listeners, routes, or view composers
    └── In boot() — application is fully booted
```

### Rationale
`register()` is for building the container — registering bindings, aliases, and tags. `boot()` is for using the container — running code that depends on all bindings being registered. The order is deterministic: all providers' `register()` methods run first, then all `boot()` methods.

### Default
Put all binding registration in `register()`. Put extenders, callbacks, and service consumption in `boot()`.

### Risks
- Putting bindings in `boot()`: other providers' `register()` can't rely on them
- Putting make() calls in `register()`: binding from another provider may not exist yet
- Calling `make()` for a singleton in `register()`: instance created before all extenders registered

### Related Rules/Skills
- Register All Bindings in Service Providers
- Skill: Configure the Service Container

---

## Decision 2: Explicit Binding vs Auto-Resolution

### Decision Context
A class needs to be resolved. Decide whether to register an explicit binding or let auto-resolution handle it.

### Decision Criteria
- **Interface/abstract type-hint?** Yes → must register explicit binding; No → auto-resolution may work
- **Hot path?** Yes (resolved every request) → explicit binding for performance; No → auto-resolution is fine
- **Constructor has required primitives?** Yes → explicit binding or `makeWith()`; No → auto-resolution works
- **Needs extenders/callbacks?** Yes → self-binding enables these; No → auto-resolution is fine

### Decision Tree
```
Register explicit binding or rely on auto-resolution?
├── Class has interface/abstract type-hints in constructor
│   └── MUST register explicit binding for each interface — auto-resolution cannot instantiate interfaces
├── Class is a concrete class with no interface dependencies
│   ├── Resolved on hot path (every request/job)
│   │   └── Register explicit binding — ~10x faster than reflection
│   ├── Resolved infrequently
│   │   └── Auto-resolution is fine — no binding needed
│   └── Needs extenders or resolution callbacks
│       └── Register self-binding: $app->bind(MyClass::class)
├── Class has required primitive parameters (no defaults)
│   ├── All callers use makeWith() with explicit params
│   │   └── Auto-resolution with makeWith() works
│   └── Some callers use plain make()
│       └── MUST register explicit binding or add defaults
└── Adding a new dependency to an existing class
    ├── Interface — must add binding
    ├── Concrete class — auto-resolution handles it
    └── Primitive with no default — will break all existing make() callers
```

### Rationale
Auto-resolution is convenient but slower and less predictable than explicit bindings. The rule of thumb: if the class has interface dependencies, you must register bindings. If it's a concrete class on a hot path, register for performance. Otherwise, auto-resolution works fine.

### Default
Use auto-resolution for concrete, non-hot-path classes. Register explicit bindings for interfaces and hot paths.

### Risks
- Interface without binding → `BindingResolutionException` at runtime
- Auto-resolution for hot path → unnecessary reflection overhead
- Adding required primitive without default → breaks existing `make()` callers

### Related Rules/Skills
- Register Bindings for Every Interface Type-Hint
- Prefer Explicit Bindings Over Auto-Resolution for Production Hot Paths
- Skill: Configure the Service Container

---

## Decision 3: Interface-to-Concrete vs Self-Binding

### Decision Context
Registering a binding. Decide whether to bind an interface to a concrete class or bind the class to itself.

### Decision Criteria
- **Multiple implementations exist?** Yes → bind interface to each; No → self-binding or interface binding
- **Interface used as type-hint?** Yes → bind interface; No → self-binding is simpler
- **Need to swap implementation later?** Yes → bind interface (easy swap); No → either works
- **Testing/mocking** → bind interface (mock interface in tests)

### Decision Tree
```
What abstract name to use for binding?
├── Class implements an interface used as type-hint
│   ├── Multiple implementations of the interface exist
│   │   └── Bind INTERFACE to each concrete: $app->bind(Interface::class, Concrete::class)
│   ├── Single implementation (currently)
│   │   └── Bind INTERFACE to concrete — enables future swaps and testing
│   └── Interface is the contract consumers should depend on
│       └── Bind INTERFACE — follows Dependency Inversion Principle
├── Class has no interface (concrete-to-concrete consumer)
│   ├── Needs extenders or resolution callbacks
│   │   └── Self-binding: $app->bind(MyClass::class) — enables lifecycle hooks
│   ├── No need for extenders/callbacks
│   │   └── Auto-resolution works — no binding needed
│   └── Class is on hot path
│       └── Self-binding: $app->bind(MyClass::class, fn() => new MyClass(...))
├── Testing consideration
│   ├── Consumers type-hint interface → mock the interface
│   │   └── Bind INTERFACE
│   └── Consumers type-hint concrete → harder to mock
│       └── Bind interfaace or add interface
└── Refactoring existing code
    ├── Currently using concrete type-hints
    │   └── Extract interface, type-hint interface, bind interface
    └── No time to extract interface
        └── Self-binding as interim solution (but consumers still coupled)
```

### Rationale
Binding interfaces to concretes is the correct DI pattern — consumers depend on abstractions, not concretions. Self-binding (or no binding) is for concrete classes where no abstraction layer is needed. The choice determines how easy it is to swap implementations and write isolated tests.

### Default
Bind interfaces to concrete implementations. Self-bind only for concrete classes that need extenders or are on hot paths.

### Risks
- No interface binding when needed → hard to swap implementations; hard to mock
- Binding concrete-to-concrete `$app->bind(ConcreteA::class, ConcreteB::class)` → no abstraction benefit
- Too many interfaces for every class → over-engineering

### Related Rules/Skills
- Register Bindings for Every Interface Type-Hint
- Skill: Configure the Service Container
