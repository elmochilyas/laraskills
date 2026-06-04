# Force Deleting Skills

## Skill: Force-delete soft-deleted records permanently using forceDelete()

### Purpose
Use `forceDelete()` to permanently remove soft-deletable records from the database, bypassing the soft-delete mechanism — typically for data that has passed its retention window or for compliance-driven erasure.

### When To Use
- GDPR right to erasure compliance — permanently removing personal data
- Admin trash cleanup — permanently removing records from a recycle bin
- Reclaiming storage — physically deleting data no longer needed for recovery
- Pre-pruning — permanently removing records that should never be restored
- Data sanitization — removing sensitive test/demo data from production

### When NOT To Use
- When data recoverability is required — use `delete()` for soft delete
- On a query builder directly — `forceDelete()` is instance-only; cannot call on builder
- Without authorization — treat as destructive operation requiring admin permissions
- Bulk `forceDelete()` without `onlyTrashed()` — iterating `Model::all()` removes all records
- Assuming `forceDelete()` recovers disk space immediately — InnoDB retains space until `OPTIMIZE TABLE`

### Prerequisites
- Model using `SoftDeletes` trait
- Authorization policy with `forceDelete` method
- Database backup for bulk operations

### Inputs
- Model instance (trashed or active)

### Workflow
1. Scope to trashed records: `Model::onlyTrashed()->find($id)`
2. Authorize via policy: `$this->authorize('forceDelete', $user)`
3. Handle foreign key constraints — delete or detach children first
4. Call `$user->forceDelete()` for permanent deletion
5. Use `forceDeleteQuietly()` in maintenance scripts to suppress events
6. Check `isForceDeleting()` in `deleting` event to differentiate soft vs force delete
7. Log force deletes in `forceDeleted` event for audit trail
8. Queue large bulk force-deletes to avoid memory exhaustion
9. Always backup before bulk force-delete operations

### Validation Checklist
- [ ] `forceDelete()` on soft-deleted model permanently removes the record
- [ ] `forceDelete()` on active model permanently removes the record
- [ ] `forceDeleteQuietly()` fires no events
- [ ] `forceDeleting`/`forceDeleted` events fire in correct order
- [ ] `deleting` listener returning `false` cancels `forceDelete()`
- [ ] `isForceDeleting()` is `true` during `forceDelete()` events
- [ ] Authorization policy and confirmation gate `forceDelete()` for non-admin users
- [ ] Bulk force-delete uses `onlyTrashed()` scope to prevent mass deletion of active records
- [ ] Foreign key constraints are handled before force-deleting parent records

### Common Failures
- Calling `forceDelete()` on a non-trashed model — permanently deletes an active record
- Assuming `forceDelete()` exists on the query builder — `Model::where(...)->forceDelete()` does NOT exist
- Missing `onlyTrashed()` before bulk iteration — permanently deletes ALL records
- Forgetting cascade deletes are real deletes — `ON DELETE CASCADE` causes permanent removal
- Not logging force-deletes — untraceable data loss

### Decision Points
- **forceDelete or delete?** — Use `forceDelete()` for permanent removal; use `delete()` for soft delete with recovery
- **forceDelete or prune?** — Use `forceDelete()` for immediate per-record removal; use pruning for scheduled batch cleanup
- **forceDelete or raw DB::table()->delete()?** — Use `forceDelete()` when events are needed; use raw delete for bulk without events

### Performance Considerations
- Single-row `DELETE` by primary key is fast — comparable to any other DELETE statement
- Bulk force delete via iteration is O(n) queries — use raw DB delete if events are not needed
- Foreign key cascades — if `ON DELETE CASCADE` is set, cascades real deletes to children
- Large bulk force deletes may cause deadlocks — batch with `->limit()` and loop

### Security Considerations
- `forceDelete()` is irreversible — gate behind admin authorization and confirmation
- Audit logging of force deletes is essential for compliance
- `ON DELETE CASCADE` can cascade permanent deletion beyond what was intended
- `forceDeleteQuietly()` suppresses events — audit logging is entirely bypassed
- Foreign key constraint violations can leak information about related data existence

### Related Rules
- [ForceDelete-Gate-With-Policy](../force-deleting/05-rules.md)
- [ForceDelete-OnlyTrashed-Before-Bulk](../force-deleting/05-rules.md)
- [ForceDelete-Quietly-In-Maintenance](../force-deleting/05-rules.md)
- [ForceDelete-IsForceDeleting-In-Observers](../force-deleting/05-rules.md)
- [ForceDelete-Log-For-Audit](../force-deleting/05-rules.md)
- [ForceDelete-Queue-Large-Batches](../force-deleting/05-rules.md)
- [ForceDelete-Handle-FK-Constraints](../force-deleting/05-rules.md)
- [ForceDelete-Instance-Only](../force-deleting/05-rules.md)
- [ForceDelete-Not-When-Recovery-Needed](../force-deleting/05-rules.md)
- [ForceDelete-Backup-Before-Bulk](../force-deleting/05-rules.md)

### Related Skills
- Mark records as soft-deleted using the SoftDeletes trait
- Query soft-deleted records using withTrashed/onlyTrashed/withoutTrashed

### Success Criteria
- `forceDelete()` issues a real `DELETE` statement and removes the record permanently
- `forceDeleteQuietly()` suppresses all model events
- `isForceDeleting()` is `true` during `deleting`/`deleted` events for force deletions
- Authorization policy prevents unauthorized force-delete
- Bulk force-delete scopes to `onlyTrashed()` — never deletes active records
- Foreign key constraints are handled before force-delete
- Audit log captures who performed the force delete
