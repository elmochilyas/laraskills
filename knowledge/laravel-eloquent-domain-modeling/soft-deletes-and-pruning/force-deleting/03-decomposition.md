# Decomposition — Force Deleting

## Implementation Tasks

### T1: Test instance `forceDelete()` on a soft-deleted model
**File:** `tests/Unit/ForceDeletingTest.php`
- Create a model, soft-delete it, verify `$model->trashed()`.
- Call `$model->forceDelete()`.
- Assert the record is physically removed from the database.
- Assert `Model::withTrashed()->find($id)` returns `null`.

### T2: Test `forceDelete()` on an active (non-trashed) model
**File:** `tests/Unit/ForceDeletingTest.php`
- Call `forceDelete()` on an active model.
- Assert the record is permanently deleted.
- Confirm both active and trashed queries return nothing.

### T3: Implement and test `forceDeleteQuietly()`
**File:** `tests/Unit/ForceDeletingTest.php`
- Set up event spies for `deleting`, `deleted`, `forceDeleting`, `forceDeleted`.
- Call `forceDeleteQuietly()`.
- Assert no events were fired.
- Assert record is physically removed.

### T4: Test `forceDeleting` / `forceDeleted` event firing
**File:** `tests/Unit/ForceDeletingTest.php`
- Register listeners for `forceDeleting` and `forceDeleted`.
- Call `forceDelete()`.
- Assert `forceDeleting` fires before deletion.
- Assert `forceDeleted` fires after deletion.
- Assert `deleting`/`deleted` also fire (dual event firing).

### T5: Test `isForceDeleting` flag detection
**File:** `tests/Unit/ForceDeletingTest.php`
- Inside a `deleting` listener, assert `$model->isForceDeleting()` is `true` when `forceDelete()` calls it.
- Compare with a regular `delete()` where `isForceDeleting()` is `false`.

### T6: Implement policy authorization for `forceDelete()`
**File:** `app/Policies/UserPolicy.php`
- Add `forceDelete(User $user, User $model)` method that returns `$user->is_admin`.
- Register the policy in `AuthServiceProvider`.
- Test that non-admin users receive a 403.

### T7: Bulk force delete with iteration
**File:** `tests/Unit/ForceDeletingTest.php`
- Soft-delete multiple records.
- Use `Model::onlyTrashed()->each(fn ($m) => $m->forceDelete())`.
- Assert all trashed records are removed.
- Assert active records remain.

### T8: Handle foreign key constraints on force delete
**File:** `tests/Unit/ForceDeletingTest.php`
- Create a parent record with dependent children.
- Assert `forceDelete()` on parent fails with constraint violation if `ON DELETE RESTRICT`.
- Assert `forceDelete()` cascades if `ON DELETE CASCADE`.
- Test with `nullOnDelete()`: assert children's foreign key becomes `null`.

### T9: Add confirmation dialog for force delete in UI
**File:** `resources/views/users/show.blade.php` or Livewire component
- Add a "Permanently Delete" button that triggers a confirmation modal.
- Require the user to type the record's name or "DELETE" to confirm.
- Submit to the `forceDelete` action only after confirmation.

### T10: Add audit logging for force delete
**File:** `app/Observers/UserObserver.php`
- In `forceDeleted(User $user)`, write a log entry: `User {id} permanently deleted by {user_id}`.
- Include a snapshot of the model data before deletion.

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `forceDelete()` on soft-deleted model | Record permanently removed from DB |
| `forceDelete()` on active model | Record permanently removed from DB |
| `forceDeleteQuietly()` fires no events | All event spies report zero calls |
| `forceDeleting`/`forceDeleted` events fire | Both events dispatched in correct order |
| `deleting` listener returning `false` cancels `forceDelete()` | `forceDelete()` returns `false`; record remains |
| `isForceDeleting()` is `true` during `forceDelete()` | Flag returns `true` inside `deleting` event |
| Authorization policy prevents non-admin `forceDelete()` | 403 response; record not deleted |
| Bulk `onlyTrashed()->each(fn => forceDelete())` | All trashed records deleted; active records preserved |
| Foreign key constraint on force delete | Throws `QueryException` or cascades as defined |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization