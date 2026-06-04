# Anti-Patterns: Restoring

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Restoring

## Anti-Patterns

### Restore Without Validation
Attempting to restore a soft-deleted record and catching the `QueryException` instead of validating unique constraints first. The record may have a unique value (email, slug) that was reused by another active record.

**Problem:** 500 errors for end users; confusing or non-actionable error messages; data inconsistency if the restore partially succeeds.

**Solution:** Validate unique column availability before calling `restore()`. Check `Model::withoutTrashed()->where('email', $model->email)->exists()` and provide a clear error message.

### Bulk Restore Without onlyTrashed()
Calling `Model::query()->restore()` (builder-level restore) without scoping to `onlyTrashed()` first. The query matches all records — active records are a no-op, but the developer's intent is unclear.

**Problem:** Accidental restore of records that should remain deleted; developer confusion about the query's scope and behavior; silent no-ops on active records.

**Solution:** Always prepend `onlyTrashed()` before builder-level `restore()`: `Model::onlyTrashed()->where(...)->restore()`.

### Ignoring Cascade
Restoring a parent model without restoring its soft-deleted children. Parent restore does not automatically cascade to children, leaving child records orphaned in trashed state.

**Problem:** Orphaned child records invisible through standard queries; data integrity issues; incomplete data sets after restore operations.

**Solution:** Implement cascading restore in the parent's `restored` event handler: `$model->children()->onlyTrashed()->restore()`.

### No Audit Trail
Calling `restore()` without logging who restored the record and why. Restore operations performed through different entry points (controllers, jobs, commands) are not tracked consistently.

**Problem:** Incomplete audit trail; compliance gaps; inability to trace who performed a restore in non-HTTP contexts.

**Solution:** Log restore actions in the `restored` event handler to capture all entry points: actor ID, record ID, timestamp, and reason.

### Race Condition Vulnerability
Restoring without database-level locking, allowing concurrent operations to interfere. Two requests can pass the unique constraint check simultaneously, or a force-delete can happen between the check and the restore.

**Problem:** Duplicate unique values causing `QueryException`; silent data corruption from interleaved operations; inconsistent state under concurrent load.

**Solution:** Wrap restore in a database transaction with `lockForUpdate()`: `DB::transaction(fn () => Model::onlyTrashed()->lockForUpdate()->findOrFail($id)->restore())`.

### Checking wasRestored After restore()
Relying solely on the boolean return value of `restore()` to determine if the operation changed state. `restore()` returns `true` even on non-trashed models (no-op).

**Problem:** Misleading success messages displayed to users; unnecessary audit log entries for no-op restores.

**Solution:** Check `$model->wasRestored` after calling `restore()` to determine if the record's `deleted_at` was actually changed.

### No Separate Restore Permission
Reusing `update` or `delete` permissions from authorization policies for restore actions. Restore is a distinct capability that may have different authorization requirements.

**Problem:** Unauthorized users gaining the ability to restore records; security gaps in permission auditing; difficulty implementing granular restore-only roles.

**Solution:** Implement a dedicated `restore` method in model policies and authorize with `$this->authorize('restore', $model)`.

### Using restore() in a Loop for Bulk Restores
Calling `$model->restore()` on each record individually in a loop for large bulk restore operations. Each call fires model events and issues a separate UPDATE query.

**Problem:** O(n) queries for n records; slow bulk operations; unnecessary event overhead when only the deletion result matters.

**Solution:** Use builder-level `Model::onlyTrashed()->where(...)->restore()` for bulk operations where per-record events are not needed.
