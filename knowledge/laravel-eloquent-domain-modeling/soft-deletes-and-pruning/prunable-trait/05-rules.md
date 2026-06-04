# Phase 5: Rules — Prunable Trait

## Rule 1: Always override `prunable()` when using the `Prunable` trait
---
## Category
Reliability
---
## Rule
Define a `prunable()` method on every model that uses the `Prunable` trait. Do not add the trait without defining the method.
---
## Reason
The default `prunable()` returns an empty query with `whereRaw('0 = 1')`, making `prune()` a silent no-op. The trait compiles and runs but never deletes any records, giving a false sense of cleanup.
---
## Bad Example
```php
class ArchivedPost extends Model
{
    use SoftDeletes, Prunable;
    // No prunable() method — records are never pruned, silently
}
```
---
## Good Example
```php
class ArchivedPost extends Model
{
    use SoftDeletes, Prunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subMonth());
    }
}
```
---
## Exceptions
Subclasses inheriting `prunable()` from a parent class where the parent definition is correct.
---
## Consequences Of Violation
Pruning never executes, soft-deleted records accumulate indefinitely, table bloat degrades performance over time.
---

## Rule 2: Index all columns used in the `prunable()` query
---
## Category
Performance
---
## Rule
Add database indexes on every column referenced in the `prunable()` method's WHERE clause. Do not rely on full table scans for prune queries.
---
## Reason
The `prunable()` query runs on every prune invocation. Without indexes on columns like `deleted_at`, `created_at`, or status flags, the query performs a full table scan. On tables with millions of rows, this causes significant database load during each prune cycle.
---
## Bad Example
```php
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth());
}
// No index on deleted_at — full table scan on every prune
```
---
## Good Example
```php
// In migration:
$table->index('deleted_at');

// In model:
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth());
}
```
---
## Exceptions
Tables with fewer than 10,000 rows where full table scans are negligible.
---
## Consequences Of Violation
Heavy database load during each prune cycle; slow pruning that takes hours instead of minutes; potential replication lag and query timeouts.
---

## Rule 3: Keep `pruning()` and `pruned()` callbacks lightweight
---
## Category
Performance
---
## Rule
Limit `pruning()` and `pruned()` callbacks to fast, in-process operations. Do not perform expensive I/O (HTTP calls, file uploads, email sends) in these callbacks.
---
## Reason
These callbacks run per-record during cursor-based iteration. An HTTP call in `pruned()` that takes 200ms becomes 200 seconds for 1,000 records. The database cursor stays open for the entire duration, risking connection timeouts and holding locks.
---
## Bad Example
```php
protected function pruned(ArchivedPost $post): void
{
    Http::post('https://archive.example.com/store', $post->toArray());
    Mail::to('admin@example.com')->send(new PostPruned($post));
    Storage::disk('s3')->put("archive/{$post->id}.json", $post->toJson());
}
```
---
## Good Example
```php
protected function pruned(ArchivedPost $post): void
{
    // Queue side effects instead of executing them inline
    ArchivePostData::dispatch($post->id);
}

// Or batch for efficiency:
protected function pruned(ArchivedPost $post): void
{
    $this->archivedIds ??= collect();
    $this->archivedIds->push($post->id);
}

// Then in prune() override, dispatch after cursor completes
```
---
## Exceptions
Operations that must be synchronous (e.g., deleting associated files from storage in `pruned()`). Always add logging around synchronous I/O.
---
## Consequences Of Violation
Excessive prune duration (hours vs minutes); database cursor timeout; connection pool exhaustion from long-running prunes; overlapping prune schedules.
---

## Rule 4: Use `pruning()` returning `false` to conditionally skip records
---
## Category
Maintainability
---
## Rule
Return `false` from `pruning()` to skip a record that should not be pruned despite matching the `prunable()` query. Do not add complex exclusion logic to the `prunable()` query itself.
---
## Reason
The `prunable()` query should be a simple, indexable filter of eligible records. Runtime conditions that cannot be expressed in SQL (API checks, user preferences, external signals) belong in the `pruning()` callback. Complex query conditions degrade performance and reduce index utilization.
---
## Bad Example
```php
// Complex, non-indexable query conditions
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth())
        ->whereHas('roles', fn ($q) => $q->where('can_prune', true));
}
```
---
## Good Example
```php
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth());
}

protected function pruning(ArchivedPost $post): ?bool
{
    return $post->is_pinned ? false : null;
}
```
---
## Exceptions
Exclusion logic that can be expressed as a simple, indexable SQL condition (e.g., `where('is_pinned', false)`).
---
## Consequences Of Violation
Slow prunable queries with complex JOINs or subqueries; reduced index utilization; difficult-to-maintain query logic.
---

## Rule 5: Schedule `model:prune` with `->withoutOverlapping()` in `Kernel::schedule()`
---
## Category
Reliability
---
## Rule
Always chain `->withoutOverlapping()` on the scheduled `model:prune` command. Do not schedule pruning without concurrency protection.
---
## Reason
If a prune run takes longer than the schedule interval (e.g., daily prune takes 26 hours), the next invocation starts before the previous one completes. This causes two cursor-iteration loops on the same records simultaneously, wasting database resources and potentially corrupting data.
---
## Bad Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('model:prune')->daily();
    // If prune takes >24h, overlapping runs will occur
}
```
---
## Good Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('model:prune')
        ->daily()
        ->withoutOverlapping();
}
```
---
## Exceptions
Prune operations guaranteed to complete in well under the schedule interval (e.g., sub-second prune scheduled every hour with a 5-minute timeout).
---
## Consequences Of Violation
Concurrent prune processes competing for the same records; doubled database load; potential deadlocks; missed schedule windows.
---

