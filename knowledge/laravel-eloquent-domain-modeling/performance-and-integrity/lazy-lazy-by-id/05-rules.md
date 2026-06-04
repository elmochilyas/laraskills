## Use lazyById for Concurrent Scenarios by Default
---
## Category
Performance
---
## Rule
Use `lazyById()` instead of `lazy()` when the dataset may be mutated during iteration.
---
## Reason
`lazy()` has the same offset-drift problem as `chunk()` — inserts or deletions during iteration shift the position, causing rows to be skipped or processed twice. `lazyById()` uses key-based pagination that is stable under concurrent mutations.
---
## Bad Example
```php
User::lazy(100)->each(function ($user) {
    $user->update(['processed_at' => now()]);
});
// Offset drift: deletions during iteration skip rows
```
---
## Good Example
```php
User::lazyById(100)->each(function ($user) {
    $user->update(['processed_at' => now()]);
});
// Key-based: mutations do not affect the cursor
```
---
## Exceptions
Read-only iteration on static datasets where no concurrent mutations occur. Document the static assumption.
---
## Consequences Of Violation
Rows silently skipped or processed multiple times. Batch jobs produce incorrect results, and the inconsistency is difficult to detect without comparing input and output counts.
---
## Use with() Before lazy() for Relationships
---
## Category
Performance
---
## Rule
Chain `with()` before `lazy()` when the iteration loop accesses relationships on each model.
---
## Reason
Unlike `cursor()`, `lazy()` respects eager loading. Calling `with()` before `lazy()` loads relationships in one query per chunk per relation instead of one query per model. This prevents N+1 query explosions within each chunk.
---
## Bad Example
```php
foreach (User::lazy(100) as $user) {
    echo $user->profile->display_name; // N+1: 100 queries per chunk
}
```
---
## Good Example
```php
foreach (User::with('profile')->lazy(100) as $user) {
    echo $user->profile->display_name; // 1 extra query per chunk
}
```
---
## Exceptions
Iteration that never accesses any relationships — no eager loading needed.
---
## Consequences Of Violation
N+1 query explosion within each chunk. For 100 chunks of 100 users accessing one relationship each: 10,100 queries instead of 200. Performance degrades linearly with dataset size.
---
## Never Materialize the LazyCollection
---
## Category
Performance
---
## Rule
Do not call `->toArray()`, `->all()`, `->count()`, or `collect()` on a `LazyCollection` returned by `lazy()` or `lazyById()`.
---
## Reason
`LazyCollection` processes items one chunk at a time, keeping memory bounded by chunk size. Materialization methods force all chunks to be fetched and loaded into memory at once, defeating the memory-efficiency purpose of lazy iteration.
---
## Bad Example
```php
$users = User::lazy(100)->toArray();
// All users loaded into memory — memory usage equals full dataset size
```
---
## Good Example
```php
foreach (User::lazy(100) as $user) {
    // One chunk of 100 in memory at a time
}
```
---
## Exceptions
Small datasets (< 1000 rows) where memory is not a concern — but then `get()` is simpler.
---
## Consequences Of Violation
Memory exhaustion on large datasets. The PHP process exceeds its memory limit and is killed, causing the batch job to fail without completing.
---
## Size Chunks According to Model Complexity
---
## Category
Performance
---
## Rule
Tune chunk size based on model complexity: 50-200 for models with many eager-loaded relationships, 1000-5000 for simple models with no relations.
---
## Reason
Each chunk holds N models plus all their eager-loaded relations in memory. A chunk of 500 models with 5 relations each (profile, posts, comments, settings, roles) may consume 50+ MB. A chunk of 5000 simple models (only scalar columns) uses far less. Matching chunk size to model complexity prevents memory spikes.
---
## Bad Example
```php
User::with('profile', 'posts', 'comments', 'settings', 'roles')
    ->lazy(5000) // 5000 users × 5 relations — potential memory spike
    ->each(fn($u) => ...);
```
---
## Good Example
```php
User::with('profile', 'posts', 'comments', 'settings', 'roles')
    ->lazy(100) // Smaller chunk for relation-heavy models
    ->each(fn($u) => ...);
```
---
## Exceptions
CLI commands with generous memory limits (memory_limit = 1G+) where larger chunks improve throughput.
---
## Consequences Of Violation
Out-of-memory errors in production batch jobs. Intermittent failures that correlate with dataset growth but are hard to reproduce locally.
---
## Place Lazy Iteration in CLI or Queue Contexts
---
## Category
Architecture
---
## Rule
Execute `lazy()` or `lazyById()` iteration in artisan commands or queue jobs, not in web controllers.
---
## Reason
While less dangerous than `cursor()` (chunks release the connection between batches), lazy iteration adds latency unpredictability to web requests. The processing time depends on the dataset size, which grows over time. A controller that takes 200ms today may take 2 seconds in six months.
---
## Bad Example
```php
class PostController
{
    public function generateReport()
    {
        $output = '';
        foreach (Post::lazy(100) as $post) {
            $output .= $post->generateReportLine(); // Web request — latency grows
        }
        return response($output);
    }
}
```
---
## Good Example
```php
class GenerateReportJob implements ShouldQueue
{
    public function handle(): void
    {
        foreach (Post::lazy(100) as $post) {
            // Background — no timeout concern
        }
    }
}
```
---
## Exceptions
Trivially small datasets (< 1000 rows) guaranteed not to grow beyond that bound. Document the bound and add monitoring.
---
## Consequences Of Violation
Gradual page load degradation as data grows. The team may not notice until users report slowness, by which time the fix requires refactoring the endpoint to use a queue job.
---
## Never Iterate a LazyCollection Twice
---
## Category
Reliability
---
## Rule
Create a new query to re-iterate a dataset. Do not attempt to iterate a `LazyCollection` more than once.
---
## Reason
`LazyCollection` wraps a PHP generator, which cannot be rewound. The second iteration produces no results or throws a generator error. Sharing the lazy variable across multiple consumers leads to subtle bugs.
---
## Bad Example
```php
$users = User::lazy(100);
foreach ($users as $user) { /* process */ }
foreach ($users as $user) { /* process again */ }
// Second foreach produces nothing — generator already consumed
```
---
## Good Example
```php
// Create a fresh query for each iteration
foreach (User::lazy(100) as $user) { /* first pass */ }
foreach (User::lazy(100) as $user) { /* second pass */ }
```
---
## Exceptions
No common exceptions. Re-consumable iteration requires materializing the collection (which defeats the purpose of lazy).
---
## Consequences Of Violation
Silent data under-processing — the second iteration produces zero results. Downstream operations miss processing entirely, and the bug is hard to trace because no error is thrown.
