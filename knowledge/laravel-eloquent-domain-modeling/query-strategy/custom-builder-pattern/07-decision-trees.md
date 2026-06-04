# Decision Trees: Custom Builder Pattern

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Custom Builder Pattern |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Custom builder vs local scopes vs query object | Primary |
| 2 | Registration method (HasBuilder vs newEloquentBuilder) | Architecture |
| 3 | Builder method design and return types | Architecture |

---

## Decision 1: Custom Builder vs Local Scopes vs Query Object

### Context
Custom builders, local scopes, and query objects all organize query logic. Scopes live on the model, custom builders provide a dedicated class, and query objects are standalone classes for complex multi-model queries.

### Criteria
- How many query methods does the model need?
- Are the methods simple WHERE constraints or complex compositions?
- Do the methods span multiple models?
- Is IDE support and type safety important?

### Decision Tree
```
How many custom query methods does the model need?
├── 0-2 → Inline where() or simple local scopes on model
├── 3-5 → Local scopes on model (sufficient for most cases)
├── 5-10 → Custom builder
│   └── Do methods span multiple models?
│       ├── YES → Query object pattern instead
│       └── NO → Custom builder with HasBuilder trait
└── 10+ → Custom builder + query objects for complex cases
    └── Are there shared patterns across different models?
        ├── YES → Extract to trait used by multiple custom builders
        └── NO → Per-model custom builders
```

### Rationale
Custom builders provide organization, IDE autocompletion, and testability for models with rich query APIs. Local scopes are sufficient for 3-5 simple methods. Query objects handle cross-model scenarios. The threshold is subjective, but 5+ methods that clutter the model class is a reasonable trigger.

### Recommended Default
Local scopes for models with < 5 simple constraints. Custom builder for models with 5+ methods or domain-specific query vocabularies. Query objects for multi-model or very complex queries.

### Risks
- Custom builder for every model: unnecessary complexity for simple models
- Scopes on model past 15 methods: model class becomes cluttered
- Query object without builder: loses fluent chaining from the model
- Forgetting to register the custom builder: methods defined but never used

### Related Rules/Skills
- HasBuilder Trait Registration (05-rules.md)
- Builder Method Return Types (05-rules.md)
- Builder Structure Guidelines (05-rules.md)

---

## Decision 2: Registration Method (HasBuilder vs newEloquentBuilder)

### Context
Laravel 10+ provides the `HasBuilder` trait for declarative custom builder registration. Pre-Laravel 10 requires overriding `newEloquentBuilder()`. The choice depends on Laravel version and whether the builder constructor needs custom arguments.

### Criteria
- Is the application on Laravel 10+?
- Does the builder need constructor injection of services?
- Is the builder instantiation pattern straightforward?

### Decision Tree
```
Is the application on Laravel 10+?
├── YES
│   └── Does the builder need custom constructor arguments?
│       ├── YES → Use newEloquentBuilder() override (custom instantiation)
│       └── NO → Use HasBuilder trait with static $builder property
└── NO (Laravel < 10)
    └── Use newEloquentBuilder() override
        └── Return the custom builder instance
```

### Rationale
`HasBuilder` with `$builder` property is declarative and simpler — no override method to write. `newEloquentBuilder()` provides more control for builders that need dependency injection (e.g., tenant resolver injected into the builder). Both work correctly; `HasBuilder` is preferred for simplicity.

### Recommended Default
`HasBuilder` trait with `protected static string $builder = CustomBuilder::class` for Laravel 10+. Fall back to `newEloquentBuilder()` for pre-Laravel 10 or when constructor injection is needed.

### Risks
- Forgetting to register: builder methods are never available
- Wrong class extended: must extend `Illuminate\Database\Eloquent\Builder`, not Query Builder
- Missing `@mixin` annotation on model: no IDE autocompletion for builder methods
- Constructor injection without registration: builder instantiated with incorrect dependencies

### Related Rules/Skills
- HasBuilder vs newEloquentBuilder (05-rules.md)
- Builder Class Extension (05-rules.md)
- @mixin Annotation for IDE (05-rules.md)

---

## Decision 3: Builder Method Design and Return Types

### Context
Custom builder methods must return `$this` (or `static`) for fluent chaining. Wrong return types break the chain. Methods should be focused on a single constraint and avoid side effects.

### Criteria
- Does the method return the builder for chaining?
- Does the method accept parameters?
- Does the method perform business logic or just query construction?
- Is the method testable independently?

### Decision Tree
```
Does the method modify the query (add WHERE, JOIN, ORDER BY)?
├── YES
│   └── Return type: static
│       └── Does the method accept parameters?
│           ├── YES → Validate parameters at the method boundary
│           └── NO → Simple constraint method
└── NO (returns data, not builder)
    └── Does the method execute a query?
        ├── YES → Return Collection, Model, or scalar (not static)
        └── NO → This method doesn't belong in the builder — extract elsewhere
```

### Rationale
Builder methods should be query construction only — no business logic, no side effects, no external calls. Failing to return `static` breaks the chain and forces callers to use separate statements. Methods that execute queries (e.g., `findActive()`) should return the query result, not the builder.

### Recommended Default
All constraint methods return `static`. Use explicit `: static` return type hint for IDE support and type safety. Never return `void` or omit the return.

### Risks
- `void` return from constraint method: chain breaks, silent error
- Business logic in builder: side effects on every query construction
- Stateful builder: mutable properties persist across separate queries
- Method names that shadow core builder methods: confusion and unexpected behavior

### Related Rules/Skills
- Builder Method Return Types (05-rules.md)
- Builder Method Naming (05-rules.md)
- Side Effect Prevention in Builders (05-rules.md)
