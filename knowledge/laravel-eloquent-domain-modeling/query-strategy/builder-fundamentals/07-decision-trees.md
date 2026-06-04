# Decision Trees: Builder Fundamentals

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Builder Fundamentals |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Eloquent Builder vs Query Builder selection | Primary |
| 2 | Builder chain structure and termination | Architecture |
| 3 | Batch processing method selection | Architecture |

---

## Decision 1: Eloquent Builder vs Query Builder Selection

### Context
Eloquent Builder (model-backed) and Query Builder (direct SQL) serve different needs. Eloquent provides hydration, relationships, scopes, and events. Query Builder is raw and fast. The wrong choice leads to unnecessary overhead or missing features.

### Criteria
- Are model hydration, events, or relationships needed?
- Is the operation read-only or write?
- Are global scopes or soft deletes required?
- What is the expected result set size?

### Decision Tree
```
Are model features needed (events, relationships, accessors, casts)?
├── YES
│   └── Use Eloquent Builder
│       └── Is the result set > 1000 rows?
│           ├── YES → Consider toBase() after building the chain
│           └── NO → Standard Eloquent is fine
└── NO
    └── Use Query Builder (DB::table())
        └── Is there a need for Eloquent scopes/constraints?
            ├── YES → Use toBase() on Eloquent builder instead
            └── NO → Pure Query Builder is simpler
```

### Rationale
Eloquent Builder adds 2-5µs per row for hydration and 2-4KB memory per model. For < 100 rows this is negligible. For 10k+ rows, it matters. `toBase()` bridges the gap — keep Eloquent builder syntax but skip hydration. Query Builder should be reserved for truly model-free operations.

### Recommended Default
Eloquent Builder for all model queries. Use `toBase()` for read-heavy paths with large result sets. Use Query Builder only for operations that truly don't involve models.

### Risks
- Eloquent for bulk operations: memory exhaustion from hydration
- Query Builder for soft-deletable models: bypasses `deleted_at` filter
- Eloquent without termination: builder object returned instead of results
- Builder reuse across queries: accumulated constraints produce wrong SQL

### Related Rules/Skills
- Builder Chaining Conventions (05-rules.md)
- Terminal Method Discipline (05-rules.md)
- Builder Reuse Prevention (05-rules.md)

---

## Decision 2: Builder Chain Structure and Termination

### Context
A builder chain must end with a terminal method to execute the query. Without it, the query never runs and the caller receives a Builder object. Chains longer than 20+ methods should be refactored.

### Criteria
- Does the chain end with a terminal method (`get`, `first`, `paginate`, `count`)?
- Is the chain longer than 15-20 methods?
- Are there conditional constraints that complicate readability?
- Is the same query pattern reused in multiple places?

### Decision Tree
```
Does the chain end with a terminal method?
├── YES
│   └── Is the chain longer than 15-20 methods?
│       ├── YES → Extract to scopes, custom builder methods, or query objects
│       └── NO → Proceed with inline chain
└── NO → MUST add a terminal method
    └── What result is expected?
        ├── Collection → get()
        ├── Single model → first() or find()
        ├── Paginated → paginate()
        ├── Count → count()
        └── Single value → value('column')
```

### Rationale
Long builder chains are hard to read, test, and maintain. Extracting logical groups to scopes or custom builder methods keeps chains short and expressive. A chain of 20+ `where()` calls with `when()` blocks is a code smell — the query logic should be encapsulated.

### Recommended Default
Keep chains under 15 methods. Extract reusable constraint groups to local scopes. Extract complex multi-constraint logic to custom builder methods or query objects.

### Risks
- Missing terminal method: silent bug — query never executes
- Over-refactoring: scattering simple queries across too many files
- Builder stored and reused: state from previous query leaks into next
- Raw string constraints: bypass parameterized bindings

### Related Rules/Skills
- Terminal Method Discipline (05-rules.md)
- Scope Organization (05-rules.md)
- Builder Reuse Prevention (05-rules.md)

---

## Decision 3: Batch Processing Method Selection

### Context
For result sets that exceed memory limits, batch processing methods (`chunk`, `chunkById`, `cursor`, `lazy`) prevent memory exhaustion. Each has different characteristics for mutation safety, eager loading, and memory profile.

### Criteria
- How many rows are being processed?
- Are mutations happening during iteration?
- Are eager-loaded relationships needed?
- Is this a CLI/queue or web request context?

### Decision Tree
```
Is the result set > 1000 rows?
├── YES
│   └── Are mutations happening during iteration?
│       ├── YES → Use chunkById() or lazyById()
│       └── NO
│           └── Are eager-loaded relationships needed?
│               ├── YES → Use lazy() with with()
│               └── NO
│                   └── Is absolute minimum memory required?
│                       ├── YES → Use cursor()
│                       └── NO → Use chunk() or lazy()
└── NO → Use get() (standard fetch)
```

### Rationale
`chunk()` and `lazy()` batch queries in pages (default 100-1000). `chunkById()`/`lazyById()` use key-based pagination for mutation safety. `cursor()` streams one row at a time but can't eager-load. Choose based on the tradeoffs: memory, mutation safety, and relationship needs.

### Recommended Default
`lazyById()` for batch processing with mutations. `lazy()` with `with()` for read-only processing needing relationships. `cursor()` for relationship-free streaming exports.

### Risks
- `get()` on 100k rows: memory exhaustion
- `chunk()` with mutations: offset drift skips rows
- `cursor()` without eager loading: N+1 inside loop
- `cursor()` in web request: connection pool starvation

### Related Rules/Skills
- Chunk vs ChunkById Decision (05-rules.md)
- Cursor Usage Patterns (05-rules.md)
- Lazy Collection Best Practices (05-rules.md)
