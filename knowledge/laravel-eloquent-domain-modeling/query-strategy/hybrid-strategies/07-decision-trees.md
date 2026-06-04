# Decision Trees: Hybrid Strategies

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Hybrid Strategies |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Hybrid strategy necessity | Primary |
| 2 | toBase() vs raw QB for hybrid | Architecture |
| 3 | Hybrid pattern encapsulation | Architecture |

---

## Decision 1: Hybrid Strategy Necessity

### Context
Hybrid strategies use Eloquent for query construction and Query Builder for execution. They add complexity. The necessity depends on whether the performance gain justifies the maintenance cost.

### Criteria
- Is hydration profiling-confirmed as a bottleneck?
- Is the result set large (> 1000 rows)?
- Are Eloquent scopes/constraints needed for the query?
- Are eager-loaded relationships essential?

### Decision Tree
```
Is hydration a confirmed bottleneck (profiling data)?
├── YES
│   └── Are Eloquent scopes or builder features needed?
│       ├── YES → Hybrid strategy is appropriate
│       │   └── Are eager-loaded relationships essential?
│       │       ├── YES → Convert with() to explicit joins/subqueries
│       │       └── NO → toBase() is straightforward
│       └── NO → Use pure Query Builder (simpler)
└── NO
    └── Don't use hybrid — complexity not justified
        └── Is there another reason (scope reuse, migration path)?
            ├── YES → Consider but document the reasoning
            └── NO → Stick with pure Eloquent
```

### Rationale
Hybrid strategies exist on the optimization spectrum between pure Eloquent and pure QB. They add complexity (replacing `with()`, verifying scope timing, testing SQL output). Only justified when profiling confirms hydration is a bottleneck AND Eloquent scopes are valuable. For simple large queries, pure QB is clearer.

### Recommended Default
Do NOT use hybrid without profiling confirmation. When needed, `toBase()` is the simplest hybrid pattern. Encapsulate in query objects. Document the performance justification.

### Risks
- Hybrid without profiling: optimization effort wasted on non-bottleneck
- Lost eager loads: `with()` doesn't survive `toBase()` — silent missing data
- Scope timing issues: global scopes may not apply as expected with `toBase()`
- Hybrid sprawl: scattered hybrid patterns across codebase instead of centralized

### Related Rules/Skills
- Profile Before Hybrid (05-rules.md)
- toBase() as Primary Hybrid (05-rules.md)
- Document Hybrid Decisions (05-rules.md)

---

## Decision 2: toBase() vs Raw QB for Hybrid

### Context
`toBase()` preserves Eloquent's query construction while returning `stdClass` results. Raw `DB::table()` is a complete departure from Eloquent. The choice depends on how much of Eloquent's API is needed.

### Criteria
- Are Eloquent scopes, `whereHas`, or relationship methods needed?
- Are global scopes required?
- Is the query complex (multiple scopes, constraints)?
- Is the query a simple SELECT from one table?

### Decision Tree
```
Are Eloquent scopes (global or local), whereHas, or relationship methods needed?
├── YES
│   └── Use toBase() at the end of the chain
│       └── Are global scopes correctly applied?
│           ├── YES → Proceed with toBase()
│           └── NO → Verify scope timing; apply manually if needed
└── NO (simple SELECT, no Eloquent features needed)
    └── Use DB::table() directly (simpler)
        └── Is this on a model with soft deletes?
            ├── YES → Add ->whereNull('deleted_at') manually
            └── NO → Proceed
```

### Rationale
`toBase()` is the bridge — all Eloquent constraints applied before it are preserved, but results come back as `stdClass`. Use `toBase()` when you need Eloquent's constraint-building API. Use `DB::table()` when the query is simple enough that Eloquent features don't add value.

### Recommended Default
`toBase()` when Eloquent scopes or constraints are valuable. `DB::table()` for simple single-table queries. Never use `toBase()` when eager loads (`with()`) are essential — convert to joins first.

### Risks
- `toBase()` too early: scopes applied after `toBase()` are lost
- `toBase()` with `with()`: eager loading silently dropped
- `DB::table()` on soft-deletable model: `deleted_at` filter bypassed
- `DB::table()` on multi-tenant model: tenant isolation bypassed

### Related Rules/Skills
- toBase() at End of Chain (05-rules.md)
- Manual Scopes for DB::table() (05-rules.md)
- Replace with() Before toBase() (05-rules.md)

---

## Decision 3: Hybrid Pattern Encapsulation

### Context
Hybrid patterns scattered across controllers create maintenance burden. Encapsulating in query objects or repository methods centralizes the hybrid logic and makes the optimization decision explicit.

### Criteria
- Is the hybrid pattern used in multiple places?
- Is the hybrid pattern inline in a controller?
- Is the hybrid pattern testable in isolation?
- Could the underlying optimization change (e.g., switching from `toBase()` to `DB::table()`)?

### Decision Tree
```
Is the hybrid pattern used in more than one place?
├── YES → Encapsulate in query object or repository method
│   └── Is the query complex?
│       ├── YES → Query object (dedicated class, testable)
│       └── NO → Repository method (lighter, still encapsulated)
└── NO (single use)
    └── Inline hybrid in controller is acceptable
        └── Is the performance justification documented?
            ├── YES → Proceed
            └── NO → Add comment explaining why hybrid was chosen
```

### Rationale
Hybrid patterns are optimization decisions that may change as the application evolves. Encapsulated in a query object, the implementation can switch from `toBase()` to `DB::table()` (or back) without affecting callers. Inline hybrid in a controller couples the optimization to the presentation layer.

### Recommended Default
Always encapsulate hybrid patterns in query objects or repository methods. Inline should be the exception, documented with the performance justification.

### Risks
- Hybrid sprawl: 20 different `toBase()` patterns across codebase
- Query object without testing: SQL output and data shape unverified
- Repository method hides hybrid behavior: caller unaware results are `stdClass`
- Optimization assumption stale: hybrid no longer needed but remains undocumented

### Related Rules/Skills
- Query Object Encapsulation (05-rules.md)
- Repository Pattern (05-rules.md)
- Test Hybrid Queries (05-rules.md)
