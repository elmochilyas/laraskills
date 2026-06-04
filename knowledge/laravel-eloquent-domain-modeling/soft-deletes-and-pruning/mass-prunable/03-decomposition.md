# Decomposition — Mass Prunable

## Implementation Tasks

### T1: Add `MassPrunable` trait to a model
**File:** `app/Models/SessionLog.php`
- Import `Illuminate\Database\Eloquent\MassPrunable`.
- Use the trait: `use MassPrunable;`.
- Ensure `SoftDeletes` is NOT used (or understand that `deleted_at` filtering must be explicit).

### T2: Implement `prunable()` query for bulk deletion
**File:** `app/Models/SessionLog.php`
- Define `public function prunable(): Builder`:
  - `static::where('created_at', '<=', now()->subDays(30))`.
- Write test confirming the prunable query returns the correct count of eligible records.

### T3: Test that mass pruning issues a single DELETE query
**File:** `tests/Unit/MassPrunableTest.php`
- Enable query logging (`DB::enableQueryLog()`).
- Create 50 eligible records.
- Run `Artisan::call('model:prune', ['--model' => SessionLog::class])`.
- Assert only ONE `DELETE` query was issued.
- Assert all 50 records are gone.
- Assert no `SELECT` queries for model hydration occurred.

### T4: Test that mass pruning does NOT fire model events
**File:** `tests/Unit/MassPrunableTest.php`
- Register a `deleting` event listener that sets a flag.
- Mass prune eligible records.
- Assert the `deleting` event was NOT fired.
- Assert the `deleted` event was NOT fired.

### T5: Test mass pruning with `SoftDeletes` model
**File:** `tests/Unit/MassPrunableTest.php`
- Use a model that has both `SoftDeletes` and `MassPrunable`.
- Implement `prunable()` to filter: `static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(30))`.
- Mass prune.
- Assert trashed records beyond threshold are permanently deleted.
- Assert active records are untouched.
- Assert trashed records within threshold remain.

### T6: Test mass pruning with limited batch size
**File:** `tests/Unit/MassPrunableTest.php`
- Implement `prunable()` with `->limit(100)` to control batch size.
- Create 250 eligible records.
- Run mass prune (the `--prunable` command calls `prune()` once per model class; implement chunking loop in the command or model).
- Assert only 100 records are deleted per invocation (or implement looping within the model).

### T7: Test `--pretend` flag with mass pruning
**File:** `tests/Unit/MassPrunableTest.php`
- Run `Artisan::call('model:prune', ['--pretend' => true, '--model' => SessionLog::class])`.
- Assert zero records deleted.
- Assert output contains the record count and query that would be executed.

### T8: Monitor and test for deadlock avoidance
**File:** `tests/Unit/MassPrunableTest.php`
- Create a scenario with concurrent inserts and mass deletes.
- Assert the mass prune does not cause a deadlock (or has retry logic).
- Use `SKIP LOCKED` or `NOWAIT` in the prunable query if needed.

### T9: Compare performance: `MassPrunable` vs `Prunable`
**File:** `tests/Performance/PrunePerformanceTest.php`
- Create 10,000 eligible records.
- Time `Prunable` model pruning (individual deletes).
- Time `MassPrunable` model pruning (bulk delete).
- Assert mass pruning is at least 10x faster (or document the ratio).

### T10: Add foreign key handling for mass prune
**File:** `tests/Unit/MassPrunableTest.php`
- Create a related model with `ON DELETE CASCADE` foreign key.
- Mass prune the parent records.
- Assert child records are also deleted (cascade).
- Test `ON DELETE RESTRICT`: assert mass prune fails with integrity constraint violation.

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `MassPrunable` deletes all eligible records | Count of eligible records matches deleted count |
| Single DELETE query issued | Query log contains exactly 1 DELETE statement |
| No model events fired | `deleting`/`deleted` listeners report 0 calls |
| Mass prune with `SoftDeletes` deletes only eligible trashed records | Active records untouched; eligible trashed records permanently removed |
| `--pretend` mode does not delete records | Zero affected rows; output matches expected count |
| Mass prune handles limited batch size | Only `limit`-specified number of records deleted per invocation |
| Performance: bulk DELETE faster than individual | Execution time of mass prune < 10% of per-record prune time |
| Foreign key cascade works with bulk DELETE | Child records cascade-deleted |
| Deadlock does not occur with concurrent access | Mass prune completes without deadlock retry |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization