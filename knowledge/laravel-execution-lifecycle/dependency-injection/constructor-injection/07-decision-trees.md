# Decision Trees — Constructor Injection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Constructor Injection |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Interface vs Concrete Type-Hint | Whether to type-hint an interface or concrete class in the constructor | Every constructor parameter | High |
| D02 | Constructor Injection vs Method Injection | Whether to inject via constructor or method parameter | Every class with dependencies | High |
| D03 | Over-Injection Detection | When a constructor has too many parameters and needs refactoring | Code review | High |

---

## D01: Interface vs Concrete Type-Hint

### Decision Context
In a constructor parameter, should you type-hint the interface or the concrete class?

### Criteria
1. **Infrastructure**: Is this an infrastructure service (cache, mail, HTTP, DB)?
2. **Swappability**: Might the implementation need to change?
3. **Testability**: Do you need to mock this in tests?
4. **Interface existence**: Does an interface already exist?

### Decision Tree
`+` Constructor type-hint decision
`+--` Infrastructure or external service?
    `+--` Yes -> Type-hint the interface
    `+--` No -> Architectural boundary (repository, gateway)?
        `+--` Yes -> Type-hint the interface
        `+--` No -> Stable internal service with one impl?
            `+--` Yes -> Concrete class is acceptable (simpler)
            `+--` No -> Type-hint the interface

### Rationale
Interfaces decouple consumers from implementations. Infrastructure services and architectural boundaries should always use interfaces. For stable internal services with one implementation and no mocking needs, concrete type-hints avoid unnecessary abstraction.

### Default
Interface for infrastructure/architectural boundaries. Concrete for stable internal services.

### Risks
- Interface without binding = TargetInterfaceNotInstantiableException.
- Concrete for infrastructure = hard to mock, hard to swap.
- Interface for every class = interface proliferation.

### Related Rules/Skills
- Skill: Constructor Injection

---

## D02: Constructor Injection vs Method Injection

### Decision Context
A class needs a dependency. Should it be constructor-injected or method-injected?

### Criteria
1. **Usage scope**: Used in one method or multiple?
2. **Instantiation cost**: Expensive to construct?
3. **Class type**: Controller, service, middleware, listener?

### Decision Tree
`+` Dependency needed by a class
`+--` Used in multiple methods?
    `+--` Yes -> Constructor injection (inject once)
    `+--` No -> Is this a controller action?
        `+--` Yes -> Method injection (action-specific)
        `+--` No -> Is this a service/repository?
            `+--` Yes -> Constructor injection (always)
            `+--` No -> Is this a listener/job handle()?
                `+--` Yes -> Method injection (runtime resolution)
                `+--` No -> Constructor injection

### Rationale
Constructor injection is for shared dependencies. Method injection is for single-use dependencies. Services and repositories always use constructor injection. Controllers use both. Listeners and job handle() methods use method injection for runtime-resolved dependencies.

### Default
Constructor for shared deps. Method for single-use deps. Follow class-type conventions.

### Risks
- Constructor injection for single-use dep = unnecessary instantiation cost.
- Method injection for shared dep = repetitive type-hints across methods.
- Service locator in constructor (app()) = hidden dependencies, untestable.

### Related Rules/Skills
- Skill: Constructor Injection

---

## D03: Over-Injection Detection

### Decision Context
A constructor has 7+ parameters. What action should be taken?

### Criteria
1. **Parameter count**: How many dependencies does the constructor take?
2. **Domain cohesion**: Do the dependencies belong to different domains?
3. **Grouping**: Can related dependencies be grouped into objects?

### Decision Tree
`+` Constructor with 7+ parameters
`+--` Do deps come from different domains?
    `+--` Yes -> Split class by domain (SRP violation)
    `+--` No -> Can deps be grouped into a facade service?
        `+--` Yes -> Create facade service, inject it instead
        `+--` No -> Can some deps use method injection?
            `+--` Yes -> Move single-use deps to method params
            `+--` No -> Refactor the class

### Rationale
A constructor with 7+ parameters is a strong SRP violation signal. Each dependency represents a distinct responsibility. Split the class, introduce a facade service, or move single-use deps to method injection.

### Default
Split the class. If SRP is not violated, introduce a facade service.

### Risks
- Parameter bag object = hides the real dependency count.
- Over-splitting = class explosion.
- Moving to method injection = shifting the problem to method signatures.

### Related Rules/Skills
- Skill: Over-Injection Anti-Pattern
