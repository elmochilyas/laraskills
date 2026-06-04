## Default to chunkById for Mutable Datasets
---
## Category
Performance
---
## Rule
Use `chunkById()` over `chunk()` whenever the dataset may be mutated during iteration (inserts, updates, or deletes).
---
## Reason
`chunk()` uses offset-based pagination; insertions or deletions shift the offset, causing rows to be skipped or processed twice. `chunkById()` uses key-based pagination (`WHERE id > ?`) and remains stable under mutation.
---
## Bad Example
```php
User::chunk(100, function ($users) {
    $users->each->delete();
});
```
After the first chunk deletes rows, the offset changes — subsequent chunks skip rows or are empty.
---
## Good Example
```php
User::chunkById(100, function ($users) {
    $users->each->delete();
});
```
Deletions do not affect the key-based cursor; each row is processed exactly once.
---
## Exceptions
Read-only exports on static datasets where no concurrent mutations occur. Document the static assumption in a comment.
---
## Consequences Of Violation
Data corruption — rows silently skipped or processed multiple times. In batch migration scripts this leads to inconsistent state that is difficult to detect and repair.
---
## Wrap Chunk Callbacks in Transactions
---
## Category
Reliability
---
## Rule
Always wrap chunk callback body in `DB::transaction()` when performing writes.
---
## Reason
If the callback throws mid-batch, partial changes from the first half of the chunk are committed. A transaction ensures each chunk processes atomically — all succeed or all roll back.
---
## Bad Example
```php
User::chunkById(100, function ($users) {
    $users->each(fn($u) => $u->update(['processed_at' => now()]));
    // If this throws, some users are updated, some are not
    $this->sendNotification($users);
});
```
---
## Good Example
```php
User::chunkById(100, function ($users) {
    DB::transaction(function () use ($users) {
        $users->each(fn($u) => $u->update(['processed_at' => now()]));
        $this->sendNotification($users);
    });
});
```
Each chunk is atomic — failure rolls back all changes for that batch.
---
## Exceptions
Read-only processing (exports, logs) where no writes occur. The transaction adds zero benefit and unnecessary overhead.
---
## Consequences Of Violation
Partial state persistence on failure — some rows updated, others not. In idempotent jobs this may be acceptable, but in financial or data-critical operations it produces irreconcilable state.
---
## Store Checkpoints for Resumability
---
## Category
Reliability
---
## Rule
Save the last processed ID to a cache key or database column to support resumable batch processing.
---
## Reason
If a chunked job fails midway without a checkpoint, the entire dataset must be reprocessed from the start. Checkpoints enable resumption from the failure point, saving time and preventing redundant work on already-processed rows.
---
## Bad Example
```php
User::chunkById(100, function ($users) {
    $users->each(fn($u) => $u->generateReport());
});
// No checkpoint — if the job fails, all users must be reprocessed
```
---
## Good Example
```php
$lastId = Cache::get('user_report_last_id', 0);
User::where('id', '>', $lastId)->chunkById(100, function ($users) {
    $users->each(fn($u) => $u->generateReport());
    Cache::put('user_report_last_id', $users->last()->id);
});
```
On failure, the job restarts from the last checkpoint, not from the beginning.
---
## Exceptions
Ad-hoc scripts run once with no resume requirement, or datasets where full reprocessing is cheap (< 1 minute).
---
## Consequences Of Violation
Wasted compute, extended job runtime, and delayed downstream processing. For multi-hour batch jobs, restarting from zero may cause SLA violations.
---
## Never Modify the Key Column Inside chunkById
---
## Category
Reliability
---
## Rule
Do not update the column used by `chunkById()` for pagination inside the callback.
---
## Reason
`chunkById()` tracks the last key value from each batch. If the callback modifies the key column, the next batch's `WHERE id > ?` may skip rows or enter an infinite loop.
---
## Bad Example
```php
User::chunkById(100, function ($users) {
    $users->each(fn($u) => $u->update(['id' => $u->id * 10]));
});
```
Changing the `id` column causes the next batch to use an incorrect cursor value.
---
## Good Example
```php
User::chunkById(100, function ($users) {
    $users->each(fn($u) => $u->update(['name' => Str::random(8)]));
});
```
Only non-key columns are modified; the pagination cursor remains valid.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Skipped rows, duplicate processing, or infinite loops in batch jobs. The job never completes, blocking subsequent operations.
---
## Ensure the Key Column Is Indexed
---
## Category
Performance
---
## Rule
Verify that the column used by `chunk()` or `chunkById()` has a database index before deploying to production.
---
## Reason
`chunkById()` generates `WHERE id > ? ORDER BY id ASC LIMIT ?`. Without an index on the key column, each chunk query performs a full table scan, degrading from O(log n) to O(n) per batch.
---
## Bad Example
```php
Schema::table('logs', function ($table) {
    $table->string('batch_id'); // No index
});

Log::chunkById(100, fn($logs) => ..., 'batch_id');
```
Each chunk scans the entire table — catastrophic for large datasets.
---
## Good Example
```php
Schema::table('logs', function ($table) {
    $table->string('batch_id')->index();
});

Log::chunkById(100, fn($logs) => ..., 'batch_id');
```
Each chunk uses the index for O(log n) key lookups.
---
## Exceptions
Tables with fewer than 10,000 rows where a full table scan is faster than an indexed lookup.
---
## Consequences Of Violation
Exponential query time growth as the table grows. A batch job that takes 1 minute at 10k rows may take hours at 1M rows.
---
## Set Batch Size Between 100 and 1000
---
## Category
Performance
---
## Rule
Configure chunk batch size within the 100-1000 range, tuning smaller for complex models with many relations and larger for simple models.
---
## Reason
Smaller batches reduce per-query memory but increase query count and round trips. Larger batches reduce query count but increase per-chunk memory and lock duration. The 100-1000 range balances memory pressure against query overhead for typical Eloquent models.
---
## Bad Example
```php
User::chunkById(5, function ($users) { ... });
// 5 rows per chunk — 20,000 queries for 100k users, massive query overhead
```
---
## Good Example
```php
User::chunkById(500, function ($users) { ... });
// 500 rows per chunk — 200 queries for 100k users, balanced memory and query cost
```
---
## Exceptions
Models with many eager-loaded relationships may need 50-200 per chunk to stay within memory limits. Models with no relationships can use 2000-5000.
---
## Consequences Of Violation
Too-small batches: query overhead dominates, DB connection pool exhaustion. Too-large batches: memory exhaustion, long-running queries blocking other operations.
---
## Do Not Run Chunked Processing in Web Requests
---
## Category
Architecture
---
## Rule
Execute chunked batch processing in queue jobs or artisan commands, never in a web controller or middleware.
---
## Reason
Chunked processing of large datasets may run for minutes or hours. A web request has a hard timeout (typically 30-60 seconds). Long-running requests block the web server process, consume connection pool slots, and provide no user feedback.
---
## Bad Example
```php
class UserController
{
    public function exportAll()
    {
        User::chunkById(100, function ($users) {
            // This may run for minutes — request times out
            $users->each->exportToExternalService();
        });
    }
}
```
---
## Good Example
```php
class ExportAllUsersJob implements ShouldQueue
{
    public function handle(): void
    {
        User::chunkById(100, function ($users) {
            $users->each->exportToExternalService();
        });
    }
}
```
The web request dispatches the job and returns immediately; processing happens in the background.
---
## Exceptions
Trivially small datasets (< 1000 rows) where full processing completes within the request timeout.
---
## Consequences Of Violation
HTTP timeouts, abandoned database connections, poor user experience, process starvation on the web server.
---
## Never Use chunkById on Non-Unique Columns
---
## Category
Reliability
---
## Rule
Ensure the column passed to `chunkById()` is strictly unique and monotonically increasing.
---
## Reason
`chunkById()` paginates using `WHERE column > lastValue`. If the column has duplicate values, the next batch picks up rows with the same value as `lastValue`, causing infinite loops. If the column can decrease, rows may be skipped.
---
## Bad Example
```php
User::chunkById(100, fn($users) => ..., 'status');
// status has duplicates and is not monotonically increasing — infinite loop
```
---
## Good Example
```php
User::chunkById(100, fn($users) => ..., 'id');
// Primary key is unique, monotonically increasing — safe
```
---
## Exceptions
UUID/ULID columns that are strictly increasing (ordered UUIDs). Plain UUIDs are not monotonically increasing — use a dedicated auto-increment or timestamp column.
---
## Consequences Of Violation
Infinite loops in batch jobs consuming CPU and database connections indefinitely, or skipped rows producing incomplete processing.
