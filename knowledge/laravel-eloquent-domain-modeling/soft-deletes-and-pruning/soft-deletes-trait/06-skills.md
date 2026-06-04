# Soft Deletes Trait Skills

## Skill: Mark records as soft-deleted using the SoftDeletes trait

### Purpose
Use `SoftDeletes` on Eloquent models to mark records as "deleted" by setting a `deleted_at` timestamp instead of physically removing them from the database, enabling data recovery and audit trails.

### When To Use
- Data that needs recoverability after accidental deletion (users, content, configurations)
- Audit requirements where deletion history must be preserved
- Soft references where other records may point to the deleted record
- Compliance scenarios requiring deletion to be reversible within a window

### When NOT To Use
- For ephemeral data (logs, cache, temporary records) — physical deletion is more appropriate
- When the table grows unbounded and soft-deleted rows accumulate without a pruning strategy
- When GDPR right to erasure requires actual data removal — soft deletes do not erase data
- For pivot tables on many-to-many relationships — use `detach()` instead
- When a hard delete is semantically required — soft delete misleadingly implies recoverability

### Prerequisites
- Migration with `$table->softDeletes()` adding a nullable `deleted_at` timestamp
- Database that supports partial unique indexes for unique columns

### Inputs
- Eloquent model instance with `SoftDeletes` trait

### Workflow
1. Add `$table->softDeletes()` to the model's migration
2. Import and add `use SoftDeletes` to the model class
3. Add a partial unique index for every unique column: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`
4. Index the `deleted_at` column for performance
5. Cascade soft deletes to children in model event listeners (not via `ON DELETE CASCADE`)
6. Implement a pruning strategy via `Prunable` or `MassPrunable` for old soft-deleted records
7. Use `withTrashed()` in admin panels for full visibility
8. Never use raw `DB::table()->delete()` on soft-deletable models

### Validation Checklist
- [ ] `deleted_at` column exists in the migration (`$table->softDeletes()`)
- [ ] Partial unique index is added for unique columns (`WHERE deleted_at IS NULL`)
- [ ] `deleted_at` column is indexed
- [ ] `SoftDeletes` trait is imported and used on the model
- [ ] `$model->delete()` performs an UPDATE, not a DELETE (verify via DB query log)
- [ ] `$model->trashed()` returns correct state after delete and restore
- [ ] Raw `DB::table()` deletes are not used on soft-deletable models
- [ ] Pruning strategy is planned for accumulated soft-deleted records

### Common Failures
- Forgetting to add `deleted_at` column — the trait works but soft deletes never mark anything
- Unique constraint violations on restore — a record with a reused unique value cannot be restored
- Missing `SoftDeletes` on related models — deleting a parent does NOT cascade soft-delete children
- Using `SoftDeletes` without a pruning strategy — table grows indefinitely with dead rows
- Using `DB::table()->delete()` bypasses the soft-delete mechanism entirely

### Decision Points
- **Soft delete or hard delete?** — Use soft delete for recoverable business data; use hard delete for ephemeral data
- **Cascade via events or database?** — Cascade soft deletes in model events (application level); never use `ON DELETE CASCADE` (database-level hard delete)
- **Partial unique index or standard unique?** — Always use partial unique index (`WHERE deleted_at IS NULL`) to allow value reuse after deletion

### Performance Considerations
- Index `deleted_at` — the `WHERE deleted_at IS NULL` scope clause causes full table scans without an index
- Use composite indexes for common query patterns: `(user_id, deleted_at)` with `deleted_at` last
- Soft-delete bloat accumulates over time — implement pruning strategy
- Partial unique indexes add overhead on insert but prevent unique constraint conflicts

### Security Considerations
- Soft-deleted records are still accessible via `withTrashed()` — sensitive data remains in the database
- Soft deletes do NOT satisfy GDPR right to erasure — must use `forceDelete()` for compliance
- Ensure admin panels use `withTrashed()` — otherwise deleted records appear nonexistent
- `$hidden` should still protect sensitive attributes on soft-deleted records when serialized

### Related Rules
- [SoftDeletes-Prefer-For-Recoverable-Data](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Partial-Unique-Index](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Use-SoftDeletes-Migration](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Index-DeletedAt](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-No-Raw-Delete](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Pruning-Strategy](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Timestamp-Over-Boolean](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Cascade-Manually-In-Events](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Not-For-Compliance](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-Cast-DeletedAt](../soft-deletes-trait/05-rules.md)
- [SoftDeletes-UUID-For-High-Volume](../soft-deletes-trait/05-rules.md)

### Related Skills
- Query soft-deleted records using withTrashed/onlyTrashed/withoutTrashed
- Restore soft-deleted records
- Force-delete soft-deleted records permanently

### Success Criteria
- `delete()` sets `deleted_at` to current timestamp instead of issuing DELETE
- `trashed()` returns `true` for soft-deleted records, `false` for active
- Soft-deleted records are excluded from default queries
- Partial unique index allows creating new records with the same unique value as a deleted record
- Pruning strategy removes old soft-deleted records after the retention period
