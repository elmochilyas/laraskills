# Decomposition — Querying Soft Deletes

## Implementation Tasks

### T1: Write tests for `withTrashed()`
**File:** `tests/Unit/QueryingSoftDeletesTest.php`
- Create a soft-deletable model, soft-delete it.
- Assert `Model::withTrashed()->count()` equals total records (including trashed).
- Assert `Model::withTrashed(false)->count()` equals active records only (default behavior restored).
- Assert chaining with `where()` works: `Model::withTrashed()->where('status', 'archived')->get()`.

### T2: Write tests for `onlyTrashed()`
**File:** `tests/Unit/QueryingSoftDeletesTest.php`
- Assert `Model::onlyTrashed()->count()` returns only soft-deleted records.
- Assert `Model::onlyTrashed()->get()` returns 0 for records that were never deleted.
- Assert `onlyTrashed()` on an empty table returns an empty collection.

### T3: Write tests for `withoutTrashed()`
**File:** `tests/Unit/QueryingSoftDeletesTest.php`
- Assert `Model::withTrashed()->withoutTrashed()->count()` returns active records only.
- Assert `withoutTrashed()` has no additional effect on default query.

### T4: Implement query parameter mapping in controllers
**File:** `app/Http/Controllers/UserController.php`
- Add `?trashed=with`, `?trashed=only`, `?trashed=without` support to index endpoint.
- Map param to respective scope via a local scope method or conditional builder call.
- Default: `withoutTrashed()` behavior.

### T5: Add `withTrashed()` to admin routes
**File:** `app/Http/Controllers/Admin/UserController.php`
- Admin index should default to `withTrashed()`.
- Admin show should accept trashed IDs (use route model binding with `withTrashed()`).

### T6: Implement `Rule::unique` with soft-delete awareness
**File:** `app/Http/Requests/StoreUserRequest.php`
- Add `Rule::unique('users')->whereNull('deleted_at')` to validation rules.
- Allow re-creation of usernames/slugs that exist only on soft-deleted records.

### T7: Test scope usage on relationships
**File:** `tests/Unit/QueryingSoftDeletesTest.php`
- Create a `User` with `Post` children, soft-delete some posts.
- Assert `$user->posts()->withTrashed()->count()` includes trashed.
- Assert `$user->posts()->onlyTrashed()->count()` returns only trashed count.

### T8: Implement eager-load constraint with `withTrashed()`
**File:** `app/Models/User.php`
- Add a `postsWithTrashed` relationship method:
  `return $this->hasMany(Post::class)->withTrashed();`
- Or use `->withTrashed()` inside an eager-load constraint:
  `User::with(['posts' => fn ($q) => $q->withTrashed()])->get()`.

### T9: Add cursor pagination test with trashed interleaving
**File:** `tests/Unit/QueryingSoftDeletesTest.php`
- Create interleaved active and trashed records with descending dates.
- Assert `cursor()->paginate()` with `withTrashed()` includes both sets in correct order.

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `withTrashed()` returns all records including soft-deleted | Count includes trashed rows |
| `withTrashed(false)` returns only active records | Count matches active rows |
| `onlyTrashed()` returns only soft-deleted records | Count matches trashed rows |
| `withoutTrashed()` re-applies the null filter after `withTrashed()` | Count matches active rows |
| Relationship `withTrashed()` includes trashed children | Related trashed records present in result |
| Relationship `onlyTrashed()` returns only trashed children | Related trashed records present; active absent |
| `User::count()` after soft-delete returns decremented count | Active count decreases; total count unchanged |
| `Rule::unique()->whereNull('deleted_at')` ignores soft-deleted records | Validation passes for value that exists on a trashed record |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization