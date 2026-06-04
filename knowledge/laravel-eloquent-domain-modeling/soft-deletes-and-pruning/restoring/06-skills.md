# Restoring Skills

## Skill: Restore soft-deleted records using restore()

### Purpose
Use `restore()` to revert a soft-deleted record to active status by setting `deleted_at` back to `NULL`, enabling data recovery while respecting lifecycle events.

### When To Use
- Undoing accidental soft deletes in admin panels (undo/restore functionality)
- Reactivating accounts, content, or resources that were soft-deleted (user re-registration)
- Batch restoring records from a trash/recycle bin interface
- Automated restore workflows (e.g., restoring a parent cascading to children)
- Testing — setting up fixtures by restoring soft-deleted seed data

### When NOT To Use
- On records that should be permanently deleted — use `forceDelete()` instead
- Without checking unique constraints — may cause integrity constraint violations
- Using builder-level `restore()` when per-record events are needed — events are NOT dispatched on bulk restore
- Calling `restore()` on a non-trashed model — it's a no-op that returns `true` and does nothing
- Using `restore()` in a loop for bulk restores — use builder-level `onlyTrashed()->restore()` instead

### Prerequisites
- Model using `SoftDeletes` trait
- `deleted_at` column in the database

### Inputs
- Model instance or query builder (for bulk restore)

### Workflow
1. Scope to trashed records: `Model::onlyTrashed()->find($id)` or `Model::onlyTrashed()`
2. Validate unique constraints before restoring — check for conflicts
3. For single record: call `$model->restore()` (returns bool)
4. Check `$model->wasRestored` to determine if state actually changed
5. For bulk restore: `Model::onlyTrashed()->where(...)->restore()`
6. Use `restoreQuietly()` in maintenance scripts where event side effects are unwanted
7. Implement `restoring` event listener returning `false` as a business rule gate
8. Log restore actions in the `restored` event for audit trail
9. Cascade restore to children in `restored` event handler
10. Wrap in transaction with `lockForUpdate()` for race condition protection

### Validation Checklist
- [ ] `$model->restore()` on soft-deleted record returns `true` and sets `deleted_at` to `null`
- [ ] `$model->restore()` on active record returns `true` with no state change
- [ ] `restoreQuietly()` does not fire `restoring`/`restored` events
- [ ] Bulk `onlyTrashed()->restore()` restores only matching trashed records
- [ ] `restoring` event returning `false` cancels the restore
- [ ] `restored` event fires after successful restore
- [ ] Unique constraint violations on restore are handled gracefully
- [ ] Restore is authorized via policies for non-admin users

### Common Failures
- Restoring without checking unique constraints — `QueryException` on conflicting values
- Assuming `restore()` returns the model — it returns `bool`; use `fresh()` for refreshed instance
- Forgetting `onlyTrashed()` before bulk restore — `Model::restore()` without it is a no-op
- Restoring a non-trashed model — returns `true` (no error) but does nothing
- Not checking `wasRestored` — misleading success messages for no-op restores

### Decision Points
- **Instance-level or builder-level restore?** — Use per-instance `restore()` when per-record events are required; use builder-level `restore()` for bulk operations when events are not needed
- **restore() or restoreQuietly()?** — Use `restore()` when event side effects are needed; use `restoreQuietly()` in maintenance scripts to suppress events

### Performance Considerations
- Single row restore is fast — simple UPDATE with primary key WHERE clause
- Bulk builder restore issues one UPDATE — efficient for large sets but may lock rows
- Instance-level restore for bulk is O(n) queries — avoid for more than a few hundred records
- Chunk large bulk restores (>10k rows) to avoid transaction log overflow and table locks

### Security Considerations
- Validate that the authenticated user has permission to restore — use policies with dedicated `restore` method
- Unique constraint violations on restore may reveal information about existing records
- `restoring` event returning `false` is a security gate — use for business rule enforcement
- Audit who restored what and when in the `restored` event handler
- Bulk restore bypasses event gates — implement query-level checks

### Related Rules
- [Restoring-Validate-Unique-Constraints](../restoring/05-rules.md)
- [Restoring-OnlyTrashed-Before-Bulk-Restore](../restoring/05-rules.md)
- [Restoring-Instance-Vs-Builder-Level](../restoring/05-rules.md)
- [Restoring-Restoring-Event-As-Gate](../restoring/05-rules.md)
- [Restoring-Log-In-Restored-Event](../restoring/05-rules.md)
- [Restoring-RestoreQuietly-In-Maintenance](../restoring/05-rules.md)
- [Restoring-Transaction-With-Lock](../restoring/05-rules.md)
- [Restoring-WasRestored-Property](../restoring/05-rules.md)
- [Restoring-Separate-Permission-In-Policies](../restoring/05-rules.md)
- [Restoring-Cascade-To-Children](../restoring/05-rules.md)

### Related Skills
- Mark records as soft-deleted using the SoftDeletes trait
- Query soft-deleted records using withTrashed/onlyTrashed/withoutTrashed
- Force-delete soft-deleted records permanently

### Success Criteria
- `restore()` sets `deleted_at` to `null` on soft-deleted records
- `restore()` on active record is a no-op
- `wasRestored` correctly indicates whether state changed
- Unique constraints are validated before restore — no `QueryException` from conflicts
- Bulk restore with `onlyTrashed()` restores only trashed records
- `restoring` event returning `false` cancels the operation
- `restored` event fires after successful restore
- Restore is properly authorized
