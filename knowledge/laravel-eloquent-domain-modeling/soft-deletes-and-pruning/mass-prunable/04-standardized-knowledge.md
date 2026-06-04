# Mass Prunable — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Mass Prunable
- **ECC Version:** 1.0

## Overview
The `MassPrunable` trait provides a bulk-pruning alternative to `Prunable` that issues a single `DELETE` query for all eligible records instead of deleting them one by one. This is significantly faster for large datasets but does NOT fire model events or lifecycle callbacks (`pruning()`/`pruned()`). It is ideal for ephemeral data where individual record processing is unnecessary. The trait uses the same `prunable()` method signature as `Prunable`, making it easy to switch between the two.

## Core Concepts
- `MassPrunable` trait — bulk pruning without per-record events or callbacks
- `prunable()` method — identical signature to `Prunable`'s `prunable()`; defines which records qualify for deletion
- Bulk `DELETE` — issues a single `DELETE FROM ... WHERE ...` query instead of N individual deletes
- No `pruning()`/`pruned()` — mass pruning does not define or call lifecycle hooks
- `SoftDeletes` interaction — if the model uses `SoftDeletes`, the mass prune issues a real `DELETE` directly (not `forceDelete()`)
- No cursor — single `DELETE` statement; no per-record iteration or model hydration

## When To Use
- Large cleanup operations where per-record events are unnecessary (10k+ records)
- Ephemeral data (sessions, log entries, notifications) where individual deletion tracking is irrelevant
- Bulk archiving — deleting old data after it has been exported/archived externally
- Performance-critical background cleanup jobs where speed matters over event fidelity
- Tables with high write throughput where individual deletes would cause too many transactions

## When NOT To Use
- Do NOT use when per-record event firing is required — use `Prunable` instead
- Do NOT use when `pruning()`/`pruned()` callbacks are needed — mass pruning has no lifecycle hooks
- Do NOT use when you need to skip individual records based on runtime conditions — `prunable()` query must be precise
- Do NOT use on tables with millions of rows without batching — a single massive `DELETE` can lock the table for minutes
- Do NOT combine with `Prunable` on the same model — trait method collision on `prune()`

## Best Practices (WHY)
- Ensure the `prunable()` query is precise — no `pruning()` callback exists to catch exceptions
- Always run `--pretend` first in production to verify which records match before actual deletion
- Wrap mass prune in a database transaction for rollback capability on smaller datasets
- Batch large prunes with `->limit()` in `prunable()` and loop externally to avoid table locks
- Schedule mass pruning during maintenance windows — bulk `DELETE` impacts concurrent read performance
- Test with realistic data volumes in staging — a query that deletes 100 records in dev may delete 1M in production

## Architecture Guidelines
- Use `MassPrunable` for ephemeral data where side effects are handled at a higher level (e.g., scheduled archiving before prune)
- Keep `MassPrunable` and `Prunable` on separate models — never on the same model
- Implement external audit logging if mass pruning affects compliance-relevant data — the trait itself doesn't fire events
- For cascading deletes, ensure the database schema uses `ON DELETE CASCADE` — mass prune does not cascade at the application level
- Monitor replication lag — a massive single `DELETE` creates one large transaction that must be applied to replicas

## Performance
- Single `DELETE` vs N deletes — for 10k records, the difference is ~1ms vs potentially 5000ms (plus 10k transaction commits)
- Table locking — a large `DELETE` without `LIMIT` locks the table for the duration; batch with `->limit(1000)` and loop
- Binary log growth — bulk `DELETE` generates fewer binary log entries than N individual deletes
- InnoDB buffer pool — bulk `DELETE` marks pages as dirty; on very large deletes, I/O spike during flush
- No model hydration — the query operates entirely at the SQL level, avoiding Eloquent overhead

## Security
- No per-record audit events — mass pruning removes records silently; implement pre-and-post checks externally
- The `prunable()` query must be absolutely correct — there is no `pruning()` safety net to skip records
- A buggy `prunable()` query (e.g., missing `whereNotNull('deleted_at')`) can delete active records
- Use `--pretend` as a mandatory pre-flight check before running mass prune in production
- Foreign key constraints may cause the bulk `DELETE` to fail — test with the full dataset

## Common Mistakes
- Applying `MassPrunable` where `Prunable` is needed — if your app depends on `deleting` events, mass prune silently skips them
- Forgetting the model uses `SoftDeletes` — the prunable query must explicitly filter `deleted_at` conditions
- No limit on prunable query — deleting millions of records in one statement causes prolonged table locks
- Assuming mass prune fires observers — it does not; side effects (cache clear, notifications) must be handled separately
- Combining `Prunable` and `MassPrunable` on the same model — trait method collision on `prune()`

## Anti-Patterns
- **Using `MassPrunable` when per-record side effects matter**: caching, notifications, or archival that depends on `deleting` events
- **No `--pretend` before production**: running mass prune blind can delete more records than intended
- **No batch limit**: deleting millions of records in one SQL statement — table lock, replication lag, transaction log overflow
- **Missing `deleted_at` filter on soft-deletable models**: `prunable()` that deletes active records without checking soft-delete state
- **Expecting `pruning()` callbacks**: implementing `pruning()` on a model with `MassPrunable` — it's never called

## Examples
```php
use Illuminate\Database\Eloquent\MassPrunable;

class SessionLog extends Model
{
    use MassPrunable;

    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}

// Soft-deletable model with mass prune
class ArchivedNotification extends Model
{
    use SoftDeletes, MassPrunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(90));
    }
}

// Batched mass prune in custom command
class PruneSessionLogs extends Command
{
    public function handle()
    {
        do {
            $deleted = SessionLog::where('created_at', '<=', now()->subDays(30))
                ->limit(1000)
                ->delete();
        } while ($deleted > 0);
    }
}

// In Kernel.php
$schedule->command('model:prune', [
    '--model' => [SessionLog::class],
])->daily()->withoutOverlapping();
```

## Related Topics
- prunable-trait — the per-record alternative to mass pruning
- prune-command — the Artisan command that triggers pruning
- soft-deletes-trait — interaction between `MassPrunable` and `SoftDeletes`
- chunking-and-batching — strategies for limiting bulk delete size
- builder-deletions — how `Builder::delete()` works at the SQL level

## AI Agent Notes
- `MassPrunable` issues a single `DELETE` — no per-record events or callbacks
- Same `prunable()` method signature as `Prunable` — switch by changing the trait import
- No `pruning()`/`pruned()` callbacks — the `prunable()` query must be precise
- For soft-deletable models, explicitly filter with `onlyTrashed()` or `whereNotNull('deleted_at')`
- Always run `--pretend` before first production use to verify the scope of deletion
- Batch large deletes with `->limit()` to prevent table locks
- Do NOT combine `MassPrunable` and `Prunable` on the same model

## Verification
- [ ] `MassPrunable` deletes all eligible records
- [ ] Single `DELETE` query is issued (verify via DB query log)
- [ ] No model events fired (`deleting`/`deleted` listeners report 0 calls)
- [ ] Mass prune with `SoftDeletes` deletes only eligible trashed records
- [ ] Active records are untouched; eligible trashed records permanently removed
- [ ] `--pretend` mode does not delete records but shows expected count
- [ ] Mass prune handles limited batch size via `->limit()` in `prunable()`
- [ ] Performance: bulk `DELETE` is significantly faster than per-record iteration
