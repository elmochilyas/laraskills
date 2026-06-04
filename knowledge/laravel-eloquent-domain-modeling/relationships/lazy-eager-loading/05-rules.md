# Lazy Eager Loading Rules

## Rule: Not-Load-In-Loops
---
## Category
Performance
---
## Rule
Never call `load()` inside a foreach loop — always call `load()` on the collection.
---
## Reason
`load()` on individual models in a loop executes one query per iteration, recreating the N+1 problem. `load()` on a collection executes one query for all models.
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
$users->load('posts'); // 1 query for the whole collection
```
---
## Exceptions
None.
---
## Consequences Of Violation
N+1 query problem, performance degradation.

## Rule: Prefer-With-Over-Load
---
## Category
Performance
---
## Rule
Use `with()` when relationships are known at query definition time; reserve `load()` for conditional or deferred loading.
---
## Reason
`with()` combines the relationship query with the parent query, reducing round trips. `load()` requires an additional query round trip after the parent models are hydrated.
---
## Bad Example
```php
$users = User::all();
$users->load('posts'); // Extra round trip when with() could combine
```
---
## Good Example
```php
$users = User::with('posts')->get(); // Single execution plan
```
---
## Exceptions
When the need for a relationship is discovered after the initial query (conditional loading).
---
## Consequences Of Violation
Extra database round trips, slower response times.

## Rule: LoadMissing-For-Reusable-Components
---
## Category
Architecture
---
## Rule
Use `loadMissing()` in API resources, middleware, and view composers to defensively load relationships.
---
## Reason
Reusable components cannot guarantee that relationships are pre-loaded. `loadMissing()` ensures availability without redundant queries.
---
## Bad Example
```php
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'comments' => CommentResource::collection($this->comments), // Crashes if not loaded
        ];
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
        $this->resource->loadMissing('comments');
        return [
            'comments' => CommentResource::collection($this->comments),
        ];
    }
}
```
---
## Exceptions
When the calling code guarantees the relationship is always pre-loaded.
---
## Consequences Of Violation
Runtime crashes, defensive pre-loading pollution in controllers.

## Rule: Batch-Independent-Loads
---
## Category
Performance
---
## Rule
Batch independent relationship loads into a single `load(['rel1', 'rel2'])` call instead of multiple separate calls.
---
## Reason
Each `load()` call executes a separate database query. Batching reduces round trips and consolidates query execution.
---
## Bad Example
```php
$users->load('posts');
$users->load('profile');
$users->load('roles');
// 3 separate queries
```
---
## Good Example
```php
$users->load(['posts', 'profile', 'roles']);
// 3 queries still, but batched in one execution
```
---
## Exceptions
When some loads are conditional on the results of previous loads.
---
## Consequences Of Violation
Unnecessary separate round trips, slightly slower execution.

## Rule: Load-Memory-Awareness
---
## Category
Performance
---
## Rule
Be aware that `load()` on large collections hydrates all related models into memory.
---
## Reason
`load()` has the same memory footprint as `with()`. Loading a relationship on 10,000 parents with 100 children each hydrates 1 million models.
---
## Bad Example
```php
$users = User::all(); // 10,000 users
$users->load('posts'); // All posts hydrated into memory
```
---
## Good Example
```php
User::with('posts')->chunkById(100, function ($users) {
    // Process in chunks — memory stays bounded
});
```
---
## Exceptions
When the dataset is guaranteed small.
---
## Consequences Of Violation
Memory exhaustion, OOM crashes, performance degradation.

## Rule: Load-After-Pagination-Correct
---
## Category
Framework Usage
---
## Rule
Understand that `load()` after pagination is correct for page-scoped models — it loads relations for the current page only.
---
## Reason
Unlike the common misconception, `load()` on a paginated collection is correct behavior — only the current page's models get the relationship. This is typically desired.
---
## Bad Example
```php
// Assuming load after paginate is wrong — it IS correct
Post::paginate(20)->load('comments'); // Loads comments for page 1 only — correct
```
---
## Good Example
```php
// Accept when page-scoped loading is the intent
$posts = Post::paginate(20)->load('comments');
```
---
## Exceptions
When relationships are needed for all models across all pages.
---
## Consequences Of Violation
Correct but misunderstood behavior, unnecessary refactoring.
