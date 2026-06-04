# Prunable Trait — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Prunable Trait
- **ECC Version:** 1.0

## Overview
The `Prunable` trait provides a mechanism for automatically expiring old records (typically soft-deleted ones) by defining a `prunable()` query scope that selects records eligible for pruning, and optional `pruning()` and `pruned()` lifecycle callbacks. When paired with the `model:prune` Artisan command, it enables scheduled, configurable cleanup of stale data. Each record is deleted individually (using `forceDelete()` for soft-deletable models, `delete()` otherwise), firing per-record lifecycle callbacks.

## Core Concepts
- `Prunable` trait — marks a model as eligible for automated pruning
- `prunable()` method — `Builder`-returning method defining which records to prune (e.g., `where('deleted_at', '<=', now()->subMonth())`)
- `pruning()` callback — invoked before each model is pruned; return `false` to skip
- `pruned()` callback — invoked after each model is successfully pruned (logging, cache clear, archiving)
- `prune()` method — iterates the prunable query via `cursor()` and deletes each record
- `forceDelete()` vs `delete()` — if model uses `SoftDeletes`, pruning calls `forceDelete()`; otherwise calls `delete()`
- Cursor-based iteration — uses `cursor()` to avoid loading all prunable records into memory at once

## When To Use
- Periodic cleanup of old soft-deleted records that are past the recovery window
- Expiring temporary data (sessions, notifications, cache entries, audit logs)
- Compliance-driven data retention policies (auto-delete records older than X days/months)
- Automated storage reclamation for tables that accumulate stale rows
- Any model where data has a known expiration and should be removed without manual intervention

## When NOT To Use
- Do NOT use for records that must be kept indefinitely (core business data, financial records)
- Do NOT use when bulk deletion is acceptable and per-record callbacks are unnecessary — use `MassPrunable` instead
- Do NOT use without defining `prunable()` — the method has no default and returns an empty query, resulting in a silent no-op
- Do NOT use `prunable()` with conditions that could match active (non-deleted) records unintentionally
- Do NOT use for models that need individual audit trails on deletion — pruning is a background operation

## Best Practices (WHY)
- Define `prunable()` with explicit, well-indexed conditions — the query runs on every prune invocation
- Use `pruning()` to skip individual records that shouldn't be pruned despite matching the query (e.g., pinned records)
- Use `pruned()` for archiving — copy data to a cold storage or archive table before deletion
- Test the `prunable()` query in CI with realistic data volumes to catch performance regressions
- Schedule pruning via `model:prune` in `Kernel::schedule()` during off-peak hours
- Run `model:prune --pretend` before enabling pruning in production to preview which records will be deleted

## Architecture Guidelines
- Add `Prunable` only to models with a clear data retention policy — every model should not be prunable
- Use `pruning()` for conditional skips, not as a business logic gate — the `prunable()` query should be the primary filter
- Coordinate pruning with storage cleanup — if the model has associated files, clean them in `pruned()`
- Document the retention policy per model in code comments or ADRs
- Monitor pruning duration and record count — schedule alerts for prune failures or unusually large batches

## Performance
- `cursor()` holds a single database cursor — memory usage is O(1) per record, but the connection stays open for the duration
- Each `forceDelete()` is its own transaction — for large prunes, consider wrapping batches in manual transactions
- Index the columns used in `prunable()` (typically `deleted_at` or `created_at`) — without an index, the cursor query does a full table scan
- For pruning >10k records, `MassPrunable` is significantly faster (1 query vs N queries)
- The `pruning()` callback can cause the prune to be slow if it performs I/O (archiving, API calls) per record

## Security
- Pruning permanently removes data — ensure the retention policy meets compliance requirements
- `pruned()` callback is the hook for secure data archival before deletion
- If `pruning()` throws an exception, the entire prune stops — ensure callbacks are exception-safe
- Pruning targets soft-deleted records by convention — verify the `prunable()` query does not include active records
- The `model:prune` command should be restricted to CLI/admin access only

## Common Mistakes
- Not overriding `prunable()` — the default returns an empty query, so nothing is ever pruned (silent)
- Using `prunable()` for non-soft-delete conditions — may delete records still needed for business processes
- Forgetting `forceDelete()` semantics — if the model uses `SoftDeletes`, pruning calls `forceDelete()`, not `delete()`
- Assuming `pruning()` can return void — `pruning()` should return `false` explicitly to skip; void return means continue
- Not testing `prunable()` query in CI — the query may be fast in development but slow in production with millions of rows

## Anti-Patterns
- **No `prunable()` override**: adding `Prunable` trait but never defining `prunable()` — silent no-op, no records are ever pruned
- **Prunable query without index**: writing `prunable()` against non-indexed columns — causes full table scan on every schedule
- **Heavy `pruning()`/`pruned()` callbacks**: doing expensive I/O per-record (API calls, file uploads) that makes pruning hours-long
- **No monitoring**: scheduling `model:prune` without monitoring whether it succeeds, fails, or how many records were pruned
- **Pruning during peak traffic**: running `model:prune` during business hours, causing row lock contention with user queries

## Examples
```php
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\SoftDeletes;

class ArchivedPost extends Model
{
    use SoftDeletes, Prunable;

    public function prunable(): Builder
    {
        return static::where('deleted_at', '<=', now()->subMonth());
    }

    protected function pruning(ArchivedPost $post): ?bool
    {
        // Skip pinned posts even if they are past the threshold
        if ($post->is_pinned) {
            return false;
        }
        return null; // Continue
    }

    protected function pruned(ArchivedPost $post): void
    {
        Log::info("Pruned archived post {$post->id}");
        // Archive to cold storage
        ArchivedPostLog::create($post->toArray());
    }
}

// In Kernel.php
$schedule->command('model:prune', [
    '--model' => [ArchivedPost::class],
])->daily()->withoutOverlapping();
```

## Related Topics
- mass-prunable — bulk pruning without per-record callbacks
- prune-command — the Artisan command that triggers pruning
- soft-deletes-trait — pruning typically targets soft-deleted records
- force-deleting — what pruning ultimately calls on soft-deletable models
- chunking-and-cursors — iteration strategies for large datasets

## AI Agent Notes
- Always define `prunable()` when using the `Prunable` trait — the default is a silent no-op
- Index the columns in `prunable()` — typically `deleted_at` or `created_at`
- Schedule `model:prune` via `Kernel::schedule()` with `->withoutOverlapping()`
- Use `--pretend` before first production run to preview which records will be deleted
- `Prunable` calls `forceDelete()` on soft-deletable models — records are permanently gone
- Use `pruning()` returning `false` to skip specific records; use `pruned()` for side effects

## Verification
- [ ] `prunable()` method is defined and returns correct eligible records
- [ ] `pruning()` returning `false` skips the record
- [ ] `pruned()` callback is invoked after successful deletion
- [ ] All eligible records are deleted after `prune()` completes
- [ ] Non-eligible records are not deleted
- [ ] Memory-efficient iteration (cursor-based, O(1) memory)
- [ ] Pruning without `SoftDeletes` calls `delete()` (not `forceDelete()`)
- [ ] `--pretend` mode does not modify data but shows intended deletions
- [ ] Columns used in `prunable()` are indexed
