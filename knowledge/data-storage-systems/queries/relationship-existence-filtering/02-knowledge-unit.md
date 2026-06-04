# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.6 Relationship existence filtering (whereHas, whereDoesntHave, orWhereHas)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`whereHas` filters the parent query based on conditions on related models. It generates a correlated `EXISTS` subquery. While expressive, `whereHas` on large tables or with deeply nested closures can be expensive. Understanding when to use `whereHas` vs a JOIN approach is critical for query performance.

---

# Core Concepts

- **whereHas('relation', closure)**: Filters parents that have at least one matching related record. SQL: `WHERE EXISTS (SELECT 1 FROM related WHERE parent_id = parents.id AND ...)`.
- **whereDoesntHave('relation')**: Filters parents that have no matching related records.
- **orWhereHas**: OR combination with existing WHERE conditions.
- **Nested whereHas**: `whereHas('comments.user', fn($q) => ...)` — filters by nested relationship conditions.

---

# Mental Models

`whereHas` is an EXISTS subquery: "Give me all X that have at least one Y where condition Z." It's a semantic filter, not a join — it doesn't load the related data, it only checks for existence.

---

# Internal Mechanics

- `whereHas` generates: `WHERE EXISTS (SELECT 1 FROM related_table WHERE related_table.parent_id = parent_table.id AND condition)`. The database executes this subquery once per candidate parent row.
- The depth of nested `whereHas` affects query complexity. Each nesting level adds another EXISTS subquery.

---

# Patterns

**Use whereHas for semantic filtering**: "Find posts with comments from active users." Expresses the filter condition naturally.

**Use JOIN for performance-critical filters**: When `whereHas` appears in a hot endpoint (dashboard, list API), rewrite as a JOIN for better performance. The JOIN approach avoids the per-row EXISTS evaluation.

**Avoid deep nesting**: `whereHas('a.b.c', fn($q) => ...)` generates deeply nested subqueries. Consider rewriting as multiple `whereHas` calls or a JOIN chain.

---

# Architectural Decisions

| Method | When | Performance |
|--------|------|-------------|
| whereHas | Simple filters, moderate table sizes | EXISTS subquery per parent row |
| JOIN | Performance-critical, large tables | Single query, index-friendly |
| Nested whereHas | Deep relationship filters | Complex query plan |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Expressive, readable code | Correlated subquery overhead | Heavy on large tables
Handles any relationship depth | Complex query plans | May surprise the query optimizer

---

# Common Mistakes

**orWhereHas without grouping**: `->where('status', 'active')->orWhereHas('comments')` — the OR applies to the entire WHERE clause, potentially returning unexpected results. Use a closure group.

**Repeated whereHas for the same relation**: Calling `whereHas('comments', ...)` and later `whereHas('comments', ...)` in the same query generates two identical subqueries. Combine constraints in a single closure.

---

# Related Knowledge Units

2.3 Eager loading | 4.24 Join optimization | 2.7 Relationship counting
## Ecosystem Usage

Laravel's Eloquent ORM is the dominant PHP ORM in the ecosystem. Community patterns are shared through Laracasts, Laravel News, and open-source packages. Features like eager loading and model events are used in virtually every Laravel project.

## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

