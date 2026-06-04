# Soft Deletes Trait — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Soft Deletes Trait
- **ECC Version:** 1.0

## Overview
The `SoftDeletes` trait marks records as "deleted" without physically removing them from the database. It injects a `SoftDeletingScope` global scope that automatically filters out soft-deleted records from all queries, and provides methods for the soft-delete lifecycle (`delete`, `restore`, `forceDelete`). The trait relies on a nullable `deleted_at` timestamp column convention. Soft deletes enable data recovery, audit trails, and reversible deletions while keeping records in the table.

## Core Concepts
- Soft delete — sets `deleted_at` timestamp instead of issuing a `DELETE` SQL statement; record remains in the table
- `SoftDeletingScope` — global scope added during `bootSoftDeletes()` that adds `WHERE deleted_at IS NULL` to all queries
- `deleted_at` column — nullable timestamp; `NULL` = active, non-null = deletion timestamp
- Trait booting — `bootSoftDeletes()` registers the global scope; `initializeSoftDeletes()` appends `deleted_at` to dates
- Method hijacking — `SoftDeletingScope` overrides the builder's `delete()` to perform `UPDATE SET deleted_at = NOW()` instead of `DELETE`
- `getDeletedAtColumn()` — returns column name (default `deleted_at`); models can override for custom column

## When To Use
- Data that needs recoverability after accidental deletion (users, content, configurations)
- Audit requirements where deletion history must be preserved
- Soft references where other records may point to the deleted record
- Compliance scenarios requiring deletion to be reversible within a window
- Any model where permanent data loss is unacceptable without explicit confirmation

## When NOT To Use
- Do NOT use for ephemeral data (logs, cache, temporary records) — physical deletion is more appropriate
- Do NOT use when the table grows unbounded and soft-deleted rows accumulate without a pruning strategy
- Do NOT use when GDPR right to erasure requires actual data removal — soft deletes do not erase data
- Do NOT use for pivot tables on many-to-many relationships — use `detach()` instead
- Do NOT use when a hard delete is semantically required — soft delete misleadingly implies recoverability

## Best Practices (WHY)
- Always add a partial unique index for unique columns: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`
- Always add `$table->softDeletes()` in migrations; use `dropSoftDeletes()` for rollback
- Index the `deleted_at` column to avoid full table scans on the global scope filter
- Use `withTrashed()` in admin panels — admin queries should include trashed records by default
- Plan for pruning: implement `Prunable` trait to periodically remove old soft-deleted records
- Test that `delete()` actually sets `deleted_at` and does not issue a `DELETE` statement

## Architecture Guidelines
- Apply `SoftDeletes` to models where data recovery is a business requirement, not universally
- Keep `deleted_at` as a nullable timestamp column — don't replace it with a boolean `is_deleted`
- For cascade behavior, soft-delete children manually in model events — `ON DELETE CASCADE` performs hard deletes
- Use `SoftDeletes` with a unique identifier strategy that accommodates soft-deleted duplicates (UUID/ULID or partial indexes)
- Document which models use soft deletes and what the retention/pruning policy is

## Performance
- Index `deleted_at` — the `WHERE deleted_at IS NULL` scope clause causes full table scans without an index
- Composite indexes — for queries filtering on `user_id` and `deleted_at`, use `(user_id, deleted_at)` with `deleted_at` last
- Soft-delete bloat — table grows with "dead" rows, degrading index scans and buffer pool performance over time
- Scope overhead — each query pays the cost of applying the `whereNull` clause; negligible per query but adds up with many models
- Unique partial indexes — `WHERE deleted_at IS NULL` avoids unique constraint conflicts with soft-deleted duplicates

## Security
- Soft-deleted records are still accessible via `withTrashed()` — sensitive data remains in the database
- Soft deletes do NOT satisfy GDPR right to erasure — must use `forceDelete()` or physical deletion for compliance
- Ensure admin panels use `withTrashed()` — otherwise deleted records appear nonexistent, causing confusion
- `$hidden` should still protect sensitive attributes on soft-deleted records when serialized
- Raw queries (`DB::table()->delete()`) bypass the soft-delete mechanism — always use the model

## Common Mistakes
- Forgetting to add `deleted_at` column — the trait works but soft deletes never actually mark anything; Laravel 11+ throws an exception
- Unique constraint violations on restore — a record with a unique slug that was reused by a new record cannot be restored
- Assuming `delete()` always returns boolean — soft-delete `delete()` returns `true` (the update succeeded), not affected row count
- Missing `SoftDeletes` on related models — deleting a parent does NOT cascade soft-delete to children
- Using `SoftDeletes` without a pruning strategy — the table grows indefinitely with "dead" rows

## Anti-Patterns
- **Soft deletes on everything**: applying `SoftDeletes` universally without considering which records genuinely need recovery
- **No pruning strategy**: soft-deleting records indefinitely without a plan to archive or physically delete them
- **Boolean instead of timestamp**: using `is_deleted = true` instead of a nullable `deleted_at` timestamp, losing temporal information
- **Relying on soft deletes for compliance**: soft deletes do not actually remove data — not compliant with right-to-erasure requirements
- **Scope bypass through raw queries**: using `DB::table()` for delete operations, bypassing the `SoftDeletingScope`

## Examples
```php
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use SoftDeletes;

    protected $dates = ['deleted_at']; // Laravel 9-; Laravel 10+ uses $casts
}

// Migration
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes(); // adds deleted_at nullable timestamp
});

// Usage
$user = User::find(1);
$user->delete();              // Sets deleted_at to now
$user->trashed();             // true
$user->restore();             // Sets deleted_at to null
User::withTrashed()->get();   // All records including deleted
User::onlyTrashed()->get();   // Only deleted records

// Partial unique index (PostgreSQL/MySQL 8.0.13+)
DB::statement('CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL');
```

## Related Topics
- querying-soft-deletes — withTrashed, onlyTrashed, withoutTrashed query scopes
- restoring — reverting soft-deleted records to active
- force-deleting — permanently removing soft-deleted records
- prunable-trait — automated cleanup of old soft-deleted records
- mass-prunable — bulk pruning without model events

## AI Agent Notes
- Always add `$table->softDeletes()` in the migration when using `SoftDeletes` trait
- Recommend a partial unique index for unique columns on soft-deletable tables
- `SoftDeletingScope` hijacks `delete()` to perform an UPDATE — this is transparent to the developer
- Raw `DB::table('users')->delete()` bypasses soft deletes — always use the model
- `SoftDeletes` does NOT cascade to related models — handle child soft deletes in model events
- Plan for pruning — soft-deleted rows accumulate and degrade performance over time

## Verification
- [ ] `deleted_at` column exists in the migration (`$table->softDeletes()`)
- [ ] Partial unique index is added for unique columns (`WHERE deleted_at IS NULL`)
- [ ] `deleted_at` column is indexed
- [ ] `SoftDeletes` trait is imported and used on the model
- [ ] `$model->delete()` performs an UPDATE, not a DELETE (verify via DB query log)
- [ ] `$model->trashed()` returns correct state after delete and restore
- [ ] Raw `DB::table()` deletes are not used on soft-deletable models
- [ ] Pruning strategy is planned for accumulated soft-deleted records
