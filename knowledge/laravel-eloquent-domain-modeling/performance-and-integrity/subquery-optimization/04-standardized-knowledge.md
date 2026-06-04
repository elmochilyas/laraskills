# Subquery Optimization

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Subquery Optimization |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Subquery optimization is the practice of writing efficient correlated and uncorrelated subqueries in Eloquent, choosing between subquery and JOIN approaches, and leveraging advanced SQL subquery features. Suboptimal subqueries can be 10-100x slower than equivalent JOINs, while well-written subqueries can outperform JOINs in specific scenarios.

## Core Concepts

- **Correlated subquery**: References columns from the outer query. Executed once per outer row. `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.post_id = posts.id)`.
- **Uncorrelated subquery**: Does not reference outer columns. Executed once; result is reused. `WHERE status = (SELECT MAX(status) FROM statuses)`.
- **`whereHas()` / `whereDoesntHave()`**: Generates `WHERE EXISTS` / `WHERE NOT EXISTS` correlated subqueries.
- **`withCount()` / `withExists()`**: Generates correlated subqueries in the SELECT clause for scalar aggregation.
- **`addSelect()` with subquery**: Raw or query-builder subquery as a computed column.
- **Subquery vs. JOIN tradeoff**: JOINs multiply rows (requiring DISTINCT/GROUP BY); subqueries do not. Subqueries can be slower per-row but avoid row multiplication.

## When To Use

- Scalar values per parent row (COUNT, MAX, MIN, latest related record)
- Avoiding row multiplication from JOINs when you don't need related columns
- Highly selective existence checks — `whereHas()` on a small subset of parents
- Computed columns in SELECT that aggregate related data

## When NOT To Use

- You need actual columns from the related table in the result (use JOIN)
- The subquery returns millions of rows for `WHERE IN` (use JOIN or EXISTS)
- The subquery is correlated and the outer query returns 100k+ rows (use JOIN)
- Simple relationship existence checks with indexes on both sides (use JOIN for large datasets)

## Best Practices

- **Always index the subquery's WHERE columns**: The single most impactful subquery optimization. `$user->whereHas('comments')` generates `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.user_id = ...)`. Without `comments.user_id` indexed, each outer row triggers a full table scan. Index the foreign key and any additional WHERE columns in the subquery.
- **Add `->limit(1)` for scalar subqueries**: `Post::addSelect(['recent_comment' => Comment::select('body')->whereColumn('post_id', 'posts.id')])` without `->limit(1)` may return multiple rows, causing a runtime error (`Subquery returns more than 1 row`). Always add `->limit(1)` with `->latest()` or explicit ordering to guarantee a single row.
- **Prefer uncorrelated subqueries when possible**: `whereIn()` with a subquery (`User::whereIn('id', Post::select('user_id'))`) executes once and reuses the result. `whereHas()` executes per outer row. Use `whereIn()` with subquery for simple existence checks where the subquery result is not too large.
- **Test with production-scale data**: Subqueries performing well on 1,000 rows may degrade catastrophically at 1,000,000 rows. Always `EXPLAIN` the query and test with realistic data volumes before deploying.

## Architecture Guidelines

- Use `whereHas()` for selective existence checks (few parents match)
- Use JOIN + GROUP BY for large-scale aggregations requiring related columns
- Use `addSelect()` with subqueries for computed columns, but limit to 2-3 per query
- Use `whereIn()` with subquery for medium-sized uncorrelated existence checks
- Monitor for temp table creation in `EXPLAIN` output (`Using temporary`)

## Performance Considerations

- `whereHas()` on 100k parents with unindexed subquery = 100k full table scans — catastrophic
- Subqueries in SELECT execute once per outer row — 10k parents × 3 subqueries = 30k executions
- `whereIn()` with subquery materializes the entire subquery result — millions of IDs cause memory exhaustion
- PostgreSQL's subquery flattening can transform correlated subqueries into JOINs automatically; MySQL does this less aggressively

## Security Considerations

- Subqueries in `addSelect()` can expose computed data — ensure the subquery respects row-level authorization
- Raw subqueries may be vulnerable to SQL injection if not using parameter binding — always use the query builder, not raw strings

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using whereHas() without indexing | Assuming index exists on FK | Full table scan per outer row | Index the subquery WHERE columns |
| Multiple subqueries in SELECT | Convenience without profiling | 30k+ subquery executions | Use JOIN + GROUP BY for complex aggregations |
| whereIn() with subquery returning all IDs | Not anticipating data volume | Temporary table with millions of rows | Use EXISTS or JOIN |
| Missing limit(1) on scalar subquery | Copy-paste without understanding | Runtime error: multiple rows returned | Always add `->limit(1)` |
| Confusing correlated vs uncorrelated | Not checking subquery references | Misunderstanding performance profile | Check if subquery references outer columns |

## Anti-Patterns

- **Unindexed-whereHas**: Using `whereHas()` without indexing the subquery's WHERE columns. The most common subquery performance mistake. Always verify the index exists.
- **Subquery-everywhere**: Using subqueries for every aggregation instead of considering JOIN + GROUP BY. Subqueries are not always faster — profile both approaches.
- **Scalar-subquery-without-limit**: Adding a subquery to SELECT without `->limit(1)`. A post with multiple comments causes the query to fail at runtime.

## Examples

```php
// Scalar subquery with limit(1) — safe
$posts = Post::addSelect([
    'last_comment_date' => Comment::select('created_at')
        ->whereColumn('post_id', 'posts.id')
        ->latest()
        ->limit(1),
])->get();

// whereHas with indexed foreign key — efficient
// Ensure comments.user_id is indexed
$activeUsers = User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subMonth())
)->get();

// whereIn subquery — uncorrelated, single execution
$users = User::whereIn(
    'id',
    Post::where('status', 'published')->select('user_id')
)->get();

// withCount — efficient scalar aggregation
$posts = Post::withCount(['comments', 'likes'])->get();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | index-aware-queries |
| Prerequisite | Eloquent whereHas(), withCount(), addSelect() |
| Closely Related | select-constraints |
| Closely Related | chunk-chunk-by-id |

## AI Agent Notes

- Add `->limit(1)` with `->latest()` on every scalar subquery in `addSelect()`
- Ensure foreign key indexes exist on subquery WHERE columns
- Prefer `whereIn()` with subquery over `whereHas()` for simple uncorrelated existence checks
- Limit subqueries in SELECT to 2-3 per query to avoid correlated execution overhead

## Verification

- [ ] Foreign key columns used in subquery WHERE clauses are indexed
- [ ] Scalar subqueries in `addSelect()` have `->limit(1)` with explicit ordering
- [ ] `EXPLAIN` confirms subquery execution plan (not full table scans)
- [ ] No more than 3 subqueries in a single SELECT
- [ ] `whereIn()` with subquery is not used when the subquery returns millions of rows
