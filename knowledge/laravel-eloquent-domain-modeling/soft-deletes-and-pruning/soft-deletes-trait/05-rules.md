# Phase 5: Rules — Soft Deletes Trait

## Rule 1: Prefer soft deletes only for recoverable business data
---
## Category
Design
---
## Rule
Use `SoftDeletes` only on models where data recovery is a business requirement. Do not apply it universally to every model.
---
## Reason
Soft deletes add query overhead (`WHERE deleted_at IS NULL` on every query), inflate table size with stale rows, and require a pruning strategy. Ephemeral data (logs, cache, sessions) should use hard deletes.
---
## Bad Example
```php
class SessionLog extends Model
{
    use SoftDeletes; // Session logs do not need recovery; hard delete is simpler
}
```
---
## Good Example
```php
class User extends Model
{
    use SoftDeletes; // Users need recoverability after accidental deletion
}

class SessionLog extends Model
{
    // No SoftDeletes — ephemeral data, hard delete is appropriate
}
```
---
## Exceptions
Regulatory requirements that mandate a soft-delete/audit trail for all record types, including ephemeral data.
---
## Consequences Of Violation
Unbounded table growth, degraded index scan performance, unnecessary query overhead on every `SELECT`, and eventual need for emergency pruning.
---

## Rule 2: Always add a partial unique index for unique columns on soft-deletable models
---
## Category
Performance
---
## Rule
Create a partial unique index (`WHERE deleted_at IS NULL`) on every unique column when using `SoftDeletes`. Do not rely on a standard unique index alone.
---
## Reason
A standard unique index prevents creating a new record with the same unique value as a soft-deleted record. A partial unique index enforces uniqueness only among active records, allowing the value to be reused after deletion.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
    $table->unique('email'); // Prevents creating user with same email as soft-deleted user
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
});
DB::statement('CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL');
```
---
## Exceptions
Tables without unique constraints, or UUID-based primary keys where uniqueness is never contested.
---
## Consequences Of Violation
`QueryException` on restore when a unique value was reused; inability to create new records after deletion of one with the same unique value.
---

## Rule 3: Always add `$table->softDeletes()` in migrations for soft-deletable models
---
## Category
Maintainability
---
## Rule
Use the `$table->softDeletes()` schema method to add the `deleted_at` column. Do not manually define a nullable timestamp column.
---
## Reason
`softDeletes()` sets the standard column type (nullable timestamp), follows Laravel conventions, provides a `dropSoftDeletes()` rollback, and integrates with the trait expectations. Laravel 11+ may throw an exception if the column is missing.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->timestamp('deleted_at')->nullable(); // Manual column, no standard convention
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes(); // Standard convention, supports dropSoftDeletes()
});
```
---
## Exceptions
Legacy migrations that must match an existing schema that does not use `softDeletes()`.
---
## Consequences Of Violation
Inconsistent column definitions, broken rollback migrations, potential trait-level validation failures in newer Laravel versions.
---

## Rule 4: Index the `deleted_at` column on every soft-deletable table
---
## Category
Performance
---
## Rule
Add a database index on the `deleted_at` column for every model that uses `SoftDeletes`. Use composite indexes where applicable.
---
## Reason
The `SoftDeletingScope` adds `WHERE deleted_at IS NULL` to every query. Without an index, this causes a full table scan on every query against the table.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
    // No index on deleted_at — every query scans all rows
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
    $table->index('deleted_at'); // Single column index

    // Or composite for common query patterns:
    // $table->index(['team_id', 'deleted_at']);
});
```
---
## Exceptions
Tables with fewer than 1,000 rows where full table scans are negligible.
---
## Consequences Of Violation
Full table scans on every Eloquent query against the model, degraded performance as the table grows, increased database CPU and I/O.
---

## Rule 5: Never use raw `DB::table()->delete()` on soft-deletable models
---
## Category
Reliability
---
## Rule
Always use Eloquent model instances or builders for deletion on soft-deletable models. Do not use `DB::table()` delete operations.
---
## Reason
Raw `DB::table()->delete()` issues a physical `DELETE` statement that bypasses the `SoftDeletingScope` and the model's `delete()` override. This permanently removes records that should only be soft-deleted.
---
## Bad Example
```php
DB::table('users')->where('id', $id)->delete(); // Permanently deletes, bypassing SoftDeletes
```
---
## Good Example
```php
User::findOrFail($id)->delete(); // Sets deleted_at — correct
// or
User::where('id', $id)->delete(); // Builder delete also respects SoftDeletes
```
---
## Exceptions
Explicit force-deletion scripts where you intentionally bypass Eloquent and have verified the `deleted_at` condition in the WHERE clause.
---
## Consequences Of Violation
Permanent data loss of records that should have been soft-deleted; compliance violations if the soft-delete was required for audit/recovery.
---

## Rule 6: Apply a pruning strategy to every soft-deletable model
---
## Category
Maintainability
---
## Rule
Implement a data retention and pruning strategy for every model that uses `SoftDeletes`. Do not let soft-deleted records accumulate indefinitely.
---
## Reason
Soft-deleted rows are never automatically removed. Over time they inflate table size, degrade index scans, increase backup size, and consume buffer pool memory. A pruning strategy (using `Prunable` or `MassPrunable`) ensures old soft-deleted records are eventually removed.
---
## Bad Example
```php
class User extends Model
{
    use SoftDeletes;
    // No Prunable trait — soft-deleted users accumulate forever
}
```
---
## Good Example
```php
class User extends Model
{
    use SoftDeletes, Prunable;

    public function prunable(): Builder
    {
        return static::onlyTrashed()->where('deleted_at', '<=', now()->subYear());
    }
}
```
---
## Exceptions
Models where retention is legally mandated (financial records, medical data). In such cases, document the retention policy explicitly.
---
## Consequences Of Violation
Unbounded table growth, degraded query performance, increased backup times and storage costs, potential out-of-disk-space incidents.
---

## Rule 7: Prefer `deleted_at` nullable timestamp over `is_deleted` boolean
---
## Category
Design
---
## Rule
Use the nullable `deleted_at` timestamp column convention. Do not replace it with a boolean `is_deleted` column.
---
## Reason
The timestamp provides temporal information (when the record was deleted), supports `onlyTrashed()` date-range filtering, and is the standard convention expected by `SoftDeletingScope`. A boolean loses deletion timing and requires additional columns for time-based queries.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('is_deleted')->default(false);
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes(); // nullable deleted_at timestamp
});
```
---
## Exceptions
Legacy systems migrating to Laravel where changing the column type is impractical.
---
## Consequences Of Violation
Loss of deletion timing metadata, inability to use built-in scope methods like `onlyTrashed()` with date conditions, and deviation from Laravel conventions.
---

## Rule 8: Cascade soft deletes to related models manually in model events
---
## Category
Reliability
---
## Rule
Handle child soft deletes in model event listeners. Do not rely on database-level `ON DELETE CASCADE` to propagate soft deletes.
---
## Reason
`ON DELETE CASCADE` is a hard-delete mechanism — it issues real `DELETE` statements on child tables, bypassing the `SoftDeletes` trait. Soft deletes must be propagated at the application level.
---
## Bad Example
```php
// Migration — relies on database cascade
$table->foreignId('user_id')->constrained()->cascadeOnDelete();

// When User is soft-deleted, the database does NOT cascade to posts
```
---
## Good Example
```php
class User extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::deleted(function (User $user) {
            // Manually soft-delete children
            $user->posts()->delete();
        });

        static::restored(function (User $user) {
            $user->posts()->onlyTrashed()->restore();
        });
    }
}
```
---
## Exceptions
Pivot tables in many-to-many relationships where a hard detach is the intended behavior.
---
## Consequences Of Violation
Orphaned related records that remain active after parent soft-deletion; data integrity issues; unexpected hard deletes if `ON DELETE CASCADE` is mistakenly applied.
---

## Rule 9: Never use `SoftDeletes` as a compliance mechanism for right-to-erasure
---
## Category
Security
---
## Rule
Do not rely on `SoftDeletes` to satisfy data erasure compliance requirements (e.g., GDPR Article 17). Soft deletes do not physically remove data.
---
## Reason
Soft deletes leave the record intact in the database with a `deleted_at` timestamp. The data remains readable via `withTrashed()`, raw queries, or direct database access. Right-to-erasure requires actual deletion or anonymization of the personal data.
---
## Bad Example
```php
// GDPR erasure request handler
$user->delete(); // Only sets deleted_at — data remains fully accessible
```
---
## Good Example
```php
// GDPR erasure request handler
$user->forceDelete(); // Permanently removes the record
// Or: anonymize the record
$user->update([
    'email' => 'redacted-'.$user->id.'@example.com',
    'name' => 'Redacted User',
]);
```
---
## Exceptions
Compliance frameworks that explicitly permit soft delete with a defined retention period and subsequent physical deletion.
---
## Consequences Of Violation
Regulatory fines, compliance audit failures, data protection authority sanctions, and reputational damage from retained personal data.
---

## Rule 10: Always add the `deleted_at` column to the `$dates` or `$casts` property
---
## Category
Framework Usage
---
## Rule
Ensure `deleted_at` is cast to a `datetime` or `immutable_datetime` type. Do not leave it as a raw string or uncast column when using `SoftDeletes`.
---
## Reason
The `SoftDeletes` trait expects `deleted_at` to be a Carbon instance for comparisons, serialization, and scope filtering. Laravel 10+ includes it automatically, but explicit casting prevents regressions and clarifies intent.
---
## Bad Example
```php
class User extends Model
{
    use SoftDeletes;
    protected $casts = [
        'email_verified_at' => 'datetime',
        // deleted_at is missing — may be treated as a string
    ];
}
```
---
## Good Example
```php
class User extends Model
{
    use SoftDeletes; // Laravel 10+ auto-casts deleted_at to datetime

    // Or explicitly:
    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime:Y-m-d H:i:s',
        ];
    }
}
```
---
## Exceptions
None. Laravel 10+ handles this automatically; the rule applies to versions where auto-casting is not guaranteed.
---
## Consequences Of Violation
Serialization inconsistencies, comparison bugs in scopes, unexpected behavior in JSON/array output of soft-deleted records.
---

## Rule 11: Use `SoftDeletes` with UUID/ULID primary keys to avoid collision concerns on restore
---
## Category
Scalability
---
## Rule
Prefer UUID or ULID primary keys for soft-deletable models with high deletion-and-recreation volume. Do not rely on auto-increment IDs for uniqueness guarantees after restore.
---
## Reason
Auto-increment IDs increment globally. After deleting and recreating a record multiple times, the ID sequence grows unbounded. UUIDs/ULIDs provide globally unique identifiers that do not collide on restore, and work seamlessly with partial unique indexes.
---
## Bad Example
```php
class User extends Model
{
    use SoftDeletes;
    // Auto-increment ID — ID values climb rapidly with repeated delete/restore cycles
}
```
---
## Good Example
```php
class User extends Model
{
    use HasUuids, SoftDeletes;
    // UUID primary key — no ID collision or sequence exhaustion concerns
}
```
---
## Exceptions
Existing tables with auto-increment IDs where migration to UUID is impractical.
---
## Consequences Of Violation
Integer ID exhaustion in high-volume tables, ID sequence gaps that confuse business logic, and potential integer overflow on large tables.
---

## Rule 12: Use `getDeletedAtColumn()` only when overriding the default column name
---
## Category
Maintainability
---
## Rule
Override `getDeletedAtColumn()` only when the `deleted_at` column name must differ from convention. Do not override it unnecessarily.
---
## Reason
The method exists for customization but adds cognitive overhead. Using the standard `deleted_at` column name keeps the model consistent with Laravel conventions and other developer expectations.
---
## Bad Example
```php
class User extends Model
{
    use SoftDeletes;

    public function getDeletedAtColumn(): string
    {
        return 'deleted_at'; // Unnecessary override of the default
    }
}
```
---
## Good Example
```php
class User extends Model
{
    use SoftDeletes;
    // No override — uses default 'deleted_at' column
}

class LegacyPage extends Model
{
    use SoftDeletes;

    public function getDeletedAtColumn(): string
    {
        return 'archive_date'; // Legitimate custom column name
    }
}
```
---
## Exceptions
Integration with legacy database schemas that use a different column name for the deletion timestamp.
---
## Consequences Of Violation
Unnecessary code clutter, confusion when other developers search for `deleted_at` references, and difficult-to-detect bugs if the override conflicts with relationships.
