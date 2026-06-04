# Soft Deletes Trait

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
The `SoftDeletes` trait is Eloquent's mechanism for marking records as "deleted" without physically removing them from the database. It injects a global scope (`SoftDeletingScope`) that automatically filters out soft-deleted records from all queries, and provides methods to interact with the soft-delete lifecycle (delete, restore, force delete). The trait relies on a `deleted_at` nullable timestamp column convention.

## Core Concepts
- **Soft delete** — a pattern where a `deleted_at` timestamp is set instead of issuing a `DELETE` SQL statement. The record remains in the table but is considered inactive.
- **`SoftDeletingScope`** — a global scope attached in the trait's `bootSoftDeletes()` method. It adds a `WHERE deleted_at IS NULL` clause to every query unless explicitly overridden.
- **`deleted_at` column** — a nullable `timestamp` column. `NULL` means the record is active; a non-null value is the deletion timestamp.
- **Trait booting** — Eloquent traits can define a `boot<TraitName>()` method to hook into model booting. `SoftDeletes` uses this to register the global scope and add the column to the model's date attributes.

## Mental Models
- **Tombstone vs. Gone** — A soft-deleted record is a tombstone: data still exists but is invisible by default. Physical deletion is the record being truly gone.
- **Trash Bin** — Think of the database table as the filesystem and soft deletes as the recycle bin. Files in the bin are hidden from normal listing but can be restored or emptied.
- **Scope as Gate** — The global scope acts as a gate that filters out trashed records. When you need to see them, you explicitly call `withTrashed()` to open the gate.

## Internal Mechanics
- **`bootSoftDeletes()`** — this static method is called during model booting. It calls `static::addGlobalScope(new SoftDeletingScope)` and marks the `deleted_at` column as a date attribute.
- **`initializeSoftDeletes()`** — appends `deleted_at` to the model's `$dates` (or `$casts`) property on instance initialization.
- **`SoftDeletingScope`** — the scope's `apply()` method adds `WHERE deleted_at IS NULL`. It also handles `restore()` calls and extends the query builder with soft-delete-specific methods (`withTrashed`, `onlyTrashed`, etc.).
- **Flag hijacking** — `SoftDeletingScope` overrides the builder's `delete()` method to perform an `UPDATE SET deleted_at = NOW()` instead of a `DELETE` statement.
- **`getDeletedAtColumn()`** — returns the column name (default `deleted_at`). Models can override this to use a custom column.

### Builder method injection
`SoftDeletingScope@extend()` adds these methods to the query builder:
- `withTrashed($withTrashed = true)` — removes the global scope, disabling the `deleted_at IS NULL` filter.
- `onlyTrashed()` — adds `WHERE deleted_at IS NOT NULL`.
- `withoutTrashed()` — re-applies the original scope filter.

## Patterns
- **Trait + Global Scope** — the trait registers a global scope; the scope contains the query-modification logic. This separates concerns: the trait handles lifecycle, the scope handles query filtering.
- **Flag-based State** — a nullable timestamp column acts as a state flag. `NULL` = active, timestamp = deleted. No join table or separate status column needed.
- **Method Hijacking** — `SoftDeletingScope` intercepts `delete()` on the builder and replaces the query with an update. This is a form of strategy pattern at the query level.

## Architectural Decisions
- **Decision:** Use a global scope instead of query macros.
  - **Context:** Global scopes are automatically applied. Macros require explicit calls.
  - **Consequence:** Trait consumers get soft-delete behavior without thinking about it. The tradeoff is that `all()` and similar queries silently exclude trashed rows, which can surprise developers unfamiliar with the trait.
- **Decision:** Hijack the `delete()` method at the scope level rather than the model level.
  - **Context:** `Model::destroy()` and relationship `delete()` calls both go through the builder.
  - **Consequence:** All deletion paths respect soft deletes consistently. The hijack lives in one place.
- **Decision:** Keep `deleted_at` a nullable timestamp rather than a boolean.
  - **Context:** A boolean `is_deleted` loses temporal information.
  - **Consequence:** You know *when* something was deleted. Indexing a nullable column also allows partial unique indexes (e.g., only one active record per user).

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Data recoverability after accidental deletion | Database tables grow with "dead" rows | Requires monitoring disk growth; eventual need for pruning |
| Audit trail without separate audit tables | Must remember to query `withTrashed()` when needed | Logic bugs where excluded records are assumed nonexistent |
| No application code changes for basic delete/restore | Global scope affects *all* queries, including counts and exists checks | Unexpected `0` counts until you use `withTrashed()` |
| Simple column convention (`deleted_at`) | Cannot use `deleted_at` column for any other purpose | Collision if model already uses `deleted_at` for business logic |

## Performance Considerations
- **Index `deleted_at`** — queries filtering on `WHERE deleted_at IS NULL` benefit from a partial index (PostgreSQL) or a filtered index (SQL Server). Without an index, the scope causes full table scans on large tables.
- **Composite indexes** — if queries filter on `user_id` and `deleted_at IS NULL`, prefer a composite index `(user_id, deleted_at)` where `deleted_at` is last.
- **Soft-delete bloat** — over time, the table accumulates rows. This degrades index scans and increases buffer pool pressure. Plan for archiving or pruning (see Prunable Trait).
- **Scope overhead** — each query pays the cost of applying the scope. In practice, this is negligible (a single `whereNull` clause), but with many models using soft deletes in a single request, the query modifications add up.

## Production Considerations
- **Always check `withTrashed()` in admin panels** — admin-facing queries (list users, view resources) should include trashed records by default to avoid confusion when looking up deleted entities.
- **Unique constraint interaction** — a unique index on `(email)` will prevent re-creating a soft-deleted record with the same email. Use a partial unique index: `CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL`.
- **Backup before force-delete** — permanent deletion of soft-deleted records is irreversible. Run `forceDelete` inside a transaction and verify before committing if doing bulk operations.
- **Migration setup** — add `$table->softDeletes()` (adds `deleted_at` nullable timestamp) and `$table->dropSoftDeletes()` for rollback.

## Common Mistakes
- **Forgetting to add `deleted_at` column** — the trait works without error but `deleted_at` will always be `NULL`, meaning soft deletes never actually mark anything as deleted. Laravel 11+ throws a proper exception; earlier versions silently fail.
- **Unique constraint violations on restore** — if a unique column (e.g., `slug`) was reused by a new record, restoring trashes uniqueness. Validate before restoring.
- **Assuming `delete()` always returns boolean** — soft-delete `delete()` returns `true` (the update succeeded), not the number of affected rows. Check `wasRecentlyDeleted` or `trashed()` for the actual state.
- **Missing `SoftDeletes` on related models** — removing a parent via `cascadeOnDelete` does NOT trigger soft deletes on children; children must implement `SoftDeletes` themselves or use `cascadeOnUpdate` listeners.

## Failure Modes
- **Silent data retention** — developer writes a "delete" expecting physical removal but uses a model with `SoftDeletes`. Data stays and causes compliance issues (GDPR right to erasure).
- **Scope bypass through raw queries** — `DB::table('users')->delete()` bypasses the model and the global scope, performing a hard delete. Always use the model for soft-deleted tables.
- **Race conditions on restore** — two processes restore the same record. Both succeed (the second overwrites the first's `deleted_at = NULL`), but the record has two "restored" timestamps. Consider using optimistic locking if this is a concern.

## Ecosystem Usage
- **Laravel Nova** — respects soft deletes natively. Resource `trashed` methods control whether trashed records appear.
- **Laravel Sanctum** — `PersonalAccessToken` model uses `SoftDeletes`; revoked tokens are soft-deleted.
- **Laravel Jetstream / Teams** — team memberships often use soft deletes for recoverability.
- **Spatie Media Library** — `Media` model is soft-deletable; deleted media remain in storage until explicitly pruned.
- **Laravel Auditing** — works alongside soft deletes; audit trails capture the soft-delete event as an `update` type, not a `delete`.

## Related Knowledge Units

### Prerequisites
- Eloquent Model Basics — model creation, configuration, and conventions
- Laravel Migrations — adding columns and modifying table schemas
- Global Scopes — understanding how Eloquent global scopes apply query constraints

### Related Topics
- Querying Soft Deletes
- Restoring
- Force Deleting

### Advanced Follow-up Topics
- Prunable Trait
- Global Scopes
- Eloquent Lifecycle Events

## Research Notes
- Laravel 11 introduced `$table->softDeletes()` returning a `ColumnDefinition` instead of `void` (allowing further column modifiers). No behavioral change.
- The `SoftDeletingScope` was refactored in Laravel 10 to use the builder's `whereNull` method for better database compatibility.
- PostgreSQL partial unique indexes are the recommended approach for unique constraints on soft-deletable tables. MySQL 8.0.13+ also supports `WHERE` clauses in unique indexes (functional indexes).
- Consider using `SoftDeletes` with `ULID` or `UUID` primary keys; the timestamp-based sorting of auto-increment IDs is lost, so `deleted_at` becomes the sole ordering mechanism for trashed records.
- Future Laravel versions may move toward implicit soft-delete detection via migration column types rather than explicit trait usage, but no timeline exists.
