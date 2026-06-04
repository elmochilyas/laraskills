# Decomposition — Prunable Trait

## Implementation Tasks

### T1: Add `Prunable` trait to a model
**File:** `app/Models/ArchivedPost.php`
- Import `Illuminate\Database\Eloquent\Prunable`.
- Use the trait: `use Prunable;`.
- Ensure the model also uses `SoftDeletes` if pruning is for soft-deleted records.

### T2: Implement `prunable()` query method
**File:** `app/Models/ArchivedPost.php`
- Define `public function prunable(): Builder`:
  - Return `static::where('deleted_at', '<=', now()->subMonth())`.
- Write test to assert the prunable query returns the correct set of records.

### T3: Implement `pruning()` and `pruned()` callbacks
**File:** `app/Models/ArchivedPost.php`
- Add `protected function pruning(ArchivedPost $post): ?bool`:
  - Skip pruning posts marked as `keep = true`.
  - Return `false` to skip.
- Add `protected function pruned(ArchivedPost $post): void`:
  - Log the prune event.
  - Dispatch a `PostPruned` event for cache invalidation.

### T4: Test `pruning()` callback skip behavior
**File:** `tests/Unit/PrunableTraitTest.php`
- Create a prunable-eligible record with `keep = true`.
- Run `$model->prune()` (or trigger via command).
- Assert the record was NOT deleted.
- Assert `pruning()` was called and returned `false`.

### T5: Test `pruned()` callback fires after deletion
**File:** `tests/Unit/PrunableTraitTest.php`
- Set up a spy on the `pruned()` callback (or use a flag property).
- Create a prunable-eligible record.
- Run pruning.
- Assert `pruned()` was called with the model instance.

### T6: Test cursor-based iteration with large dataset
**File:** `tests/Unit/PrunableTraitTest.php`
- Create 100+ prunable records.
- Run pruning.
- Assert all eligible records are deleted.
- Assert memory usage stays below a threshold (not loading all records at once).

### T7: Test pruning on non-soft-deletable model
**File:** `tests/Unit/PrunableTraitTest.php`
- Create a model with `Prunable` but WITHOUT `SoftDeletes`.
- Implement `prunable()` to filter by `created_at` (not `deleted_at`).
- Run pruning.
- Assert old records are deleted via `delete()` (not `forceDelete()`).

### T8: Test that pruning respects `prunable()` query constraints
**File:** `tests/Unit/PrunableTraitTest.php`
- Create records of varying ages (some eligible, some not).
- Run pruning.
- Assert only eligible records are deleted.
- Assert ineligible records remain.

### T9: Add indexing for prunable query columns
**File:** `database/migrations/xxxx_add_indexes_for_pruning.php`
- Add index on `(deleted_at)` for pruning queries.
- Add composite index on `(deleted_at, keep)` if `pruning()` checks `keep`.
- Write a migration that creates these indexes.

### T10: Implement dry-run test to verify `--pretend` behavior
**File:** `tests/Unit/PrunableTraitTest.php`
- Use `Artisan::call('model:prune', ['--pretend' => true])`.
- Assert no records are actually deleted.
- Assert output displays the record IDs that would be pruned.

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `prunable()` returns correct eligible records | Only records past expiry threshold returned |
| `pruning()` returning `false` skips record | Eligible record with skip condition is not deleted |
| `pruned()` called after successful prune | Callback invoked with deleted model instance |
| All eligible records deleted after `prune()` | Count of eligible records matches count of deletions |
| Non-eligible records not deleted | Records within expiry threshold are untouched |
| Memory-efficient iteration | Memory usage remains O(1) regardless of eligible count |
| Pruning without `SoftDeletes` calls `delete()` | Model permanently removed via standard delete |
| `--pretend` mode does not modify data | Zero records deleted; output shows intended deletions |
| Indexes improve pruning query performance | Query plan shows index scan (not full table scan) |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization