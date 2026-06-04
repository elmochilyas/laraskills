# Decision Trees — Contextual Binding

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-05: Contextual Binding |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Contextual Binding vs Global Binding | Whether to use a contextual binding or change the global binding for an interface | When consumers need different implementations | High |
| D02 | Contextual Binding vs Factory Pattern | Whether to use contextual binding or a factory class to resolve different implementations | Architecture decision | High |
| D03 | Primitive Contextual Binding Need | Whether a primitive constructor parameter needs contextual binding | Every primitive in constructors | Medium |

---

## D01: Contextual Binding vs Global Binding

### Decision Context
Different consumers of the same interface need different implementations. Should you use contextual bindings or change the global binding?

### Criteria
1. **Consumer count**: How many consumers need the non-default implementation?
2. **Default majority**: Do most consumers use the same implementation?
3. **Override nature**: Is this a permanent architectural need or a temporary override?

### Decision Tree
```
Multiple consumers of the same interface need different implementations
├── Is there a clear "standard" implementation used by most consumers?
│   ├── Yes → Register the standard as global bind(), use contextual for exceptions
│   └── No (split roughly evenly) → Do you have <3 consumers?
│       ├── Yes → Use contextual binding for all consumers (explicit, no global default)
│       └── No (3+ consumers with different needs) → Consider if the architecture needs redesign:
│           ├── Interfaces are too broad — split the interface per concern
│           └── Different consumers genuinely need different implementations
│               └── Use contextual binding for each consumer
```

### Rationale
Contextual bindings override global bindings for specific consumers. The pattern is: set a sensible global default, then override for consumers that need something different. This keeps the codebase predictable — most code gets the standard implementation, and exceptions are explicitly documented where they occur.

### Default
Global `bind()` for the standard implementation. Contextual bindings for the exceptions.

### Risks
- No global default = every consumer must have a contextual binding (brittle — new consumers silently get nothing).
- Contextual binding sprawl (50+ rules) = architecture may need simplification.
- Contextual binding in `boot()` after consumer already resolved = no effect.

### Related Rules/Skills
- Skill: Contextual Binding

---

## D02: Contextual Binding vs Factory Pattern

### Decision Context
You need to provide different implementations of an interface based on which consumer is requesting it. You can use contextual binding or a factory class.

### Criteria
1. **Selection criteria**: Is the implementation choice based on the consumer class (compile-time known) or runtime data?
2. **Number of consumers**: How many different consumers need different implementations?
3. **Complexity**: Is the selection logic simple (one consumer → one impl) or complex (multi-condition)?

### Decision Tree
```
Need to provide different implementations based on context
├── Is the implementation choice determined by the consumer class (known at compile time)?
│   ├── Yes → Is the selection simple (consumer A → impl X, consumer B → impl Y)?
│   │   ├── Yes → Use contextual binding (clean, declarative, no factory class needed)
│   │   └── No (complex multi-condition logic) → Use factory pattern (more flexible)
│   └── No (determined by runtime data — request, user role, config)?
│       ├── Yes → Use factory pattern (contextual binding cannot handle runtime conditions)
│       └── No → (not reachable)
```

### Rationale
Contextual binding replaces the simplest factory cases: "Consumer A gets Implementation X, Consumer B gets Implementation Y." It is cleaner than a factory because it's declarative — no `if/else` chains. However, contextual binding cannot handle runtime conditions (request data, user roles, feature flags). For runtime-dependent selection, a factory or middleware-based resolution is required.

### Default
Contextual binding for compile-time known consumer-specific choices. Factory for runtime-dependent choices.

### Risks
- Contextual binding for runtime-dependent choices = wrong implementation selected.
- Factory pattern for simple consumer-specific choices = unnecessary boilerplate.
- Using `give()` with Closure that captures request data = subtle bugs (Closure runs during resolution, may be cached).

### Related Rules/Skills
- Skill: Contextual Binding

---

## D03: Primitive Contextual Binding Need

### Decision Context
A constructor takes a primitive parameter (string, int, array). Should you use primitive contextual binding (`needs('$paramName')`) or another approach?

### Criteria
1. **Value source**: Is the value a config constant, a service-specific setting, or a runtime value?
2. **Consumer specificity**: Does each consumer need a different value for this primitive?
3. **Default value**: Does the parameter have a sensible default?

### Decision Tree
```
Primitive constructor parameter needs a value
├── Is the value the same for all consumers of this class?
│   ├── Yes → Use global binding with a Closure factory that provides the value
│   └── No → Do different consumers need different values?
│       ├── Yes → Use primitive contextual binding: needs('$apiKey')->give(config('...'))
│       └── No → (not reachable — all consumers same value = global binding)
├── Does the parameter have a default value already?
│   ├── Yes → Does the default work for all consumers?
│   │   ├── Yes → No binding needed
│   │   └── No → Use primitive contextual binding for consumers that need different values
│   └── No → Use primitive contextual binding or explicit binding with factory
```

### Rationale
Primitive contextual binding (`$app->when(Consumer::class)->needs('$apiKey')->give('value')`) is the cleanest way to provide different primitive values to different consumers. It avoids injecting the entire config array and avoids conditional logic inside the consumer. For values that are the same across all consumers, a global binding with a factory closure is simpler.

### Default
Primitive contextual binding for consumer-specific values. Global factory binding for shared values.

### Risks
- Forgetting the `$` prefix in `needs('$paramName')` = binding silently ignored.
- Primitive contextual binding for runtime values = value locked at registration time.
- Overriding a default value unnecessarily = hiding the default from future maintainers.

### Related Rules/Skills
- Skill: Contextual Binding
