# Mass Prunable

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
The `MassPrunable` trait provides a bulk-pruning alternative to `Prunable` that issues a single `DELETE` query for all eligible records instead of deleting them one by one. This is significantly faster for large datasets but does NOT fire model events or lifecycle callbacks (`pruning()`/`pruned()`). It is ideal for ephemeral data where individual record processing is unnecessary.

## Core Concepts
- **`MassPrunable` trait** — added to a model for bulk pruning without per-record events.
- **`prunable()` method** — identical in signature to `Prunable`'s `prunable()`; defines which records qualify for deletion.
- **Bulk `DELETE`** — instead of iterating and calling `forceDelete()` on each record, `MassPrunable` issues a single `DELETE FROM ... WHERE ...` query.
- **No `pruning()`/`pruned()` callbacks** — the trait does not define or call these hooks. Mass pruning is fire-and-forget.
- **`SoftDeletes` interaction** — if the model also uses `SoftDeletes`, the mass prune does NOT call `forceDelete()`. It issues a real `DELETE` directly. The `SoftDeletingScope` is removed for the query to target trashed records.

## Mental Models
- **Bulk delete vs. individual processing** — `Prunable` is like a doctor checking each patient before treatment. `MassPrunable` is like a controlled demolition — everyone goes at once.
- **Event silence** — mass pruning is the quiet worker. No events, no callbacks, no audit trail from the model layer. If you need logs, do it separately before the prune.
- **Speed over safety** — mass pruning trades safety (event-driven, per-record checks) for speed (single query). Choose based on whether per-record side effects matter.

## Internal Mechanics
- **`MassPrunable::prune()`** — does not override `Prunable::prune()`. Instead, both traits coexist. However, `MassPrunable` is typically used alone (not alongside `Prunable`).
- The actual mass prune logic: `$this->prunable()->delete()`.
  - `prunable()` returns the query builder.
  - `delete()` on the builder issues one SQL `DELETE`.
- If the model uses `SoftDeletes`, the prunable query should target trashed records: `static::whereNotNull('deleted_at')->where('deleted_at', '<=', ...)`.
- **No cursor** — because a single `DELETE` statement is issued, there is no record-by-record iteration. Memory usage is minimal (just the query).
- **No event dispatching** — the builder's `delete()` does not fire model events. `deleting`/`deleted` listeners are not triggered.

## Patterns
- **Bulk operation trait** — `MassPrunable` separates the "what to delete" (prunable query) from the "how to delete" (bulk SQL). This is a strategy pattern variation.
- **Trait conflict resolution** — if both `Prunable` and `MassPrunable` are used on the same model, the `prune()` method would conflict. Use one or the other per model.
- **Query-level deletion** — unlike the per-record `forceDelete()` path, bulk delete operates entirely at the query builder level. No model hydration occurs.

## Architectural Decisions
- **Decision:** `MassPrunable` does not fire events.
  - **Context:** The purpose of mass pruning is speed. Firing events for each record would negate the performance advantage.
  - **Consequence:** Observers on `deleting`/`deleted` do not fire. If event-driven side effects are required, use `Prunable` instead.
- **Decision:** `MassPrunable` uses `prunable()` method (same name as `Prunable`).
  - **Context:** Consistency between the two traits. A model can switch between them by changing the trait import.
  - **Consequence:** The `prunable()` method is shared. The difference is solely in how pruning is executed.
- **Decision:** No `pruning()`/`pruned()` callbacks.
  - **Context:** Callbacks require per-record iteration. That conflicts with the bulk nature of mass pruning.
  - **Consequence:** Cannot skip individual records during a mass prune. The prunable query must be precise.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Extremely fast for large datasets | No per-record events or callbacks | Auditing, cache invalidation, storage cleanup must happen via scheduled jobs |
| Single SQL query, minimal overhead | No ability to skip individual records | `prunable()` query must be exact; no post-hoc exclusions |
| Memory efficient (no hydration) | No model instances hydrated | Cannot access model accessors/mutators during pruning |
| Simple to implement | Same `prunable()` method as `Prunable` can cause confusion | Developer must know which trait is imported |

## Performance Considerations
- **Single DELETE vs. N deletes** — `MassPrunable` issues 1 query vs. N queries for `Prunable`. For 10,000 records, this is the difference between ~1ms and ~5000ms (plus 10,000 transaction commits).
- **Table locking** — a large `DELETE` without `LIMIT` can lock the table for the duration of the query. Consider chunking within `prunable()`: `->where('id', '<', $lastId)->limit(1000)`.
- **Binary log growth** — a bulk DELETE generates fewer binary log entries than N individual deletes (but the total is the same in row count). For replication-heavy environments, bulk DELETE may cause less replication lag.
- **InnoDB buffer pool** — bulk DELETE marks pages as dirty. On very large deletes, the flush to disk can spike I/O. Use small batches or schedule during low I/O periods.

## Production Considerations
- **Always test with `--pretend` first** — the `model:prune --pretend` flag shows which records match the prunable query without deleting them. Run this to verify the scope of the delete.
- **Run inside a transaction** — wrap the mass prune in a database transaction. If something goes wrong, you can roll back. However, for very large deletes, transaction log size may be a concern.
- **Schedule outside peak hours** — a single bulk DELETE on a large table can degrade query performance for concurrent reads. Schedule during maintenance windows.
- **Foreign key checks** — bulk DELETE will fail if child records exist and the FK constraint is `RESTRICT`. Ensure no dependent records exist or use `ON DELETE CASCADE`.
- **Monitor deadlocks** — a large DELETE can cause deadlocks with concurrent writes. Use `LOCK IN SHARE MODE` or `SKIP LOCKED` if available.

## Common Mistakes
- **Applying `MassPrunable` where `Prunable` is needed** — if your application depends on `deleting` events (e.g., for cache invalidation), `MassPrunable` silently skips them. Choose based on side-effect requirements.
- **Forgetting the model uses `SoftDeletes`** — the prunable query for a soft-deletable model must explicitly filter on `deleted_at` conditions. `Model::where('created_at', '<', ...)` alone would also delete active records.
- **No limit on prunable query** — a prunable query without a `LIMIT` or `chunkById` may delete millions of records in one statement, causing prolonged table locks and replication lag.
- **Assuming mass prune fires observers** — it does not. If you have an observer that sends a "your post was deleted" email, mass prune will NOT trigger it.
- **Combining `Prunable` and `MassPrunable` on the same model** — this causes a trait method collision on `prune()`. Use one or the other.

## Failure Modes
- **Unintended mass deletion** — a bug in `prunable()` (e.g., missing `whereNotNull('deleted_at')`) deletes active records. Always use `--pretend` first in production.
- **Deadlock** — if the bulk DELETE affects rows that concurrent queries are also modifying, a deadlock occurs. The deadlocked transaction is rolled back. Retry logic in the command handler can mitigate this.
- **Transaction log overflow** — extremely large deletes may fill the transaction log (especially in full recovery mode on SQL Server). Batch the delete with `->limit(1000)` and loop.
- **Replication lag** — a massive DELETE on the primary is a single large transaction that must be applied to replicas. This can cause seconds to minutes of replication lag.

## Ecosystem Usage
- **Laravel Telescope** — Telescope's `prune()` command uses mass pruning for old entry deletion. The entries table accumulates quickly, making per-record pruning impractical.
- **Laravel Pulse** — pulse data is ephemeral and mass-pruned to keep the dashboard responsive.
- **Session tables** — expired session records are often mass-pruned with `MassPrunable`.
- **Notification tables** — old read notifications are bulk-pruned to keep the table size manageable.

## Related Knowledge Units

### Prerequisites
- prunable-trait — the per-record alternative to mass pruning
- Eloquent Builder & Deletions — how Builder::delete() works at the SQL level
- Chunking & Batching — strategies for limiting bulk delete size

### Related Topics
- Prunable Trait
- Prune Command
- Soft Deletes Trait

### Advanced Follow-up Topics
- Eloquent Builder & Deletions
- Chunking & Batching

## Research Notes
- `MassPrunable` was introduced in Laravel 9.x as a companion to `Prunable`. Earlier versions required custom implementations or raw queries.
- The trait is intentionally minimal (~30 lines of code). It delegates all logic to `prunable()` and the builder's `delete()` method.
- MySQL's `DELETE` with `LIMIT` is not safe for replication in statement-based mode. Use row-based replication or `chunkById` with looped deletes.
- PostgreSQL's `DELETE ... RETURNING *` can be used to capture deleted records in bulk. Laravel does not use this natively, but you can implement it in `prunable()` with a raw expression.
- In Laravel 11+, `MassPrunable` handles the `SoftDeletes` case by checking `$model->usesSoftDeletes()` and removing the global scope automatically before the bulk delete.
