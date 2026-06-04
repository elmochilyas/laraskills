# Decision Trees: Performance Tradeoffs

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Performance Tradeoffs |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Optimization priority (N+1 vs hydration) | Primary |
| 2 | Batch processing method for large datasets | Architecture |
| 3 | Eager loading strategy | Architecture |

---

## Decision 1: Optimization Priority (N+1 vs Hydration)

### Context
N+1 queries and hydration overhead are two different Eloquent performance problems. N+1 adds entire queries (often 100+). Hydration adds microseconds per row. Fixing N+1 is almost always the higher priority.

### Criteria
- Is lazy loading occurring in loops?
- Is the result set large (> 1000 rows)?
- Is hydration overhead confirmed via profiling?
- Is this a read path or a write path?

### Decision Tree
```
Is there lazy loading (N+1) occurring?
├── YES
│   └── Fix N+1 FIRST (add with(), use loadMissing(), chunkById())
│       └── Is N+1 resolved?
│           ├── YES → Now profile hydration if result set is > 1000 rows
│           └── NO → Continue fixing N+1 — optimize the right problem
└── NO (no lazy loading)
    └── Is the result set > 1000 rows?
        ├── YES → Profile hydration overhead
        │   └── Is hydration confirmed as bottleneck?
        │       ├── YES → Optimize with toBase() or select()
        │       └── NO → Look for other bottlenecks (indexing, queries)
        └── NO → No optimization needed (performance is fine)
```

### Rationale
N+1 on 100 items adds 101 queries — each taking 1-10ms. That's 100-1000ms of database time. Hydration overhead for 100 rows is ~0.5ms. N+1 is ALWAYS the bigger problem. Fixing N+1 before optimizing hydration provides 100-1000x more benefit. Profile before optimizing — never guess about performance bottlenecks.

### Recommended Default
Fix N+1 first. Then profile. Optimize hydration with `toBase()` only if confirmed as a bottleneck. Never optimize hydration before fixing N+1.

### Risks
- Optimizing hydration before N+1: 99% of the problem remains
- Guessing about bottlenecks: optimization effort wasted on non-issues
- Premature `toBase()`: loses model features for negligible gain on small sets
- Ignoring profiling: optimization decisions based on intuition, not data

### Related Rules/Skills
- N+1 First Priority (05-rules.md)
- Profile Before Optimizing (05-rules.md)
- preventLazyLoading in Development (05-rules.md)

---

## Decision 2: Batch Processing Method for Large Datasets

### Context
For result sets that exceed memory limits, batch processing methods prevent memory exhaustion. The choice between `chunk()`, `chunkById()`, `lazy()`, `lazyById()`, and `cursor()` depends on mutation safety, relationship needs, and memory profile.

### Criteria
- Is the dataset being mutated during iteration?
- Are eager-loaded relationships needed?
- Is minimum memory usage critical?
- Is the operation in a web request or CLI/queue?

### Decision Tree
```
Is the dataset being mutated during iteration?
├── YES → Use chunkById() or lazyById() (key-based pagination)
│   └── Are eager-loaded relationships needed?
│       ├── YES → lazyById() with with()
│       └── NO → chunkById() (simpler callback API)
└── NO
    └── Are eager-loaded relationships needed?
        ├── YES → lazy() with with()
        └── NO
            └── Is minimum memory critical?
                ├── YES → cursor() (single query, one row at a time)
                └── NO → chunk() or lazy() (simpler, good balance)
```

### Rationale
`chunk()` and `lazy()` use offset pagination — mutations during iteration cause offset drift. `chunkById()` and `lazyById()` are mutation-safe. `cursor()` streams one row at a time but can't eager load. `lazy()` supports eager loading with chunked queries. Match the method to the tradeoffs.

### Recommended Default
`lazyById()` for mutation-safe batch processing with relationships. `lazy()` with `with()` for read-only batch processing needing relationships. `cursor()` for relationship-free streaming. `chunkById()` for simple mutation-safe callbacks.

### Risks
- `chunk()` with mutations: offset drift, skipped/duplicate rows
- `cursor()` with `with()`: eager loading silently ignored, N+1
- `cursor()` in web request: connection pool starvation
- `get()` on 10k+ rows: memory exhaustion

### Related Rules/Skills
- chunk vs chunkById Decision (05-rules.md)
- lazy vs lazyById Decision (05-rules.md)
- cursor Usage Context (05-rules.md)

---

## Decision 3: Eager Loading Strategy

### Context
Eager loading adds queries per relation but prevents N+1. Over-eager loading loads relations that are never used. The optimal strategy depends on whether the relation is always, sometimes, or rarely needed.

### Criteria
- Is the relationship accessed on every row or conditionally?
- How many relationships are accessed?
- Is the dataset large (> 100 rows)?
- Can the relationship be loaded conditionally?

### Decision Tree
```
Is the relationship accessed on every row in the result set?
├── YES → Always with() — one query per relation regardless of row count
│   └── How many relationships are accessed?
│       ├── 1-2 → Simple with()
│       ├── 3-5 → Acceptable if all are needed
│       └── 6+ → Review if all are necessary
└── NO (conditional access, 5-50% of rows)
    └── Use load() after get() — only query when needed
        └── Is the condition predictable?
            ├── YES → load() with condition
            └── NO → lazy loading is acceptable (bounded by condition rate)
```

### Rationale
`with('posts')` on 50 users loads all posts for all users in ONE query — regardless of how many users have posts. `load('posts')` after `get()` adds a separate query but only when needed. For relationships needed on every row, `with()` is optimal. For conditional access, `load()` avoids the query when not needed.

### Recommended Default
`with()` for relationships needed on > 80% of results. `load()` for relationships needed on < 50% of results. Avoid lazy loading (`$user->posts`) unless the access is truly rare and unpredictable.

### Risks
- `with()` on rarely-used relations: wasted query on every request
- Lazy loading in loop: N+1 (the most common Eloquent bug)
- `load()` called multiple times: redundant queries
- `loadMissing()` not used: queries even when relation is already loaded

### Related Rules/Skills
- Always Eager-Load in Controllers (05-rules.md)
- Use loadMissing in Accessors (05-rules.md)
- Prefer Explicit with() Over $with (05-rules.md)
