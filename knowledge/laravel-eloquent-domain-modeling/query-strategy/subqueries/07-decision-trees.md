# Decision Trees: Subqueries

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Subqueries |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Subquery vs join vs withCount() selection | Primary |
| 2 | Scalar subquery safety (limit 1) | Architecture |
| 3 | Subquery binding and closure safety | Architecture |

---

## Decision 1: Subquery vs Join vs withCount() Selection

### Context
Subqueries, JOINs, and `withCount()` all retrieve related data. Subqueries avoid row multiplication. JOINs can be faster for large datasets. `withCount()` is a specialized subquery for simple aggregates.

### Criteria
- Do you need columns from the related table or just aggregates?
- Is the result set large (> 1000 rows)?
- Is the related table indexed on the join column?
- Is row multiplication from JOINs acceptable?

### Decision Tree
```
Do you need columns from the related table in the result?
├── YES → Use JOIN
│   └── Does the JOIN cause row multiplication?
│       ├── YES → Add GROUP BY or use DISTINCT
│       └── NO → Direct JOIN is optimal
└── NO (aggregate, existence check, or single value)
    └── What type of related data is needed?
        ├── Simple count → Use withCount() (built-in, efficient)
        ├── Existence check → Use whereHas() or whereExists()
        ├── Single value per row (latest post, max) → Subquery in addSelect()
        │   └── MUST add ->take(1) to prevent multi-row error
        └── Complex aggregation → JOIN with GROUP BY
            └── Test with EXPLAIN to compare performance
```

### Rationale
`withCount()` is the simplest and most readable for counts. Subqueries in `addSelect()` provide single related values (latest post date) without row multiplication. JOINs are better when you need related columns or the dataset is large. Test with production-scale data — subquery vs JOIN performance varies by database and data volume.

### Recommended Default
`withCount()` for relationship counts. `addSelect()` with subquery for scalar values per row. JOIN for related columns or large aggregations. Always test with `EXPLAIN`.

### Risks
- Missing `->take(1)` on scalar subquery: runtime SQL error on multi-row return
- Subquery where JOIN would be faster: correlated subquery executes per outer row
- `withCount()` on deeply nested relation: suboptimal SQL for complex aggregates
- JOIN without GROUP BY: row duplication, incorrect results

### Related Rules/Skills
- Scalar Subquery Safety (05-rules.md)
- Subquery vs JOIN Profiling (05-rules.md)
- withCount() Preference (05-rules.md)

---

## Decision 2: Scalar Subquery Safety (limit 1)

### Context
A scalar subquery in SELECT must return exactly one row. Without `->take(1)`, a parent with multiple related records causes a fatal SQL error. This error often doesn't surface in development with sparse data.

### Criteria
- Is the subquery in `addSelect()` or `selectSub()`?
- Does the related table have a one-to-many relationship with the parent?
- Is `->take(1)` applied with ordering?
- Could development data have fewer related records than production?

### Decision Tree
```
Is the subquery in SELECT (addSelect or selectSub)?
├── YES → MUST add ->take(1) with ordering
│   └── Is the subquery based on a one-to-many relationship?
│       ├── YES (Post has many Comments) → CRITICAL
│       │   └── Add ->latest() or ->orderBy() with ->take(1)
│       └── NO (one-to-one relationship) → Still add ->take(1) defensively
└── NO → Subquery in WHERE or FROM — multi-row is allowed
    └── EXCEPTION: scalar comparison (=) — MUST be single row
```

### Rationale
`Post::addSelect(['last_comment' => Comment::select('body')->whereColumn('post_id', 'posts.id')])` fails when any post has >1 comment. The error appears in production as data accumulates. `->latest()->take(1)` guarantees a deterministic single row. This is a non-negotiable safety rule for all scalar subqueries.

### Recommended Default
Always append `->latest()->take(1)` or `->orderBy()->take(1)` to every scalar subquery in SELECT.

### Risks
- Missing `->take(1)`: "Subquery returns more than 1 row" — runtime crash
- `->take(1)` without ordering: non-deterministic which row is returned
- Hash/join order assumption: developer thinks "only one comment" but data proves otherwise
- Late-appearing error: development with 0-1 related records masks the bug

### Related Rules/Skills
- Scalar Subquery Safety (05-rules.md)
- Subquery Naming and Aliasing (05-rules.md)
- Correlated Subquery Structure (05-rules.md)

---

## Decision 3: Subquery Binding and Closure Safety

### Context
Closure-based subqueries use automatic parameter binding. Raw SQL subqueries require manual binding management and risk SQL injection.

### Criteria
- Is the subquery built with closures or raw `DB::raw()`?
- Are user-supplied values used inside the subquery?
- Is the subquery correlated (references outer query)?
- Is `whereColumn` used for correlation?

### Decision Tree
```
Is the subquery built with closures or raw string?
├── Closure → Automatic binding management (safe)
│   └── Is the subquery correlated?
│       ├── YES → Use whereColumn() to reference outer query
│       └── NO → Standard closure subquery
└── Raw string (DB::raw("(SELECT ...)"))
    └── Are user-supplied values interpolated into the string?
        ├── YES → CRITICAL: Use ? placeholders instead
        └── NO → Raw is acceptable for static SQL
```

### Rationale
Closure-based subqueries (`fn($q) => $q->select(...)->whereColumn(...)`) automatically manage bindings — safe from SQL injection. Raw strings with string interpolation are vulnerable. `whereColumn()` correctly correlates the subquery to the outer query without hard-coding table aliases.

### Recommended Default
Always use closure syntax for subqueries. Use `whereColumn()` for correlation. Never interpolate user input into subquery strings.

### Risks
- Raw subquery with string interpolation: SQL injection
- Missing `whereColumn`: subquery returns same value for all rows
- Binding order mismatch: mixing subquery bindings with parent query bindings incorrectly
- `DB::raw()` in subquery without `?` placeholders: injection vulnerability

### Related Rules/Skills
- Closure Subquery Safety (05-rules.md)
- Binding Management (05-rules.md)
- No Raw Interpolation (05-rules.md)
