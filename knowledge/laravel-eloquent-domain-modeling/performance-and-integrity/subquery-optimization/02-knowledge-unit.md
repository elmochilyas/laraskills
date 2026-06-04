# Subquery Optimization — Advanced Subquery Techniques

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Subquery Optimization
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Subquery optimization is the practice of writing efficient correlated and uncorrelated subqueries in Eloquent, choosing between subquery and JOIN approaches, and leveraging advanced SQL subquery features. While Eloquent abstracts much of the SQL generation, the developer must understand when Eloquent generates subqueries (via `whereHas()`, `withCount()`, `addSelect()` with subqueries) and how those subqueries perform under different database engines. Suboptimal subqueries can be 10-100x slower than equivalent JOINs, while well-written subqueries can outperform JOINs in specific scenarios.

---

## Core Concepts

- **Correlated subquery:** A subquery that references columns from the outer query. Executed once per outer row. `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.post_id = posts.id)`.
- **Uncorrelated subquery:** A subquery that does not reference outer columns. Executed once and the result is reused. `WHERE status = (SELECT MAX(status) FROM statuses)`.
- **`whereHas()` / `whereDoesntHave()`:** Generates `WHERE EXISTS` / `WHERE NOT EXISTS` correlated subqueries.
- **`withCount()` / `withExists()`:** Generates correlated subqueries in the SELECT clause for scalar aggregation.
- **`addSelect()` with subquery:** Raw or query-builder subquery as a computed column: `Post::addSelect(['last_comment_date' => Comment::select('created_at')->whereColumn('post_id', 'posts.id')->latest()->limit(1)])`.
- **Join vs. subquery tradeoff:** JOINs multiply rows (requiring DISTINCT or GROUP BY); subqueries do not. Subqueries can be slower for large datasets because of per-row execution.
- **`whereIn()` with subquery:** `User::whereIn('id', Post::where('status', 'published')->select('user_id'))` — an uncorrelated subquery.

---

## Mental Models

### The Nested Loop Metaphor
A correlated subquery is a nested loop in PHP: for each outer row, run the inner query. If the outer query returns 1,000 rows and the inner query takes 1ms each, that's 1 second total. An uncorrelated subquery is like a single query whose result is cached and reused — it runs once.

### The Assembly Line vs. Custom Workshop
A JOIN is an assembly line — rows from both tables are joined simultaneously in a single pass. A subquery is a custom workshop — each outer row gets its own custom treatment. The assembly line is faster for large volumes; the workshop is more flexible for selective operations.

---

## Internal Mechanics

- `whereHas()` generates `WHERE EXISTS (SELECT 1 FROM table WHERE ...)`. MySQL optimizes `EXISTS` by short-circuiting on the first match — it stops scanning the subquery as soon as a matching row is found.
- `withCount()` generates a correlated scalar subquery in the SELECT clause: `(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comments_count`.
- `addSelect()` with a subquery uses the query builder's `where` internals — the subquery is passed as a `Expression` object and rendered as a SQL subquery.
- `whereIn()` with a subquery generates `WHERE id IN (SELECT user_id FROM posts WHERE ...)`. MySQL may optimize this to a semi-join in some versions.
- PostgreSQL's query planner handles subqueries differently from MySQL — it can often transform correlated subqueries into JOINs internally via subquery flattening.

---

## Patterns

- **Subquery in SELECT for computed columns:**
```php
$posts = Post::addSelect([
    'last_comment_date' => Comment::select('created_at')
        ->whereColumn('post_id', 'posts.id')
        ->latest()
        ->limit(1),
    'comment_count' => Comment::selectRaw('count(*)')
        ->whereColumn('post_id', 'posts.id'),
])->get();
```
- **WhereHas with constrained subquery:**
```php
User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subMonth())
       ->havingRaw('count(*) > 5')
);
```
- **WhereIn subquery vs. raw IDs:**
```php
// Subquery (single query, no serialization)
$users = User::whereIn('id', Post::where('status', 'published')->select('user_id'))->get();
// vs. raw IDs (two queries, but IDs are serialized)
$ids = Post::where('status', 'published')->pluck('user_id');
$users = User::whereIn('id', $ids)->get();
```
- **Subquery ordering:**
```php
$posts = Post::addSelect([
    'recent_comment_id' => Comment::select('id')
        ->whereColumn('post_id', 'posts.id')
        ->latest()
        ->limit(1),
])->orderBy('recent_comment_id')->get();
```

---

## Architectural Decisions

- **Subquery vs. JOIN:** Use subqueries when: (1) you need a scalar value per parent row (COUNT, MAX, MIN), (2) you want to avoid row multiplication, (3) the subquery is highly selective (returns few rows). Use JOINs when: (1) you need columns from the related table in the result, (2) you're joining large tables and the JOIN can use indexes, (3) the query needs to sort by related columns.
- **Correlated vs. uncorrelated:** Prefer uncorrelated subqueries when possible — they execute once. `whereIn()` with a subquery is uncorrelated. `whereHas()` with a subquery referencing the outer query is correlated and executes per outer row.
- **Eloquent's subquery limitations:** Eloquent's relationship-based subqueries (`whereHas()`, `withCount()`) are optimized for common patterns. Raw subqueries in `addSelect()` give full control but bypass Eloquent's relationship mapping.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Subqueries avoid row multiplication | Correlated subqueries execute per outer row | Profile with EXPLAIN; may need JOIN for large datasets |
| `whereIn()` subquery is uncorrelated | Large `IN` lists can be slow | Use JOIN or EXISTS for large subquery results |
| Scalar subquery in SELECT adds computed column | Multiple subqueries in SELECT degrade performance | Limit to 2-3 subqueries per SELECT |
| Subquery without DISTINCT | Less readable than equivalent JOIN for complex cases | Document with inline SQL comments |
| `whereHas()` short-circuits on first match | `NOT EXISTS` scans until end | Index the subquery WHERE columns |

---

## Performance Considerations

- `whereHas()` with unindexed foreign key in the subquery: `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.post_id = posts.id)` — without `comments.post_id` index, this is a full table scan per outer row. Index the foreign key.
- Subqueries in SELECT (`addSelect()` with subquery) execute once per outer row. For 10,000 outer rows with 3 subqueries each, that's 30,000 subquery executions. Ensure each subquery is fast (indexed, lightweight).
- `whereIn()` with a subquery that returns millions of IDs: MySQL materializes the entire subquery result into an internal temporary table. For very large subquery results, use `EXISTS` or a JOIN instead.
- PostgreSQL's subquery flattening can transform correlated subqueries into JOINs automatically. MySQL does this less aggressively. Test the same query on both engines.

---

## Production Considerations

- **EXPLAIN before deploying:** Always run `EXPLAIN` on queries containing subqueries. Look for `DEPENDENT SUBQUERY` (MySQL) or `SubPlan` (PostgreSQL) indicating correlated execution.
- **Subquery materialization in MySQL 8:** MySQL may materialize uncorrelated subqueries into temporary tables. This is usually beneficial but can be a problem for very large subquery results.
- **Monitor for temp table creation:** `EXPLAIN` output showing `Using temporary` indicates the subquery creates a temporary table. If the temp table is written to disk (large result), performance degrades significantly.
- **Test with production-scale data:** Subqueries that perform well on 1,000 rows may degrade catastrophically at 1,000,000 rows. Load test with realistic data volumes.
- **Consider materialized views:** For extremely expensive subqueries (e.g., complex aggregation per row), pre-compute the results in a materialized view or cached column.

---

## Common Mistakes

