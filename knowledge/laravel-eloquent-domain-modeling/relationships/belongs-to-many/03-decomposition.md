# BelongsToMany — Decomposition

## Implementation Tasks

### 1. Create pivot migration
- Create migration for pivot table (e.g., `role_user`, `post_tag`)
- Add both foreign key columns with `UNIQUE` composite constraint
- Add `ON DELETE CASCADE` on both foreign keys
- Add `created_at`/`updated_at` if using timestamps
- Add extra pivot columns (e.g., `expires_at`, `quantity`)

### 2. Define `belongsToMany` on both models
- Add `belongsToMany(Related::class)` on Model A
- Add `belongsToMany(Related::class)` on Model B (inverse)
- Configure custom pivot table name if non-conventional
- Add `->withPivot('column1', 'column2')` for extra pivot columns
- Add `->withTimestamps()` if pivot has timestamps
- Add `->as('membership')` for custom pivot accessor

### 3. Define custom pivot model (optional)
- Create class extending `Pivot` or `Illuminate\Database\Eloquent\Relations\Pivot`
- Add casts, events, or methods to the pivot model
- Reference in relationship: `->using(Membership::class)`

### 4. Implement CRUD operations
- `$user->roles()->attach($roleId, ['expires_at' => now()])`
- `$user->roles()->detach($roleId)`
- `$user->roles()->sync([1, 2, 3])`
- `$user->roles()->syncWithoutDetaching([4, 5])`
- `$user->roles()->toggle([1, 2])`
- `$user->roles()->updateExistingPivot($roleId, ['expires_at' => now()->addYear()])`

### 5. Implement querying filtered by pivot
- `->wherePivot('expires_at', '>=', now())` (Laravel 10+)
- `->wherePivotIn('status', ['active', 'pending'])`
- `->orderByPivot('created_at', 'desc')`

### 6. Add eager loading defaults
- `protected $with = ['roles'];` if always needed
- `$user->load('roles:name,id')` with specific columns
- `$user->load('roles.pivot')` for pivot data on loaded models

### 7. Set up cascade cleanup on model delete
- Add `deleting` event to model to detach all pivot rows
- Or rely on `ON DELETE CASCADE` in pivot migration
- Verify with test: `$user->delete()` removes all pivot rows

### 8. Write feature tests
- Test `attach` inserts pivot row
- Test `detach` removes pivot row
- Test `sync` computes correct diff
- Test `toggle` adds/removes correctly
- Test composite unique prevents duplicate pivot
- Test `withPivot` returns extra columns
- Test custom pivot model fires events
- Test `->using()` pivot model has custom methods
- Test eager loading produces 2 queries
- Test cascade delete removes pivot rows

### 9. Add pivot validation and scopes
- Add composite unique migration constraint
- Add scope: `scopeWithRole($query, $roleId)` using `whereHas('roles', fn($q) => $q->where('id', $roleId))`
- Add scope: `scopeHavingRoles($query, $count = 1)` using `has('roles', '>=', $count)`

### 10. Implement pivot query performance
- Add composite index on both FK columns
- For bulk detach: `$user->roles()->detach()` (one DELETE query)
- For pivot-heavy operations, consider direct DB query on pivot table

## Validation Criteria
- [ ] `$user->roles` returns `Collection` of related models
- [ ] Each related model has `pivot` attribute with extra columns
- [ ] `sync()` correctly inserts, updates, and deletes pivot rows
- [ ] Composite unique constraint prevents duplicate pivot
- [ ] Deleting model cascades to pivot rows
- [ ] Custom pivot model methods work as expected
- [ ] Eager loading produces 2 queries total
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization