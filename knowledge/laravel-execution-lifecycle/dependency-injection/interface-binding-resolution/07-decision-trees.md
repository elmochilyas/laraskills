# Decision Trees — Interface Binding Resolution

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Interface Binding Resolution |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Global Binding vs Contextual Binding | Whether to use a global interface binding or consumer-specific contextual binding | Every interface binding | High |
| D02 | Interface vs No Interface | Whether to create an interface for a class or use the concrete type directly | Architecture decision | High |
| D03 | bind() vs singleton() vs instance() for Interfaces | Which registration method to use when binding an interface to a concrete | Every interface binding | Medium |

---

## D01: Global Binding vs Contextual Binding

### Decision Context
An interface needs to be bound to a concrete. Should it be a global binding (same for all consumers) or contextual (different per consumer)?

### Criteria
1. **Uniformity**: Do all consumers need the same concrete?
2. **Exception count**: How many consumers need a different implementation?
3. **Default selection**: Is there a clear standard implementation?

### Decision Tree
`+` Interface binding decision
`+--` Do ALL consumers need the same concrete?
    `+--` Yes -> Global binding: bind() or singleton()
    `+--` No -> Is there a standard implementation for most consumers?
        `+--` Yes -> Global default + contextual for exceptions
        `+--` No (split evenly) -> Are there <3 consumers?
            `+--` Yes -> Contextual binding for each (no global default)
            `+--` No -> Consider splitting the interface per concern

### Rationale
Global bindings provide a single default for all consumers. Contextual bindings override the default for specific consumers. The pattern is: set a sensible global default, then override for consumers that need something different. Without a clear default, every consumer needs its own contextual binding.

### Default
Global binding for the standard implementation. Contextual bindings for exceptions.

### Risks
- No global default = every new consumer must have a contextual binding.
- Contextual binding sprawl (50+ rules) = architecture needs simplification.
- Contextual binding in boot() after consumer already resolved = no effect.

### Related Rules/Skills
- Skill: Interface Binding Resolution

---

## D02: Interface vs No Interface

### Decision Context
A class exists. Should you also create an interface for it?

### Criteria
1. **Architectural boundary**: Is this a repository, gateway, or external service?
2. **Implementation count**: Could there be multiple implementations?
3. **Testability**: Do you need to mock in tests?
4. **Team practice**: Does the team use interfaces for all services?

### Decision Tree
`+` Should an interface be created?
`+--` Is this an infrastructure service (cache, mail, HTTP, DB)?
    `+--` Yes -> Create interface (essential abstraction)
`+--` Is this a repository or gateway?
    `+--` Yes -> Create interface (architectural boundary)
`+--` Is this a domain service with a single stable implementation?
    `+--` Yes -> Do you need to mock in tests?
        `+--` Yes -> Create interface (enables clean mocking)
        `+--` No -> Concrete class is acceptable (simpler)
`+--` Could there be multiple implementations now or in the future?
    `+--` Yes -> Create interface (future-proof)

### Rationale
Interfaces should serve a purpose: enabling polymorphism, decoupling, or testability. Infrastructure services and architectural boundaries always benefit from interfaces. For internal services with one stable implementation and no mocking needs, concrete type-hints avoid interface proliferation.

### Default
Interface for infrastructure/architectural boundaries. Concrete for stable internal services without mocking needs.

### Risks
- Interface for every class = IUserService, IUserRepository proliferation.
- No interface for infrastructure = impossible to mock or swap.
- Interface without binding = TargetInterfaceNotInstantiableException.

### Related Rules/Skills
- Skill: Interface Binding Resolution

---

## D03: bind() vs singleton() vs instance() for Interfaces

### Decision Context
An interface is being bound to a concrete. Should you use bind(), singleton(), or instance()?

### Criteria
1. **Statefulness**: Does the concrete maintain mutable per-request state?
2. **Construction cost**: Is the concrete expensive to create?
3. **Pre-built object**: Do you already have the object ready?

### Decision Tree
`+` Interface binding registration method
`+--` Do you already have a pre-built object?
    `+--` Yes -> Use instance() (bypasses resolution entirely)
    `+--` No -> Is the concrete stateless (no per-request mutable state)?
        `+--` Yes -> Use singleton() (cached, efficient, one instance)
        `+--` No -> Use bind() (new instance per resolution)
            `+--` If request-scoped -> Use scoped() (one per request/scope)

### Rationale
instance() bypasses resolution — use when you have a ready object. singleton() caches one instance per application lifecycle — use for stateless services. bind() creates a new instance each time — use for stateful services. scoped() provides one instance per scope (request/tenant) — use for services with scope-specific state.

### Default
Stateless -> singleton(). Stateful -> bind(). Pre-built -> instance(). Request-scoped -> scoped().

### Risks
- Singleton with mutable state = data leakage between consumers.
- bind() for expensive services = repeated construction cost.
- instance() for services the container should construct = bypassing DI.

### Related Rules/Skills
- Skill: Interface Binding Resolution
