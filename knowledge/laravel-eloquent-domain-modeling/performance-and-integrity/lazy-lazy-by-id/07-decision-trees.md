# Decision Trees: lazy / lazyById

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | lazy-lazy-by-id |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | lazy() vs lazyById() selection | Primary |
| 2 | With() eager loading before lazy() | Architecture |
| 3 | Chunk size optimization | Architecture |

---

## Decision 1: lazy() vs lazyById() Selection

### Context
`lazy()` uses offset-based pagination (like `chunk()`) and has the same offset-drift problem under concurrent mutations. `lazyById()` uses key-based pagination (like `chunkById()`) and is stable under mutation. The wrong choice causes skipped or duplicate rows.

### Criteria
- Is the dataset actively being written to during iteration?
- Is the callback performing mutations (updates, deletes, inserts)?
- Is the dataset proven read-only and static?
- Does the table have a monotonically incrementing key?

### Decision Tree
```
Is the dataset mutated during iteration?
├── YES (deletions, insertions, updates)
│   └── Use lazyById()
│       └── Is the primary key auto-increment?
│           ├── YES → Use lazyById($count) (defaults to PK)
│           └── NO → Pass explicit $column and $alias to lazyById()
└── NO (read-only, static data)
    └── Is concurrent mutation guaranteed absent?
        ├── YES → Use lazy() (simpler, no key requirement)
        └── NO → Use lazyById() (defensive default)
```

### Rationale
Same offset-drift problem as `chunk()`: when rows are deleted during `lazy()` iteration, the offset shifts and rows are skipped. `lazyById()` paginates by key (`WHERE id > ?`) and is unaffected by insertions/deletions before the cursor. Since production datasets are rarely truly static, `lazyById()` is the safer default.

### Recommended Default
`lazyById()` for any batch processing on live tables. `lazy()` only for read-only exports on static datasets.

### Risks
- `lazyById()` on non-unique key: infinite loop or skipped rows
- `lazyById()` with custom `orderBy()`: breaks key-based pagination
- `lazy()` with concurrent writes: silent data corruption
- Iterating LazyCollection twice: generator rewind error

### Related Rules/Skills
- Use lazyById for Concurrent Scenarios by Default (05-rules.md)
- Never Materialize the LazyCollection (05-rules.md)
- Size Chunks According to Model Complexity (05-rules.md)
- Prevent N+1 with Proactive Eager Loading Strategies (06-skills.md)

---

## Decision 2: with() Eager Loading Before lazy()

### Context
Unlike `cursor()`, `lazy()` respects eager loading. Without `with()` before `lazy()`, relationship access inside the loop triggers N+1 queries — one per model per relation. With `with()`, relationships load in one query per chunk per relation.

### Criteria
- Are relationships accessed inside the iteration loop?
- How many relationships are accessed per model?
- What is the chunk size?
- Could the relationships be loaded conditionally?

### Decision Tree
```
Are relationships accessed inside the loop?
├── YES
│   └── Chain with('relation1', 'relation2') before lazy()
│       └── How many relationships are accessed?
│           ├── 1-2 → with() before lazy() is sufficient
│           ├── 3-5 → Consider loadCount() for aggregates instead of full relations
│           └── 6+ → Profile: eager loading many relations adds queries per chunk
└── NO (only scalar columns accessed)
    └── Do NOT add with() — unnecessary queries per chunk
```

### Rationale
`lazy()` fetches models in chunks and eager loads relations per chunk. Without `with()`, `$user->profile` inside the loop triggers a separate query for each of the chunk's models — 100 queries for a 100-model chunk. With `with('profile')`, one query loads all profiles for the chunk — 1 query instead of 100.

### Recommended Default
Always add `with()` before `lazy()` for any relationship accessed in the loop. Use `loadCount()` instead of full relation loading when only aggregates are needed.

### Risks
- Eager loading relations that are never accessed: wasted queries per chunk
- Forgetting to add `with()`: N+1 within each chunk, 100x query explosion
- Deeply nested eager loading: N relations = N+1 queries per chunk (1 parent + N relation queries)

### Related Rules/Skills
- Use with() Before lazy() for Relationships (05-rules.md)
- Never Materialize the LazyCollection (05-rules.md)
- Use loadMissing in Accessors (05-rules.md)

---

## Decision 3: Chunk Size Optimization

### Context
Chunk size determines memory-per-chunk vs query-count tradeoff. Heavy models with many relations need smaller chunks to stay within memory limits. Simple models can use larger chunks for fewer queries.

### Criteria
- How many columns does the model have?
- How many relations are eager-loaded?
- What is the PHP memory limit?
- How many total rows are being processed?

### Decision Tree
```
Are models simple (few columns, no eager loading)?
├── YES
│   └── Chunk size 1000-2000
└── NO (many columns, eager-loaded relations)
    └── How many relations are loaded?
        ├── 1-2 → Chunk size 500
        ├── 3-5 → Chunk size 200
        └── 5+ → Chunk size 100
            └── Is the PHP memory limit < 128MB?
                ├── YES → Reduce chunk size further (50-100)
                └── NO → Current size should be fine
```

### Rationale
Each chunk holds hydrated Eloquent models plus their eager-loaded relations in memory. A chunk of 1000 simple models uses ~1-2 MB. A chunk of 500 models with 5 eager-loaded relations each having 10+ columns can use 50+ MB. Tune chunk size so peak memory stays within 50% of the PHP memory limit to leave room for other operations.

### Recommended Default
1000 for simple models, 100-500 for models with eager-loaded relations. Tune based on actual memory profiling.

### Risks
- Too large: PHP memory limit exceeded, job killed mid-batch
- Too small: thousands of queries, slow processing, connection pool pressure
- Eager loading memory not accounted for: chunk of 500 models with 5 relations each consumes far more memory than expected

### Related Rules/Skills
- Size Chunks According to Model Complexity (05-rules.md)
- Use with() Before lazy() for Relationships (05-rules.md)
- Implement Select Constraints for Efficient Data Retrieval (06-skills.md)
