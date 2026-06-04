# Decision Trees — Constructor Injection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-02: Constructor Injection |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Constructor Injection vs Method Injection | Whether to inject a dependency via constructor or method parameter | Every class with dependencies | High |
| D02 | Concrete Class vs Interface Type-Hint | Whether to type-hint the concrete class or interface in the constructor | Every constructor parameter | Medium |
| D03 | Dependency Count Management | What to do when a constructor has too many parameters | Code review / refactoring | High |
| D04 | Readonly vs Mutable Property | Whether to use readonly promoted properties for injected dependencies | Every injected dependency | Low |

---

## D01: Constructor Injection vs Method Injection

### Decision Context
A class needs a dependency. Should it be injected via the constructor (available to all methods) or via a method parameter (available only in that method)?

### Criteria
1. **Usage scope**: Is the dependency used in one method or multiple methods?
2. **Instantiation cost**: Is the dependency expensive to construct?
3. **Construction context**: Is the class created by the container or manually?
4. **Serialization**: Does the class need to be serialized (queued jobs)?

### Decision Tree
```
Dependency needed by a class
├── Is the dependency used in multiple methods or across the class?
│   ├── Yes → Constructor injection (inject once, use everywhere)
│   └── No → Used in only one method?
│       ├── Yes → Method injection (keeps constructor lean, no unnecessary instantiation)
│       └── No → (edge case — refactor)
├── Is the class a queued job that needs serialization?
│   ├── Yes → Constructor injection for serializable payload (non-serializable deps via method injection)
│   └── No → Normal rules apply
├── Is the class a middleware?
│   ├── Yes → Constructor injection (handle() signature is fixed)
│   └── No → Normal rules apply
```

### Rationale
Constructor injection is preferred for shared dependencies used across multiple methods — it makes dependencies explicit and the container handles resolution once. Method injection is preferred for single-use dependencies — it keeps the constructor lean and avoids unnecessary instantiation when the method isn't called.

### Default
Constructor injection for shared dependencies. Method injection for single-use dependencies.

### Risks
- Constructor injection for single-use dependency = unnecessary instantiation on every class creation.
- Method injection for shared dependency = repetitive type-hints, harder to refactor.
- Mixing both patterns inconsistently = confusion about where dependencies come from.

### Related Rules/Skills
- Skill: Constructor Injection

---

## D02: Concrete Class vs Interface Type-Hint

### Decision Context
In a constructor parameter, should you type-hint the concrete class or the interface?

### Criteria
1. **Implementation stability**: Is this implementation likely to change?
2. **Mocking needs**: Do you need to mock this in tests?
3. **Binding existence**: Is there an existing binding for the interface?
4. **Abstraction level**: Is this an infrastructure concern (cache, mail, DB)?

### Decision Tree
```
Constructor type-hint decision
├── Is this an infrastructure or external service (cache, mail, HTTP, DB)?
│   ├── Yes → Type-hint the interface (CachesMessages, Mailer, HttpClient)
│   └── No → Is the dependency an application service?
│       ├── Yes → Is it likely to have multiple implementations or need mocking?
│       │   ├── Yes → Type-hint the interface (flexibility, testability)
│       │   └── No → Type-hint the concrete class (simpler, no interface needed)
│       └── No (utility / value object) → Concrete class is fine
```

### Rationale
Interfaces decouple consumers from implementations. For infrastructure concerns (where implementations are frequently swapped or mocked), interfaces are essential. For stable application services with only one implementation and no mocking needs, concrete type-hints avoid unnecessary abstraction overhead.

### Default
Infrastructure/external services → interface. Internal stable services → concrete class.

### Risks
- Type-hinting concrete infrastructure class = hard to swap, hard to mock.
- Interface for every dependency = over-abstraction, maintenance burden.
- Interface without binding = `TargetInterfaceNotInstantiableException` at runtime.

### Related Rules/Skills
- Skill: Interface Binding Resolution

---

## D03: Dependency Count Management

### Decision Context
A class has too many constructor parameters (7+). What should you do?

### Criteria
1. **Parameter count**: How many dependencies does the constructor take?
2. **Responsibility scope**: Does the class do too many things?
3. **Dependency nature**: Are some dependencies grouped by domain?
4. **Refactoring options**: Can parameter objects or facade services help?

### Decision Tree
```
Constructor has too many parameters (7+)
├── Are the dependencies from different domains?
│   ├── Yes → Split the class into smaller classes per domain (SRP violation)
│   └── No → Are some dependencies grouping naturally?
│       ├── Yes → Create a parameter object or facade service
│       │   ├── Introduce facade service that consolidates related deps
│       │   └── Inject the facade instead of individual deps
│       └── No → Identify dependencies used together and extract
├── Could some dependencies be moved to method injection?
│   ├── Yes → Move single-use deps to method parameters
│   └── No → Refactor the class — it does too much
```

### Rationale
A constructor with 7+ parameters is a strong signal that the class violates the Single Responsibility Principle. Each dependency represents a distinct responsibility. The solution is typically to split the class or introduce parameter objects/facade services that group related dependencies.

### Default
Split the class. If SRP is not violated, introduce a facade service.

### Risks
- Creating a "parameter bag" object = hiding the real dependency count.
- Splitting too aggressively = class explosion.
- Moving dependencies to method injection = shifting the problem to method signatures.

### Related Rules/Skills
- Skill: Over-Injection Anti-Pattern

---

## D04: Readonly vs Mutable Property

### Decision Context
A dependency is injected via the constructor. Should the property be readonly or mutable?

### Criteria
1. **PHP version**: Is the project on PHP 8.1+ (readonly properties)?
2. **Immutability intent**: Should the dependency be replaceable after construction?
3. **Testing pattern**: Do you need to swap the dependency after construction (e.g., for testing)?

### Decision Tree
```
Injected dependency property declaration
├── Is the project on PHP 8.1+?
│   ├── Yes → Use readonly promoted properties (concise, immutable, clear intent)
│   └── No → Use standard property assignment in constructor body
├── Does the dependency need to be replaced after construction (testing)?
│   ├── Yes → Use mutable property (public or setter for swapping)
│   └── No → Use readonly (prevents accidental reassignment)
```

### Rationale
Readonly promoted properties (`public function __construct(readonly Logger $log) {}`) are the cleanest way to declare injected dependencies in PHP 8.1+. They are concise, enforce immutability, and make it clear that the dependency is set once and never changed. The only reason to avoid readonly is if the dependency needs to be swapped after construction (which should be rare in well-designed code).

### Default
Use readonly promoted properties for all injected dependencies on PHP 8.1+.

### Risks
- Readonly prevents property swapping — if tests need to replace the dependency, use a setter or `ReflectionProperty::setValue()`.
- Mixing readonly and mutable properties inconsistently = unclear intent.
- Readonly on PHP <8.1 = syntax error.

### Related Rules/Skills
- Skill: Constructor Injection
