# Decision Trees: Global Scopes

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Global Scopes |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Global scope vs local scope selection | Primary |
| 2 | Scope registration method | Architecture |
| 3 | Global scope complexity and performance | Architecture |

---

## Decision 1: Global Scope vs Local Scope Selection

### Context
Global scopes apply automatically to every query. Local scopes require explicit invocation. The wrong choice makes scopes invisible (global that shouldn't be) or easy to miss (local that should always apply).

### Criteria
- Should the constraint ALWAYS apply to every query on this model?
- Is this a cross-cutting concern (multi-tenant, soft delete, published only)?
- Will the scope require frequent suppression?
- Does the scope enforce a security boundary?

### Decision Tree
```
Should the constraint apply to EVERY query on this model?
├── YES (ALWAYS)
│   └── Is the constraint a cross-cutting concern?
│       ├── YES → Global scope (correct use)
│       │   └── Does the scope need frequent suppression?
│       │       ├── YES → Reconsider: frequent suppression means it shouldn't be global
│       │       └── NO → Proceed with global scope
│       └── NO → Consider if a local scope would be clearer
└── NO (opt-in, caller decides)
    └── Use local scope instead
        └── Is the scope used in most queries anyway?
            ├── YES → Evaluate if global would be more appropriate
            └── NO → Local scope is correct
```

### Rationale
Global scopes are invisible to calling code — developers may not know a constraint is applied. This makes them appropriate ONLY for cross-cutting concerns that should truly never be forgotten (multi-tenant isolation, mandatory published-only content for public users). If a scope is suppressed in 20%+ of queries, it shouldn't be global — convert to local scope.

### Recommended Default
Global scopes for security boundaries (tenant isolation) and universal filters (soft deletes). Local scopes for everything else. Review existing global scopes for suppression frequency.

### Risks
- Invisible filter: developer unaware of constraint, confused by missing results
- Frequent suppression: scope applied then removed in many queries — code smell
- Scope on wrong model: applying a constraint that should be on a related model
- Query Builder bypass: QB queries skip all global scopes — data leak risk for security scopes

### Related Rules/Skills
- Global Scope Documentation (05-rules.md)
- Local Scope Extraction (05-rules.md)
- Suppression Frequency Review (05-rules.md)

---

## Decision 2: Scope Registration Method

### Context
Global scopes can be registered via `booted()` (closure or class), `#[ScopedBy]` attribute (Laravel 11+), or trait-based auto-registration (like `SoftDeletes`). The method affects readability, suppressibility, and discoverability.

### Criteria
- Is the application on Laravel 11+ (supports `#[ScopedBy]`)?
- Is the scope simple (single WHERE) or complex (class with methods)?
- Is the scope tied to a trait?
- Does the scope need to be suppressible by class name?

### Decision Tree
```
Is the scope simple (single WHERE clause)?
├── YES
│   └── Is it tied to a reusable trait?
│       ├── YES → Register via trait boot method (like SoftDeletes)
│       └── NO → Use anonymous closure scope in booted()
└── NO (complex logic, multiple constraints, relationships)
    └── Is the application on Laravel 11+?
        ├── YES → Use #[ScopedBy(ScopeClass::class)] attribute
        └── NO → Register scope class in booted() with addGlobalScope()
```

### Rationale
Anonymous closure scopes are simple but cannot be suppressed by class name — they can only be suppressed by key or with `withoutGlobalScopes()`. Class-based scopes are suppressible by class name, which is more precise. The `#[ScopedBy]` attribute provides declarative registration at the class level, making scope association visible immediately when reading the model.

### Recommended Default
Anonymous closure scopes for simple, never-suppressed constraints. Class-based scopes for complex logic or suppressible scopes. `#[ScopedBy]` attribute for Laravel 11+ models. Trait-based registration for scopes that always accompany a trait.

### Risks
- Anonymous scope not suppressible by class name: must use key or blanket suppression
- `#[ScopedBy]` not recognized pre-Laravel 11: attribute silently ignored
- Forgetting registration: scope class defined but never applied
- Double registration: scope applied twice (in trait boot and booted()) — double constraint

### Related Rules/Skills
- ScopedBy Attribute Usage (05-rules.md)
- Closure vs Class Scopes (05-rules.md)
- Trait Registration Pattern (05-rules.md)

---

## Decision 3: Global Scope Complexity and Performance

### Context
Global scopes execute on every query for the model. Complex scopes with joins or subqueries add cost to every operation. The `apply()` method must be fast.

### Criteria
- Does the scope add a JOIN or subquery?
- Does the scope call external APIs or make database queries?
- Are the scope's WHERE columns indexed?
- Is the scope's performance measurable (EXPLAIN)?

### Decision Tree
```
Does the scope use JOINs, subqueries, or raw SQL?
├── YES
│   └── Is the cost justified for every query?
│       ├── YES → Ensure all WHERE columns are indexed
│       │   └── Profile with EXPLAIN — verify index usage
│       └── NO → Refactor scope to be simpler
│           └── Consider if the scope should be local instead
└── NO (simple WHERE clause)
    └── Ensure WHERE columns are indexed
        └── Verify with EXPLAIN on a typical query
```

### Rationale
A global scope with a JOIN executes that JOIN on every query — even simple counts. A scope that queries the database inside `apply()` adds a query to every query (N+1 at the scope level). Keep `apply()` to simple WHERE clauses on indexed columns. Complex logic should be local scopes that only apply when explicitly requested.

### Recommended Default
Simple WHERE clause on indexed column. No database queries inside `apply()`. Profile scope performance with `EXPLAIN`.

### Risks
- JOIN in global scope: every query pays the JOIN cost
- Database query in `apply()`: N+1 queries added to every operation
- Unindexed scope column: full table scan on every query
- Multiple global scopes compounding: several WHERE clauses + JOINs on every query

### Related Rules/Skills
- Scope Performance Review (05-rules.md)
- Index Scope Columns (05-rules.md)
- No Queries in apply() (05-rules.md)
