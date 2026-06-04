# Decision Trees: Select Constraints

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Select Constraints |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | select() usage strategy | Primary |
| 2 | List vs detail view select separation | Architecture |
| 3 | Partial model safety decision | Architecture |

---

## Decision 1: select() Usage Strategy

### Context
Every unnecessary column loaded from the database wastes I/O, memory, and network bandwidth. `select()` limits columns; `$hidden` controls serialization but does NOT reduce I/O. The decision is whether to use `select()`, `$hidden`, or both.

### Criteria
- Is this a list/index query or a detail query?
- Are there large columns (TEXT, BLOB, JSON) on the table?
- Are there sensitive columns that should never be loaded?
- Will the model be serialized to JSON/API response?

### Decision Tree
```
Is this a list/index query (multiple rows returned)?
├── YES → Use select() with minimal columns
│   └── Are there large columns (TEXT, BLOB, JSON)?
│       ├── YES → Explicitly exclude them from select()
│       └── NO → Select only displayable columns
└── NO (detail query, single model)
    └── Is this a write operation (will the model be saved)?
        ├── YES → Do NOT use select() — load full model
        └── NO → Use select() for needed columns
            └── Are there sensitive columns?
                ├── YES → Exclude them via select() (not just $hidden)
                └── NO → Select all needed columns
```

### Rationale
`select()` controls what is loaded from the database — it reduces I/O at the source. `$hidden` only filters serialization output; the data is still loaded into memory. For I/O reduction, `select()` is the only effective tool. For API response payload control, `$hidden` is appropriate. Both should be used together for comprehensive optimization.

### Recommended Default
`select()` for list queries. Full model loads for write operations. Both `select()` and `$hidden` for comprehensive I/O and serialization control. Never use `$hidden` as a substitute for `select()` when I/O reduction is the goal.

### Risks
- `select()` on model that is later saved: unloaded columns overwritten with null/default
- Missing foreign key in constrained select: relation matching fails silently
- `$hidden` instead of `select()` for large columns: data still loaded, no I/O benefit
- Selecting too few columns: missing data for display or computation

### Related Rules/Skills
- Never Save Partial Models (05-rules.md)
- Always Include the Foreign Key in Constrained Eager Loading (05-rules.md)
- Use $hidden for Serialization, select() for I/O Reduction (05-rules.md)

---

## Decision 2: List vs Detail View Select Separation

### Context
List views (multiple items) should use minimal columns for performance. Detail views (single item) can load all needed columns. Using the same select set for both wastes I/O on lists or misses data on details.

### Criteria
- Is the endpoint returning a list of items or a single item?
- What columns are needed for display in each view?
- Are there columns needed only in detail view (body, description, full content)?
- Is there a performance budget for the list endpoint?

### Decision Tree
```
Is this a list/index endpoint?
├── YES → Define separate minimal select list
│   └── What is the expected row count?
│       ├── < 100 → Minor I/O savings, but still use select()
│       ├── 100-1000 → Significant I/O reduction with select()
│       └── 1000+ → Critical to use select() — 75% I/O savings
└── NO (detail/show endpoint)
    └── Use full select or all needed columns
        └── Are there performance concerns even for single model?
            ├── YES (very large TEXT/BLOB columns) → Select() selectively
            └── NO → Full model load acceptable
```

### Rationale
A list endpoint returning 50 posts with 20 columns each transfers data for 1000 column values. With `select('id', 'title', 'summary', 'status')`, that drops to 200 column values — an 80% reduction. For detail endpoints, the savings are less significant since only one row is loaded, but large columns should still be conditionally selected.

### Recommended Default
Separate select lists: minimal for list (id, title, status), comprehensive for detail. Use query scopes or repository methods to maintain separate lists.

### Risks
- Same select set for both: lists too heavy or details missing data
- List view adds column without updating select: column not loaded, shows null
- Refactored list to detail (or vice versa): wrong select set applied
- `addSelect()` stacking: select lists grow unbounded over time

### Related Rules/Skills
- Use Different Select Sets for List vs. Detail Views (05-rules.md)
- Never Save Partial Models (05-rules.md)
- Use $hidden for Serialization, select() for I/O Reduction (05-rules.md)

---

## Decision 3: Partial Model Safety Decision

### Context
A model loaded with `select()` is a partial model — it has only a subset of columns. Saving a partial model overwrites unloaded columns with null/default values. The decision is whether a partial model is safe given the code path.

### Criteria
- Will the model be saved/modified after loading?
- Is the model used only for display?
- Are all non-nullable columns loaded?
- Is `preventAccessingMissingAttributes()` enabled?

### Decision Tree
```
Will the model be saved or modified after loading?
├── YES → Do NOT use select() for this query
│   └── Use fresh() to reload full model before save
│       └── Or use update() directly on the query builder
└── NO (display-only, export, serialization)
    └── Is the model serialized (toArray/toJson)?
        ├── YES → Ensure all serialized columns are in select()
        └── NO → select() is safe for display
            └── Is preventAccessingMissingAttributes() enabled?
                ├── YES → Accessing unloaded column throws — catches bugs
                └── NO → Missing columns return null silently — dangerous
```

### Rationale
Saving a partial model is the most dangerous select() mistake. A single `$post->save()` after `Post::select('id', 'title')->find($id)` and `$post->update(['title' => 'new'])` overwrites ALL unloaded columns with defaults, silently corrupting data. Partial models are safe ONLY for read operations.

### Recommended Default
Never save partial models. Always load full model before writes. Enable `preventAccessingMissingAttributes()` in development to catch accidental access to unloaded columns.

### Risks
- Partial model saved after select(): silent data corruption
- Unloaded column accessed in view: returns null without error
- Developer unaware of partial model: passes to service that updates it
- `preventAccessingMissingAttributes()` not enabled: bugs go undetected

### Related Rules/Skills
- Never Save Partial Models (05-rules.md)
- Use $hidden for Serialization, select() for I/O Reduction (05-rules.md)
- Enable shouldBeStrict in Development and CI (05-rules.md)
