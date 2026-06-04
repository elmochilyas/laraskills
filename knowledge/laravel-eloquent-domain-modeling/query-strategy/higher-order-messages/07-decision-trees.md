# Decision Trees: Higher Order Messages

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Higher Order Messages |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | each() vs map() vs filter() selection | Primary |
| 2 | HOM memory safety | Architecture |
| 3 | N+1 prevention in HOM callbacks | Architecture |

---

## Decision 1: each() vs map() vs filter() Selection

### Context
HOMs on the builder provide collection-like iteration without calling `get()` explicitly. `each()` uses `cursor()` for memory efficiency. `map()` and `filter()` call `get()` and load all results into memory. The choice depends on whether side effects or transformations are needed.

### Criteria
- Are you performing side effects (updates, emails, logging) or data transformations?
- Is the result set large (> 1000 rows)?
- Does the pipeline continue after the HOM (chaining more methods)?
- Is the result set small enough to fit in memory?

### Decision Tree
```
Is the goal side effects or data transformation?
├── Side effects (send email, update record, log)
│   └── Use each() — returns void, uses cursor() for memory safety
│       └── Is the result set > 1000 rows?
│           ├── YES → each() is ideal (memory-safe streaming)
│           └── NO → each() still fine (slightly more overhead but safe)
└── Data transformation (map, filter, reduce)
    └── Is the result set > 1000 rows?
        ├── YES → Do NOT use HOMs — use cursor() with manual loop
        │   └── map() and filter() call get() internally — OOM risk
        └── NO → Use map() or filter() HOMs (convenient, within memory)
```

### Rationale
`each()` is backed by `cursor()` — memory-efficient generator iteration. `map()` and `filter()` call `get()` and load everything into memory. Using `map()` on 100k rows will exhaust PHP memory. The choice is straightforward: side effects = `each()`, transformations on small sets = `map()`/`filter()`.

### Recommended Default
`each()` for side effects on any size dataset. `map()`/`filter()` only for small result sets (< 1000 rows). For large transformations, use `cursor()` with manual collection.

### Risks
- `map()` on large dataset: memory exhaustion, OOM kill
- `filter()` that could be a WHERE clause: unnecessary PHP-side filtering
- `each()` returns void: expected collection for further chaining — not possible
- `each()` using `cursor()`: connection held for iteration duration

### Related Rules/Skills
- HOM Memory Boundaries (05-rules.md)
- each() for Side Effects (05-rules.md)
- SQL Filter Before HOM Filter (05-rules.md)

---

## Decision 2: HOM Memory Safety

### Context
`map()` and `filter()` load all results into memory. `each()` uses `cursor()` and is memory-safe. Understanding the memory implications of each HOM is critical for preventing OOM.

### Criteria
- How many rows will the query return?
- Is the dataset size known and bounded?
- Is the PHP memory limit sufficient for the full dataset?
- Is memory safety more important than convenience?

### Decision Tree
```
Is the result set size known and bounded?
├── YES
│   └── Estimated memory < 50% of PHP memory_limit?
│       ├── YES → Any HOM is safe
│       └── NO → Use each() or cursor() only
└── NO (unbounded or unknown)
    └── Always use each() or cursor()-based patterns
        └── Is the dataset potentially millions of rows?
            ├── YES → Use cursor() with manual iteration, not HOMs
            └── NO → each() is sufficient
```

### Rationale
PHP memory limits are typically 128MB-512MB. A 10k-row result set with 20 columns and 3 relationships can use 100-200MB when fully loaded. `map()` and `filter()` materialize the entire dataset in memory. For unknown-sized datasets, defaulting to `each()`/`cursor()` is the safe choice.

### Recommended Default
Use `each()` for anything that could exceed memory. Use `map()`/`filter()` only for known-small result sets (< 1000 rows) or when memory limit is verified.

### Risks
- Unknown dataset size: `map()` on production data exhausted memory
- Relationship eager loading with HOM: `with('posts.comments')` before `map()` adds significant per-row memory
- HOM chain to `toArray()`: HOM already loaded results, `toArray()` doubles memory
- `each()` still uses per-row memory for model hydration: 2-4KB per model

### Related Rules/Skills
- HOM Memory Boundaries (05-rules.md)
- Dataset Size Estimation (05-rules.md)
- each() for Large Sets (05-rules.md)

---

## Decision 3: N+1 Prevention in HOM Callbacks

### Context
HOM callbacks that access relationships trigger lazy loads if the relationship isn't eager-loaded before the HOM. This is the most common HOM performance trap.

### Criteria
- Are relationships accessed inside the HOM callback?
- Are the relationships eager-loaded with `with()` before the HOM?
- Is the relationship access conditional (only for some rows)?
- Is the callback simple or complex?

### Decision Tree
```
Are relationships accessed inside the HOM callback?
├── YES
│   └── Is the relationship eager-loaded with with() before the HOM?
│       ├── YES → Safe (pre-loaded, one query per relation)
│       └── NO → N+1 risk — add with() before the HOM
│           └── Is the relationship accessed conditionally?
│               ├── YES → Consider load() with conditional logic
│               └── NO → Always add with()
└── NO (only scalar attributes accessed)
    └── No eager loading needed — proceed
```

### Rationale
`each(fn($user) => $user->posts->count())` without `with('posts')` triggers a query for every user — N+1. `with('posts')->each(...)` loads all posts in one query per chunk. The same applies to `map()`, `filter()`, and `tap()`. Always eager-load before HOMs when relationships are accessed.

### Recommended Default
Always add `with()` before HOM chain for any relationship accessed inside the callback. Use `load()` for conditionally-needed relationships.

### Risks
- Hidden N+1 in `each()`: relationship accessed in callback without `with()`
- `filter()` accessing relationship: N+1 for every filtered row — worst case filters check many rows
- Lazy loading from nested HOMs: HOM inside HOM without eager loading
- `with()` before `each()` for unused relations: wasted queries

### Related Rules/Skills
- Eager Load Before HOMs (05-rules.md)
- Relationship Access in Callbacks (05-rules.md)
- Conditional Loading with load() (05-rules.md)
