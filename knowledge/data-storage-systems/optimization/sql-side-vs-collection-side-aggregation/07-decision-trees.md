# Decision Trees for 4-15 SQL Side Vs Collection Side Aggregation

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-15 |
| Title | SQL Side Vs Collection Side Aggregation |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: withCount vs collection count
- D2: SQL aggregation vs collection aggregation for SUM/AVG
- D3: Mass assignment aggregation approach

## Architecture-Level Decision Trees

### D1: withCount vs collection count

**Decision Context**: Need count of related records for a list of parent models.

**Criteria**:
- Number of parent models
- Number of related records per parent
- Need for related data beyond count

**Tree**:
```
Need only the count (not the related models)?
├── Yes → Use withCount('relationship')
│   Result: $post->comments_count (single integer)
└── No (need both count and related data)
    └── Use withCount + with('relationship')
        (loads count + models, but only when related data is actually used)
```

**Rationale**: `withCount` adds a subquery to the SELECT, returning one integer per parent. Loading all related models just to count them in PHP is memory-inefficient.

**Default**: Always use `withCount` when only the count is needed. Never use `$model->related->count()`.

**Risks**: `withCount` adds a correlated subquery per relationship. For many relationships, verify performance.

**Related Rules/Skills**: 2-7 (relationship counting), 2-8 (subquery selects)

---

### D2: SQL aggregation vs collection aggregation for SUM/AVG

**Decision Context**: Need sum, average, min, or max of related records.

**Criteria**:
- Aggregation function
- Number of parent rows
- Precision requirements

**Tree**:
```
Is the aggregation simple (SUM, AVG, MIN, MAX)?
├── Yes
│   └── Use SQL aggregation
│       Post::withSum('comments', 'votes')
│       or DB::raw('SUM(amount)')
└── Complex aggregation (custom logic, multiple steps)
    └── Collection aggregation (if dataset is small)
```

**Rationale**: SQL databases are optimized for set-based aggregation. Loading full datasets into PHP and aggregating in memory wastes memory and CPU.

**Default**: SQL-side aggregation for all standard aggregate functions.

**Risks**: `withSum` in Laravel may not support all use cases; fall back to `selectRaw` + `join` when needed.

**Related Rules/Skills**: 2-8 (subquery selects), 4-23 (when to drop to query builder)

---

### D3: Mass assignment aggregation approach

**Decision Context**: Need counts per group (e.g., users per plan_id).

**Criteria**:
- Cardinality of grouping column
- Number of rows total
- Real-time vs batch need

**Tree**:
```
Is the cardinality of grouping column low?
├── Yes (< 100 unique groups)
│   └── Use SQL GROUP BY
│       User::select('plan_id')
│           ->selectRaw('COUNT(*) as count')
│           ->groupBy('plan_id')
│           ->get()
└── No (many unique groups)
    └── Consider materialized view or scheduled aggregation
```

**Rationale**: GROUP BY aggregation is always preferred in SQL. Only fall to collection-based grouping for very small datasets or when models must be loaded anyway.

**Default**: SQL GROUP BY for all mass assignment aggregations.

**Risks**: Full table scan on COUNT without WHERE clause.

**Related Rules/Skills**: 4-26 (row count vs response time)

---
