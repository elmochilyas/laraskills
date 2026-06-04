# Anti-Patterns: Soft Deletes Trait

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Soft Deletes Trait

## Anti-Patterns

### Soft Deletes on Everything
Applying `SoftDeletes` universally to every model without considering which records genuinely need recovery. Ephemeral data (logs, cache, sessions) that will never be restored accumulates indefinitely.

**Problem:** Unbounded table growth, degraded index scan performance, unnecessary query overhead on every SELECT, and eventual need for emergency pruning.

**Solution:** Use `SoftDeletes` only on models where data recovery is a documented business requirement. Use hard deletes for ephemeral data.

### No Pruning Strategy
Soft-deleting records indefinitely without a plan to archive or physically delete them. The table grows with "dead" rows that consume storage and degrade performance.

**Problem:** Soft-deleted rows inflate table size, degrade index scans, increase backup size, and consume buffer pool memory — eventually causing out-of-disk-space incidents.

**Solution:** Implement a pruning strategy using `Prunable` or `MassPrunable` for every soft-deletable model. Define a retention window and schedule `model:prune`.

### Boolean Instead of Timestamp
Using `is_deleted = true` (boolean) instead of a nullable `deleted_at` timestamp. This loses temporal information about when a record was deleted.

**Problem:** No deletion timing metadata, inability to use built-in scope methods like `onlyTrashed()` with date conditions, no support for partial unique indexes, deviation from Laravel conventions.

**Solution:** Always use `$table->softDeletes()` in migrations to add a nullable `deleted_at` timestamp column.

### Relying on Soft Deletes for Compliance
Using `SoftDeletes` to satisfy data erasure compliance requirements (e.g., GDPR Article 17). Soft deletes do not physically remove data — the record remains fully accessible in the database.

**Problem:** Regulatory fines, compliance audit failures, data protection authority sanctions, and reputational damage from retained personal data.

**Solution:** Use `forceDelete()` for right-to-erasure requests, or anonymize the record by overwriting personal data fields.

### Scope Bypass Through Raw Queries
Using `DB::table('users')->delete()` or other raw queries on soft-deletable models. Raw queries bypass the `SoftDeletingScope` and issue a physical DELETE instead of setting `deleted_at`.

**Problem:** Permanent data loss of records that should have been soft-deleted; compliance violations if soft-delete was required for audit or recovery.

**Solution:** Always use Eloquent model instances or builders for deletion on soft-deletable models.

### Assuming Cascade Applies
Deleting a parent model and assuming soft deletes cascade to children. `ON DELETE CASCADE` performs hard deletes at the database level, and `SoftDeletes` does not automatically propagate to related models.

**Problem:** Orphaned related records that remain active after parent soft-deletion, or unexpected hard deletes if `ON DELETE CASCADE` is mistakenly applied.

**Solution:** Cascade soft deletes to children manually in model event listeners (e.g., `static::deleted(fn ($model) => $model->children()->delete())`).

### No Unique Constraint Strategy
Using a standard unique index on a soft-deletable table, which prevents creating a new record with the same unique value as a soft-deleted record. On restore, the operation fails with a unique constraint violation.

**Problem:** `QueryException` on restore when a unique value was reused; inability to create new records after deletion of one with the same unique value.

**Solution:** Always use a partial unique index (`CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`) so uniqueness is enforced only among active records.
