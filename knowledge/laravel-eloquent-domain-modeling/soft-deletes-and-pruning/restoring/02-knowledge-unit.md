# Restoring

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
Restoring is the process of reverting a soft-deleted record to active status by setting `deleted_at` back to `NULL`. The `restore()` method performs the restore and fires lifecycle events (`restoring` and `restored`). `restoreQuietly()` skips event dispatching. Bulk restore is available via query builder `restore()`.

## Core Concepts
- **`restore()`** — instance method that sets `deleted_at = null` and saves. Returns `bool`.
- **`restoreQuietly()`** — same as `restore()` but does not fire model events.
- **`SoftDeletingScope::restore()`** — builder-level restore: applies to all records in a query. `Model::onlyTrashed()->restore()` restores all trashed records matching the query.
- **Lifecycle events** — `restoring` (before save, returning false cancels), `restored` (after save).
- **`wasRestored` property** — set to `true` on the model instance after a successful restore.

## Mental Models
- **Undo delete** — restoring is the undo operation for soft delete. The data was never removed; restoring simply clears the tombstone flag.
- **Reanimation** — like bringing data back from the dead. Dependencies and constraints that assumed the record was gone may break.
- **Event gate** — the `restoring` event is a gate. Returning `false` from its listener blocks the restore, preventing the record from coming back.

## Internal Mechanics
- **`restore()` on model instance:** calls `performDeleteOnModel`-like logic in reverse — an `UPDATE SET deleted_at = NULL` on the record's primary key.
- **`restore()` on Builder (via scope):** `SoftDeletingScope@restore()` iterates through matched records or issues a single `UPDATE` with `SET deleted_at = NULL`. The behavior depends on whether `Model::getEventDispatcher()` is present.
- **`restoring` / `restored` events** — fired via `fireModelEvent()`. The `restoring` event can cancel via `return false`. `restored` is fired after the database update.
- **`restoreQuietly()`** — wraps the restore in `withoutEvents()` or temporarily removes the event dispatcher.
- **`wasRestored`** — set in the `finishRestore()` method, accessible via `$model->wasRestored()` (Laravel 8+).

## Patterns
- **Command-Query separation** — `restore()` performs an action and returns a boolean for success/failure. State is checked via `trashed()` (read) and changed via `restore()` (write).
- **Event-driven lifecycle** — the restore lifecycle fires before/after events, mirroring the create/update/delete pattern. This allows cross-cutting concerns (audit, notifications) without modifying the model.
- **Bulk via builder** — `Model::query()->restore()` allows mass restore using the same `SoftDeletingScope` method. The scope applies the update to all records matching the current query constraints.

## Architectural Decisions
- **Decision:** `restore()` fires separate events (`restoring`/`restored`) rather than reusing `saving`/`saved`.
  - **Context:** Restore is semantically distinct from an ordinary update.
  - **Consequence:** Developers can listen specifically for restore actions without filtering update events.
- **Decision:** Bulk `restore()` on the builder does NOT fire model events by default.
  - **Context:** Firing events for each row in a bulk restore would be prohibitive (n+1 event dispatch).
  - **Consequence:** `Observer` listeners on `restored` are not triggered for bulk restores. Use `restore()` on individual instances if events are required.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Restore fires dedicated events for granular listeners | Separate events require separate observers | More code but clearer intent |
| `restoreQuietly()` enables silent restoration in scripts | Possibility of missing audit trails when used carelessly | Use intentionally; log manually if audit needed |
| Bulk builder `restore()` is efficient (single query) | No model events fired | Observers miss the restore; must use queue for individual event firing |
| `wasRestored` flag enables check after save | Only available on the instance, not in `restored` event | Pass instance in event if flag is needed |

## Performance Considerations
- **Single row restore** — fast, simple UPDATE with primary key WHERE clause.
- **Bulk builder restore** — issues one UPDATE. On large datasets, this may lock rows. Chunk if restoring > 10,000 rows.
- **Index impact** — clearing `deleted_at` from NULL to timestamp (or vice versa) causes an index write. On tables with high restore frequency, consider index maintenance windows.
- **Event dispatcher overhead** — each `restore()` with events calls `getEventDispatcher()`. Disable events for bulk operations if possible.

## Production Considerations
- **Validate before restore** — check unique constraints that may have been filled by newer records. A attempt to restore a slug that another record now uses will throw a `QueryException` on the unique index.
- **Cascading restore** — restoring a parent may require restoring children. Implement a `restored` listener that cascade-restores related soft-deleted models if applicable.
- **Soft restore permissions** — in apps with roles, ensure restore is a separate permission from `delete` and `update`.
- **Audit trail** — log who restored the record and why. The `restored` event is the ideal hook.

## Common Mistakes
- **Restoring without checking unique constraints** — attempting to restore a record with a now-conflicting unique value throws an integrity constraint violation.
- **Assuming `restore()` returns the model** — `restore()` returns `bool`. Use `fresh()` after restore if you need the refreshed instance.
- **Forgetting `onlyTrashed()` before bulk restore** — `Model::restore()` without `onlyTrashed()` is a no-op (since the scope excludes trashed records). All records matching the query must be trashed.
- **Restoring a non-trashed model** — `restore()` on a model where `deleted_at` is already NULL returns `true` (no error) but does nothing. Check `$model->trashed()` first.
- **Missing observer registration** — `restored` events are not handled by the default `AppServiceProvider` observer pattern unless explicitly registered in `$observers` property or `EventServiceProvider`.

## Failure Modes
- **Unique constraint violation** — the most common failure. Wrap restore in a transaction, attempt the restore, and catch `QueryException` to roll back and inform the user.
- **Race condition: concurrent restore and delete** — one process restores a record while another soft-deletes it. Both may succeed, leaving the record in an indeterminate state. Use database-level locking (`sharedLock` / `lockForUpdate`) if this is a concern.
- **Bulk restore without filter** — `Model::query()->restore()` without a `where` clause attempts to restore ALL trashed records. This may be unintended. Always scope bulk restores.

## Ecosystem Usage
- **Laravel Nova** — restore action is available on resources with `SoftDeletes`. The action fires `restore()` and logs in the action events.
- **Laravel Backpack** — `RestoreOperation` trait provides restore functionality in CRUD panels.
- **Spatie Media Library** — restoring a model restores associated media records if they are soft-deletable.
- **Laravel Auditing** — the `restored` event is audited as a `restore` type; the old values show `deleted_at` being cleared.

## Related Knowledge Units

### Prerequisites
- soft-deletes-trait — the trait that provides restore functionality
- querying-soft-deletes — using onlyTrashed() to scope restorable records

### Related Topics
- Soft Deletes Trait
- Querying Soft Deletes
- Force Deleting

### Advanced Follow-up Topics
- Eloquent Lifecycle Events
- Prunable Trait

## Research Notes
- `restoreQuietly()` was added in Laravel 8.x. Prior versions required wrapping in `Model::withoutEvents()`.
- Builder-level `restore()` is implemented in `SoftDeletingScope` and uses `QueryException` wrapping to handle failures per record in chunked mode. Laravel 10+ uses `each()` for chunked bulk restore.
- The `wasRestored` flag is set via `$model->wasRestored = true` after the update query succeeds, and is reset on fresh loads or saves.
- When using PostgreSQL, restoring in a transaction that later rolls back leaves the record in its original trashed state. No cleanup is needed.
