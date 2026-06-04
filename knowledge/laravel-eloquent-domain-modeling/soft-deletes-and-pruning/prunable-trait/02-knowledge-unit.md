# Prunable Trait

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
The `Prunable` trait provides a mechanism for automatically expiring old records (typically soft-deleted ones) by defining a `prunable()` query scope that selects records eligible for pruning, and optional `pruning()` and `pruned()` lifecycle callbacks. When paired with the `model:prune` Artisan command, it enables scheduled, configurable cleanup of stale data.

## Core Concepts
- **`Prunable` trait** — added to a model to mark it as eligible for automated pruning.
- **`prunable()` method** — a `Builder`-returning method that defines the query for records to prune. Conventionally returns `Model::where('created_at', '<=', now()->subMonth())` for soft-deleted records.
- **`pruning()` callback** — invoked before each model is pruned (i.e., before the actual delete/forceDelete). Can return `false` to skip the record.
- **`pruned()` callback** — invoked after each model is successfully pruned.
- **`prune()` method** — the concrete action that iterates the prunable query and deletes each record (using `forceDelete()` if the model uses `SoftDeletes`, or `delete()` otherwise).
- **`massPrune()` vs `prune()`** — `Prunable` trait calls `forceDelete()` per record (firing events). `MassPrunable` trait uses bulk delete (no events).

## Mental Models
- **Garbage collection** — `prunable()` defines what qualifies as garbage. `pruning()`/`pruned()` are hooks before/after collection. The Artisan command is the GC trigger.
- **Selective sweep** — unlike a raw `DELETE`, pruning respects lifecycle callbacks, making it safe to integrate with audit trails, cache invalidation, and storage cleanup.
- **Opt-in perishability** — models without `Prunable` last forever. Adding the trait declares "this model has an expiration date."

## Internal Mechanics

### `prunable()` method
- Must be defined on the model. Returns an Eloquent `Builder` or `QueryBuilder` instance.
- Convention: `Model::where('deleted_at', '<=', now()->subMonth())`.
- Default implementation does NOT exist (abstract/throws if not overridden? No — the trait provides no default. If `prunable()` is not defined, `prune()` returns early with 0 records pruned.)

### `prune()` method
- Called by the Artisan command or manually.
- Retrieves records via `$this->prunable()->cursor()` (lazy chunking).
- For each record:
  1. Calls `$this->pruning($record)` (if defined).
  2. If pruning() did not return false, calls `$record->forceDelete()` or `$record->delete()`.
  3. Calls `$this->pruned($record)` (if defined).
- If the model uses `SoftDeletes`, `forceDelete()` permanently removes it. If not, `delete()` is called.

### `pruning()` / `pruned()` callbacks
- These are NOT Eloquent events — they are called directly by the `prune()` method on the trait.
- `pruning($model)` can return `false` to skip pruning that specific record.
- `pruned($model)` receives the model after successful deletion (for logging, cache clear, etc.).

## Patterns
- **Trait with lifecycle hooks** — the trait defines a process (`prune`) and exposes optional hooks. This is the Template Method pattern in trait form.
- **Cursor-based iteration** — `prune()` uses `cursor()` to avoid loading all prunable records into memory at once.
- **Dual-deletion path** — if the model has `SoftDeletes`, pruning calls `forceDelete()`. Otherwise it calls `delete()`. This adapts to the model's delete behavior automatically.
- **Conditional skip via hook** — `pruning()` returning `false` allows runtime exclusion of records that would otherwise match the prunable query but shouldn't be pruned (e.g., a pinned record).

## Architectural Decisions
- **Decision:** `prunable()` returns a query builder rather than a static array or closure.
  - **Context:** This allows chaining, scopes, and complex conditions.
  - **Consequence:** The query is executed lazily. The cursor iterates results; no eager loading of the entire result set.
- **Decision:** `pruning()`/`pruned()` are trait methods, not Eloquent events.
  - **Context:** Eloquent events fire for all creates/updates/deletes. Pruning callbacks are specific to the pruning process.
  - **Consequence:** No observer duplication. But these callbacks don't show up in `EventServiceProvider` — they must be defined on the model.
- **Decision:** `prune()` uses `cursor()` instead of `chunk()`.
  - **Context:** Cursor uses a single database cursor (less memory than chunk which loads N rows per iteration).
  - **Consequence:** The database connection stays open for the duration of the prune. For very large datasets, the cursor lifetime may exceed database timeout settings.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automated cleanup of stale data | Each model is loaded into memory and deleted individually | Slow for 100k+ records; use MassPrunable for bulk |
| Lifecycle hooks for side effects | Must define `prunable()` — no out-of-box behavior | Forgetting `prunable()` results in no-op pruning |
| Works with and without `SoftDeletes` | Dual path adds complexity in the trait | `forceDelete()` vs `delete()` behavior is transparent |
| Cursor-based iteration is memory-efficient | Long-running database cursor | May hit `max_execution_time` or DB timeout on large datasets |
| `pruning()` can skip individual records | If `pruning()` always returns false, no records are pruned | Debugging "why didn't it prune?" can be confusing |

## Performance Considerations
- **Cursor vs. Chunk** — `cursor()` holds a single open cursor; memory usage is O(1) per record. `chunk()` loads N records per query. For pruning, cursor is preferable because records are being deleted (shifting chunk boundaries).
- **Transaction per record** — each `forceDelete()` is its own transaction by default. For bulk pruning, accumulate deletes in a single transaction or use `MassPrunable`.
- **Indexing `prunable()` columns** — ensure the columns used in `prunable()` (e.g., `deleted_at`, `created_at`) are indexed. Without an index, the cursor query performs a full table scan.
- **Batch size** — `cursor()` processes one row at a time. Consider wrapping batches in manual transactions: `DB::beginTransaction()` every N records and `commit()` to reduce transaction overhead.

## Production Considerations
- **Schedule pruning off-peak** — run `model:prune` during low-traffic hours. The pruning process holds row locks and can degrade read performance.
- **Monitor pruning duration** — use Laravel's `PruneCommand` with `--pretend` to estimate record count before running.
- **Storage reclaim** — deleting rows does not reclaim disk space from InnoDB tables immediately. Schedule `OPTIMIZE TABLE` during maintenance windows for tables that undergo heavy pruning.
- **Observer interference** — if the model has a `deleting` observer that throws exceptions, pruning fails for that record. Ensure observers on pruned models are idempotent and should-not-fail.
- **Export before pruning** — for compliance, export or archive data before pruning. The `pruned()` callback is a good hook for archiving.

## Common Mistakes
- **Not overriding `prunable()`** — the default returns an empty query, so nothing is ever pruned. This is silent.
- **Using `prunable()` for non-soft-delete conditions** — pruning is for data expiry. Using it for conditions like `where('status', 'pending')` may delete records still needed for business processes.
- **Forgetting `forceDelete()` semantics** — if the model uses `SoftDeletes`, pruning calls `forceDelete()`, not `delete()`. The record is permanently removed — cannot be restored.
- **Assuming `pruning()` can return void** — `pruning()` should return `false` explicitly to skip. Nothing (void return) is treated as "continue with prune."
- **Not testing `prunable()` query in CI** — the query may be fast in development but slow in production with millions of rows. Always include explain-plan analysis in deployment review.

## Failure Modes
- **Cursor timeout** — if `prunable()` returns a query that takes longer than `wait_timeout` to fetch, the cursor expires mid-prune. Use `chunk()` or increase DB timeout.
- **Half-pruned state** — if the prune is interrupted (process killed, timeout), some records are deleted and some are not. The operation is not atomic. Re-running handles the remainder.
- **`pruning()` throws exception** — an exception in `pruning()` stops the entire prune process. Wrap in try/catch or ensure `pruning()` is exception-safe.
- **Race condition: record restored during prune** — if `pruning()` checks a condition that changes between check and `forceDelete()`, the record may be restored by another process and then force-deleted. Use database locks or idempotent checks.

## Ecosystem Usage
- **Laravel Telescope** — `TelescopePruneCommand` uses pruning logic to clear old Telescope entries.
- **Laravel Passport** — stale tokens and auth codes are pruned via `PrunableModel` or similar.
- **Laravel Pulse** — heartbeats and entries are pruned using the pruning system.
- **Spatie Activitylog** — the `CleanActivitylogCommand` uses pruning-like logic to remove old activity log entries.

## Related Knowledge Units

### Prerequisites
- soft-deletes-trait — pruning typically targets soft-deleted records
- Eloquent Chunking & Cursors — iteration strategies for large datasets
- Eloquent Model Events — understanding deleting/deleted lifecycle hooks

### Related Topics
- Mass Prunable
- Prune Command
- Soft Deletes Trait

### Advanced Follow-up Topics
- Force Deleting
- Eloquent Chunking & Cursors

## Research Notes
- `Prunable` trait was introduced in Laravel 8.x as a framework-supported alternative to community packages like `laravel-medialibrary`'s custom cleanup commands.
- The `pruning()` and `pruned()` callbacks were added in Laravel 9.x.
- When using `Prunable` with MongoDB (Jenssegers/Moloquent), the cursor implementation differs. Test cursor behavior on non-relational databases.
- Laravel 11+ introduced `PrunableModel` as an interface for models that are prunable, but the trait-based approach remains the primary pattern.
- The `--pretend` flag on `model:prune` outputs what would be deleted without actually deleting, useful for dry-run validation in CI/CD pipelines.
