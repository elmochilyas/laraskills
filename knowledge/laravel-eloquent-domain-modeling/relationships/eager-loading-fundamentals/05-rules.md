# Eager Loading Fundamentals Rules

## Rule: Always-Eager-Load-In-Loops
---
## Category
Performance
---
## Rule
Always eager-load relationships before iterating models when accessing those relationships inside the loop.
---
## Reason
Without eager loading, each iteration triggers a separate database query (N+1). With eager loading, the number of queries is fixed regardless of the parent count.
---
## Bad Example
```php
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count(); // N+1 queries
}
```
---
## Good Example
```php
$users = User::with('posts')->get();
foreach ($users as $user) {
    echo $user->posts->count(); // 2 queries
}
```
---
## Exceptions
When the parent set is guaranteed to have fewer than 5 items.
---
## Consequences Of Violation
N+1 query problem, excessive database load, page latency.

## Rule: Prevent-Lazy-Loading-Dev
---
## Category
Reliability
---
## Rule
Enable `Model::preventLazyLoading()` in development environments to catch N+1 problems early.
---
## Reason
Lazy loading errors are silent in production. Preventing them in development forces developers to address missing eager loads before they reach production.
---
## Bad Example
```php
// No lazy loading prevention — N+1 goes unnoticed in development
```
---
## Good Example
```php
// AppServiceProvider::boot()
Model::preventLazyLoading(! app()->isProduction());
```
---
## Exceptions
When an intentional lazy load is masked with `handleLazyLoadingViolationUsing`.
---
## Consequences Of Violation
Undetected N+1 problems deployed to production, performance regressions.

## Rule: LoadMissing-Defensive-Pattern
---
## Category
Architecture
---
## Rule
Use `loadMissing()` in API resources and reusable components instead of unconditional `load()`.
---
## Reason
`loadMissing()` checks if the relationship is already loaded before querying. This prevents redundant queries when multiple components access the same relationship.
---
## Bad Example
```php
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        $this->resource->load('comments'); // Loads even if already loaded
        return ['comments' => CommentResource::collection($this->comments)];
    }
}
```
---
## Good Example
```php
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        $this->resource->loadMissing('comments'); // Only loads if not present
        return ['comments' => CommentResource::collection($this->comments)];
    }
}
```
---
## Exceptions
When the relationship is never pre-loaded by calling code.
---
## Consequences Of Violation
Redundant database queries, performance degradation, unnecessary load.

## Rule: Dots-Add-Queries
---
## Category
Performance
---
## Rule
Do not assume nested eager loading (`with('a.b.c')`) executes a single query — each dot level adds a separate query.
---
## Reason
Eloquent executes one query per relationship level. `with('posts.comments.author')` is 4 queries, not 1. This surprises developers and can cause unexpected database load.
---
## Bad Example
```php
User::with('posts.comments.author')->get();
// 4 queries: users, posts, comments, authors
```
---
## Good Example
```php
// Be intentional about depth
User::with('posts.comments.author')->get();
// Document that this generates 4 queries
```
---
## Exceptions
When `HasManyThrough` or `HasOneThrough` can replace a chain with a single join.
---
## Consequences Of Violation
Unexpected query count, performance test failures.

## Rule: Not-Load-In-Loops
---
## Category
Performance
---
## Rule
Never call `$model->load()` inside a loop — call `load()` on the collection instead.
---
## Reason
`load()` on individual models in a loop triggers one query per iteration. `load()` on a collection batches the eager loading into a single query.
---
## Bad Example
```php
foreach ($users as $user) {
    $user->load('posts'); // N queries
}
```
---
## Good Example
```php
$users->load('posts'); // 1 query for all users
// Or batch:
$users->load(['posts', 'profile']);
```
---
## Exceptions
None.
---
## Consequences Of Violation
N+1 query problem via load, performance degradation.

## Rule: Eager-Load-After-Pagination-Awareness
---
## Category
Framework Usage
---
## Rule
Understand that eager loading after pagination only loads relationships for the current page's models.
---
## Reason
Calling `with()` after `paginate()` loads relations only for the models on the current page. If relationships are needed across all pages, the approach must change.
---
## Bad Example
```php
// Only page 1 models get their relationships
Post::paginate(20)->load('comments'); // Wrong — load() on collection
```
---
## Good Example
```php
Post::with('comments')->paginate(20); // Correct — eager load before paginate
```
---
## Exceptions
When only the current page's relationships are needed.
---
## Consequences Of Violation
Missing relationship data on subsequent pages, hard-to-find bugs.

## Rule: Selective-Eager-Loading
---
## Category
Performance
---
## Rule
Eager-load only the relationships that are actually consumed in the current request or view.
---
## Reason
Loading unused relationships wastes memory, database bandwidth, and hydration time. Each extra relationship adds query and hydration overhead.
---
## Bad Example
```php
class UserController
{
    public function index(): array
    {
        return User::with(['posts', 'profile', 'roles', 'settings', 'logins'])->get();
        // Some relationships never used in the response
    }
}
```
---
## Good Example
```php
class UserController
{
    public function index(): array
    {
        return User::with(['posts', 'profile'])->get();
        // Only load what the view/API resource actually consumes
    }
}
```
---
## Exceptions
When the response shape is dynamic or consumed by multiple clients with different needs.
---
## Consequences Of Violation
Memory waste, slow responses, excessive database load.
