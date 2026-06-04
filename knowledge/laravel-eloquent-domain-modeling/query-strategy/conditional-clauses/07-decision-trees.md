# Decision Trees: Conditional Clauses

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Conditional Clauses |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | when() vs if/else selection | Primary |
| 2 | Condition value selection (filled vs has vs boolean) | Architecture |
| 3 | when() chain depth and extraction | Architecture |

---

## Decision 1: when() vs if/else Selection

### Context
`when()` and `unless()` enable conditional query composition within a fluent chain. The alternative is imperative if/else blocks that break the chain and scatter query logic across multiple statements.

### Criteria
- Is the condition part of a logical query chain?
- Is the condition based on request input, user state, or feature flags?
- Is a fallback/default constraint needed when condition is false?

### Decision Tree
```
Is the condition part of a fluent builder chain?
├── YES
│   └── Use when() for condition, unless() for negative condition
│       └── Is there a default/fallback constraint?
│           ├── YES → Use when(condition, ifTrue, ifFalse) with default closure
│           └── NO → Use when(condition, closure) with no default
└── NO (condition determines which completely different query to build)
    └── Use if/else blocks (different query structures, not just different filters)
```

### Rationale
`when()` keeps the builder chain contiguous — the condition is evaluated inline and the closure only executes when truthy. This produces cleaner, more readable code than breaking the chain with if blocks. The default closure (third argument) provides fallback behavior, replacing the else branch.

### Recommended Default
Use `when()` for conditional constraints within builder chains. Use if/else only when the condition fundamentally changes the query structure (different joins, different models).

### Risks
- Forgetting `return $q` in callback: constraint silently does nothing
- Side effects inside callbacks: logging, API calls in what should be query-only code
- Condition always true/false: unnecessary `when()` — just write the constraint directly
- Deeply nested `when()`: readability suffers beyond 2-3 levels

### Related Rules/Skills
- Explicit Return in when() Callbacks (05-rules.md)
- No Side Effects in when() (05-rules.md)
- when() Depth Limits (05-rules.md)

---

## Decision 2: Condition Value Selection

### Context
The condition passed to `when()` determines whether the closure executes. Common sources are request parameters, user state, and feature flags. The choice of condition function (`filled`, `has`, `boolean`) affects behavior for edge cases.

### Criteria
- Is the condition from a request parameter?
- Should empty strings be treated as "not provided"?
- Is the condition a boolean (user permission, feature flag)?
- Is the condition expensive to evaluate (database query, API call)?

### Decision Tree
```
Is the condition from a request input?
├── YES
│   └── Should empty strings, null, and whitespace-only skip the filter?
│       ├── YES → Use $request->filled('param') (rejects null, '', [], false)
│       └── NO → Use $request->has('param') (accepts empty strings)
└── NO (user state, feature flags, business logic)
    └── Is the condition expensive to evaluate?
        ├── YES → Pass a callable condition: when(fn() => expensiveCheck(), ...)
        └── NO → Pass the boolean directly: when($user->isAdmin(), ...)
```

### Rationale
`$request->filled()` rejects empty strings, null, and empty arrays — the right choice for most filter endpoints where an empty status field means "don't filter by status." `$request->has()` returns true even for empty strings, which is useful for boolean flags like `?include_inactive`. Callable conditions defer evaluation until `when()` is called, avoiding unnecessary work when the condition is never reached.

### Recommended Default
`$request->filled()` for most request-based filter conditions. Boolean values for user state conditions. Callable conditions for expensive checks.

### Risks
- `$request->has('status')` when status is `""`: filter applies with empty value
- Zero as condition: `when(0, ...)` is falsy — unexpected skip
- Empty array as condition: always truthy in PHP
- Expensive condition evaluated before `when()`: waste if `when()` condition is not reached

### Related Rules/Skills
- filled() vs has() in Filters (05-rules.md)
- Callable Conditions for Expensive Checks (05-rules.md)
- Edge Case Handling for Conditions (05-rules.md)

---

## Decision 3: when() Chain Depth and Extraction

### Context
Deeply nested `when()` chains reduce readability and make testing difficult. The decision point is when to extract conditional filter logic into separate methods.

### Criteria
- How many `when()` calls are in the chain?
- Is the same filter pattern used in multiple controllers?
- Does the filter logic span more than 3 lines?
- Is there a complex combination of conditions?

### Decision Tree
```
How many when() calls are in the chain?
├── 0-3 → Inline is fine
├── 4-6 → Consider extraction
│   └── Is the same pattern used elsewhere?
│       ├── YES → Extract to scope or query object method
│       └── NO → Inline is acceptable if < 5 lines each
└── 7+ → MUST extract
    └── What is the right abstraction?
        ├── Reusable filter → Local scope on model
        ├── Query composition → Custom builder method
        └── Complex multi-model → Query object class
```

### Rationale
A chain of 7+ `when()` calls is nearly impossible to read test. The conditions, closures, and fallbacks create a dense pyramid. Extracting groups of related filters to named methods makes the intent clear and enables independent testing.

### Recommended Default
Extract to local scopes when the same filter pattern appears in multiple controllers. Extract to query objects when the filter logic spans multiple models or has complex combinations.

### Risks
- Extracting too early: unnecessary abstraction for one-off filters
- Not extracting when needed: unreadable controller methods
- Scopes that accept too many parameters: hidden complexity
- Mixing filter logic with business logic in the same extraction

### Related Rules/Skills
- when() Depth Limits (05-rules.md)
- Scope Organization (05-rules.md)
- Query Object Pattern (05-rules.md)
