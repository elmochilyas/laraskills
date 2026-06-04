## Always Index Subquery WHERE Columns
---
## Category
Performance
---
## Rule
Ensure the foreign key and all WHERE columns inside a subquery are indexed before deploying code using `whereHas()`, `withCount()`, or subqueries in `addSelect()`.
---
## Reason
Subqueries in Eloquent generate correlated executions. `User::whereHas('comments')` generates `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.user_id = ...)`. Without an index on `comments.user_id`, each of the 100k outer rows triggers a full table scan on the comments table — catastrophic performance.
---
## Bad Example
```php
// comments.user_id is not indexed
$users = User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subMonth())
)->get();
// Each user → full table scan on comments table
```
---
## Good Example
```php
// Migration: $table->foreignIdFor(User::class)->constrained()->index();
// $table->index('created_at');
$users = User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subMonth())
)->get();
// Index lookups — O(log n) per user
```
---
## Exceptions
Tables with fewer than 1000 rows where full table scans are faster than index lookups.
---
## Consequences Of Violation
Catastrophic query times. `whereHas()` on 100k users with unindexed subquery = 100k full table scans. A query that should take milliseconds takes minutes or hours.
---
## Add limit(1) for Every Scalar Subquery
---
## Category
Reliability
---
## Rule
Always append `->limit(1)` with explicit ordering to scalar subqueries in `addSelect()`.
---
## Reason
A scalar subquery in SELECT must return exactly one row. Without `->limit(1)`, a parent with multiple related records causes a runtime error: "Subquery returns more than 1 row." `->limit(1)` with ordering guarantees a deterministic single row.
---
## Bad Example
```php
Post::addSelect([
    'recent_comment' => Comment::select('body')
        ->whereColumn('post_id', 'posts.id')
        // No limit — runtime error if post has multiple comments
]);
```
---
## Good Example
```php
Post::addSelect([
    'recent_comment' => Comment::select('body')
        ->whereColumn('post_id', 'posts.id')
        ->latest()
        ->limit(1),
]);
// Always returns exactly one comment per post
```
---
## Exceptions
No common exceptions. Every scalar subquery must have `->limit(1)`. The cost of the check is zero; the cost of missing it is a production error.
---
## Consequences Of Violation
Runtime SQL errors on pages where a parent has multiple related records. The error may not appear in development (limited data) but crashes in production when real data accumulates.
---
## Prefer Uncorrelated Subqueries When Possible
---
## Category
Performance
---
## Rule
Use `whereIn()` with a subquery for simple existence checks instead of correlated `whereHas()` when the subquery result set is manageable.
---
## Reason
`whereIn()` with a subquery executes the inner query once and reuses the result. `whereHas()` executes the correlated subquery once per outer row — for 100k parents, that is 100k executions. Uncorrelated subqueries are dramatically cheaper for large parent datasets.
---
## Bad Example
```php
// Correlated — 100k executions for 100k users
$users = User::whereHas('posts', fn($q) =>
    $q->where('status', 'published')
)->get();
```
---
## Good Example
```php
// Uncorrelated — 1 execution, reused
$users = User::whereIn(
    'id',
    Post::where('status', 'published')->select('user_id')
)->get();
```
---
## Exceptions
When the subquery returns millions of IDs, materializing them in memory is worse than the correlated approach. Use `whereHas()` or EXISTS for large-result subqueries.
---
## Consequences Of Violation
Unnecessary query execution cost. A correlated subquery executed 100k times vs. an uncorrelated one executed once — the difference can be hours vs. seconds for large datasets.
---
## Test with Production-Scale Data
---
## Category
Testing
---
## Rule
Benchmark subquery performance with datasets matching production scale before deploying to production.
---
## Reason
Subqueries that perform well on 1000 rows may degrade catastrophically at 1M rows. Correlated subqueries, unindexed WHERE columns, and poorly chosen subquery types only reveal their cost at scale. Performance testing with realistic data volumes prevents production surprises.
---
## Bad Example
```php
// Tested with 100 users — fast
// Production has 500k users — unreachable
$users = User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subDay())
)->get();
// EXPLAIN with 500k users reveals the problem
```
---
## Good Example
```php
// Test with 100k+ records matching production volume
// EXPLAIN shows type: ref or range (not ALL)
// Query completes under acceptable threshold
$users = User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subDay())
)->get();
```
---
## Exceptions
Greenfield projects with no production data yet. Set up a realistic seed dataset (100k+ rows) approximating expected production volume.
---
## Consequences Of Violation
Production outages from suboptimal subqueries. Code that passed code review and QA fails under real-world data volumes, requiring emergency fixes.
---
## Limit Subqueries in SELECT to 2-3 Per Query
---
## Category
Performance
---
## Rule
Do not add more than 3 `addSelect()` subqueries to a single Eloquent query.
---
## Reason
Each correlated subquery in SELECT executes once per returned row. For 10k parent rows with 3 subqueries each, that is 30k subquery executions. While each may be fast individually, the aggregate cost dominates query time. JOIN + GROUP BY is often more efficient for queries requiring multiple aggregations.
---
## Bad Example
```php
Post::addSelect([
    'comment_count' => Comment::whereColumn('post_id', 'posts.id')->selectRaw('count(*)'),
    'like_count' => Like::whereColumn('post_id', 'posts.id')->selectRaw('count(*)'),
    'view_count' => View::whereColumn('post_id', 'posts.id')->selectRaw('count(*)'),
    'share_count' => Share::whereColumn('post_id', 'posts.id')->selectRaw('count(*)'),
    'bookmark_count' => Bookmark::whereColumn('post_id', 'posts.id')->selectRaw('count(*)'),
])->get();
// 5 subqueries × 10k posts = 50k subquery executions
```
---
## Good Example
```php
Post::withCount(['comments', 'likes', 'views'])->get();
// withCount uses efficient correlated subqueries
// If more aggregates needed, consider a dedicated aggregation table
```
---
## Exceptions
Queries returning a small number of rows (< 100) where subquery overhead is negligible.
---
## Consequences Of Violation
Query times 5-10x longer than necessary. The application becomes progressively slower as the dataset grows, with no single query being the obvious bottleneck.
