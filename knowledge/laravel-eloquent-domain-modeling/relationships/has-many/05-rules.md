# HasMany Rules

## Rule: HasMany-Eager-Load-Loops
---
## Category
Performance
---
## Rule
Always eager-load `HasMany` relationships using `with()` before iterating parent models in loops.
---
## Reason
Accessing `$user->posts` inside a loop without eager loading triggers the classic N+1 problem — one query per parent. This is the single most common performance issue in Laravel applications.
---
## Bad Example
```php
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count(); // N queries
}
```
---
## Good Example
```php
$users = User::with('posts')->get();
foreach ($users as $user) {
    echo $user->posts->count(); // 2 queries total
}
```
---
## Exceptions
When iterating fewer than 5 parent models in a non-performance-critical path.
---
## Consequences Of Violation
N+1 query problem, degraded response times, excessive database load.

## Rule: HasMany-Paginate-Not-Get
---
## Category
Performance
---
## Rule
Use `paginate()`, `simplePaginate()`, or `cursorPaginate()` on `HasMany` relationship builders instead of unbounded `get()`.
---
## Reason
Unbounded `get()` loads all child records into memory. For users with thousands of children, this exhausts memory and slows the application.
---
## Bad Example
```php
$user->posts()->get(); // Loads all posts — potentially millions
```
---
## Good Example
```php
$user->posts()->paginate(20); // Loads only current page
$user->posts()->cursorPaginate(20);
```
---
## Exceptions
When the result set is guaranteed small (under 100 records) by domain constraints.
---
## Consequences Of Violation
Memory exhaustion, slow page loads, application crashes on large datasets.

## Rule: HasMany-Inverse-BelongsTo
---
## Category
Architecture
---
## Rule
Always define the inverse `BelongsTo` on the child model when defining `HasMany` on the parent.
---
## Reason
The child must be able to navigate back to its parent. Without the inverse, the child model lacks fundamental domain navigation.
---
## Bad Example
```php
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
// Post has no user() relationship
```
---
## Good Example
```php
class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```
---
## Exceptions
When the child model will never need to reference its parent (extremely rare).
---
## Consequences Of Violation
Incomplete domain model, workarounds that add query overhead.

## Rule: HasMany-Cascade-Or-Cleanup
---
## Category
Reliability
---
## Rule
Configure cascade delete on the child's foreign key or handle child cleanup in model events when deleting a parent.
---
## Reason
Without cascade or cleanup, deleting a parent leaves orphaned children with foreign keys pointing to non-existent parents. This causes constraint violations or phantom data.
---
## Bad Example
```php
$user->delete();
// All posts still exist with user_id pointing to deleted user
```
---
## Good Example
```php
// Migration
$table->foreignId('user_id')->constrained()->cascadeOnDelete();

// Or event
protected static function booted(): void
{
    static::deleting(fn ($user) => $user->posts()->delete());
}
```
---
## Exceptions
When children should outlive parents (soft-delete, archival patterns).
---
## Consequences Of Violation
Orphaned child records, foreign key constraint violations, data integrity corruption.

## Rule: HasMany-Filter-In-DB-Not-PHP
---
## Category
Performance
---
## Rule
Use `whereHas` for filtering parents by child attributes instead of loading all children and filtering in PHP collections.
---
## Reason
Loading all children into PHP memory just to filter them wastes memory and CPU. Database filtering is orders of magnitude more efficient.
---
## Bad Example
```php
$users = User::with('posts')->get();
$usersWithActivePosts = $users->filter(fn ($u) => $u->posts->contains('active', true));
```
---
## Good Example
```php
$users = User::whereHas('posts', fn ($q) => $q->where('active', true))->with('posts')->get();
```
---
## Exceptions
When the parent set is already loaded and adding a query is more expensive than filtering in PHP.
---
## Consequences Of Violation
Memory exhaustion, slow processing, unnecessary data transfer from database.

## Rule: HasMany-Use-WithCount-Over-Load
---
## Category
Performance
---
## Rule
Use `withCount('relation')` when you only need the count of children, not the child models themselves.
---
## Reason
Loading full child models just to count them wastes memory and bandwidth. A `COUNT(*)` subquery is dramatically more efficient.
---
## Bad Example
```php
$users = User::with('posts')->get();
$users->each(fn ($u) => $u->posts->count()); // Hydrates all posts
```
---
## Good Example
```php
$users = User::withCount('posts')->get();
// $user->posts_count is an integer, no model hydration
```
---
## Exceptions
When the child models are needed for display alongside their count.
---
## Consequences Of Violation
Memory bloat, slow queries, unnecessary model hydration.

## Rule: HasMany-Chunk-For-Large-Sets
---
## Category
Performance
---
## Rule
Use `chunkById()` or `lazy()` for memory-safe batch processing of large `HasMany` parent sets.
---
## Reason
Loading thousands of parent models with eager-loaded children into a single collection exhausts PHP memory. Chunking keeps memory bounded.
---
## Bad Example
```php
User::with('posts')->get()->each(fn ($user) => process($user));
// OOM with 100k users
```
---
## Good Example
```php
User::with('posts')->chunkById(100, fn ($users) => process($users));
```
---
## Exceptions
When the total result set is guaranteed under 1,000 records.
---
## Consequences Of Violation
Memory exhaustion, application crashes, failed batch jobs.

## Rule: HasMany-Ordering-For-Consistency
---
## Category
Reliability
---
## Rule
Define default ordering on `HasMany` relationships when order matters for the domain.
---
## Reason
Without explicit ordering, Eloquent returns children in unpredictable order (typically by primary key). This causes inconsistent display order across requests.
---
## Bad Example
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
    // No ordering — unpredictable results
}
```
---
## Good Example
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class)->latest();
}
```
---
## Exceptions
When the consumer always specifies their own ordering.
---
## Consequences Of Violation
Inconsistent display order, confusing user experience, hard-to-reproduce bugs.
