# Restoring — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Restoring
- **ECC Version:** 1.0

## Overview
Restoring reverts a soft-deleted record to active status by setting `deleted_at` back to `NULL`. The `restore()` method performs the restore and fires lifecycle events (`restoring` before, `restored` after). `restoreQuietly()` skips event dispatching. Bulk restore is available via the query builder's `restore()` method on `SoftDeletingScope`. Restore enables data recovery while respecting the application's event-driven side effects.

## Core Concepts
- `restore()` — instance method that sets `deleted_at = null` and saves; returns `bool`
- `restoreQuietly()` — same as `restore()` but does not fire model events
- Builder-level `restore()` — `SoftDeletingScope::restore()` applies to all records in a query
- `restoring` event — fires before the restore; returning `false` cancels the operation
- `restored` event — fires after successful restore
- `wasRestored` property — set to `true` on the model after a successful restore; reset on fresh loads
- No bulk events — builder-level `restore()` does NOT fire model events for performance

## When To Use
- Undoing accidental soft deletes in admin panels (undo/restore functionality)
- Reactivating accounts, content, or resources that were soft-deleted (user re-registration)
- Batch restoring records from a trash/recycle bin interface
- Automated restore workflows (e.g., restoring a parent cascades to children)
- Testing — setting up fixtures by restoring soft-deleted seed data

## When NOT To Use
- Do NOT use `restore()` on records that should be permanently deleted — use `forceDelete()`
- Do NOT use `restore()` without checking unique constraints — may cause integrity constraint violations
- Do NOT use builder-level `restore()` when you need per-record event firing — events are NOT dispatched on bulk restore
- Do NOT call `restore()` on a non-trashed model — it's a no-op that returns `true` and does nothing
- Do NOT use `restore()` in a loop for bulk restores — use builder-level `onlyTrashed()->restore()` instead

## Best Practices (WHY)
- Validate unique constraints before calling `restore()` — catch and handle conflicts gracefully
- Always use `onlyTrashed()` before builder-level `restore()` — avoid accidentally restoring non-trashed records
- Implement a `restoring` event listener to validate conditions and return `false` to cancel if needed
- Wrap restore in a transaction with lock-for-update to prevent race conditions with concurrent operations
- Log restore actions in the `restored` event handler for audit trail
- For cascading restores, implement a `restored` listener that restores related soft-deleted children

## Architecture Guidelines
- Treat restore as a separate permission from delete and update — implement restore authorization in policies
- Use `restoreQuietly()` in maintenance scripts where event side effects are not needed
- Document the restore behavior in API responses — clients need to know whether restore succeeded
- For `BelongsToMany` relationships, restoring the parent does NOT restore pivot records — handle manually
- Implement conflict resolution UI when restoring records with unique constraint violations

## Performance
- Single row restore is fast — simple UPDATE with primary key WHERE clause
- Bulk builder restore issues one UPDATE — efficient for large sets but may lock rows
- Index impact — clearing `deleted_at` causes an index write; high restore frequency may warrant index maintenance
- Event dispatcher overhead — each `restore()` with events calls `getEventDispatcher()`; disable events for bulk operations
- Chunk large bulk restores (>10k rows) to avoid transaction log overflow and table locks

## Security
- Validate that the authenticated user has permission to restore — use policies
- Unique constraint violations on restore may reveal information about existing records (e.g., "email already taken")
- `restoring` event returning `false` is a security gate — use it for business rule enforcement
- Audit who restored what and why — the `restored` event is the ideal hook
- Bulk restore bypasses event gates — implement query-level checks in the `prunable()` method

## Common Mistakes
- Restoring without checking unique constraints — attempting to restore a record with a now-conflicting unique value throws `QueryException`
- Assuming `restore()` returns the model — it returns `bool`; use `fresh()` for the refreshed instance
- Forgetting `onlyTrashed()` before bulk restore — `Model::restore()` without `onlyTrashed()` is a no-op (scope excludes trashed)
- Restoring a non-trashed model — returns `true` (no error) but does nothing; check `$model->trashed()` first
- Missing observer registration — `restored` events are not handled unless observers are registered

## Anti-Patterns
- **Restore without validation**: attempting to restore and catching the `QueryException` instead of validating constraints first
- **Bulk restore without `onlyTrashed()`**: calling `Model::query()->restore()` which attempts to restore ALL trashed records
- **Ignoring cascade**: restoring a parent without restoring children, leaving child records orphaned
- **No audit trail**: calling `restore()` without logging who restored the record and why
- **Race condition vulnerability**: restoring without database-level locking, allowing concurrent operations to interfere

## Examples
```php
// Instance restore
$user = User::onlyTrashed()->find($id);
if ($user && $user->trashed()) {
    $user->restore();
}

// Check wasRestored
$restored = $user->restore();
if ($user->wasRestored) {
    // Record was actually restored (not a no-op)
}

// Bulk restore
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(30))
    ->restore();

// Quiet restore (no events)
$user->restoreQuietly();

// Restoring event listener (in Observer)
public function restoring(User $user): ?bool
{
    // Check unique constraints
    if (User::where('email', $user->email)->exists()) {
        return false; // Cancel restore
    }
    return true;
}

// Cascading restore in restored event
public function restored(User $user): void
{
    $user->posts()->onlyTrashed()->restore();
}

// Transactional restore with locking
DB::transaction(function () use ($id) {
    $user = User::onlyTrashed()->lockForUpdate()->findOrFail($id);
    $user->restore();
});
```

## Related Topics
- soft-deletes-trait — the trait that provides restore functionality
- querying-soft-deletes — using `onlyTrashed()` to scope restorable records
- force-deleting — permanent removal alternative to restore
- prunable-trait — automated cleanup lifecycle management

## AI Agent Notes
- Always check unique constraints before calling `restore()` — conflicting values cause `QueryException`
- Use `onlyTrashed()` before builder-level `restore()` to scope the update to trashed records only
- `restore()` returns `bool`; use `wasRestored` property to check if the restore actually changed state
- Bulk `restore()` does NOT fire model events — use per-instance `restore()` if events are needed
- Implement `restoring` returning `false` as a gate to cancel restore on business rule violations
- Log restore actions in `restored` event for audit trail

## Verification
- [ ] `$model->restore()` on soft-deleted record returns `true` and sets `deleted_at` to `null`
- [ ] `$model->restore()` on active record returns `true` with no state change
- [ ] `restoreQuietly()` does not fire `restoring`/`restored` events
- [ ] Bulk `onlyTrashed()->restore()` restores only matching trashed records
- [ ] `restoring` event returning `false` cancels the restore
- [ ] `restored` event fires after successful restore
- [ ] Unique constraint violations on restore are handled gracefully
- [ ] Restore is authorized via policies for non-admin users
