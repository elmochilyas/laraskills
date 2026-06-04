# Phase 5: Rules — Mass Prunable

## Rule 1: Use `MassPrunable` only when per-record event firing is unnecessary
---
## Category
Architecture
---
## Rule
Apply `MassPrunable` to models where deletion tracking, auditing, or side effects at the individual record level are not required. Do not use it on models that depend on `deleting`/`deleted` events.
---
## Reason
`MassPrunable` issues a single `DELETE` query and fires zero model events. Any business logic, audit logging, cache invalidation, or cascading deletes triggered by events will be silently skipped. This creates invisible data integrity gaps.
---
## Bad Example
```php
class ArchivedPost extends Model
{
    use SoftDeletes, MassPrunable;
    // Observer registered for deleting event — but it never fires!

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subMonth());
    }
}
```
---
## Good Example
```php
class SessionLog extends Model
{
    use MassPrunable; // Ephemeral data — no events needed

    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}
```
---
## Exceptions
When external pre-prune and post-prune hooks handle side effects at a higher level (e.g., scheduled job that archives data before mass pruning).
---
## Consequences Of Violation
Silent loss of audit trails; missing cascading deletes; cache invalidation failures; notifications never sent — all without errors.
---

## Rule 2: Ensure the `prunable()` query is absolutely precise
---
## Category
Reliability
---
## Rule
Write the `prunable()` query with exact, well-tested conditions. Do not rely on a `pruning()` callback to catch or skip records — `MassPrunable` has no lifecycle hooks.
---
## Reason
`Prunable` has `pruning()` returning `false` to skip individual records. `MassPrunable` has no equivalent. If the `prunable()` query is too broad, every matched record is deleted in a single irreversible `DELETE` statement. There is no per-record safety net.
---
## Bad Example
```php
// Overly broad — no safety net
public function prunable(): Builder
{
    return static::where('deleted_at', '<=', now()->subMonth());
    // If onlyTrashed() was forgotten, active records are deleted
}
```
---
## Good Example
```php
// Precise — only eligible trashed records
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subMonth());
}
```
---
## Exceptions
No common exceptions. Always verify the `prunable()` query produces exactly the intended record set.
---
## Consequences Of Violation
Mass permanent deletion of records that should not have been deleted; catastrophic data loss with no recovery mechanism.
---

## Rule 3: Always run `--pretend` before production mass prune
---
## Category
Reliability
---
## Rule
Execute `model:prune --pretend --model=YourModel` in the production environment before the first scheduled mass prune. Do not enable mass pruning without a dry-run verification.
---
## Reason
`MassPrunable` deletes all matching records atomically. Unlike `Prunable` (which iterates one-by-one and can be interrupted), a mass prune either deletes everything or nothing. The `--pretend` run shows the exact record count and query that will be used, allowing verification before irreversible deletion.
---
## Bad Example
```php
$schedule->command('model:prune', [
    '--model' => [SessionLog::class],
])->daily();
// Deployed without --pretend — prunable() may have an incorrect filter
```
---
## Good Example
```php
// Deploy, then verify:
// ssh production "php artisan model:prune --model=SessionLog --pretend"
// Confirm 5,000 records match, ages are correct

// Then schedule:
$schedule->command('model:prune', [
    '--model' => [SessionLog::class],
])->daily();
```
---
## Exceptions
Development environments where data loss is acceptable.
---
## Consequences Of Violation
Irreversible mass deletion of incorrect records; no ability to roll back without database restore.
---

## Rule 4: Add `->limit()` in `prunable()` to batch large mass prunes
---
## Category
Performance
---
## Rule
Apply `->limit()` in the `prunable()` query when the table contains millions of rows. Do not delete more than 10,000 records per single `DELETE` statement on production tables.
---
## Reason
A single massive `DELETE` without `LIMIT` locks the table for the duration of the statement, blocks concurrent reads and writes, fills the transaction log, and causes replication lag. Batching with `LIMIT` keeps each statement short, allowing other operations to proceed between batches.
---
## Bad Example
```php
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subYear());
    // No limit — deletes potentially millions of records in one statement
}
```
---
## Good Example
```php
public function prunable(): Builder
{
    return static::onlyTrashed()
        ->where('deleted_at', '<=', now()->subYear())
        ->limit(1000);
}

// External loop to repeat until all records are pruned
```
---
## Exceptions
Tables with fewer than 10,000 eligible records where a single `DELETE` completes in under 1 second.
---
## Consequences Of Violation
Prolonged table locks blocking application queries; replication lag on read replicas; transaction log overflow on high-volume tables; deadlocks with concurrent writes.
---

## Rule 5: For soft-deletable models, explicitly filter trashed records in `prunable()`
---
## Category
Reliability
---
## Rule
Always include `onlyTrashed()` or `whereNotNull('deleted_at')` in the `prunable()` query when the model uses `SoftDeletes`. Do not assume mass prune automatically scopes to trashed records.
---
## Reason
`MassPrunable` issues a raw `DELETE FROM ... WHERE ...` based on the `prunable()` query result. It does not call `forceDelete()` (which respects `SoftDeletes`). If the `prunable()` query does not explicitly filter for trashed records, it will delete active records.
---
## Bad Example
```php
class ArchivedPost extends Model
{
    use SoftDeletes, MassPrunable;

    public function prunable(): Builder
    {
        return static::where('deleted_at', '<=', now()->subMonth());
        // This matches BOTH active and trashed records
        // because mass prune does NOT call forceDelete()
    }
}
```
---
## Good Example
```php
class ArchivedPost extends Model
{
    use SoftDeletes, MassPrunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subMonth());
        // Only matches trashed records — safe
    }
}
```
---
## Exceptions
Models without `SoftDeletes` where all records are eligible for physical deletion.
---
## Consequences Of Violation
Permanent deletion of active records from the database; catastrophic data loss with no soft-delete recovery mechanism.
---

## Rule 6: Do not combine `MassPrunable` and `Prunable` on the same model
---
## Category
Maintainability
---
## Rule
Use exactly one pruning trait per model. Do not import both `MassPrunable` and `Prunable`.
---
## Reason
Both traits define a `prune()` method. Using both causes a PHP trait method collision that must be manually resolved. The resulting behavior is unpredictable and the intent is unclear to other developers.
---
## Bad Example
```php
class SessionLog extends Model
{
    use Prunable, MassPrunable;
    // Fatal error: trait method collision on 'prune'
}
```
---
## Good Example
```php
class SessionLog extends Model
{
    use MassPrunable; // Bulk deletion without events — correct for ephemeral data

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
PHP fatal error preventing the application from booting; confusing resolution code if manually aliased.
---

## Rule 7: Implement external audit logging if mass pruning affects compliance-relevant data
---
## Category
Security
---
## Rule
Add pre-prune and post-prune audit logging when mass pruning removes compliance-relevant data. Do not rely on model events for audit trails.
---
## Reason
`MassPrunable` fires no model events, so no `deleted` or `forceDeleted` listeners execute. If the data being pruned has any compliance or audit relevance, you must implement external logging (pre-count query, post-count query) that runs alongside the mass prune.
---
## Bad Example
```php
class ArchivedNotification extends Model
{
    use SoftDeletes, MassPrunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(90));
    }
    // No audit trail — deletion of notifications is invisible
}
```
---
## Good Example
```php
class ArchivedNotification extends Model
{
    use SoftDeletes, MassPrunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(90));
    }
}

