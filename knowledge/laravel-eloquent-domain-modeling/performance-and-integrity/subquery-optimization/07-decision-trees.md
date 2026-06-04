# Decision Trees: Subquery Optimization

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Subquery Optimization |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Subquery type selection (whereHas vs whereIn vs JOIN) | Primary |
| 2 | Scalar subquery safety | Architecture |
| 3 | Subquery count and complexity management | Architecture |

---

## Decision 1: Subquery Type Selection (whereHas vs whereIn vs JOIN)

### Context
Subqueries in Eloquent can be expressed as `whereHas()` (correlated EXISTS), `whereIn()` with subquery (uncorrelated IN), or JOIN + GROUP BY. Each has different performance characteristics depending on data volume and indexing.

### Criteria
- How many rows does the outer query return?
- How many rows does the subquery return?
- Are the subquery WHERE columns indexed?
- Do you need columns from the related table in the result?

### Decision Tree
```
Do you need columns from the related table in the result?
├── YES → Use JOIN + GROUP BY or JOIN + DISTINCT
└── NO → Use subquery approach
    └── Is the subquery result set small (< 10k rows)?
        ├── YES → Use whereIn() with subquery (uncorrelated, single execution)
        │   └── Are the IDs manageable in memory?
        │       ├── YES → whereIn() is efficient — 1 query, reused
        │       └── NO → Use JOIN instead (avoids materializing large ID list)
        └── NO (subquery returns large result set or is selective)
            └── Use whereHas() (correlated EXISTS)
                └── Are the subquery WHERE columns indexed?
                    ├── YES → whereHas() is efficient — O(log n) per outer row
                    └── NO → MUST index first — O(n) full table scan per outer row
```

### Rationale
`whereIn()` with subquery executes once and reuses the result — best for small uncorrelated checks. `whereHas()` executes per outer row — best for selective checks with indexed WHERE columns. JOINs multiply rows and may need DISTINCT/GROUP BY but can be faster for large datasets. The key is matching the approach to the data volume and access pattern.

### Recommended Default
`whereHas()` with indexed subquery columns for selective existence checks. `whereIn()` with subquery for small uncorrelated result sets. JOIN + GROUP BY when related columns are needed.

### Risks
- `whereHas()` without index on subquery WHERE columns: full table scan per outer row — catastrophic
- `whereIn()` with subquery returning millions of rows: temporary table with memory exhaustion
- JOIN without DISTINCT/GROUP BY: row duplication, incorrect counts
- Using subquery when JOIN is appropriate: slower per-row execution

### Related Rules/Skills
- Always Index Subquery WHERE Columns (05-rules.md)
- Prefer Uncorrelated Subqueries When Possible (05-rules.md)
- Design Index-Aware Queries (06-skills.md)

---

## Decision 2: Scalar Subquery Safety

### Context
Scalar subqueries in `addSelect()` must return exactly one row per parent row. Without `->limit(1)`, a parent with multiple related records causes a runtime SQL error. This is a common production failure that doesn't appear in development with sparse data.

### Criteria
- Is the subquery in SELECT (scalar subquery via `addSelect()`)?
- Does the subquery return a single value per parent row?
- Is `->limit(1)` applied with explicit ordering?
- Could the related table have multiple rows per parent?

### Decision Tree
```
Is the subquery in SELECT (addSelect() with subquery)?
├── YES → MUST add ->limit(1) with explicit ordering
│   └── Is there a default ordering (latest/popular/custom)?
│       ├── YES → Use ->latest() or ->orderBy() with ->limit(1)
│       └── NO → Always specify explicit ordering for determinism
└── NO (subquery in WHERE clause)
    └── Does the subquery need limit?
        ├── Scalar comparison (=) → YES, must return exactly 1 row
        ├── IN/EXISTS → NO, can return multiple rows naturally
        └── Aggregation (MAX, MIN, COUNT) → NO, returns single row inherently
```

### Rationale
`Post::addSelect(['last_comment' => Comment::select('body')->whereColumn('post_id', 'posts.id')])` without `->limit(1)` fails when a post has multiple comments. The error may not surface in development (1-2 comments per post) but appears in production (users with hundreds of comments). `->limit(1)` with ordering guarantees a deterministic single row.

### Recommended Default
Always add `->limit(1)` with `->latest()` or explicit ordering to every scalar subquery in `addSelect()`. This is a non-negotiable safety rule.

### Risks
- Missing `->limit(1)`: "Subquery returns more than 1 row" runtime error in production
- `->limit(1)` without ordering: non-deterministic which row is returned
- Two subqueries in SELECT without limit: both fail when data accumulates
- Developer only tests with empty/limited data: thinks code is safe with 0-1 related records

### Related Rules/Skills
- Add limit(1) for Every Scalar Subquery (05-rules.md)
- Prefer Uncorrelated Subqueries When Possible (05-rules.md)
- Implement Select Constraints for Efficient Data Retrieval (06-skills.md)

---

## Decision 3: Subquery Count and Complexity Management

### Context
Multiple subqueries in SELECT execute once per outer row. Three subqueries on 10k parents = 30k subquery executions. The number of subqueries and their complexity must be managed to prevent performance degradation.

### Criteria
- How many subqueries are in the SELECT?
- How many rows does the outer query return?
- Are the subqueries correlated or uncorrelated?
- Could a JOIN + GROUP BY replace multiple subqueries?

### Decision Tree
```
How many subqueries are in the SELECT?
├── 0-2 → Acceptable
│   └── Are they correlated?
│       ├── YES → Ensure WHERE columns are indexed
│       └── NO → Single execution, minimal concern
├── 3 → At the limit — should be reviewed
│   └── Can any be replaced with withCount() or JOIN?
│       ├── YES → Replace to reduce count
│       └── NO → Profile with production-scale data
└── 4+ → Too many — MUST refactor
    └── Can multiple subqueries be combined?
        ├── Yes, related → Use withCount() or single JOIN with multiple aggregates
        └── No, unrelated → Consider separate queries or cached computations
```

### Rationale
Each correlated subquery in SELECT executes once per outer row. For 10k rows with 4 subqueries, that's 40k executions. Even with indexed WHERE columns, this volume of execution adds significant overhead. `withCount()` handles common aggregate subqueries more efficiently. JOIN + GROUP BY with conditional aggregation can replace multiple scalar subqueries.

### Recommended Default
Limit subqueries in SELECT to 2-3 per query. Use `withCount()` / `withExists()` for simple aggregates. Consider JOIN + GROUP BY for complex aggregations. Always profile with production-scale data.

### Risks
- 4+ correlated subqueries: thousands of executions, seconds of query time
- Subquery not replaced by `withCount()`: missing optimization opportunity
- JOIN + GROUP BY replacing subqueries without verifying row multiplication
- No profiling before deploying: performance degradation only visible at production scale

### Related Rules/Skills
- Limit Subqueries in SELECT to 2-3 Per Query (05-rules.md)
- Test with Production-Scale Data (05-rules.md)
- Design Index-Aware Queries (06-skills.md)