- **Using whereHas() without indexing the subquery column:** The most common subquery performance mistake. `$user->whereHas('comments', ...)` generates `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.user_id = ...)`. Without `comments.user_id` index, each outer row triggers a full table scan.
- **Multiple subqueries in SELECT without performance testing:** `Post::addSelect([...3 subqueries...])` on 10,000 posts executes 30,000 subqueries. Test the query with EXPLAIN; consider JOIN + GROUP BY as an alternative.
- **Using whereIn() with subquery returning all IDs:** `User::whereIn('id', DB::table('logs')->select('user_id'))` — if `logs` has 10M rows, the subquery materializes 10M IDs. Use EXISTS or JOIN instead.
- **Not using limit(1) for scalar subqueries:** `Post::addSelect(['recent_comment' => Comment::select('body')->whereColumn('post_id', 'posts.id')])` — without `->limit(1)`, the subquery may return multiple rows, causing a runtime error. Always add `->limit(1)` for scalar subqueries.
- **Confusing uncorrelated and correlated subqueries:** `User::whereIn('id', Post::select('user_id'))` is uncorrelated — the subquery does not reference the outer query. `User::whereHas('posts', fn($q) => ...)` is correlated — the subquery references the outer `users.id`.

---

## Failure Modes

- **Correlated subquery performance explosion:** A query using `whereHas()` on 100,000 users without an index on the subquery's WHERE column executes 100,000 full table scans. The query may take hours and block the database.
- **Subquery returns multiple rows for scalar context:** `Post::addSelect(['comment_body' => Comment::select('body')->whereColumn('post_id', 'posts.id')])` — if a post has multiple comments, the subquery returns multiple rows, and MySQL throws `Subquery returns more than 1 row`.
- **Memory exhaustion from materialized subquery:** MySQL may materialize a large `WHERE IN (subquery)` into memory. If the subquery returns 2M rows, the temporary table exhausts temp table memory and spills to disk, causing disk I/O storm.
- **Incorrect results with LIMIT in subquery:** MySQL does not guarantee the order of rows in a subquery unless `ORDER BY` is used. `Comment::select('body')->whereColumn('post_id', 'posts.id')->limit(1)` may return a different comment each time.

---

## Ecosystem Usage

- **Laravel Nova:** Uses correlated subqueries for relationship counts and existence checks on resource index views.
- **Laravel Telescope:** Entry queries use subqueries for tag filtering and relationship existence checks.
- **Laravel Pulse:** Subquery-driven aggregation for dashboard metrics, optimized with pre-aggregated tables.
- **Laravel Scout:** Does not use database subqueries — search queries go to the search engine (Algolia, Meilisearch, Typesense).

---

## Related Knowledge Units

### Prerequisites
- SQL subquery fundamentals (correlated vs uncorrelated)
- Eloquent `whereHas()`, `withCount()`, `addSelect()` basics

### Related Topics
- `index-aware-queries` (indexing subquery columns)
- `select-constraints` (column reduction in subqueries)
- `chunk-chunk-by-id` (alternative for large dataset processing)

### Advanced Follow-up Topics
- Database-specific subquery optimization (MySQL vs PostgreSQL vs SQLite)
- Lateral joins as a subquery alternative (PostgreSQL, MySQL 8+)
- Common Table Expressions (CTEs) vs subqueries

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Concerns\QueriesRelationships::whereHas()` generates correlated subqueries. `Illuminate\Database\Query\Builder::addSelect()` with subqueries uses `Illuminate\Database\Query\Expression`. The query builder's `fromSub()` generates FROM-clause subqueries.

### Key Insight
The single most impactful subquery optimization is indexing the columns used in the subquery's WHERE clause. An unindexed subquery is always slow; an indexed subquery is usually fast. This rule applies to both correlated and uncorrelated subqueries.

### Version-Specific Notes
- MySQL 8.0: Subquery materialization (`MaterializedLookupStrategy`) improves `IN (subquery)` performance.
- PostgreSQL 12+: Improved subquery flattening, better correlated subquery optimization.
- Laravel 8+: `whereHas()` with `havingRaw()` support for filtered aggregation.
- Laravel 9+: `addSelect()` with subquery nesting improvements.
- Laravel 10+: Subquery support in `orderBy()` for ordering by related column values.
