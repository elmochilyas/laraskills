# withCount / loadCount Rules

## Rule: WithCount-Over-Loading-Collection
---
## Category
Performance
---
## Rule
Use `withCount()` instead of loading full related models and calling `->count()` in PHP.
---
## Reason
Loading full models just to count them hydrates unnecessary objects — wasting memory and CPU. `withCount()` adds a single aggregate subquery with zero model hydration.
---
## Bad Example
```php
$users = User::with('posts')->get();
foreach ($users as $user) {
    echo $user->posts->count(); // Hydrates all post models
}
```
---
## Good Example
```php
$users = User::withCount('posts')->get();
foreach ($users as $user) {
    echo $user->posts_count; // Integer, no model hydration
}
```
---
## Exceptions
When the related models are needed for display alongside the count.
---
## Consequences Of Violation
Memory bloat, wasted CPU, unnecessary database data transfer.

## Rule: WithExists-Over-WithCount-For-Boolean
---
## Category
Performance
---
## Rule
Use `withExists()` instead of `withCount()` when you only need a boolean yes/no answer about relationship existence.
---
## Reason
`EXISTS` short-circuits on the first matching row. `COUNT(*)` scans all matching rows. For boolean checks, `EXISTS` is significantly faster, especially on large child sets.
---
## Bad Example
```php
$users = User::withCount('posts')->get();
$users->each(fn($u) => $u->posts_count > 0); // Scans all rows
```
---
## Good Example
```php
$users = User::withExists('posts')->get();
$users->each(fn($u) => $u->posts_exists); // Short-circuits on first match
```
---
## Exceptions
When the actual count value is needed, not just existence.
---
## Consequences Of Violation
Unnecessary full table scans, slower queries on large child tables.

## Rule: WithCount-Index-Foreign-Key
---
## Category
Performance
---
## Rule
Index the foreign key column used by `withCount()` subqueries for optimal performance.
---
## Reason
The correlated subquery in `withCount()` uses `WHERE foreign_key = parent.id` in a nested loop. Without an index, this becomes a full table scan per parent row.
---
## Bad Example
```php
Schema::create('comments', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained();
    // No index — withCount subquery scans
});
```
---
## Good Example
```php
Schema::create('comments', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained()->index();
});
```
---
## Exceptions
Trivially small tables under 1,000 rows.
---
## Consequences Of Violation
Slow correlated subqueries, O(n²) query performance with parent count.

## Rule: WithCount-Not-With-Eager-Loaded-Relation
---
## Category
Performance
---
## Rule
Do not use `withCount()` on a relationship that is also being eager-loaded with `with()` — the count subquery is redundant.
---
## Reason
If the relationship is already loaded, `$model->relation->count()` uses PHP's collection count with zero database overhead. Adding `withCount()` adds an unnecessary subquery.
---
## Bad Example
```php
$posts = Post::with('comments')->withCount('comments')->get();
// Comments loaded AND counted — redundant subquery
```
---
## Good Example
```php
$posts = Post::with('comments')->get();
$posts->each(fn($p) => $p->comments->count()); // Uses loaded collection — zero DB cost
// OR
$posts = Post::withCount('comments')->get(); // Count only
```
---
## Exceptions
When both the models and count are needed but the loaded collection is too large for PHP count.
---
## Consequences Of Violation
Unnecessary subquery execution, wasted database resources.

## Rule: WithCount-Nested-Naming-Awareness
---
## Category
Framework Usage
---
## Rule
Be aware that nested `withCount('posts.comments')` produces the attribute `posts_comments_count`, combining intermediate relationship names with underscores.
---
## Reason
The attribute name combines all levels of the dot notation with underscores. This can produce long or unexpected attribute names.
---
## Bad Example
```php
User::withCount('posts.comments');
// $user->posts_comments_count — the name may not be obvious
```
---
## Good Example
```php
User::withCount('posts.comments');
echo $user->posts_comments_count; // Document the naming pattern
```
---
## Exceptions
None.
---
## Consequences Of Violation
Unexpected attribute names, accessing null attributes instead of count.

## Rule: WithCount-SoftDelete-Awareness
---
## Category
Reliability
---
## Rule
Add `->whereNull('deleted_at')` in constraint callbacks for `withCount()` on soft-deletable relations if trashed records should not be counted.
---
## Reason
`withCount()` counts all related rows by default, including soft-deleted ones. This often produces unexpectedly high counts.
---
## Bad Example
```php
$posts = Post::withCount('comments')->get();
// Count includes soft-deleted comments
```
---
## Good Example
```php
$posts = Post::withCount(['comments' => fn($q) => $q->whereNull('deleted_at')])->get();
```
---
## Exceptions
When soft-deleted records should be included in the count.
---
## Consequences Of Violation
Inflated counts, misleading display values, incorrect reporting.

## Rule: WithCount-Multiple-Subqueries
---
## Category
Performance
---
## Rule
Monitor query plans when using multiple `withCount()` calls in one query — each adds a separate correlated subquery.
---
## Reason
Each `withCount()` adds an independent subquery to the SELECT clause. Five `withCount()` calls = five subqueries. This can slow the query substantially.
---
## Bad Example
```php
$posts = Post::withCount(['comments', 'likes', 'views', 'shares', 'bookmarks'])->get();
// 5 subqueries — potentially slow
```
---
## Good Example
```php
// Limit to essential counts
$posts = Post::withCount(['comments', 'likes'])->get();
// Cache or defer less important counts
```
---
## Exceptions
When the result set is small (under 100 rows) and all counts are needed.
---
## Consequences Of Violation
Slow queries, database performance degradation.