## Rule 6: Run `model:prune --pretend` before enabling pruning in production
---
## Category
Reliability
---
## Rule
Execute `model:prune --pretend` in the production environment before enabling the scheduled prune. Review the output to verify the `prunable()` query matches the expected records.
---
## Reason
The `prunable()` query behavior in production may differ from development due to data volume, date ranges, or state differences. A `--pretend` run shows exactly which records would be deleted without actually deleting them, catching bugs like missing `onlyTrashed()` filters or incorrect date conditions.
---
## Bad Example
```php
// Deployed to production without preview — deleted 50k active records
protected function schedule(Schedule $schedule): void
{
    $schedule->command('model:prune', [
        '--model' => [User::class],
    ])->daily();
}
```
---
## Good Example
```php
// Pre-deployment verification
ssh production "php artisan model:prune --model=User --pretend"
// Review output, confirm only trashed records > 1 year old would be pruned

// Then deploy the schedule
```
---
## Exceptions
Development and staging environments only, where data loss is acceptable.
---
## Consequences Of Violation
Mass deletion of active records due to a buggy `prunable()` query; catastrophic data loss requiring database restore.
---

## Rule 7: Test the `prunable()` query in CI with realistic data volumes
---
## Category
Testing
---
## Rule
Write a CI test that creates records matching the prune conditions and asserts they are included in the `prunable()` result. Do not maintain prune logic without automated verification.
---
## Reason
Changes to the `prunable()` query or the model's relationships can silently alter what qualifies for pruning. Without a test, a refactored query may include active records or exclude eligible trashed records, causing data loss or retention bloat.
---
## Bad Example
```php
// No test — any refactor may change the prunable query behavior
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth());
}
```
---
## Good Example
```php
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth());
}

// Test
public function test_prunable_returns_eligible_records(): void
{
    $eligible = ArchivedPost::factory()->create([
        'deleted_at' => now()->subMonths(2),
    ]);
    $recent = ArchivedPost::factory()->create([
        'deleted_at' => now()->subDays(5),
    ]);

    $prunable = ArchivedPost::prunable()->get();

    $this->assertTrue($prunable->contains($eligible));
    $this->assertFalse($prunable->contains($recent));
}
```
---
## Exceptions
No common exceptions. Always test the `prunable()` query.
---
## Consequences Of Violation
Catastrophic production incidents from query changes; regressions undetected until the next prune cycle; difficult debugging of prune behavior.
---

## Rule 8: Do not use `Prunable` on models without a defined data retention policy
---
## Category
Architecture
---
## Rule
Apply `Prunable` only to models with a documented data retention policy. Do not add pruning without specifying how long records are retained.
---
## Reason
Without a documented retention policy, the `prunable()` date condition is arbitrary. Different developers may change it without understanding the business implications (legal retention requirements, user expectations for recovery). A documented policy commits the team to a specific retention window.
---
## Bad Example
```php
class ArchivedPost extends Model
{
    use SoftDeletes, Prunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()->where('deleted_at', '<=', now()->subMonth());
    }
    // No documentation — why 30 days? Is it a legal requirement?
}
```
---
## Good Example
```php
/**
 * ArchivedPost retention policy:
 * - Soft-deleted posts are kept for 90 days for author recovery
 * - After 90 days, they are permanently pruned
 * - Legal requirement: GDPR right to erasure handled separately
 */
class ArchivedPost extends Model
{
    use SoftDeletes, Prunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(90));
    }
}
```
---
## Exceptions
Development-only models with no data retention requirements.
---
## Consequences Of Violation
Arbitrary retention periods that violate legal requirements; user data deleted before the promised recovery window; or data retained beyond the legal maximum.
---

## Rule 9: Use `MassPrunable` when pruning more than 10,000 records per cycle and per-record callbacks are unnecessary
---
## Category
Performance
---
## Rule
Switch from `Prunable` to `MassPrunable` when pruning large batches (>10,000 records) where per-record events are not needed. Do not use `Prunable` for bulk cleanup without callbacks.
---
## Reason
`Prunable` issues one `DELETE` per record via `forceDelete()` — 10,000 records = 10,000 queries. `MassPrunable` issues a single `DELETE` statement for all eligible records. The difference can be seconds vs hours. Use `Prunable` only when `pruning()`/`pruned()` callbacks are genuinely needed.
---
## Bad Example
```php
// 50k session logs being deleted one-by-one unnecessarily
class SessionLog extends Model
{
    use Prunable; // No pruning/pruned callbacks defined — wasted per-record iteration

    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}
```
---
## Good Example
```php
class SessionLog extends Model
{
    use MassPrunable; // Single DELETE query, no callbacks needed

    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}
```
---
## Exceptions
When per-record callbacks are required even for large batches (e.g., archiving each record before deletion).
---
## Consequences Of Violation
Unnecessary database load from millions of individual DELETE queries; prune operations that take hours instead of seconds; connection pool exhaustion.
---

## Rule 10: Do not combine `Prunable` and `MassPrunable` on the same model
---
## Category
Maintainability
---
## Rule
Use only one pruning trait per model — either `Prunable` or `MassPrunable`. Do not use both.
---
## Reason
Both traits define a `prune()` method. Using both causes a trait method collision that must be manually resolved, and the resulting behavior is confusing (are records pruned one-by-one or in bulk?). The choice should be clear per model.
---
## Bad Example
```php
class SessionLog extends Model
{
    use Prunable, MassPrunable;
    // Trait method collision on prune() — ambiguous behavior
}
```
---
## Good Example
```php
class SessionLog extends Model
{
    use MassPrunable; // Clear intent: bulk pruning, no per-record callbacks

    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}
```
---
## Exceptions
No common exceptions. The traits are mutually exclusive by design.
---
## Consequences Of Violation
PHP fatal error from trait method collision; confusing, difficult-to-maintain code.
