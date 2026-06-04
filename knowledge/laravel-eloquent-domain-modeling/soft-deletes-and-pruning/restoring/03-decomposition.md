# Decomposition — Restoring

## Implementation Tasks

### T1: Implement and test instance `restore()`
**File:** `tests/Unit/RestoringTest.php`
- Create a model, soft-delete it, assert `$model->trashed()` is `true`.
- Call `$model->restore()`.
- Assert return value is `true`.
- Assert `$model->fresh()->trashed()` is `false`.
- Assert `$model->fresh()->deleted_at` is `null`.

### T2: Test `restore()` on a non-trashed model
**File:** `tests/Unit/RestoringTest.php`
- Call `restore()` on an active model (never deleted).
- Assert return value is `true` (no-op success).
- Assert model state unchanged.

### T3: Implement and test `restoreQuietly()`
**File:** `tests/Unit/RestoringTest.php`
- Set up a listener/spy for `restoring` and `restored` events.
- Call `restoreQuietly()` on a soft-deleted model.
- Assert events were NOT fired.
- Assert model is restored (deleted_at is null).

### T4: Bulk restore via query builder
**File:** `tests/Unit/RestoringTest.php`
- Soft-delete multiple records matching a condition.
- Call `Model::onlyTrashed()->where('category', 'archived')->restore()`.
- Assert only matching records are restored.
- Assert non-matching trashed records remain trashed.

### T5: Implement `restoring` event listener / observer
**File:** `app/Observers/UserObserver.php`
- Register observer in `EventServiceProvider` or `User::observe()`.
- In `restoring(User $user)`, validate unique constraints and return `false` to cancel if conflict exists.
- In `restored(User $user)`, log the restore action or clear cache.

### T6: Write test for `restoring` event cancellation
**File:** `tests/Unit/RestoringTest.php`
- Attach a listener that returns `false` from `restoring`.
- Assert `restore()` returns `false`.
- Assert model remains soft-deleted.

### T7: Implement cascading restore for related models
**File:** `app/Models/User.php` (in `restored` event)
- When a `User` is restored, restore all soft-deleted `Post` records owned by the user.
- Use `$user->posts()->onlyTrashed()->restore()`.
- Add test confirming children are restored after parent restore.

### T8: Handle unique constraint violation during restore
**File:** `app/Models/Post.php` or `app/Observers/PostObserver.php`
- Before restore, check if the record's unique columns (e.g., `slug`) conflict with existing active records.
- If conflict, throw a custom `RestoreConflictException`.
- Write test that attempts to restore a record with a conflicting slug.

### T9: Implement `wasRestored` state check
**File:** `tests/Unit/RestoringTest.php`
- After calling `restore()`, assert `$model->wasRestored()` returns `true` (if method exists) or check `$model->wasRestored` property.
- After `fresh()`, assert the flag is reset (`false` or `null`).

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `$model->restore()` on soft-deleted record | Returns `true`; `deleted_at` becomes `null` |
| `$model->restore()` on active record | Returns `true`; no state change |
| `restoreQuietly()` does not fire events | `restoring`/`restored` listeners not invoked |
| Bulk `onlyTrashed()->restore()` | Only matching trashed records restored |
| `restoring` event returning `false` cancels restore | `restore()` returns `false`; record stays trashed |
| `restored` event fires after successful restore | Listener invoked with model instance |
| Cascading restore restores children | Related soft-deleted models also restored |
| Unique constraint violation on restore | Throws `QueryException` or custom exception |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization