# Phase 5: Rules — Performance Tradeoffs

## Rule 1: Fix N+1 Before Optimizing Hydration
---
## Category
Performance
---
## Rule
Always fix N+1 query problems before considering hydration optimization. Never switch to `toBase()` or Query Builder while N+1 still exists.
---
## Reason
N+1 is the dominant Eloquent performance problem — one lazy-loaded relationship in a loop of 100 items adds 100 extra queries. Hydration optimization saves 2-5µs per row (~0.5ms for 100 rows). Fixing N+1 saves 100 database round trips (~500-5000ms). N+1 is 1000x more impactful.
---
## Bad Example
```php
// Optimized hydration but N+1 still present
$users = User::toBase()->get();
foreach ($users as $user) {
    $posts = DB::table('posts')->where('user_id', $user->id)->get(); // N+1!
}
```
---
## Good Example
```php
// Fix N+1 first — eager load
$users = User::with('posts')->get();
foreach ($users as $user) {
    $user->posts; // already loaded
}
```
---
## Exceptions
No common exceptions. N+1 must always be fixed before any other optimization.
---
## Consequences Of Violation
Severe performance degradation from 100+ queries per page; database server overload; response times in seconds rather than milliseconds; optimization effort directed at the wrong bottleneck.

## Rule 2: Never Use `get()` for Result Sets Exceeding 10,000 Rows
---
## Category
Performance
---
## Rule
Use `chunkById()`, `cursor()`, or `paginate()` instead of `get()` when the expected result set exceeds 10,000 rows. Never load large datasets into memory with a single `get()` call.
---
## Reason
Each hydrated model consumes ~2-4KB of memory. 50,000 models at 3KB each = 150MB — exceeding typical PHP memory limits (128MB). `chunkById()` processes in batches of 100; `cursor()` streams one row at a time.
---
## Bad Example
```php
// 50k rows -> ~150MB memory — OOM crash
$users = User::where('active', true)->get();
foreach ($users as $user) {
    $user->sendEmail();
}
```
---
## Good Example
```php
// Processes in batches of 100 — ~300KB per batch
User::where('active', true)->chunkById(100, fn($users) => $users->each->sendEmail());
```
---
## Exceptions
APIs and paginated list endpoints where result sets are naturally bounded (e.g., `User::paginate(20)` returns max 20 rows).
---
## Consequences Of Violation
Out-of-memory crashes in production; PHP process killed by OOM killer; incomplete data processing; request timeouts.

## Rule 3: Enable `Model::preventLazyLoading()` in Development to Catch N+1 Early
---
## Category
Performance
---
## Rule
Call `Model::preventLazyLoading()` in development and testing environments. Configure lazy loading violation handling in production to log, not throw.
---
## Reason
N+1 queries are invisible during development without explicit detection. `preventLazyLoading()` throws an exception when a relationship is lazy-loaded, forcing developers to add eager loading before code reaches production.
---
## Bad Example
```php
// No prevention — N+1 goes undetected until production
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {}
}
```
---
## Good Example
```php
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {
        Model::preventLazyLoading(!$this->app->isProduction());
    }
}
```
---
## Exceptions
Production environments must NOT throw exceptions but should log violations via `Model::handleLazyLoadingViolationUsing()`.
---
## Consequences Of Violation
N+1 queries deployed to production; slow page loads discovered by users, not developers; emergency hotfixes to add eager loading under pressure.

