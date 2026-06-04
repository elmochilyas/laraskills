# Decomposition — Soft Deletes Trait

## Implementation Tasks

### T1: Add the `SoftDeletes` trait and `deleted_at` column migration
**File:** `database/migrations/xxxx_create_users_table.php` and `app/Models/User.php`
- Add `$table->softDeletes()` in the migration's `up()` method.
- Add `$table->dropSoftDeletes()` in `down()`.
- Import `Illuminate\Database\Eloquent\SoftDeletes` trait in the model.
- Use the trait inside the class: `use SoftDeletes;`.

### T2: Verify global scope registration
**File:** `app/Models/User.php` (or a test)
- Assert that `User::getGlobalScope(SoftDeletingScope::class)` returns an instance after boot.
- Confirm `User::all()->toSql()` contains `WHERE deleted_at IS NULL`.

### T3: Override the `deleted_at` column name (if needed)
**File:** `app/Models/Post.php`
- Override `public function getDeletedAtColumn(): string` to return a custom column (e.g., `'removed_at'`).
- Ensure the migration uses that custom column instead of `softDeletes()`.

### T4: Add partial unique index for soft-deletable tables
**File:** `database/migrations/xxxx_add_partial_unique_index_to_users_table.php`
- Raw SQL for PostgreSQL: `CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL`.
- Raw SQL for MySQL (8.0.13+): `CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL`.
- SQLite note: partial unique indexes not supported; use `withoutTrashed()` validation at the application layer.

### T5: Handle `cascade` behavior with soft-deleted parents
**File:** `app/Models/Post.php` (with `SoftDeletes` and `belongsTo(User::class)`)
- Ensure `onDelete('cascade')` in the foreign key migration does NOT cascade soft-delete.
- Add a `Bootable` trait or listener to soft-delete children when parent is soft-deleted:
  `static::deleted(fn ($user) => $user->posts()->delete())`.

### T6: Add `trashed()` state-check method test
**File:** `tests/Unit/SoftDeletesTraitTest.php`
- Create a model instance, soft-delete it, assert `$model->trashed()` returns `true`.
- Restore it, assert `trashed()` returns `false`.

### T7: Add `SoftDeletes` to a pivot table (optional)
**File:** `database/migrations/xxxx_create_role_user_table.php`
- Add `$table->softDeletes()` to the pivot migration.
- Use `->withPivot('deleted_at')` on the `belongsToMany` relationship.
- Note: `detach()` on a many-to-many does NOT soft-delete; it hard-deletes the pivot row.

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `SoftDeletes` trait boot registers `SoftDeletingScope` | Scope instance retrievable via `getGlobalScope()` |
| `Model::all()` excludes soft-deleted records | SQL contains `WHERE deleted_at IS NULL` |
| `Model::withTrashed()->get()` includes all records | SQL removes the `WHERE deleted_at IS NULL` clause |
| `$model->delete()` sets `deleted_at` instead of issuing `DELETE` | Record persists in DB with non-null `deleted_at` |
| `$model->trashed()` returns correct state | Returns `true` after delete, `false` after restore |
| Raw query `DB::table('users')->delete()` performs hard delete | Record physically removed even if model uses `SoftDeletes` |
| Unique constraint allows soft-deleted duplicates | Insert succeeds for soft-deleted record's unique value |
| Custom `getDeletedAtColumn()` returns configured column | Method returns custom column name string |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization