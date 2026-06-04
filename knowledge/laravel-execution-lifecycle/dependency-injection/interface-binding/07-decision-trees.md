# Decision Trees — Interface Binding

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-08: Interface Binding |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Interface vs Concrete Type-Hint | Whether to type-hint an interface or the concrete implementation class | Architecture decision | High |
| D02 | bind() vs singleton() for Interface Binding | Whether to use `bind()` (new instance) or `singleton()` (cached) for an interface binding | Every interface binding | High |
| D03 | Interface Design — Granular vs Coarse | Whether to design fine-grained interfaces or broader abstractions | Interface creation | High |

---

## D01: Interface vs Concrete Type-Hint

### Decision Context
You are type-hinting a dependency. Should it be an interface or the concrete class?

### Criteria
1. **Abstraction boundary**: Is this an architectural seam (repository, gateway, external service)?
2. **Implementation count**: Are there or could there be multiple implementations?
3. **Testability**: Do you need to mock the dependency in tests?
4. **Future flexibility**: Is the implementation likely to change?

### Decision Tree
```
Dependency type-hint decision
├── Is this an infrastructure or external service (cache, mail, http, db, filesystem)?
│   ├── Yes → ALWAYS type-hint the interface (these are the quintessential DI abstractions)
│   └── No → Is this a repository, gateway, or other architectural boundary?
│       ├── Yes → Type-hint the interface (swappable, mockable, testable)
│       └── No → Is this domain logic with a single stable implementation?
│           ├── Yes → Is testing with a mock important for this class?
│           │   ├── Yes → Create an interface (enables mocking)
│           │   └── No → Concrete type-hint is acceptable (simpler, no interface overhead)
│           └── No → (multiple or changing implementations → interface)
```

### Rationale
Interfaces decouple consumers from implementations. The most important places to use them are architectural boundaries (infrastructure services, repositories, gateways). For internal domain services with only one stable implementation and no mocking needs, concrete type-hints avoid interface proliferation. The rule of thumb: if you can imagine swapping the implementation or mocking in tests, use an interface.

### Default
Interface for infrastructure and architectural boundaries. Concrete for stable internal services.

### Risks
- No interface for infrastructure = impossible to mock, hard to swap.
- Interface for every class = IUserService, IUserRepository, IUserValidator — unnecessary abstraction.
- Interface without binding = `TargetInterfaceNotInstantiableException` at runtime.

### Related Rules/Skills
- Skill: Interface Binding Resolution

---

## D02: bind() vs singleton() for Interface Binding

### Decision Context
You are binding an interface to a concrete implementation. Should you use `bind()` (new instance per resolution) or `singleton()` (shared instance)?

### Criteria
1. **Statefulness**: Does the concrete implementation maintain mutable state?
2. **Construction cost**: Is the concrete expensive to create?
3. **Request lifecycle**: Should each request/consumer get the same instance or a fresh one?
4. **Dependency tree**: Does the concrete have its own dependencies that should be resolved once?

### Decision Tree
```
Binding interface to concrete
├── Is the concrete implementation stateless (no per-request mutable state)?
│   ├── Yes → Use singleton() (faster, one instance for the application)
│   │   └── Is construction expensive (DB connection, HTTP client, file I/O)?
│   │       ├── Yes → singleton() is strongly recommended
│   │       └── No → singleton() still beneficial (avoids repeated resolution)
│   └── No (has per-request mutable state) → Use bind() (fresh instance per resolution)
│       └── Does the state need to be scoped to a specific context?
│           ├── Yes → Use scoped() for tenant/request-scoped singletons
│           └── No → bind() is fine
```

### Rationale
Singleton-instance bindings resolve once and reuse the instance for all subsequent resolutions. This saves construction cost and ensures consistent state sharing. However, singletons with mutable state leak data between consumers. Stateless services (loggers, HTTP clients, repository proxies) are good singleton candidates. Stateful services should use `bind()` or `scoped()`.

### Default
Stateless → `singleton()`. Stateful → `bind()`. Request-scoped state → `scoped()`.

### Risks
- Singleton with mutable state = data leakage between consumers.
- `bind()` for expensive services = repeated construction cost.
- `scoped()` without flush = state accumulates across the scope.

### Related Rules/Skills
- Skill: Interface Binding Resolution

---

## D03: Interface Design — Granular vs Coarse

### Decision Context
You are designing an interface that will be bound in the container. Should it be granular (one method) or coarse (many related methods)?

### Criteria
1. **Single responsibility**: Does the interface represent a single responsibility?
2. **Implementation cohesion**: Would implementors naturally include all methods?
3. **Consumer needs**: Do consumers typically use all methods or subsets?
4. **Interface Segregation Principle**: Are you forcing consumers to depend on methods they don't use?

### Decision Tree
```
Interface design decision
├── Does the interface represent a single, cohesive responsibility?
│   ├── Yes → Keep as-is (granular enough)
│   └── No → Can it be split into smaller interfaces by consumer need?
│       ├── Yes → Split (ISP compliance, consumers only depend on what they use)
│       └── No → (methods are inherently coupled — keep together)
├── Do implementors need to provide all methods?
│   ├── Yes → Coarse interface is acceptable (implementors implement everything)
│   └── No (some methods are optional or irrelevant for some implementors) → Split
├── Do consumers typically use all methods or subsets?
│   ├── All → Coarse is fine
│   └── Subsets → Split (consumers should not depend on methods they don't call)
```

### Rationale
The Interface Segregation Principle (ISP) states: no client should be forced to depend on methods it does not use. A coarse `CrudRepository` interface with 10 methods forces every consumer to know about all 10, even if they only need `findById()`. Splitting into `ReadRepository` and `WriteRepository` follows ISP and allows more focused interfaces. However, splitting too aggressively creates interface proliferation.

### Default
Start with a cohesive interface. Split only when consumers demonstrably use different subsets.

### Risks
- Coarse interface with unrelated methods = violates ISP, hard to implement.
- Ultra-granular interfaces (one method each) = interface proliferation, harder to compose.
- Splitting interfaces that are always used together = unnecessary indirection.

### Related Rules/Skills
- Skill: Interface Binding Resolution
