# Decision Trees: Local Scopes

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Local Scopes |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Local scope vs inline where() selection | Primary |
| 2 | Scope naming convention | Architecture |
| 3 | Scope return value and termination | Architecture |

---

## Decision 1: Local Scope vs Inline where() Selection

### Context
Local scopes encapsulate reusable query constraints. Inline `where()` is direct. Scopes add abstraction; inline is simpler. The choice depends on reusability and domain expressiveness.

### Criteria
- Is the constraint used in multiple places (controllers, jobs, tests)?
- Does the constraint represent a domain concept?
- Is the constraint complex (multi-WHERE, whereHas, subquery)?
- Is this a one-off filter for a single controller?

### Decision Tree
```
Is the constraint used in more than one place?
├── YES → Create a local scope
│   └── Is the constraint simple (single WHERE)?
│       ├── YES → Simple scope (one line)
│       └── NO → Scope with documentation
└── NO (single use)
    └── Inline where() is acceptable
        └── Might it be reused in the future?
            ├── YES → Create scope proactively (low cost)
            └── NO → Inline is fine
```

### Rationale
Scopes prevent duplication of query logic. When the same `where('status', 'published')->where('published_at', '<=', now())` appears in 5 places, a `published()` scope ensures consistency — changes to the definition of "published" update in one place. For one-off filters, the abstraction overhead is not justified.

### Recommended Default
Create a scope when the pattern appears in 2+ places or expresses a meaningful domain concept. Inline for truly one-off technical filters.

### Risks
- Scope for every WHERE: over-abstraction, 20+ scopes on a model
- No scope for repeated logic: definition of "published" duplicated across codebase
- Scope with side effects: logging, caching inside scope methods
- Scope that accepts too many parameters: hidden complexity

### Related Rules/Skills
- Single Constraint per Scope (05-rules.md)
- No Side Effects in Scopes (05-rules.md)
- Parameter Limits (05-rules.md)

---

## Decision 2: Scope Naming Convention

### Context
Scope names should read as business language. Technical names like `whereActive` expose column names and operators. Domain names like `active()` express intent.

### Criteria
- Does the name use business terminology?
- Is the name understandable without reading the implementation?
- Does the name collide with a core Builder method?
- Does the name follow team conventions?

### Decision Tree
```
Does the name express business intent?
├── YES (domain term: active, verified, published, recent)
│   └── Does the name collide with a core Builder method?
│       ├── YES → Rename to avoid collision (e.g., isActive vs where)
│       └── NO → Good scope name
└── NO (technical: whereActive, whereStatusPublished)
    └── Rename to domain term
        └── What is the business concept?
            ├── State → active, suspended, archived
            ├── Time → recent, outdated, expired
            ├── Relationship → ownedBy, assignedTo
            └── Quality → verified, trusted, featured
```

### Rationale
`User::active()->verified()->recentlyJoined()` reads like a business specification. `User::where('active', true)->whereNotNull('email_verified_at')->where('created_at', '>=', now()->subDays(7))` is a technical description. Scopes bridge the gap between technical constraints and business language.

### Recommended Default
Domain vocabulary for all scope names. Technical column-based names only for scopes that are truly mechanical (e.g., `ofType()` for column-type filtering).

### Risks
- Column-based naming: `whereStatusPublished()` instead of `published()`
- Conflicting names: `where()` is a Builder method, not a scope name
- Inconsistent across models: `active()` means different things on different models
- Names too vague: `filter()` doesn't communicate what the scope does

### Related Rules/Skills
- Domain Vocabulary Naming (05-rules.md)
- Core Method Name Collision (05-rules.md)
- Consistent Scope Language (05-rules.md)

---

## Decision 3: Scope Return Value and Termination

### Context
Scopes must return the builder for fluent chaining. Forgetting the return or calling a terminal method inside a scope breaks the chain.

### Criteria
- Does the scope return the builder (`$query` or `$this`)?
- Does the scope call a terminal method (`get`, `first`, `count`)?
- Does the scope modify a builder from outer scope?
- Does the scope have side effects?

### Decision Tree
```
Does the scope return the builder?
├── YES
│   └── Does the scope call a terminal method (get, first, count)?
│       ├── YES → MUST refactor — scopes should not terminate
│       │   └── Move terminal call to the caller
│       └── NO → Correct
└── NO (forgets return)
    └── MUST add return — constraint silently does nothing
```

### Rationale
A scope that calls `->get()` terminates the query — subsequent scopes in the chain will fail. Scopes should ONLY add constraints. Terminal methods belong at the end of the full chain. Forgetting the return is the most common scope bug — the constraint is silently ignored.

### Recommended Default
Always `return $query` from scope methods. Never call terminal methods inside scopes. Use explicit `: Builder|static` return type hints.

### Risks
- Missing return: constraint silently skipped, no error
- Terminal inside scope: subsequent chain fails with "call to a member function on non-object"
- Side effects: scope calls external API, performed on every query
- Builder from outer scope modified: subtle cross-query contamination

### Related Rules/Skills
- Return Builder from Scopes (05-rules.md)
- No Terminal Methods in Scopes (05-rules.md)
- Scope Testing (05-rules.md)
