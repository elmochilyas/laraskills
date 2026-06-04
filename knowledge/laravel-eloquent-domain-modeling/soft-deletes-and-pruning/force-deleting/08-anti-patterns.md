# Anti-Patterns: Force Deleting

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Force Deleting

## Anti-Patterns

### Bulk Force Delete Without Scoping
Calling `Model::all()->each->forceDelete()` or iterating an un-scoped query and force-deleting every record. Without `onlyTrashed()`, this permanently destroys all records in the table.

**Problem:** Complete, irreversible deletion of all records in the table; catastrophic production incidents requiring database restore from backup.

**Solution:** Always scope to `onlyTrashed()` before bulk force-delete iteration: `Model::onlyTrashed()->where(...)->each(fn ($m) => $m->forceDelete())`.

### forceDelete in User-Facing Features Without Confirmation
Allowing permanent deletion from a user interface without explicit confirmation or requiring the user to type a confirmation word. Accidental clicks permanently destroy recoverable data.

**Problem:** Permanent, irreversible data loss from accidental UI interaction; user dissatisfaction; no recovery mechanism.

**Solution:** Require explicit confirmation (e.g., typing "DELETE" or the record name) before executing `forceDelete()` in user-facing features.

### Ignoring Foreign Key Cascades
Force-deleting a parent record without handling its child records first. If foreign key constraints use `ON DELETE RESTRICT`, the deletion fails with a constraint violation.

**Problem:** `QueryException` with "Integrity constraint violation" error; partial deletion in inconsistent state; application errors exposed to users.

**Solution:** Delete or detach child records before force-deleting a parent. Use a transaction: delete children first, then the parent.

### No Audit Trail for Force Deletes
Calling `forceDelete()` without logging, making data loss untraceable. Without the `forceDeleted` event capturing actor ID, record details, and timestamp, compliance and investigation are impossible.

**Problem:** Missing audit trail for destructive operations; compliance violations; inability to investigate data loss incidents.

**Solution:** Audit log in the `forceDeleted` event handler to capture all entry points: record ID, actor ID, timestamp, and reason.

### Using forceDeleteQuietly() and Losing Event Side Effects
Calling `forceDeleteQuietly()` in maintenance scripts and forgetting to handle side effects that observers normally manage (cache clearing, notifications, cascading deletes).

**Problem:** Stale cache serving deleted records; missing notifications; orphaned records in search indexes; cascading operations silently skipped.

**Solution:** Only use `forceDeleteQuietly()` when event side effects are intentionally unnecessary. Handle side effects explicitly before suppression.

### Calling forceDelete() on the Query Builder
Attempting `Model::where('id', $id)->forceDelete()` expecting it to work. `forceDelete()` is an instance-only method — it does not exist on the query builder.

**Problem:** Runtime `BadMethodCallException`; confusion for developers unfamiliar with the API; production errors if not caught in testing.

**Solution:** Always call `forceDelete()` on a model instance: `Model::withTrashed()->findOrFail($id)->forceDelete()`. For bulk operations, iterate with `->each()`.

### Not Differentiating Soft vs Force Delete in Observers
Using the same `deleting` observer logic for both soft delete and force delete without checking `isForceDeleting()`. The same behavior runs for both operations, which may be incorrect.

**Problem:** Soft-deleted children permanently deleted during parent force-delete, or children soft-deleted when hard deletion was intended. Mixed, incorrect behavior.

**Solution:** Check `$model->isForceDeleting()` inside the `deleting` event to branch logic: prepare children for permanent removal during force delete, soft-delete them during soft delete.

### forceDelete When Data Should Be Recoverable
Using `forceDelete()` (permanent removal) when the business requirement allows for a recovery window. Once executed, the record cannot be recovered from the application.

**Problem:** Irrecoverable data loss; user and business dissatisfaction; potential legal consequences if data was deleted prematurely.

**Solution:** Use `delete()` (soft delete) with a defined recovery window. Only `forceDelete()` after the recovery window has expired or for compliance-driven erasure.
