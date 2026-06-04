# Decision Trees: To Base Pattern

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | To Base Pattern |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | toBase() usage decision | Primary |
| 2 | toBase() positioning in the chain | Architecture |
| 3 | Eager loading replacement for toBase() | Architecture |

---

## Decision 1: toBase() Usage Decision

### Context
`toBase()` preserves Eloquent's query construction but returns `stdClass` instead of models. It eliminates hydration overhead (2-5µs/row, 2-4KB/row) while keeping Eloquent's builder API. The decision is whether the savings justify losing model features.

### Criteria
- Is hydration a confirmed bottleneck (profiling data)?
- How many rows are being returned?
- Are accessors, casts, or model methods needed?
- Are eager-loaded relationships required?

### Decision Tree
```
Is the result set > 100 rows?
├── YES
│   └── Are model features needed (accessors, casts, events, relationships)?
│       ├── NO → Use toBase() — significant savings
│       └── YES
│           └── Is hydration confirmed as a bottleneck via profiling?
│               ├── YES → Use toBase() + manual handling
│               └── NO → Keep Eloquent (model features > minor savings)
└── NO (< 100 rows)
    └── Don't use toBase() — savings are negligible (~0.5ms for 100 rows)
        └── Readability and model features are more important
```

### Rationale
Hydration overhead at small scale is invisible — 100 models cost ~0.5ms. At 10k rows it's ~50ms. Never use `toBase()` without profiling data confirming hydration is the bottleneck. The default should be Eloquent; `toBase()` is an optimization, not an alternative API.

### Recommended Default
Eloquent by default. `toBase()` only when profiling confirms hydration overhead > 10ms per request or result sets exceed 1000 rows with no model features needed.

### Risks
- `toBase()` for small datasets: optimization effort wasted on non-bottleneck
- `toBase()` with `with()`: eager loading silently dropped
- `toBase()` with scope timing issues: some global scopes may not apply correctly
- `stdClass` returned when callers expect models: runtime errors on method calls

### Related Rules/Skills
- Profile Before toBase() (05-rules.md)
- toBase() at End of Chain (05-rules.md)
- Document toBase() Decisions (05-rules.md)

---

## Decision 2: toBase() Positioning in the Chain

### Context
`toBase()` must be called at the end of the chain, after all Eloquent-specific constraints. Calling it too early loses constraints applied after it.

### Criteria
- Are all Eloquent constraints (scopes, `whereHas`, etc.) applied before `toBase()`?
- Is the chain ordering correct — scopes before `toBase()`?
- Are global scopes applied before `toBase()` is called?
- Is the chain using `with()` (which `toBase()` drops)?

### Decision Tree
```
Is toBase() called at the end of the chain?
├── YES
│   └── Are all Eloquent constraints applied before it?
│       ├── YES → Correct — toBase() preserves all prior constraints
│       └── NO → Reorder: all Eloquent constraints first, toBase() last
└── NO (called mid-chain)
    └── MUST move to end — constraints after toBase() are lost
```

### Rationale
`toBase()` returns the underlying Query Builder. All constraints applied before it are preserved (they modify the shared Query Builder instance). Constraints applied after it are on the Query Builder — they still work but lose Eloquent-specific features like relationship constraints.

### Recommended Default
Call `toBase()` as the last method before the terminal method (`get()`, `first()`, etc.). All scopes, constraints, and Eloquent features must be applied before `toBase()`.

### Risks
- `with()` before `toBase()`: eager loading silently dropped
- `toBase()` before `get()`: works fine (QB has `get()` too)
- `toBase()` before scope that uses Eloquent features: scope may not apply correctly
- Double `get()`: `toBase()->get()` returns results, calling `->get()` again returns empty collection

### Related Rules/Skills
- toBase() at End of Chain (05-rules.md)
- Replace with() Before toBase() (05-rules.md)
- Verify Scopes with toBase() (05-rules.md)

---

## Decision 3: Eager Loading Replacement for toBase()

### Context
`toBase()` does NOT preserve `with()` calls. Any eager loading must be converted to explicit JOINs or subqueries. This is the most common mistake when adopting `toBase()`.

### Criteria
- Are there `with()` calls before `toBase()`?
- Can the eager loads be converted to JOINs?
- Is `load()` needed after the query for conditional hydration?
- Is the relationship data essential for the query results?

### Decision Tree
```
Are there with() calls before toBase()?
├── YES
│   └── Are the eager-loaded relations needed in the output?
│       ├── YES → Convert with() to explicit JOINs or subqueries
│       │   └── Is the relationship a single related row (latest post)?
│       │       ├── YES → Subquery in addSelect() (scalar)
│       │       └── NO (collection) → JOIN with select columns
│       └── NO (with() was unnecessary) → Remove with() calls
└── NO → No change needed — proceed with toBase()
```

### Rationale
`with()` is an Eloquent feature that hydrates relations in separate queries. `toBase()` returns `stdClass` — no hydration, no relations. To include related data, add JOINs to the query or use subqueries in `addSelect()`. This is the main complexity cost of using `toBase()`.

### Recommended Default
Remove unnecessary `with()` calls. Convert essential ones to JOINs or subqueries. If many relationships are needed, consider whether `toBase()` is worth the conversion cost.

### Risks
- `with()` silently dropped: related data missing from results without error
- Wrong JOIN type (inner vs left): parent rows excluded when no related data exists
- JOIN without disambiguation: ambiguous column names in results
- Subquery in select without `take(1)`: multi-row SQL error

### Related Rules/Skills
- Replace with() Before toBase() (05-rules.md)
- Join vs Subquery Decision (05-rules.md)
- Column Disambiguation (05-rules.md)