// In the prune command wrapper or schedule listener:
$before = ArchivedNotification::prunable()->count();
// Execute prune
$after = ArchivedNotification::prunable()->count();
Log::info('Mass prune completed', [
    'model' => ArchivedNotification::class,
    'records_removed' => $before - $after,
    'timestamp' => now(),
]);
```
---
## Exceptions
Completely ephemeral data with zero audit requirements (e.g., raw session tokens, temporary cache entries).
---
## Consequences Of Violation
Invisible data removal that cannot be traced; compliance audit gaps; inability to investigate data loss incidents.
---

## Rule 8: Schedule mass pruning during maintenance windows
---
## Category
Scalability
---
## Rule
Run mass prune schedules during off-peak hours or maintenance windows. Do not schedule mass pruning during peak traffic periods.
---
## Reason
A mass prune `DELETE` statement acquires table-level locks (or sufficient row locks) that block concurrent reads and writes. Running mass prune during peak hours causes application latency spikes, timeouts, and degraded user experience.
---
## Bad Example
```php
$schedule->command('model:prune', [
    '--model' => [SessionLog::class],
])->everyFourHours();
// Runs potentially during peak hours — degrades application performance
```
---
## Good Example
```php
$schedule->command('model:prune', [
    '--model' => [SessionLog::class],
])->dailyAt('03:00'); // 3 AM — lowest traffic window
```
---
## Exceptions
Applications with consistent traffic patterns 24/7. In such cases, use aggressive batching with small `->limit()` values to minimize lock duration.
---
## Consequences Of Violation
Application timeouts during peak traffic; user-facing errors from locked rows; increased database connection pool contention.
---

## Rule 9: Test `MassPrunable` with realistic data volumes in staging
---
## Category
Testing
---
## Rule
Run mass prune queries against a staging database with production-scale data volumes before deploying to production. Do not assume performance characteristics scale linearly.
---
## Reason
A `DELETE` query that executes in 50ms on 1,000 development records may take 5 minutes on 1,000,000 production records. Lock duration, transaction log growth, and replication lag are volume-dependent behaviors that only manifest at scale.
---
## Bad Example
```php
// Tested with 100 records in development — fast
// In production with 2 million records — deletes 10k rows, takes 45s, blocks reads
public function prunable(): Builder
{
    return static::where('created_at', '<=', now()->subDays(30))->limit(10000);
}
```
---
## Good Example
```php
// Staging test with 500k records:
// Confirm DELETE completes in < 2s
// Confirm no replication lag > 1s
// Then deploy with appropriate batch size:
public function prunable(): Builder
{
    return static::where('created_at', '<=', now()->subDays(30))->limit(1000);
}
```
---
## Exceptions
No common exceptions. Volume testing is required for any mass operation.
---
## Consequences Of Violation
Unexpected production incidents: prolonged table locks, replication lag, transaction log overflow, and application downtime.
---

## Rule 10: Wrap small mass prunes in a database transaction for rollback capability
---
## Category
Reliability
---
## Rule
Wrap mass prune operations on smaller datasets (<10,000 records) in an explicit database transaction. Do not leave mass prune without rollback protection when the dataset size allows it.
---
## Reason
If a mass prune `DELETE` affects fewer than 10,000 records, wrapping it in a transaction adds negligible overhead but provides a rollback safety net. If the subsequent validation query detects unexpected data loss, the transaction can be rolled back.
---
## Bad Example
```php
// No rollback capability — once committed, data is gone
public function handle(): void
{
    SessionLog::where('created_at', '<=', now()->subDays(30))->delete();
}
```
---
## Good Example
```php
public function handle(): void
{
    DB::beginTransaction();

    try {
        $count = SessionLog::where('created_at', '<=', now()->subDays(30))->delete();
        // Optional: validate expected count
        if ($count > 10000) {
            throw new UnexpectedValueException("Unexpected prune count: $count");
        }
        DB::commit();
    } catch (Throwable $e) {
        DB::rollBack();
        Log::error('Mass prune rolled back', ['error' => $e->getMessage()]);
        throw $e;
    }
}
```
---
## Exceptions
Very large datasets (>10,000 records) where transaction log size is a concern.
---
## Consequences Of Violation
Irreversible data loss from a buggy prune query; inability to recover mistakenly deleted records without database restore.
