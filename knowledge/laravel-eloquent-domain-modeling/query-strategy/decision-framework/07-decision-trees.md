# Decision Trees: Decision Framework

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Decision Framework |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Eloquent vs Query Builder selection | Primary |
| 2 | toBase() optimization timing | Architecture |
| 3 | Hybrid strategy adoption | Architecture |

---

## Decision 1: Eloquent vs Query Builder Selection

### Context
Every database operation sits on a spectrum from full Eloquent ORM to raw SQL. Eloquent provides model features but adds overhead. Query Builder is minimal and fast. The right choice depends on the operation's need for model features.

### Criteria
- Are model events (creating, created, updating, saved) needed?
- Are relationships (eager/lazy loading) required?
- Are global scopes (soft deletes, multi-tenant) required?
- Is the operation a read or write?
- What is the expected result set size?

### Decision Tree
```
Is this a write operation (create, update, delete)?
├── YES → Use Eloquent
│   └── Are model events needed?
│       ├── YES → Eloquent is required (QB bypasses events)
│       └── NO → Consider QB for bulk operations (> 1000 rows)
└── NO (read operation)
    └── Are relationships, scopes, or accessors needed?
        ├── YES → Use Eloquent
        │   └── Is the result set > 1000 rows?
        │       ├── YES → Consider toBase() after building chain
        │       └── NO → Standard Eloquent
        └── NO → Use Query Builder or toBase()
            └── Is soft-delete or tenant scoping needed?
                ├── YES → Use toBase() (QB bypasses Eloquent scopes)
                └── NO → Pure QB (DB::table()) is fine
```

### Rationale
Eloquent is the correct default for all operations. The optimization path is: Eloquent → `toBase()` → Query Builder → Raw SQL. Each step trades features for performance. Never jump straight to QB without profiling data. The 80/20 rule applies: 80% of operations benefit from Eloquent features; 20% of hot paths may need QB.

### Recommended Default
Eloquent for all operations. Profile first before switching to QB. Document any QB usage with the performance justification.

### Risks
- QB for writes: losing model events (logging, cache invalidation, auditing)
- QB for soft-deletable models: bypassing `deleted_at` filter
- Over-optimization: switching to QB before profiling confirms it's a bottleneck
- Mixed approaches: Eloquent for SELECT, QB for UPDATE on the same model — inconsistent behavior

### Related Rules/Skills
- Eloquent Default Convention (05-rules.md)
- Profile Before Optimizing (05-rules.md)
- Document QB Decisions (05-rules.md)

---

## Decision 2: toBase() Optimization Timing

### Context
`toBase()` is the first optimization step when Eloquent hydration is confirmed as a bottleneck. It preserves Eloquent's builder API while returning `stdClass` results. The decision is whether the optimization is worth the loss of model features.

### Criteria
- Is hydration confirmed as a bottleneck via profiling?
- How many rows are being returned?
- Are accessors, casts, or model methods needed on the results?
- Are eager-loaded relationships required?

### Decision Tree
```
Has profiling confirmed hydration as a bottleneck?
├── YES
│   └── Is the result set > 100 rows?
│       ├── YES → Use toBase() (savings are measurable)
│       └── NO → Don't bother (savings on 100 rows = ~0.5ms)
└── NO
    └── Are global scopes correctly applied with toBase()?
        ├── YES → Use toBase() for large result sets preemptively
        └── NO → Verify scope timing first (some scopes apply at execution time)
```

### Rationale
Hydration overhead is 2-5µs per model. For 100 rows, that's 0.2-0.5ms — invisible to users. For 10k rows, it's 20-50ms — significant. Never use `toBase()` without profiling confirmation or a clear understanding that model features are unnecessary.

### Recommended Default
Use `toBase()` when profiling confirms hydration overhead > 10ms per request or when working with result sets > 1000 rows where model features are not needed.

### Risks
- `toBase()` loses `with()`: eager loads must be converted to joins/subqueries
- `toBase()` may skip late-applying global scopes: verify with `toSql()`
- `toBase()` shared reference: modifying the returned QB affects the original Eloquent builder
- `toBase()` for single rows: unnecessary complexity for 2-5µs savings

### Related Rules/Skills
- Profile Before Optimizing (05-rules.md)
- toBase() at End of Chain (05-rules.md)
- Replace with() Before toBase() (05-rules.md)

---

## Decision 3: Hybrid Strategy Adoption

### Context
Hybrid strategies combine Eloquent and Query Builder features — using Eloquent's expressive API for query construction with QB's raw performance for execution. This is appropriate for complex read paths that need partial Eloquent features.

### Criteria
- Does the query benefit from Eloquent scopes but not from hydration?
- Can eager loads be replaced with explicit joins?
- Is the query complex enough to warrant the hybrid approach?
- Is the data path read-only (query, not mutation)?

### Decision Tree
```
Is the query complex (multiple scopes, constraints, filtering)?
├── YES
│   └── Are model features (accessors, events, casts) needed?
│       ├── YES → Pure Eloquent
│       └── NO → Hybrid: Eloquent scopes + toBase() or QB features
│           └── Can eager loads be converted to explicit joins?
│               ├── YES → Proceed with hybrid
│               └── NO → Pure Eloquent (keep with() functionality)
└── NO (simple query, 1-2 constraints)
    └── Pure Eloquent or pure QB — hybrid adds unnecessary complexity
```

### Rationale
Hybrid strategies are for complex queries that benefit from Eloquent's fluent API but don't need per-row model features. The complexity of maintaining hybrid patterns is only justified when both complexity AND performance matter. Simple queries don't benefit from the hybrid overhead.

### Recommended Default
Reserve hybrid strategies for complex read-model queries in reporting, dashboards, and exports. Use pure Eloquent for standard CRUD and simple queries.

### Risks
- Hybrid sprawl: scattered `toBase()` calls across controllers instead of query objects
- Lost eager loads: using `with()` then `toBase()` without converting to joins
- Global scope timing: some scopes may not apply correctly with `toBase()`
- Testing complexity: hybrid paths need SQL-level and data-shape verification

### Related Rules/Skills
- Encapsulate Hybrid in Query Objects (05-rules.md)
- toBase() as Primary Hybrid Tool (05-rules.md)
- Verify Scopes with toBase() (05-rules.md)
