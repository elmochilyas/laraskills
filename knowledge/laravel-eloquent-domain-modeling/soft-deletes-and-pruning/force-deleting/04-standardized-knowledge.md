# Force Deleting — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Force Deleting
- **ECC Version:** 1.0

## Overview
Force deleting permanently removes a soft-deletable model from the database, bypassing the soft-delete mechanism. The `forceDelete()` method issues a real `DELETE` SQL statement regardless of the `SoftDeletes` trait. `forceDeleteQuietly()` does the same without firing model events. The method fires both `deleting`/`deleted` and `forceDeleting`/`forceDeleted` events, and the `isForceDeleting` flag allows observers to differentiate soft from force deletes.

## Core Concepts
- `forceDelete()` — instance method that permanently deletes the model; issues `DELETE FROM ... WHERE id = ?`
- `forceDeleteQuietly()` — same as `forceDelete()` but suppresses all model events
- `forceDeleting` / `forceDeleted` events — lifecycle events specific to force delete
- `isForceDeleting` — flag set on the model during `forceDelete()` to differentiate from soft delete
- Temporary scope removal — `forceDelete()` temporarily removes `SoftDeletingScope` to find the record even without `withTrashed()`
- No builder method — `forceDelete()` is instance-only; bulk force delete requires iteration

## When To Use
- GDPR right to erasure compliance — permanently removing personal data when requested
- Admin trash cleanup — permanently removing records from a recycle bin
- Reclaiming storage — physically deleting data no longer needed for recovery
- Pre-pruning — permanently removing records that should never be restored
- Data sanitization — removing sensitive test/demo data from production

## When NOT To Use
- Do NOT use `forceDelete()` when data recoverability is required — use `delete()` for soft delete
- Do NOT use `forceDelete()` on a query builder — it's not available; must call on an instance
- Do NOT use `forceDelete()` without authorization — treat it as a destructive operation requiring admin permissions
- Do NOT bulk `forceDelete()` without `onlyTrashed()` — iterating `Model::all()` and force-deleting removes all records
- Do NOT assume `forceDelete()` recovers disk space immediately — InnoDB may retain space until `OPTIMIZE TABLE`

## Best Practices (WHY)
- Permission-gate `forceDelete()` via policies — restrict to admin roles with explicit confirmation
- Always ask for confirmation in UI — require typing "DELETE" or the record name before executing
- Use `forceDeleteQuietly()` in maintenance scripts where event side effects would cause errors
- Use `onlyTrashed()->each(fn ($m) => $m->forceDelete())` for bulk force delete — never call on all records
- Backup before bulk force-delete operations — data is unrecoverable from the application
- Queue large force-deletes to avoid memory exhaustion and request timeouts

## Architecture Guidelines
- Treat `forceDelete()` as a separate capability from `delete()` in permission systems
- Implement audit logging in the `forceDeleted` event to capture who deleted what
- Handle foreign key constraints — force delete on a parent with `ON DELETE RESTRICT` children fails
- Use `ON DELETE CASCADE` or manually delete children before force-deleting a parent
- For batch operations, dispatch a queued job that iterates through trashed records with chunking

## Performance
- Single-row `DELETE` by primary key is fast — comparable to any other DELETE statement
- Bulk force delete via iteration is O(n) queries — use raw `DB::table()->whereNotNull('deleted_at')->delete()` if events are not needed
- Foreign key cascades — if `ON DELETE CASCADE` is set, force-deleting a parent cascades real deletes to children
- Large bulk force deletes may cause deadlocks with concurrent writes — batch with `->limit()` and loop
- Disk space recovery — InnoDB does not immediately return space; factor in `OPTIMIZE TABLE` for heavy pruning

## Security
- `forceDelete()` is irreversible — gate it behind admin authorization and confirmation
- Audit logging of force deletes is essential for compliance — log who deleted what and when
- `ON DELETE CASCADE` can cascade permanent deletion beyond what the developer intended
- `forceDeleteQuietly()` suppresses events — if used in scripts, audit logging is entirely bypassed
- Foreign key constraint violations on force delete can leak information about related data existence

## Common Mistakes
- Calling `forceDelete()` on a non-trashed model — works fine but permanently deletes an active record
- Assuming `forceDelete()` exists on the query builder — `Model::where(...)->forceDelete()` does NOT exist
- Missing `onlyTrashed()` before `each(fn => forceDelete())` — iterating ALL records and deleting them permanently
- Forgetting that cascade deletes are real deletes — `ON DELETE CASCADE` on a foreign key causes permanent removal of related records
- Overlooking event listeners — if a `deleting` listener throws an exception, `forceDelete()` also fails

## Anti-Patterns
- **Bulk force delete without scoping**: calling `Model::all()->each->forceDelete()` — permanently deletes EVERY record
- **forceDelete in user-facing features without confirmation**: allowing permanent deletion without explicit user confirmation
- **Ignoring foreign key cascades**: relying on database-level cascade for related records that should have their own lifecycle
- **No audit trail for force deletes**: calling `forceDelete()` without logging, making data loss untraceable
- **Using `forceDeleteQuietly()` and losing event side effects**: suppressing events in maintenance scripts and forgetting to handle side effects (cache clear, notifications)

## Examples
```php
// Instance force delete
$user = User::onlyTrashed()->find($id);
$user->forceDelete();

// Quiet force delete (no events)
$user->forceDeleteQuietly();

// Check isForceDeleting in observer
public function deleting(User $user): void
{
    if ($user->isForceDeleting()) {
        Log::info("User {$user->id} is being force deleted");
    }
}

// Bulk force delete with iteration
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subYear())
    ->each(fn (User $user) => $user->forceDelete());

// Policy authorization
public function forceDelete(User $authenticated, User $target): bool
{
    return $authenticated->is_admin;
}

// Raw bulk delete (no events)
DB::table('users')
    ->whereNotNull('deleted_at')
    ->where('deleted_at', '<=', now()->subYear())
    ->delete();
```

## Related Topics
- soft-deletes-trait — the trait that provides `forceDelete()`
- restoring — the alternative lifecycle operation (undo soft delete)
- prunable-trait — automated per-record pruning that uses `forceDelete()` internally
- mass-prunable — bulk pruning without per-record iteration or events

## AI Agent Notes
- `forceDelete()` is instance-only — no builder-level equivalent
- Always scope to `onlyTrashed()` before bulk force delete iteration
- `forceDelete()` fires both `deleting`/`deleted` and `forceDeleting`/`forceDeleted` events
- Check `$model->isForceDeleting()` in `deleting` observers to differentiate soft vs force delete
- Gate `forceDelete()` behind admin policies and UI confirmation
- Backup before bulk force-delete operations — data is permanently gone
- Queue large batch force-deletes to avoid request timeouts

## Verification
- [ ] `forceDelete()` on soft-deleted model permanently removes the record from DB
- [ ] `forceDelete()` on active model permanently removes the record from DB
- [ ] `forceDeleteQuietly()` fires no events
- [ ] `forceDeleting`/`forceDeleted` events fire in correct order
- [ ] `deleting` listener returning `false` cancels `forceDelete()`
- [ ] `isForceDeleting()` is `true` during `forceDelete()` events
- [ ] Authorization policy and confirmation gate `forceDelete()` for non-admin users
- [ ] Bulk force-delete uses `onlyTrashed()` scope to prevent mass deletion of active records