## Rule 4: Use `chunkById()` for Stable Batch Pagination Over Simple Offset
---
## Category
Performance
---
## Rule
Use `chunkById()` instead of `offset`/`limit` pagination for batch processing jobs. Do not use offset pagination for large datasets with concurrent writes.
---
## Reason
Offset pagination is unstable when rows are inserted or deleted between pages — rows shift positions, causing duplicates or missed records. `chunkById()` uses a stable `WHERE id > lastId` approach that is immune to row insertion shifting.
---
## Bad Example
```php
// Offset pagination — unstable with concurrent writes
$page = 1;
do {
    $users = User::skip(($page - 1) * 100)->take(100)->get();
    $page++;
} while ($users->isNotEmpty());
```
---
## Good Example
```php
// chunkById — stable against insertion shifting
User::chunkById(100, function ($users) {
    foreach ($users as $user) {
        // process
    }
});
```
---
## Exceptions
User-facing pagination where stable ordering by `created_at` is required and concurrent writes are rare. Offset pagination is acceptable there but consider cursor pagination for larger datasets.
---
## Consequences Of Violation
Duplicate processing of records; missed records in batch jobs; inconsistent data exports; unreliable ETL pipelines.

## Rule 5: Select Only Needed Columns to Reduce Hydration Overhead
---
## Category
Performance
---
## Rule
Use `select()` to specify only the columns required for the operation. Avoid selecting all columns (`select('*')`) when only a subset is needed.
---
## Reason
Hydration overhead scales with the number of attributes. A model with 20 columns selected instead of 5 consumes more memory (~4x) and takes longer to hydrate. Database transfer also increases proportionally.
---
## Bad Example
```php
// Fetches all columns — 20+ unnecessary attributes hydrated
$names = User::where('active', true)->get()->pluck('name');
```
---
## Good Example
```php
// Only fetches needed columns
$names = User::where('active', true)->select('name')->get()->pluck('name');
```
---
## Exceptions
When all attributes are needed for downstream processing (serialization, API resources). When the query is on a small table (< 1000 rows) with few columns.
---
## Consequences Of Violation
Unnecessary memory consumption; slower hydration; increased database I/O; higher hosting costs from inefficient data transfer.

## Rule 6: Use `cursor()` Instead of `chunk()` for True Streaming Iteration
---
## Category
Performance
---
## Rule
Use `cursor()` when you need to stream each record individually without loading batches into memory. Use `chunkById()` when you need batching but with stable pagination.
---
## Reason
`cursor()` uses unbuffered queries — rows are fetched one at a time from the database connection. `chunk()` fetches batches of 100 rows into memory. For processing that must be truly streamed (large files, long-running iterations), `cursor()` has constant memory usage.
---
## Bad Example
```php
// chunk() loads batches into memory — 100 rows at a time
User::chunk(100, fn($users) => $users->each->sendEmail());
```
---
## Good Example
```php
// cursor() — one row at a time, constant memory
foreach (User::where('active', true)->cursor() as $user) {
    $user->sendEmail();
}
```
---
## Exceptions
When the processing callback benefits from working on batches (e.g., bulk inserts, batch API calls). Use `chunkById()` in those cases.
---
## Consequences Of Violation
Higher memory usage than necessary; connection held for the duration of iteration (both `cursor()` and `chunk()` hold connections); slower iteration on very large datasets.

## Rule 7: Cache Frequent Query Results with Correct Invalidation
---
## Category
Performance
---
## Rule
Cache the results of frequently executed, read-heavy queries when the underlying data changes infrequently. Implement cache invalidation via model events.
---
## Reason
Repeating the same expensive query 1000 times per minute wastes database resources. Caching with event-based invalidation reduces database load by 100x while keeping data fresh.
---
## Bad Example
```php
// Database queried on every request
public function activeUsersCount(): int {
    return User::where('active', true)->count();
}
```
---
## Good Example
```php
public function activeUsersCount(): int {
    return Cache::remember('active_users_count', 3600, fn() =>
        User::where('active', true)->count()
    );
}

// Invalidation on model event
class User extends Model {
    protected static function booted(): void {
        static::created(fn() => Cache::forget('active_users_count'));
        static::updated(fn() => Cache::forget('active_users_count'));
        static::deleted(fn() => Cache::forget('active_users_count'));
    }
}
```
---
## Exceptions
Real-time dashboards where data must be current to the second. Write-heavy tables where cache invalidation overhead exceeds the query cost.
---
## Consequences Of Violation
Unnecessary database load; slower response times; higher database costs; scalability bottlenecks under high traffic.
