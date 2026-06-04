# Force Deleting

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
Force deleting permanently removes a soft-deletable model from the database, bypassing the soft-delete mechanism. The `forceDelete()` method issues a real `DELETE` SQL statement regardless of the `SoftDeletes` trait. `forceDeleteQuietly()` does the same without firing model events.

## Core Concepts
- **`forceDelete()`** — instance method that permanently deletes the model. Issues `DELETE FROM ... WHERE id = ?` ignoring the `SoftDeletingScope`.
- **`forceDeleteQuietly()`** — same as `forceDelete()` but suppresses model events (`deleting`, `deleted`, `forceDeleting`, `forceDeleted`).
- **`forceDeleting` / `forceDeleted` events** — lifecycle events specific to force delete. Fire before and after the permanent removal.
- **`isForceDeleting`** — a flag set on the model during `forceDelete()` to differentiate from a soft delete.
- **No return distinction** — `forceDelete()` returns `bool` just like `delete()`. The caller must track which method was called.

## Mental Models
- **Permanent erasure** — while `delete()` moves the record to the recycle bin, `forceDelete()` shreds it. The data is gone forever.
- **Bypass valve** — forceDelete bypasses the hijacked `delete()` method and calls the original `Builder::delete()` on the query.
- **Event fork** — the delete lifecycle splits at `performDeleteOnModel`: soft delete goes to `runSoftDelete()`, force delete goes to `runDelete()`. The events also fork (`deleting`/`deleted` vs `forceDeleting`/`forceDeleted`).

## Internal Mechanics
- **`forceDelete()` on instance:** calls `performDeleteOnModel()` which checks `$this->forceDeleting = true`, then calls `runDelete()` (the real `DELETE` query) instead of `runSoftDelete()`.
- **SoftDeletingScope interaction:** `forceDelete()` removes the global scope temporarily, issues the DELETE, then re-applies the scope. This ensures the record is found for deletion even if it was not loaded with `withTrashed()`.
- **`forceDeleteQuietly()`:** wraps the operation in `withoutEvents()` or detaches the event dispatcher.
- **`forceDelete()` on Builder:** not directly available. Must call on the model instance. For bulk force delete: `Model::onlyTrashed()->each(fn ($m) => $m->forceDelete())`.
- **`forceDeleting` / `forceDeleted` events:** fired in `performDeleteOnModel` when `$this->forceDeleting` is true.

## Patterns
- **Method hijack bypass** — `forceDelete()` skips the `SoftDeletingScope`'s hijacked `delete()` by marking a flag on the model and calling the parent class's `performDeleteOnModel()`. This is an internal bypass, not a public API change.
- **Event differentiation** — by using separate event names, observers can react differently to soft vs. force deletes. `deleting` fires for both, but `forceDeleting` fires only for permanent removal.
- **Temporary scope removal** — `forceDelete()` temporarily calls `withoutGlobalScope(SoftDeletingScope::class)` on the query to ensure the record is queryable even without `withTrashed()`.

## Architectural Decisions
- **Decision:** `forceDelete()` is an instance method only, not a builder method.
  - **Context:** Bulk force delete is risky and potentially destructive. Forcing it through the builder would require an explicit `forceDelete()` on each instance.
  - **Consequence:** Bulk force delete requires iteration or a raw query. Safer, but slower for large cleanups.
- **Decision:** `forceDelete()` fires both `deleting`/`deleted` and `forceDeleting`/`forceDeleted` events.
  - **Context:** Observers often register on `deleting` for general cleanup regardless of deletion type.
  - **Consequence:** Observers must check `$model->isForceDeleting()` inside `deleting` handlers to differentiate behavior.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clean, permanent removal from database | Irreversible — no recovery | Requires careful permission gating |
| `forceDeleteQuietly()` for batch cleanup | Events suppressed means no audit trail | Must manually log if audit required |
| Separate events enable granular observers | Dual event firing (`deleting` + `forceDeleting`) | Duplicate observer logic if not careful |
| Temporary scope removal ensures queryability | Scope removal has edge cases with other global scopes | Test force delete with custom global scopes |

## Performance Considerations
- **Same as any DELETE** — a single-row DELETE by primary key is fast. Bulk force delete via iteration is O(n) queries.
- **Bulk force delete** — use a raw `DB::table()->whereNotNull('deleted_at')->delete()` if event firing is not needed. Benchmark to ensure no locking issues.
- **Foreign key cascades** — if the table has `ON DELETE CASCADE` foreign keys, force deleting a record cascades to child tables. This is a real DELETE, not a soft delete — children are hard-deleted.

## Production Considerations
- **Permission-gate `forceDelete()`** — treat force delete as a destructive operation. Use policies or middleware to restrict to admin roles.
- **Always ask for confirmation** — in UI, require a confirmation dialog (e.g., typing "DELETE") before issuing `forceDelete()`.
- **GDPR / right to erasure** — `forceDelete()` is the implementation path for data deletion requests. Ensure audit logs capture the erasure event.
- **Backup before bulk force delete** — run a backup immediately before any bulk force-delete operation. The data is unrecoverable from the application.
- **Queue large force-deletes** — for thousands of records, dispatch a queued job that iterates with chunking to avoid memory exhaustion.

## Common Mistakes
- **Calling `forceDelete()` on a non-trashed model** — works fine (deletes the active record permanently). Ensure this is intentional.
- **Assuming `forceDelete()` on a query builder works** — `Model::where('id', 1)->forceDelete()` does NOT exist. Must call on an instance.
- **Missing `onlyTrashed()` before `each(fn => forceDelete())`** — iterating `Model::get()->each(fn ($m) => $m->forceDelete())` deletes ALL records, including active ones.
- **Forgetting that cascade deletes are real deletes** — `ON DELETE CASCADE` on a foreign key causes permanent removal of related records even if they have `SoftDeletes`. Use `nullOnDelete()` or handle cascading in application code.
- **Overlooking event listeners** — if a `deleting` listener throws an exception, `forceDelete()` also fails (since `forceDelete` still fires `deleting` first).

## Failure Modes
- **Foreign key constraint violation** — if child records reference the record, `forceDelete()` may fail with a constraint violation. Use `ON DELETE CASCADE` or manually delete children first.
- **Deadlock during concurrent force deletes** — two transactions force-deleting overlapping datasets may deadlock. Order by primary key and keep transactions short.
- **Disk space recovery delay** — InnoDB does not immediately return disk space after DELETE. The table's `.ibd` file retains the space until `OPTIMIZE TABLE`. Factor this into storage monitoring.
- **Partial failure in bulk force delete** — if using iterator with transactions, some records may be deleted and others not. Wrap each iteration in its own transaction to isolate failures.

## Ecosystem Usage
- **Laravel Nova** — "Force Delete" action on resources with `SoftDeletes`. The action calls `forceDelete()` on selected resources.
- **Laravel Horizon** — failed jobs can be force-deleted via `Horizon::forget()`.
- **Spatie Media Library** — `forceDelete()` on the parent model triggers media file deletion from storage.
- **Laravel Auditing** — a force-delete audit is recorded as a `delete` type, but the `old_values` show the full record before removal.

## Related Knowledge Units

### Prerequisites
- soft-deletes-trait — the trait that provides forceDelete
- Database Foreign Key Constraints — understanding cascade deletes and referential integrity

### Related Topics
- Soft Deletes Trait
- Restoring
- Prunable Trait

### Advanced Follow-up Topics
- Mass Prunable
- Eloquent Lifecycle Events

## Research Notes
- `forceDelete()` was renamed from `forceDelete()` in early Laravel versions (originally it was only a method on the `SoftDeletes` trait). The name has been stable since Laravel 5.x.
- `forceDeleteQuietly()` was added in Laravel 9.x alongside the general `*Quietly` pattern for all Eloquent operations.
- The `isForceDeleting` flag is checked in `runSoftDelete()` to determine whether to perform the soft delete or the real delete.
- In cases where a model uses `SoftDeletes` but you need to call `Model::destroy($id)`, the `destroy()` method also respects `SoftDeletes` and performs a soft delete. Use `$model->forceDelete()` for permanent removal.
