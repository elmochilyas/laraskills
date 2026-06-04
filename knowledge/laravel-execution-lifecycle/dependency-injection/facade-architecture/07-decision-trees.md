# Decision Trees — Facade Architecture

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Facade Architecture |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Facade vs Constructor Injection | Whether to use a facade or constructor injection for accessing a service | Every service access | High |
| D02 | Standard Facade vs Real-Time Facade | Whether to create a custom facade class or use a real-time facade | Every new facade | Medium |
| D03 | Facade Faking Strategy | What testing strategy to use when testing code that uses facades | Every test with facades | Medium |

---

## D01: Facade vs Constructor Injection

### Decision Context
You need to access a service. Should you use a facade (static proxy) or constructor injection?

### Criteria
1. **Class location**: Controller, service, repository, or view?
2. **Usage frequency**: Used once or across multiple methods?
3. **Testability requirement**: How critical is isolated testing?
4. **Context**: Is constructor injection available (Blade/route closures)?

### Decision Tree
`+` Service access needed
`+--` Is this in a Blade template or route closure?
    `+--` Yes -> Facade is acceptable (constructor injection not available)
    `+--` No -> Is this in a controller?
        `+--` Yes -> Is the service used across multiple actions?
            `+--` Yes -> Constructor injection (shared dep, avoid repetition)
            `+--` No -> Either is acceptable (facade for convenience, injection for explicitness)
        `+--` No -> Is this in a service, repository, or business logic class?
            `+--` Yes -> ALWAYS use constructor injection (facades hide deps)
            `+--` No -> Depends on context

### Rationale
Facades are acceptable in controllers, views, and route files where convenience outweighs strict DI. In business logic (services, repositories), constructor injection is mandatory because facades hide dependencies, making code harder to test and reason about. Facades are never acceptable in domain services.

### Default
Constructor injection in business logic. Facades acceptable in controllers, views, and routes.

### Risks
- Facade in domain service = hidden dependency, hard to test.
- Facade in Octane = static cache persists across requests.
- Not clearing facade state between tests = test pollution.

### Related Rules/Skills
- Skill: Facade Architecture

---

## D02: Standard Facade vs Real-Time Facade

### Decision Context
You want to use a facade for a class. Should you create a custom facade class or use a real-time facade?

### Criteria
1. **Usage frequency**: How often is the facade used across the codebase?
2. **Class ownership**: Is the class yours or third-party?
3. **Testing pattern**: Do you need shouldReceive() support?
4. **Documentation**: Would a dedicated facade class aid discoverability?

### Decision Tree
`+` Facade needed for a service
`+--` Is the service used across many classes (>5)?
    `+--` Yes -> Create a standard facade class (discoverable, reusable)
    `+--` No -> Is it a third-party service used in 1-2 places?
        `+--` Yes -> Use real-time facade (Facades\Class::method() - no custom class needed)
        `+--` No -> Is constructor injection available?
            `+--` Yes -> Use constructor injection instead of facade
            `+--` No -> Real-time facade is fine

### Rationale
Standard facades provide a named, discoverable static proxy with full shouldReceive() support. Real-time facades (Facades\ClassName) are convenient for one-off usage without creating a facade class. The tradeoff is discoverability and slightly more overhead (autoloader interception).

### Default
Standard facade for widely-used services. Real-time facade for one-off usage.

### Risks
- Custom facade for a service used once = unnecessary class.
- Real-time facade for widely-used service = inconsistent access pattern.
- Real-time facade autoloader overhead on every call.

### Related Rules/Skills
- Skill: Facade Architecture

---

## D03: Facade Faking Strategy

### Decision Context
Code under test uses facades. How should you mock/fake the facade in tests?

### Criteria
1. **Mocking library**: Is Mockery available?
2. **Assertion needs**: Do you need to verify how the facade was called?
3. **Return value**: Does the facade method return a value used by the code?
4. **State isolation**: Are facade resolved instances cleared between tests?

### Decision Tree
`+` Testing code that uses facades
`+--` Do you need to assert HOW the facade was called?
    `+--` Yes -> Use shouldReceive() (Mockery expectations)
        `+--` Returns a value? -> shouldReceive()->once()->andReturn($value)
        `+--` Throws exception? -> shouldReceive()->once()->andThrow($e)
    `+--` No -> Do you need to REPLACE the underlying service?
        `+--` Yes -> Use swap($instance) to replace the resolved instance
        `+--` No -> Use shouldReceive()->zeroOrMoreTimes() with return value
`+--` Have you cleared facade state between tests?
    `+--` Yes -> Good (Facade::clearResolvedInstance() in setUp)
    `+--` No -> Add clearance to prevent test pollution

### Rationale
Facade::shouldReceive() creates a Mockery mock and swaps the facade root. It provides assertion capabilities (called once, with specific args). Facade::swap() simply replaces the underlying instance without assertions. Always clear resolved instances between tests to prevent static state leakage.

### Default
Use shouldReceive() when assertions needed. Use swap() for simple replacement. Always clear state in setUp.

### Risks
- Not clearing facade state = mock from previous test affects current test.
- Using real service instead of fake = integration test timing, side effects.
- shouldReceive() without return value = facade method returns null.

### Related Rules/Skills
- Skill: Facade Architecture
